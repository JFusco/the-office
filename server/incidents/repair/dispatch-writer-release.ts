import { createHash, randomUUID } from 'node:crypto';
import type { HarnessRequest, WorkRef } from '../../../src/contracts/work';
import { stoppedWriter } from '../../delivery/attempts/restart-writer';
import type { Store } from '../../store/store';
import { processGroupAlive } from '../../workers/process';
import { canonical } from '../canonical-json';
import type { ResumeAdmission, ResumeIntent } from './dispatch-resume';
import { freezeReads } from './freeze-reads';
import { repairFreeze } from './repair-freeze';
import { waitKey, waitOver } from './repair-wait';
import { boundResume, resumeIdentity } from './resume-binding';
import { dispatchable, forWriterRelease, RESUME_ROUTES, subjectParts, writerReleasePayload, type ResumeRoute } from './resume-routes';
import { PENDING, Undone, WAIT_ENDED, type AdmissionRefusal } from './undo-admission';

/**
 * Admits one `release-writer` resume, or says why not: it grants the dead writer run of a GitHub
 * delivery job one restart beyond the harness's ordinary allowance, and restarts nothing itself.
 * A resume already bound for this incident, subject and fix is returned as it stands. Otherwise
 * every condition a job's resume has is read now, with nothing awaited (see dispatch-resume.ts):
 * the project is neither paused nor draining; this release dispatches the route for a job, with
 * the `{ key, head }` payload it takes; the repair wait of this incident is in effect for the
 * subject's exact stop; the subject is a delivery job of this project, found by its ID, and the
 * route's key is that job's; no request for that key is queued or working; no scheduler claim is
 * active for the job. Then the harness's own restart rule, short of its allowance, must name a
 * dead run of the job (`stoppedWriter` in server/delivery/attempts/restart-writer.ts), and the
 * route's `head` must be that run's ID exactly.
 *
 * Then, in one project transaction: the grant on the job (`job.repairRelease`, bound to this
 * resume, the fix, the run, its stage and the accepted head); a completed harness request that is
 * only the receipt of this resume, carrying the binding and how the job stood; the removal of the
 * subject's repair-wait marker; and the `repair-resume-admitted` event. The job stays stopped:
 * the harness's restart (server/delivery/attempts/restart-stopped-writers.ts) spends the grant at
 * a later poll, with every one of its own checks. A refusal, or a wait that ran out meanwhile,
 * writes nothing. No counter, attempt or budget of the job is touched.
 */
export function admitWriterRelease(store: Store, intent: ResumeIntent, now: Date, routes: Readonly<Record<string, ResumeRoute>> = RESUME_ROUTES, alive: (pid: number) => boolean = processGroupAlive): ResumeAdmission {
    const state = store.state, { binding, incident, fix } = intent, { action, payload } = binding.route;
    const began = store.clock.monotonic(), sofar = () => new Date(now.getTime() + store.clock.monotonic() - began);
    const refused = (code: AdmissionRefusal, detail: string): ResumeAdmission => ({ refused: code, detail });
    const identity = resumeIdentity(incident, binding.subject, fix.event), bound = boundResume(state, identity);
    if (bound) return { admitted: bound, replayed: true };
    if (state.paused || state.draining) return refused('project-paused', state.draining ? 'The project is draining.' : 'The project is paused.');
    const known = Object.hasOwn(routes, action) ? routes[action] : undefined, route = writerReleasePayload(payload);
    if (!known || !forWriterRelease(action) || known.subject !== 'job' || !dispatchable(known, payload) || !route) return refused('not-dispatchable', `This release does not dispatch ${action} for a job in this form.`);
    const work = subjectParts(binding.subject);
    if (!work || work.project !== store.project.id || work.kind !== 'delivery') return refused('no-record', `${binding.subject} is not delivery work of ${store.project.id}.`);
    const ref = { kind: work.kind, id: work.id } as Pick<WorkRef, 'kind' | 'id'>;
    const wait = repairFreeze(state, ref, now, freezeReads(store, now));
    if (!wait || wait.incident !== incident || wait.digest !== binding.digest) return refused('wait-ended', WAIT_ENDED);
    // By its ID: another job may carry the same ticket key.
    const job = state.coordination?.jobs?.find(job => job.id === work.id);
    if (!job) return refused('no-record', `${binding.subject} has no delivery job.`);
    if (job.key !== route.key) return refused('key-mismatch', `The route names ${route.key}; the job is ${job.key}.`);
    const requests = state.coordination?.requests ?? [];
    if (requests.some(request => request.key === job.key && PENDING.includes(request.status))) return refused('request-pending', `Another request for ${job.key} is queued or working.`);
    const claim = store.activeClaims().find(active => active.work.kind === ref.kind && active.work.id === ref.id);
    if (claim) return refused('request-pending', `${job.key} has work in flight under a scheduler claim (${claim.stage}).`);
    let stopped: ReturnType<typeof stoppedWriter> = null;
    try { stopped = stoppedWriter(store, job, alive); }
    catch { /* A failed candidate read leaves the worker unestablished. */ }
    // The rule reads the Effects ledger: a wait that ran out while it read is over, whatever the rule said.
    if (waitOver(wait, sofar())) return refused('wait-ended', WAIT_ENDED);
    if (!stopped) return refused('head-mismatch', `The harness's restart rule names no dead ${job.stage} run of ${job.key}.`);
    if (route.head !== stopped.work.id) return refused('head-mismatch', `The route names worker ${route.head}; the dead ${job.stage} run is ${stopped.work.id}.`);
    try {
        return store.transaction((): ResumeAdmission => {
            const at = now.toISOString(), { work: run, accepted } = stopped, stood = { steps: job.steps.length, stage: job.stage };
            job.repairRelease = { id: identity, incident, subject: binding.subject, fix: fix.event, commit: fix.commit, workId: run.id, stage: job.stage, accepted, grantedAt: at };
            const receipt: HarnessRequest = {
                id: randomUUID(), action, key: job.key, head: '', lane: 'delivery', requestedAt: at, status: 'completed',
                detail: `Repair resume: one restart of the stopped ${job.stage} run ${run.id} from ${accepted.slice(0, 7)} granted beyond the ordinary allowance; the harness restarts it.`,
                repairResume: {
                    id: identity, incident, subject: binding.subject, digest: binding.digest, fix: fix.event, commit: fix.commit, action,
                    payload: createHash('sha256').update(canonical(payload)).digest('hex'), release: intent.release, admittedAt: at,
                },
            };
            (state.coordination!.requests ??= []).push(receipt);
            const waits = state.coordination!.repairWaits!;
            delete waits[waitKey(ref)];
            if (!Object.keys(waits).length) delete state.coordination!.repairWaits;
            const admission = store.emit('repair-resume-admitted', `${job.key}: one more ${job.stage} restart granted after harness fix ${fix.commit.slice(0, 7)} (${incident}).`, undefined, job.key);
            // What the outcome is later judged against (see judge-resumes.ts): how the job stood at the grant, which leaves it stopped.
            receipt.repairResume!.stood = { ...stood, event: admission.id };
            if (waitOver(wait, sofar())) throw new Undone('wait-ended', WAIT_ENDED);
            return { admitted: receipt, replayed: false };
        });
    } catch (error) {
        if (error instanceof Undone) return refused(error.code, error.detail);
        throw error;
    }
}
