import { createHash } from 'node:crypto';
import type { RepairResume, WorkRef } from '../../../src/contracts/work';
import type { DeliveryRequest } from '../../../src/shared';
import { consecutiveSetupStops, SETUP_STOP_CAP } from '../../cec/qa/setup-stop-cap';
import type { Store } from '../../store/store';
import { canonical } from '../canonical-json';
import { redactEvidence } from '../redact-evidence';
import type { ResumeIntent } from './dispatch-resume';
import { freezeReads } from './freeze-reads';
import { repairFreeze } from './repair-freeze';
import { waitKey, waitOver } from './repair-wait';
import { boundTicketResume, resumeIdentity } from './resume-binding';
import { dispatchable, RESUME_ROUTES, subjectParts, type ResumeRoute } from './resume-routes';
import { PENDING, Undone, WAIT_ENDED, type AdmissionRefusal } from './undo-admission';

/** Queues the ticket's own `resume-ticket` request, carrying the binding, through the project's delivery queue; throws what that queue refuses with. */
export type QueueTicketResume = (key: string, binding: RepairResume) => DeliveryRequest;

/** `replayed`: the resume was admitted by an earlier pass; the request found is returned and nothing is queued. */
export type TicketResumeAdmission = { admitted: DeliveryRequest; replayed: boolean } | { refused: AdmissionRefusal; detail: string };

const TICKET = 'ticket:';

/**
 * Admits one resume of a Jira/Azure pilot ticket in its project, or says why not. A resume
 * already bound for this incident, subject and fix is returned as it stands. Otherwise every
 * condition is read now, with nothing awaited:
 *
 * - the project is neither paused nor draining;
 * - this release dispatches the route in this form, for a ticket;
 * - the repair wait of this incident is in effect for the ticket's exact stop. That already
 *   rules out a ticket parked on the board, held, waiting on a prerequisite or with a write
 *   unconfirmed (see repair-freeze.ts);
 * - that stop carries a date the project saved. A ticket stopped by its stage's own verdict has
 *   none: it is marked by its run and attempt, which a later stop of the same run repeats, so
 *   the wait could not tell a new stop from the one the fix was bound to. A saved date is
 *   removed when the next stage run starts, and a stop after it never carries the same one;
 * - the ticket is there and the route's key is its key;
 * - no delivery request for the ticket is queued or working: the queue would answer with that
 *   request, and binding it would claim a resume that is not the Office's;
 * - no scheduler claim is active for the ticket, its run or any of its delivery requests: a QA
 *   ownership check, for one, runs under a claim while its request stays blocked, and a request
 *   queued beside it would spend that approved handoff's one check;
 * - no blocked delivery request for the ticket holds a QA handoff a person approved that has not
 *   been used: between its checks it holds no claim, and a plain resume would change the
 *   blocker it waits on and leave it stranded;
 * - the ticket is not at the QA setup cap, where a first resume only shows the count and the
 *   next spends another attempt. Either step is a person's.
 *
 * Then the ticket's own `resume-ticket` request is queued through `queue`, with the binding, and
 * the subject's repair-wait marker is removed, in one transaction. The queue makes its own checks
 * (the feature gate, a ticket that is no resumable pilot) and touches no intake episode for a
 * repair resume (see server/cec/pilot-delivery.ts). A refusal writes nothing, the queue's own
 * included: that transaction is undone. The binding records the ticket's stage and the event
 * this admission emitted, for its outcome to be judged against later.
 *
 * The caller checks the deployment fence, the Office-wide switch and that the running release
 * holds the fix. The handler makes its own checks when the scheduler runs the request, and may
 * make a paid model read-back before it refuses. No counter or budget of the ticket is touched.
 */
