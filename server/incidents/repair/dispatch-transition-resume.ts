import { createHash, randomUUID } from 'node:crypto';
import type { HarnessRequest, WorkRef } from '../../../src/contracts/work';
import type { TicketJob } from '../../../src/shared';
import { requeueImplement } from '../../delivery/recovery/implementation/requeue-waited-implement';
import { requeueCandidateReview, requeuePRReview } from '../../scheduling/review-transitions';
import type { Store } from '../../store/store';
import { canonical } from '../canonical-json';
import { redactEvidence } from '../redact-evidence';
import type { ResumeAdmission, ResumeIntent } from './dispatch-resume';
import { freezeReads } from './freeze-reads';
import { repairFreeze } from './repair-freeze';
import { waitKey, waitOver } from './repair-wait';
import { boundResume, resumeIdentity } from './resume-binding';
import { dispatchable, RESUME_ROUTES, subjectParts, type ResumeRoute } from './resume-routes';
import { PENDING, Undone, WAIT_ENDED, type AdmissionRefusal } from './undo-admission';

/** The routes whose handler changes the job at once rather than queueing a request: the same transition an operator's recheck or requeue makes. */
const TRANSITIONS: Readonly<Record<string, (store: Store, job: TicketJob) => string>> = {
    'review-pr': requeuePRReview,
    'review-candidate': (_store, job) => requeueCandidateReview(job),
    'requeue-implement': requeueImplement,
};

/** Whether a route is resumed by a synchronous transition (see admitTransitionResume). */
export const forTransition = (action: string) => Object.hasOwn(TRANSITIONS, action);

/**
 * Admits one resume whose route is a synchronous transition of a GitHub delivery job, or says why
 * not. A resume already bound for this incident, subject and fix is returned as it stands.
 * Otherwise every condition a job's resume has is read now, with nothing awaited (see
 * dispatch-resume.ts): the project is neither paused nor draining; this release dispatches the
 * route for a job; the repair wait of this incident is in effect for the subject's exact stop; the
 * subject is a delivery job of this project and the route's key is that job's; no request for that
 * key is queued or working; and no scheduler claim is active for the job, since nothing queued
 * stands between this transition and the job.
 *
 * Then, in one project transaction: the transition the operator's recheck or requeue makes, with
 * its own checks (`server/scheduling/review-transitions.ts`, and for `requeue-implement`
 * `server/delivery/recovery/implementation/requeue-waited-implement.ts`); a completed harness
 * request that is only the receipt of this resume, carrying the binding and how the job stood; the
 * removal of the subject's repair-wait marker; and the `repair-resume-admitted` event. The
 * operator's own event is not emitted, so a person's later recheck or requeue still reads as moved
 * by hand. The receipt is never run: the
 * scheduler reads a completed request as terminal. A transition its checks refuse, or a wait that
 * ran out meanwhile, writes nothing. No counter, attempt or budget of the job is touched.
 */
export function admitTransitionResume(store: Store, intent: ResumeIntent, now: Date, routes: Readonly<Record<string, ResumeRoute>> = RESUME_ROUTES): ResumeAdmission {
    const state = store.state, { binding, incident, fix } = intent, { action, payload } = binding.route;
    const began = store.clock.monotonic(), sofar = () => new Date(now.getTime() + store.clock.monotonic() - began);
    const refused = (code: AdmissionRefusal, detail: string): ResumeAdmission => ({ refused: code, detail });
    const identity = resumeIdentity(incident, binding.subject, fix.event), bound = boundResume(state, identity);
    if (bound) return { admitted: bound, replayed: true };
    if (state.paused || state.draining) return refused('project-paused', state.draining ? 'The project is draining.' : 'The project is paused.');
    const known = Object.hasOwn(routes, action) ? routes[action] : undefined, transition = forTransition(action) ? TRANSITIONS[action] : undefined;
    if (!known || !transition || known.subject !== 'job' || !dispatchable(known, payload)) return refused('not-dispatchable', `This release does not dispatch ${action} for a job.`);
    const work = subjectParts(binding.subject);
    if (!work || work.project !== store.project.id || work.kind !== 'delivery') return refused('no-record', `${binding.subject} is not delivery work of ${store.project.id}.`);
    const ref = { kind: work.kind, id: work.id } as Pick<WorkRef, 'kind' | 'id'>;
    const wait = repairFreeze(state, ref, now, freezeReads(store, now));
    if (!wait || wait.incident !== incident || wait.digest !== binding.digest) return refused('wait-ended', WAIT_ENDED);
    const job = state.coordination?.jobs?.find(job => job.id === work.id);
    if (!job) return refused('no-record', `${binding.subject} has no delivery job.`);
    const key = String(payload.key);
    if (job.key !== key) return refused('key-mismatch', `The route names ${key}; the job is ${job.key}.`);
    const requests = state.coordination?.requests ?? [];
    if (requests.some(request => request.key === job.key && PENDING.includes(request.status))) return refused('request-pending', `Another request for ${job.key} is queued or working.`);
    const claim = store.activeClaims().find(active => active.work.kind === ref.kind && active.work.id === ref.id);
    if (claim) return refused('request-pending', `${job.key} has work in flight under a scheduler claim (${claim.stage}).`);
    if (waitOver(wait, sofar())) return refused('wait-ended', WAIT_ENDED);
    try {
        return store.transaction((): ResumeAdmission => {
            const stood = { steps: job.steps.length, stage: job.stage };
            let detail: string;
            try { detail = transition(store, job); }
            catch (error) { throw new Undone('transition-refused', `The handler's own check refused it: ${redactEvidence(String(error instanceof Error ? error.message : error)).slice(0, 300)}`); }
            if (waitOver(wait, sofar())) throw new Undone('wait-ended', WAIT_ENDED);
            const receipt: HarnessRequest = {
                id: randomUUID(), action, key: job.key, head: '', lane: 'delivery', requestedAt: now.toISOString(), status: 'completed', detail: `Repair resume: ${detail}`,
                repairResume: {
                    id: identity, incident, subject: binding.subject, digest: binding.digest, fix: fix.event, commit: fix.commit, action,
                    payload: createHash('sha256').update(canonical(payload)).digest('hex'), release: intent.release, admittedAt: now.toISOString(),
                },
            };
            (state.coordination!.requests ??= []).push(receipt);
            const waits = state.coordination!.repairWaits!;
            delete waits[waitKey(ref)];
            if (!Object.keys(waits).length) delete state.coordination!.repairWaits;
            const admission = store.emit('repair-resume-admitted', `${job.key}: ${action} resumed after harness fix ${fix.commit.slice(0, 7)} (${incident}).`, undefined, job.key);
            // What the outcome is later judged against (see judge-resumes.ts): how the job stood before the transition.
            receipt.repairResume!.stood = { ...stood, event: admission.id };
            return { admitted: receipt, replayed: false };
        });
    } catch (error) {
        if (error instanceof Undone) return refused(error.code, error.detail);
        throw error;
    }
}
