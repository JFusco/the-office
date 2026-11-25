import { createHash, randomUUID } from 'node:crypto';
import type { HarnessRequest, WorkRef } from '../../../src/contracts/work';
import { AssignmentTransitionRefused, requeueAssignmentReview } from '../../scheduling/assignment-transition';
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

const ACTION = 'review-assignment';

/** Whether a route resumes an assignment review (see admitAssignmentResume). */
export const forAssignment = (action: string) => action === ACTION;

/**
 * Admits one resume of a stopped assignment review, or says why not. A resume already bound for
 * this incident, subject and fix is returned as it stands, whatever became of the review since.
 * Otherwise every condition is read now, with nothing awaited:
 *
 * - the project is neither paused nor draining;
 * - the route is `review-assignment`, and this release dispatches it for an assignment review;
 * - the subject is an assignment review of this project, and the project holds it;
 * - the repair wait of this incident is in effect for the review's exact stop (see
 *   repair-freeze.ts), and the review is the last one stored for its ticket, the one the scheduler
 *   runs (server/scheduling/scheduled-work.ts). A review a later one superseded no longer stands
 *   for its ticket, so it is refused the same way;
 * - the route's key is the review's ticket;
 * - no request for that ticket is queued or working, in the recovery queue or the delivery queue,
 *   and no scheduler claim is active for the review;
 * - the wait has not run out in the time these reads took.
 *
 * Then, in one project transaction: the review is requeued (server/scheduling/assignment-transition.ts),
 * which keeps its IT recovery count and its read retries as they are, a spent budget included; a
 * completed harness request that is only the receipt of this resume, carrying the binding and the
 * review's baseline (no steps, at `assignment-review`); the removal of the review's repair-wait
 * marker; and the `repair-resume-admitted` event, the only one. The receipt is what makes this
 * one resume per fix: no counter is touched for that. It is never run: the scheduler reads a
 * completed request as terminal. A transition its checks refuse, or a wait that ran out
 * meanwhile, writes nothing.
 *
 * The caller checks the deployment fence, the Office-wide switch and that the running release
 * holds the fix. The scheduler then runs the review as any queued review, through the pump's own
 * checks (server/scheduling/coordination-pump.ts).
 */
export function admitAssignmentResume(store: Store, intent: ResumeIntent, now: Date, routes: Readonly<Record<string, ResumeRoute>> = RESUME_ROUTES): ResumeAdmission {
    const state = store.state, { binding, incident, fix } = intent, { action, payload } = binding.route;
    // `now` is one instant, and the reads below take time it does not hold: the wait's deadline is put to the time that has passed since entry.
    const began = store.clock.monotonic(), sofar = () => new Date(now.getTime() + store.clock.monotonic() - began);
    const refused = (code: AdmissionRefusal, detail: string): ResumeAdmission => ({ refused: code, detail });
    const identity = resumeIdentity(incident, binding.subject, fix.event), bound = boundResume(state, identity);
    if (bound) return { admitted: bound, replayed: true };
    if (state.paused || state.draining) return refused('project-paused', state.draining ? 'The project is draining.' : 'The project is paused.');
    const known = Object.hasOwn(routes, action) ? routes[action] : undefined;
    if (!forAssignment(action) || !known || known.subject !== 'intake' || !dispatchable(known, payload)) return refused('not-dispatchable', `This release does not dispatch ${action} for an assignment review.`);
    const work = subjectParts(binding.subject);
    if (!work || work.project !== store.project.id || work.kind !== 'intake') return refused('no-record', `${binding.subject} is not an assignment review of ${store.project.id}.`);
    const reviews = state.coordination?.listener.reviews ?? [], review = reviews.find(saved => saved.id === work.id);
    if (!review) return refused('no-record', `${binding.subject} has no assignment review.`);
    const ref = { kind: work.kind, id: work.id } as Pick<WorkRef, 'kind' | 'id'>;
    const wait = repairFreeze(state, ref, now, freezeReads(store, now));
    if (!wait || wait.incident !== incident || wait.digest !== binding.digest) return refused('wait-ended', WAIT_ENDED);
    if (reviews.filter(saved => saved.key === review.key).at(-1) !== review) return refused('wait-ended', WAIT_ENDED);
    if (payload.key !== review.key) return refused('key-mismatch', `The route names ${String(payload.key)}; the review is of ${review.key}.`);
    const queues = [...state.coordination?.requests ?? [], ...state.deliveryQueue ?? []];
    if (queues.some(request => request.key === review.key && PENDING.includes(request.status))) return refused('request-pending', `Another request for ${review.key} is queued or working.`);
    const claim = store.activeClaims().find(active => active.work.kind === ref.kind && active.work.id === ref.id);
    if (claim) return refused('request-pending', `${review.key} has work in flight under a scheduler claim (${claim.stage}).`);
    if (waitOver(wait, sofar())) return refused('wait-ended', WAIT_ENDED);
    try {
        return store.transaction((): ResumeAdmission => {
            // A review has no steps of its own and one stage: what the outcome is later judged against (see review-progress.ts).
            const stood = { steps: 0, stage: 'assignment-review' };
            let detail: string;
            try { detail = requeueAssignmentReview(store, review); }
            catch (error) {
                if (!(error instanceof AssignmentTransitionRefused)) throw error;
                throw new Undone('transition-refused', `The handler's own check refused it: ${redactEvidence(error.message).slice(0, 300)}`);
            }
            if (waitOver(wait, sofar())) throw new Undone('wait-ended', WAIT_ENDED);
            const receipt: HarnessRequest = {
                id: randomUUID(), action, key: review.key, head: '', lane: 'delivery', requestedAt: now.toISOString(), status: 'completed', detail: `Repair resume: ${detail}`,
                repairResume: {
                    id: identity, incident, subject: binding.subject, digest: binding.digest, fix: fix.event, commit: fix.commit, action,
                    payload: createHash('sha256').update(canonical(payload)).digest('hex'), release: intent.release, admittedAt: now.toISOString(),
                },
            };
            (state.coordination!.requests ??= []).push(receipt);
            const waits = state.coordination!.repairWaits!;
            delete waits[waitKey(ref)];
            if (!Object.keys(waits).length) delete state.coordination!.repairWaits;
            const admission = store.emit('repair-resume-admitted', `${review.key}: ${action} resumed after harness fix ${fix.commit.slice(0, 7)} (${incident}).`, undefined, review.key);
            receipt.repairResume!.stood = { ...stood, event: admission.id };
            return { admitted: receipt, replayed: false };
        });
    } catch (error) {
        if (error instanceof Undone) return refused(error.code, error.detail);
        throw error;
    }
}
