import type { Incident, IncidentEvent, IncidentFix, ResumeSwitch } from '../../../src/contracts/incidents';
import { eventId } from '../event-id';
import type { IncidentLedger } from '../incident-ledger';
import { redactEvidence } from '../redact-evidence';
import { nextState } from '../transitions';
import { assessResumes } from './assess-resumes';
import { resumeAdmitted } from './resume-arrivals';
import { incidentVerdict } from './verify-incident';

export interface SettleIncidentsInput {
    ledger: IncidentLedger;
    /** The verified release that runs now, when it is known to hold this fix; null otherwise (see running-release.ts). */
    running: (fix: IncidentFix) => unknown;
    now: () => Date;
    /** Asked before every listing, incident, admission lookup, opening history read and write. */
    fenced: () => boolean;
    report?: (message: string) => void;
}

/** A subject waiting for its resume is unaccounted for whether the switch holds it or it is due, so the reading is taken as if paused. */
const ANY_SWITCH: ResumeSwitch = { enabled: false, revision: 0, reason: 'not read for a verdict', at: null };

/** Incident IDs by what one pass recorded for them. */
export interface SettledIncidents { verified: string[]; recurred: string[] }

/**
 * Moves an incident on once its evidence amounts to something (see verify-incident.ts): a
 * `deployed` incident becomes `verified` or `recurred`, a `verified` one becomes `recurred` when
 * its cause stops work again. Each move is one event, `incident-verified` or `incident-recurred`,
 * with the incident's new state and revision; a verification also notes on the incident which fix
 * it was for and when. The fix, its bindings and its outcomes stay as they are.
 *
 * A deployed incident is settled only while the release that runs now is verified and known to
 * hold its fix. A pending release comparison leaves the mark standing. The withdrawal pass
 * returns the incident to `shipped` if the release identity is unknown or the fix is confirmed
 * absent. A verified incident is settled whatever runs.
 *
 * It reads and writes the ledger only. What follows from leaving `deployed` is the other passes'
 * doing: repair waits are kept for `fixing`, `shipped` and `deployed` incidents, so the markers of
 * subjects not yet resumed go on the next pass; resumes are neither queued nor judged any more;
 * and the deployment mark is no longer kept true of the running release.
 *
 * Synchronous. Nothing is read or written once `fenced` says so, and each incident is read
 * afresh before it is judged. One that cannot be judged is reported and leaves the others
 * unaffected.
 */
export function settleIncidents({ ledger, running, now, fenced, report = console.error }: SettleIncidentsInput): SettledIncidents {
    const settled: SettledIncidents = { verified: [], recurred: [] };
    for (const listed of ['deployed', 'verified'] as const) {
        if (fenced()) return settled;
        for (const { id } of ledger.inState(listed)) {
            if (fenced()) return settled;
            try {
                // Read afresh: the listing can be a move behind. An incident this pass just verified is listed again as verified, and nothing has opened since.
                const incident = ledger.get(id);
                if (fenced()) return settled;
                const fix = incident?.fixes?.at(-1);
                if (!incident || !fix || incident.state === 'deployed' && !(fix.deployed && running(fix))) continue;
                let held = false;
                const standings = assessResumes(incident, ANY_SWITCH, undefined, subject => !(held ||= fenced()) && resumeAdmitted(ledger, incident, subject))?.subjects ?? null;
                if (held || fenced()) return settled;
                // What opened since the event the incident is measured from, by the ledger's own order of writing.
                const since = incident.state === 'verified' ? incident.verified?.event : fix.deployed?.event;
                const verdict = incidentVerdict(incident, standings, since ? ledger.openedAfter(incident.id, [since]) : []);
                if (!verdict) continue;
                if (fenced()) return settled;
                const kind = verdict.state === 'verified' ? 'incident-verified' as const : 'incident-recurred' as const, state = nextState(incident.state, kind);
                const at = now().toISOString(), revision = incident.revision + 1;
                // Named by what it follows: a fix is verified once, and an incident recurs once after a deployment and once after a verification.
                const event: IncidentEvent = { id: eventId(incident.id, kind, incident.state === 'verified' ? incident.verified!.event : fix.event), incident: incident.id, at, kind,
                    body: { fix: fix.event, commit: fix.commit, from: incident.state, to: state, revision, detail: verdict.detail, subjects: verdict.subjects } };
                const next: Incident = { ...incident, state, revision, ...(kind === 'incident-verified' ? { verified: { event: event.id, fix: fix.event, at } } : {}) };
                ledger.record({ events: [event], incidents: [next] });
                settled[verdict.state].push(incident.id);
            } catch (error) { report(`Incident ${id} could not be settled: ${redactEvidence(String(error)).slice(0, 300)}`); }
        }
    }
    return settled;
}
