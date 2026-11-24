import { createHash } from 'node:crypto';
import type { WorkRef } from '../../../src/contracts/work';
import { enqueueRequest } from '../../scheduling/requests';
import type { Store } from '../../store/store';
import { canonical } from '../canonical-json';
import { checkpointEligibility } from './checkpoint-eligibility';
import type { ResumeAdmission, ResumeIntent } from './dispatch-resume';
import { freezeReads } from './freeze-reads';
import { repairFreeze } from './repair-freeze';
import { waitKey, waitOver } from './repair-wait';
import { boundResume, resumeIdentity } from './resume-binding';
import { dispatchable, RESUME_ROUTES, subjectParts, type ResumeRoute } from './resume-routes';
import { PENDING, Undone, WAIT_ENDED, type AdmissionRefusal } from './undo-admission';

const NATIVE = 'reconcile-native-checkpoint';

/** Whether a route resumes a checkpoint through its native read-back (see admitCheckpointResume). */
export const forCheckpoint = (action: string) => action === NATIVE;

/**
 * Admits one resume of a Brain checkpoint through its native read-back, or says why not. A resume
 * already bound for this incident, subject and fix is returned as it stands, whatever became of
 * its request. Otherwise every condition is read now, with nothing awaited:
 *
 * - the project is neither paused nor draining;
 * - the route is `reconcile-native-checkpoint`, this release dispatches it for a checkpoint, and
 *   the project is Brain, the only one with a native gate;
 * - the subject is a checkpoint of this project;
 * - the repair wait of this incident is in effect for the checkpoint's exact stop (see
 *   repair-freeze.ts). A checkpoint that is gone has no stop to hold, so it is refused the same way;
 * - the route's key is the checkpoint's own ID;
 * - no request for that key is queued or working, whatever its action or head;
 * - the checkpoint meets local repair admission conditions (see checkpoint-eligibility.ts),
 *   including the native handler's store-side checks and an original run unique to this
 *   checkpoint. A refusal here keeps the wait, and the next pass asks again;
 * - the wait has not run out in the time these reads took, nor in the time the queue and the
 *   admission's own writes took.
 *
 * Then, in one project transaction: the native read-back is queued through `enqueueRequest`, with
 * its admission row and `operation-queued` event; the request is bound to the fix; the
 * checkpoint's repair-wait marker is removed; and `repair-resume-admitted` is emitted. The binding
 * records the original run, its step count and that event, for the outcome to be judged against
 * (see checkpoint-progress.ts). A refusal writes nothing; a wait that ran out before the
 * transaction returned undoes it whole. Nothing is written on the checkpoint itself, its older
 * `repairResume` field included.
 *
 * The caller checks the deployment fence, the Office-wide switch and that the running release
 * holds the fix. When the scheduler runs the request, it checks again that the checkpoint still
 * names that original run (see bound-checkpoint-run.ts), and the handler reads Brain's native gate
 * once, with no model run, and completes the checkpoint only from a native completion that already
 * exists.
 */
export function admitCheckpointResume(store: Store, intent: ResumeIntent, now: Date, routes: Readonly<Record<string, ResumeRoute>> = RESUME_ROUTES): ResumeAdmission {
    const state = store.state, { binding, incident, fix } = intent, { action, payload } = binding.route;
    // `now` is one instant, and the reads below take time it does not hold: the wait's deadline is put to the time that has passed since entry.
    const began = store.clock.monotonic(), sofar = () => new Date(now.getTime() + store.clock.monotonic() - began);
    const refused = (code: AdmissionRefusal, detail: string): ResumeAdmission => ({ refused: code, detail });
    const identity = resumeIdentity(incident, binding.subject, fix.event), bound = boundResume(state, identity);
    if (bound) return { admitted: bound, replayed: true };
    if (state.paused || state.draining) return refused('project-paused', state.draining ? 'The project is draining.' : 'The project is paused.');
    const known = Object.hasOwn(routes, action) ? routes[action] : undefined;
    if (!forCheckpoint(action) || !known || known.subject !== 'checkpoint' || !dispatchable(known, payload)) return refused('not-dispatchable', `This release does not dispatch ${action} for a checkpoint.`);
    if (store.project.id !== 'brain') return refused('not-dispatchable', `${store.project.id} has no native checkpoint read-back; only Brain's checkpoints are resumed.`);
    const work = subjectParts(binding.subject);
    if (!work || work.project !== store.project.id || work.kind !== 'checkpoint') return refused('no-record', `${binding.subject} is not a checkpoint of ${store.project.id}.`);
    const ref = { kind: work.kind, id: work.id } as Pick<WorkRef, 'kind' | 'id'>;
    const wait = repairFreeze(state, ref, now, freezeReads(store, now));
    if (!wait || wait.incident !== incident || wait.digest !== binding.digest) return refused('wait-ended', WAIT_ENDED);
    // A wait in effect means the checkpoint stands stopped, so it is there; naming it only tells the compiler so.
    const checkpoint = state.coordination?.checkpoints.find(saved => saved.id === work.id);
    if (!checkpoint) return refused('wait-ended', WAIT_ENDED);
    const key = checkpoint.id, routeKey = payload.key;
    const pending = routeKey === key && (state.coordination!.requests ?? []).some(request => request.key === key && PENDING.includes(request.status));
    // The wait lookup read the Effects ledger. Expiry takes precedence over any fault these reads found.
    if (waitOver(wait, sofar())) return refused('wait-ended', WAIT_ENDED);
    if (routeKey !== key) return refused('key-mismatch', typeof routeKey === 'string'
        ? `The route names ${routeKey}; the checkpoint is ${key}.`
        : `The route key for checkpoint ${key} must be a string.`);
    if (pending) return refused('request-pending', `Another request for ${key} is queued or working.`);
    const eligible = checkpointEligibility(state, checkpoint);
    if (waitOver(wait, sofar())) return refused('wait-ended', WAIT_ENDED);
    if ('fault' in eligible) return refused('not-dispatchable', `Checkpoint repair admission refused: ${eligible.fault}`);
    const { original } = eligible;
    try {
        return store.transaction((): ResumeAdmission => {
            const request = enqueueRequest(store, action, key, '');
            request.repairResume = {
                id: identity, incident, subject: binding.subject, digest: binding.digest, fix: fix.event, commit: fix.commit, action,
                payload: createHash('sha256').update(canonical(payload)).digest('hex'), release: intent.release, admittedAt: now.toISOString(),
            };
            const waits = state.coordination!.repairWaits!;
            delete waits[waitKey(ref)];
            if (!Object.keys(waits).length) delete state.coordination!.repairWaits;
            const admission = store.emit('repair-resume-admitted', `${key}: ${action} queued to resume after harness fix ${fix.commit.slice(0, 7)} (${incident}).`);
            // What the outcome is later judged against: the run the checkpoint was linked to, and how many steps it had. The pump can link the checkpoint to another run later.
            request.repairResume.stood = { steps: original.steps.length, stage: 'checkpoint', event: admission.id, run: original.id };
            // The queue and the writes took time too: a wait that ran out meanwhile undoes them all.
            if (waitOver(wait, sofar())) throw new Undone('wait-ended', WAIT_ENDED);
            return { admitted: request, replayed: false };
        });
    } catch (error) {
        if (error instanceof Undone) return refused(error.code, error.detail);
        throw error;
    }
}
