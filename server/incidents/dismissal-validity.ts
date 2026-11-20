import { subjectKey, type Incident, type IncidentEvent } from '../../src/contracts/incidents';
import { citationFault, type SourceVersions } from './cited-sources';
import { eventId } from './event-id';
import type { IncidentLedger } from './incident-ledger';
import { repairSubject } from './subject-digest';
import { nextState } from './transitions';

/**
 * Why the incident's standing dismissal no longer holds, or null while it does. It was made
 * against particular code and particular stops: a cited file that changed or left the running
 * release, a subject that was not part of it, or a covered subject that stopped again or stands
 * differently, is new evidence. A covered subject that cleared, and a change to a file the
 * verdict did not cite, are not.
 */
export function dismissalLapse(incident: Incident, versions: SourceVersions): string | null {
    const dismissal = incident.dismissals?.at(-1);
    if (!dismissal || dismissal.lapsed) return null;
    for (const citation of dismissal.cited) {
        const fault = citationFault(citation, versions);
        if (fault) return `cited source changed: ${fault}`;
    }
    const covered = new Map(dismissal.subjects.map(subject => [subject.subject, subject.digest]));
    for (const subject of incident.subjects) {
        if (subject.status !== 'open') continue;
        const key = subjectKey(subject);
        if (!covered.has(key)) return `${key} stopped after the dismissal and was not part of it`;
        if (covered.get(key) !== repairSubject(subject).digest) return `${key} stopped again or stands differently than when it was dismissed`;
    }
    return null;
}

/**
 * Returns every dismissed incident whose dismissal no longer holds to `observed`, once, with the
 * reason on record and the dismissal kept, marked as lapsed. Reads and writes only the ledger.
 */
export function invalidateDismissals(ledger: IncidentLedger, versions: SourceVersions, now: Date): string[] {
    const lapsed: string[] = [], at = now.toISOString();
    for (const incident of ledger.inState('dismissed')) {
        const reason = dismissalLapse(incident, versions), dismissal = incident.dismissals?.at(-1);
        if (!reason || !dismissal) continue;
        const state = nextState(incident.state, 'dismissal-invalidated'), revision = incident.revision + 1;
        const event: IncidentEvent = { id: eventId(incident.id, 'dismissal-invalidated', dismissal.event), incident: incident.id, at, kind: 'dismissal-invalidated', body: { dismissal: dismissal.event, reason, from: incident.state, to: state, revision } };
        ledger.record({ events: [event], incidents: [{ ...incident, state, revision, dismissals: [...incident.dismissals!.slice(0, -1), { ...dismissal, lapsed: { event: event.id, reason, at } }] }] });
        lapsed.push(incident.id);
    }
    return lapsed;
}
