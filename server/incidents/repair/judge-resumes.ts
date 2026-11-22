import { subjectKey, type Incident, type IncidentEvent, type ResumeOutcome } from '../../../src/contracts/incidents';
import type { Store } from '../../store/store';
import { eventId } from '../event-id';
import type { IncidentLedger } from '../incident-ledger';
import { redactEvidence } from '../redact-evidence';
import { movedByHand } from './moved-by-hand';
import { admittedId } from './resume-arrivals';
import { boundResume, resumeIdentity } from './resume-binding';
import { resumeOutcome } from './resume-outcome';
import { subjectParts } from './resume-routes';

export interface JudgeResumesInput {
    ledger: IncidentLedger;
    entries: readonly { store: Store }[];
    now: () => Date;
    /** Asked before each subject is read and again before every write: nothing is read or recorded while a deployment holds the fence. */
    fenced: () => boolean;
    report?: (message: string) => void;
}

type Open = { incident: string; subject: string; openedAt: string };

/** Every subject some incident holds open, by its key. */
function openSubjects(ledger: IncidentLedger): Map<string, Open[]> {
    const open = new Map<string, Open[]>();
    for (const incident of ledger.current()) for (const subject of incident.subjects) {
        if (subject.status !== 'open') continue;
        const key = subjectKey(subject);
        open.set(key, [...open.get(key) ?? [], { incident: incident.id, subject: key, openedAt: subject.openedAt }]);
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
 * It judges and records; it changes no incident's state and writes no project store. Each
 * outcome is recorded once: evidence that has not changed records nothing on a later pass.
 * The incident is read again for every subject, so no outcome is written over a newer revision.
 * Synchronous throughout. Nothing is read or written while `fenced` says so: it is asked before
 * each subject is read and again before its outcome is written. A subject whose
 * project this Office does not hold is left for a later pass, and one that cannot be read is
 * reported and leaves the others unaffected.
 */
export function judgeResumes({ ledger, entries, now, fenced, report = console.error }: JudgeResumesInput): string[] {
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
                const incident = ledger.get(id), fix = incident?.fixes?.at(-1), binding = fix?.bindings.find(binding => binding.subject === subject);
                // A subject with no route has no admission either; naming it here only tells the compiler so.
                if (!incident || !fix?.deployed || !binding || binding.disposition === 'no-route') continue;
                const identity = resumeIdentity(incident.id, subject, fix.event), admission = ledger.event(admittedId(incident.id, identity));
                const work = subjectParts(subject), store = work && stores.get(work.project);
                if (!admission || !store) continue;
                const previous = fix.outcomes?.find(outcome => outcome.subject === subject)?.outcome;
                if (previous === 'recurred') continue;
                const request = boundResume(store.state, identity), stood = request?.repairResume?.stood;
                const job = store.state.coordination?.jobs?.find(job => job.id === work.id);
                // A recorded outcome gives way only to a recurrence, which the ledger alone shows: the project's events and the other incidents are read while the outcome is still open.
                const undecided = !previous || previous === 'chained';
                const held = incident.subjects.find(record => subjectKey(record) === subject), past = held ? null : ledger.subjectHistory(incident.id, subject);
                const reading = resumeOutcome({
                    binding, admittedAt: admission.at, deployedAt: fix.deployed.at, previous, request, job,
                    // The projection lets a long-cleared record go; the history still says when it last opened.
                    record: held ?? (past ? { openedAt: past.lastOpenedAt } : undefined),
                    // By the request's own key: the job may be gone, and the move is still on record.
                    moved: undecided && request && stood ? movedByHand(store, request.key, stood.event) : null,
                    elsewhere: undecided ? [subject, ...(request ? [`${work.project}/reconciliation/${request.id}`] : [])].flatMap(key => (open ??= openSubjects(ledger)).get(key) ?? []).filter(other => other.incident !== incident.id) : [],
                });
                if (!reading) continue;
                if (fenced()) return recorded;
                const at = now().toISOString(), detail = redactEvidence(reading.detail).slice(0, 300);
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