export function admitTicketResume(store: Store, queue: QueueTicketResume, intent: ResumeIntent, now: Date, routes: Readonly<Record<string, ResumeRoute>> = RESUME_ROUTES): TicketResumeAdmission {
    const state = store.state, { binding, incident, fix } = intent, { action, payload } = binding.route;
    // `now` is one instant, and the queue's own reads take time it does not hold: the wait's deadline is put to the time that has passed since entry.
    const began = store.clock.monotonic(), sofar = () => new Date(now.getTime() + store.clock.monotonic() - began);
    const refused = (code: AdmissionRefusal, detail: string): TicketResumeAdmission => ({ refused: code, detail });
    const identity = resumeIdentity(incident, binding.subject, fix.event), bound = boundTicketResume(state, identity);
    if (bound) return { admitted: bound, replayed: true };
    if (state.paused || state.draining) return refused('project-paused', state.draining ? 'The project is draining.' : 'The project is paused.');
    // An action that is no row, an inherited property included, has no ticket for its subject.
    const known: ResumeRoute | undefined = routes[action];
    if (!known || known.subject !== 'ticket' || !dispatchable(known, payload)) return refused('not-dispatchable', `This release does not dispatch ${action} for a ticket.`);
    const work = subjectParts(binding.subject);
    if (!work || work.project !== store.project.id || work.kind !== 'delivery' || !work.id.startsWith(TICKET)) return refused('no-record', `${binding.subject} is not a ticket of ${store.project.id}.`);
    const ref = { kind: work.kind, id: work.id } as Pick<WorkRef, 'kind' | 'id'>;
    const wait = repairFreeze(state, ref, now, freezeReads(store, now));
    if (!wait || wait.incident !== incident || wait.digest !== binding.digest) return refused('wait-ended', WAIT_ENDED);
    // Only a saved date marks one stop apart from the next of the same run (see above).
    if (!wait.stands.stop?.at) return refused('ticket-not-resumable', 'The ticket was stopped by its stage and its stop carries no date of its own; a later stop of the same run could not be told from it, so the resume is a person\'s.');
    // A wait in effect means the record stands stopped, so the ticket is there; naming it only tells the compiler so.
    const ticket = state.tickets.find(ticket => ticket.key === work.id.slice(TICKET.length));
    if (!ticket) return refused('no-record', `${binding.subject} has no ticket.`);
    const key = String(payload.key);
    if (ticket.key !== key) return refused('key-mismatch', `The route names ${key}; the ticket is ${ticket.key}.`);
    if ((state.deliveryQueue ?? []).some(request => request.key === key && PENDING.includes(request.status))) return refused('request-pending', `Another delivery request for ${key} is queued or working.`);
    // A claim is work in flight whatever a request's status says: a QA ownership check runs under one while its request stays blocked.
    const owned = new Set([work.id, ticket.runId, ...(state.deliveryQueue ?? []).filter(request => request.key === key).map(request => request.id)]);
    const claim = store.activeClaims().find(active => owned.has(active.work.id));
    if (claim) return refused('request-pending', `${key} has work in flight under a scheduler claim (${claim.stage}).`);
    if ((state.deliveryQueue ?? []).some(request => request.key === key && request.status === 'blocked' && request.officeQAHandoff && !request.officeQAHandoff.consumedAt))
        return refused('request-pending', `${key} has an approved QA handoff waiting on its ownership check.`);
    const stops = consecutiveSetupStops(ticket);
    if (stops >= SETUP_STOP_CAP) return refused('ticket-not-resumable', `QA setup has stopped ${stops} times in a row on this candidate; whether to spend another attempt is a person's to say.`);
    try {
        return store.transaction((): TicketResumeAdmission => {
            let request: DeliveryRequest;
            try {
                request = queue(key, { id: identity, incident, subject: binding.subject, digest: binding.digest, fix: fix.event, commit: fix.commit, action,
                    payload: createHash('sha256').update(canonical(payload)).digest('hex'), release: intent.release, admittedAt: now.toISOString() });
            } catch (error) { throw new Undone('ticket-not-resumable', `The ticket's own resume refused: ${redactEvidence(String(error)).slice(0, 200)}`); }
            // The queue reads before it answers (the feature gate, the ticket): a wait that ran out meanwhile is over, and the request is undone.
            if (waitOver(wait, sofar())) throw new Undone('wait-ended', WAIT_ENDED);
            const waits = state.coordination!.repairWaits!;
            delete waits[waitKey(ref)];
            if (!Object.keys(waits).length) delete state.coordination!.repairWaits;
            const admission = store.emit('repair-resume-admitted', `${key}: ${action} queued to resume after harness fix ${fix.commit.slice(0, 7)} (${incident}).`, undefined, key);
            // What the outcome is later judged against: a ticket's results carry no time. A ticket has no steps.
            request.repairResume!.stood = { steps: 0, stage: ticket.stage, event: admission.id };
            return { admitted: request, replayed: false };
        });
    } catch (error) {
        if (error instanceof Undone) return refused(error.code, error.detail);
        throw error;
    }
}
