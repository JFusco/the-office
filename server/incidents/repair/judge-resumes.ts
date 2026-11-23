import { subjectKey, type Incident, type IncidentEvent, type IncidentFix, type ResumeOutcome } from '../../../src/contracts/incidents';
import type { Store } from '../../store/store';
import { eventId } from '../event-id';
import type { IncidentLedger } from '../incident-ledger';
import { redactEvidence } from '../redact-evidence';
import { movedByHand } from './moved-by-hand';
import { lastActivity, lastTicketActivity } from './resume-activity';
import { admittedId } from './resume-arrivals';
import { boundResume, boundTicketResume, resumeIdentity } from './resume-binding';
import { resumeOutcome } from './resume-outcome';
import { subjectParts } from './resume-routes';
import { stalledSince } from './stalled-resume';
import { ticketMovedByHand } from './ticket-moved-by-hand';
import { attemptsBegunBy, ticketProgress } from './ticket-progress';

const TICKET = 'ticket:';

export interface JudgeResumesInput {
    ledger: IncidentLedger;
    entries: readonly { store: Store }[];
    /** The verified release that runs now, when it is known to hold this fix; null otherwise (see running-release.ts). */
    running: (fix: IncidentFix) => unknown;
    now: () => Date;
    /** Asked before each subject is read and again before every write: nothing is read or recorded while a deployment holds the fence. */
    fenced: () => boolean;
    report?: (message: string) => void;
}

type Open = { incident: string; subject: string; openedAt: string; waiting: boolean };

/** Every subject some incident holds open, by its key. */
function openSubjects(ledger: IncidentLedger): Map<string, Open[]> {
    const open = new Map<string, Open[]>();
    for (const incident of ledger.current()) for (const subject of incident.subjects) {
        if (subject.status !== 'open') continue;
        const key = subjectKey(subject);
        open.set(key, [...open.get(key) ?? [], { incident: incident.id, subject: key, openedAt: subject.openedAt, waiting: !!subject.expected }]);
    }
    return open;
}

/**
 * Records what became of each resume the Office queued. For every `deployed` incident, each
 * subject of its latest fix whose resume the ledger holds as admitted is read in its own project
 * (see resume-outcome.ts), and an outcome that is new is recorded: one `resume-outcome` event and
 * the subject's entry on the fix, with the incident's revision advanced. Returns the subjects
 * recorded, as `project/kind/id`.
 *
 * An incident is read only while the release that runs now is verified and known to hold its
 * fix: the deployment mark alone can outlast the release it names, and what happens then says
 * nothing of the fix.
 *
 * It judges and records; it changes no incident's state and writes no project store. Each
 * outcome is recorded once: evidence that has not changed records nothing on a later pass.
 * The incident is read again for every subject, so no outcome is written over a newer revision.
 * Synchronous throughout. Nothing is read or written while `fenced` says so: it is asked before
 * each subject is read and again before its outcome is written. A subject whose
 * project this Office does not hold is left for a later pass, and one that cannot be read is
 * reported and leaves the others unaffected.
 */
