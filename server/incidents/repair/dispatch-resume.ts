import { createHash } from 'node:crypto';
import type { IncidentFix, SubjectFix } from '../../../src/contracts/incidents';
import type { HarnessRequest, WorkRef } from '../../../src/contracts/work';
import { enqueueRequest } from '../../scheduling/requests';
import type { Store } from '../../store/store';
import { canonical } from '../canonical-json';
import { freezeReads } from './freeze-reads';
import { repairFreeze } from './repair-freeze';
import { waitKey, waitOver } from './repair-wait';
import { forTransition } from './dispatch-transition-resume';
import { boundResume, resumeIdentity } from './resume-binding';
import { dispatchable, forWriterRelease, RESUME_ROUTES, subjectParts, type ResumeRoute } from './resume-routes';
import { routeHeadFault } from './route-head';
import { PENDING, Undone, WAIT_ENDED, type AdmissionRefusal } from './undo-admission';

/** One subject of a fix the running release holds, to be resumed by the route the fix bound for it. */
export interface ResumeIntent {
    incident: string;
    fix: Pick<IncidentFix, 'event' | 'commit'>;
    /** The verified release that runs now and is known to hold the fix (see running-release.ts). */
    release: { commit: string; operation: string };
    binding: Extract<SubjectFix, { route: unknown }>;
}

/** `replayed`: the resume was admitted by an earlier pass; the request found is returned and nothing is queued. */
export type ResumeAdmission = { admitted: HarnessRequest; replayed: boolean } | { refused: AdmissionRefusal; detail: string };


/**
 * Admits one resume in its project, or says why not. A resume already bound for this incident,
 * subject and fix is returned as it stands. Otherwise every condition is read now, with nothing
 * awaited, so no other work runs between the checks and the write:
 *
 * - the project is neither paused nor draining;
 * - this release dispatches the route in this form, for a delivery job;
 * - the repair wait of this incident is in effect for the subject's exact stop, so the stop
 *   stands as the fix bound it and nothing stronger explains it (see repair-freeze.ts);
 * - the subject is a delivery job of this project and the route's key is that job's;
 * - no other request for that key is queued or working;
 * - the route's `head` is the one its handler would take for that job now (see route-head.ts);
 * - the wait has not run out in the time these reads took, nor in the time the queue took to answer.
 *
 * Then the existing recovery request is queued through `enqueueRequest`, bound to the fix, and the
 * subject's repair-wait marker is removed, in one transaction with the request's admission row.
 * The binding also records how the job stood then, for the outcome to be judged against later.
 * A refusal writes nothing, the one the queue itself makes included: that transaction is undone.
 * The caller checks the deployment fence, the Office-wide switch and that the running release
 * holds the fix; the handler checks its own preconditions when the scheduler runs the request. No counter,
 * attempt or budget of the job is touched.
 */
export function admitResume(store: Store, intent: ResumeIntent, now: Date, routes: Readonly<Record<string, ResumeRoute>> = RESUME_ROUTES, headFault: typeof routeHeadFault = routeHeadFault): ResumeAdmission {
    const state = store.state, { binding, incident, fix } = intent, { action, payload } = binding.route;
    // `now` is one instant, and the reads below take time it does not hold: the wait's deadline is put to the time that has passed since entry.
    const began = store.clock.monotonic(), sofar = () => new Date(now.getTime() + store.clock.monotonic() - began);
    const refused = (code: AdmissionRefusal, detail: string): ResumeAdmission => ({ refused: code, detail });
    const identity = resumeIdentity(incident, binding.subject, fix.event), bound = boundResume(state, identity);
    if (bound) return { admitted: bound, replayed: true };
    if (state.paused || state.draining) return refused('project-paused', state.draining ? 'The project is draining.' : 'The project is paused.');
    const known = Object.hasOwn(routes, action) ? routes[action] : undefined;
    // A synchronous transition and a writer release are admitted by their own paths (dispatch-transition-resume.ts, dispatch-writer-release.ts); neither has a request to queue.
    if (!known || known.subject !== 'job' || !dispatchable(known, payload) || forTransition(action) || forWriterRelease(action)) return refused('not-dispatchable', `This release does not dispatch ${action}${payload.head ? ' with a head' : ''}.`);
    const work = subjectParts(binding.subject);
    if (!work || work.project !== store.project.id || work.kind !== 'delivery') return refused('no-record', `${binding.subject} is not delivery work of ${store.project.id}.`);
    const ref = { kind: work.kind, id: work.id } as Pick<WorkRef, 'kind' | 'id'>;
    const wait = repairFreeze(state, ref, now, freezeReads(store, now));
    if (!wait || wait.incident !== incident || wait.digest !== binding.digest) return refused('wait-ended', WAIT_ENDED);
    // A wait in effect means the record stands stopped, so a job found here is a live one.
    const job = state.coordination?.jobs?.find(job => job.id === work.id);
    if (!job) return refused('no-record', `${binding.subject} has no delivery job.`);
    const key = String(payload.key), head = typeof payload.head === 'string' ? payload.head : '';
    if (job.key !== key) return refused('key-mismatch', `The route names ${key}; the job is ${job.key}.`);
    const requests = state.coordination!.requests ?? [];
    if (requests.some(request => request.key === job.key && PENDING.includes(request.status))) return refused('request-pending', `Another request for ${job.key} is queued or working.`);
    // Last, with nothing else in the way: a handler refuses any run but the one its own rule names, and a request it refuses ends blocked with the resume spent.
    const fault = headFault(store, job, action, head);
    // The rule reads saved evidence from disk: a wait that ran out while it read is over, whatever the rule said.
    if (waitOver(wait, sofar())) return refused('wait-ended', WAIT_ENDED);
    if (fault) return refused('head-mismatch', fault);
    try {
        return store.transaction((): ResumeAdmission => {
        const known = new Set(requests.map(request => request.id)), request = enqueueRequest(store, action, job.key, head);
        // An identical request that completed earlier is its own answer to `enqueueRequest`; binding it would claim a resume that never ran.
        if (known.has(request.id)) throw new Undone('already-reconciled', `${action} for ${job.key} completed earlier and was not queued again.`);
        // The queue reads too before it answers (for a base update, a saved audit): a wait that ran out meanwhile is over, and the request is undone.
        if (waitOver(wait, sofar())) throw new Undone('wait-ended', WAIT_ENDED);
        request.repairResume = {
            id: identity, incident, subject: binding.subject, digest: binding.digest, fix: fix.event, commit: fix.commit, action,
            payload: createHash('sha256').update(canonical(payload)).digest('hex'), release: intent.release, admittedAt: now.toISOString(),
        };
        const waits = state.coordination!.repairWaits!;
        delete waits[waitKey(ref)];
        if (!Object.keys(waits).length) delete state.coordination!.repairWaits;
        const admission = store.emit('repair-resume-admitted', `${job.key}: ${action} queued to resume after harness fix ${fix.commit.slice(0, 7)} (${incident}).`, undefined, job.key);
        // What the outcome is later judged against (see judge-resumes.ts): a job's steps carry no time, and neither does a stage.
        request.repairResume.stood = { steps: job.steps.length, stage: job.stage, event: admission.id };
        return { admitted: request, replayed: false };
        });
    } catch (error) {
        if (error instanceof Undone) return refused(error.code, error.detail);
        throw error;
    }
}