export function judgeResumes({ ledger, entries, running, now, fenced, report = console.error }: JudgeResumesInput): string[] {
    const recorded: string[] = [];
    if (fenced()) return recorded;
    const stores = new Map(entries.map(({ store }) => [store.project.id, store]));
    let open: Map<string, Open[]> | undefined;
    for (const { id } of ledger.inState('deployed')) {
        if (fenced()) return recorded;
        const subjects = ledger.get(id)?.fixes?.at(-1)?.bindings.map(binding => binding.subject) ?? [];
        for (const subject of subjects) {
            // The fence can be taken while the pass runs: once it is, nothing more is read.
            if (fenced()) return recorded;
            try {
                // Read again for every subject: the one before may have advanced the revision.
                const incident = ledger.get(id);
                if (fenced()) return recorded;
                const fix = incident?.fixes?.at(-1), binding = fix?.bindings.find(binding => binding.subject === subject);
                // A subject with no route has no admission either; naming it here only tells the compiler so.
                if (!incident || !fix?.deployed || !binding || binding.disposition === 'no-route') continue;
                // The mark alone can name a release that no longer serves: after a rollback it stands until the withdrawal pass has asked GitHub. What happens meanwhile says nothing of the fix.
                const release = running(fix);
                if (fenced()) return recorded;
                if (!release) continue;
                const identity = resumeIdentity(incident.id, subject, fix.event), admission = ledger.event(admittedId(incident.id, identity));
                if (fenced()) return recorded;
                const work = subjectParts(subject), store = work && stores.get(work.project);
                if (!admission || !store) continue;
                const previous = fix.outcomes?.find(outcome => outcome.subject === subject)?.outcome;
                if (previous === 'recurred') continue;
                // A final outcome gives way only to recurrence, which the ledger alone shows.
                const undecided = !previous || previous === 'chained' || previous === 'stalled';
                // A CEC pilot ticket is read as a job is, from its own records: its delivery request, its stage attempts, its queue (see ticket-progress.ts).
                const ticket = work.id.startsWith(TICKET) ? work.id.slice(TICKET.length) : null;
                const held = ticket === null ? boundResume(store.state, identity) : boundTicketResume(store.state, identity);
                const repair = held?.repairResume;
                let request = held;
                // An unmarked zero with earlier attempts means the admission did not record how the ticket stood.
                if (undecided && ticket !== null && held && repair?.stood?.steps === 0 && !repair.stood.ticketAttemptsCounted) {
                    const earlierAttempts = attemptsBegunBy(store, ticket, repair.admittedAt);
                    if (fenced()) return recorded;
                    if (earlierAttempts > 0) request = { ...held, repairResume: { ...repair, stood: undefined } };
                }
                const stood = request?.repairResume?.stood;
                let job: ReturnType<typeof ticketProgress>;
                if (ticket === null) {
                    job = store.state.coordination?.jobs?.find(job => job.id === work.id);
                } else if (undecided) {
                    job = ticketProgress(store, ticket);
                    if (fenced()) return recorded;
                }
                // By the ledger's own order of writing, not by clock: an opening counts when it was recorded after the mark that stands. A resume is admitted only for a subject that still stood as the fix bound it, so such an opening followed the admission too, unless the mark was made again after it.
                const opening = ledger.openedAfter(incident.id, [fix.deployed.event]).find(opened => opened.subject === subject);
                if (fenced()) return recorded;
                let replacementMarkAfterAdmission = false;
                if (undecided && fix.withdrawn) {
                    const appendedAfterAdmission = ledger.eventFollows(fix.deployed.event, admission.id);
                    if (fenced()) return recorded;
                    replacementMarkAfterAdmission = appendedAfterAdmission || Date.parse(fix.deployed.at) > Date.parse(admission.at);
                }
                const stallRequest = undecided && previous !== 'stalled' ? request : undefined;
                const projectWaiting = !!stallRequest && (!!store.state.paused || !!store.state.draining);
                if (!open && (!previous || (stallRequest && !projectWaiting))) {
                    open = openSubjects(ledger);
                    if (fenced()) return recorded;
                }
                const moment = now();
                let moved = null;
                if (undecided && request && stood) {
                    // By the request's own key: the job may be gone, and the move is still on record. A ticket's is read from its delivery queue.
                    moved = ticket === null ? movedByHand(store, request.key, stood.event) : ticketMovedByHand(store.state, request);
                    if (fenced()) return recorded;
                }
                const reading = resumeOutcome({
                    binding, admittedAt: admission.at, deployedAt: fix.deployed.at, replacementMarkAfterAdmission, previous, request, job, moved, noun: ticket === null ? 'job' : 'ticket',
                    // The project's own date for the stop is known while the projection holds the subject; once a long-cleared record is let go, the order of writing decides alone.
                    reopened: opening ? { at: opening.at, stoppedAt: incident.subjects.find(record => subjectKey(record) === subject)?.stop?.at ?? null } : null,
                    // Only a resume with nothing recorded can still be called chained.
                    elsewhere: !previous ? [subject, ...(request ? [`${work.project}/${ticket === null ? 'reconciliation' : 'delivery'}/${request.id}`] : [])].flatMap(key => open?.get(key) ?? []).filter(other => other.incident !== incident.id) : [],
                    // An applicable wait suppresses the stalled judgment.
                    stalled: stallRequest ? stalledSince({
                        admittedAt: admission.at, activity: [ticket === null ? lastActivity(store.state, [work.id, stallRequest.id]) : lastTicketActivity(store.state, ticket), ledger.subjectChangedAt(subject)],
                        waiting: projectWaiting || (open?.get(subject) ?? []).some(other => other.waiting),
                    }, moment) : null,
                });
                if (!reading) continue;
                if (fenced()) return recorded;
                const at = moment.toISOString(), detail = redactEvidence(reading.detail).slice(0, 300);
                // Named by the resume and the outcome: an outcome is never recorded twice, and each can be reached once.
                const event: IncidentEvent = { id: eventId(incident.id, 'resume-outcome', identity, reading.outcome), incident: incident.id, at, kind: 'resume-outcome',
                    body: { resume: identity, fix: fix.event, commit: fix.commit, subject, outcome: reading.outcome, detail, replaces: previous ?? null } };
                const outcome: ResumeOutcome = { subject, outcome: reading.outcome, detail, event: event.id, at };
                const next: Incident = { ...incident, revision: incident.revision + 1, fixes: [...incident.fixes!.slice(0, -1), { ...fix, outcomes: [...(fix.outcomes ?? []).filter(held => held.subject !== subject), outcome] }] };
                ledger.record({ events: [event], incidents: [next] });
                recorded.push(subject);
            } catch (error) { report(`The outcome of a repair resume could not be judged for ${subject}: ${redactEvidence(String(error)).slice(0, 300)}`); }
        }
    }
    return recorded;
}
