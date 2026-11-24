import { subjectKey, type Incident } from '../../src/contracts/incidents';
import type { ProjectObservation } from './observation';
import { redactEvidence } from './redact-evidence';
import { mailboxErrorHidden } from './sources/mailbox-check';

/**
 * The Jira mailbox subject to keep while a check under way has blanked its error, or null. Each reading
 * of a mailbox failure saves the ID of the latest completed check's event (`mailCheckOutcomeId`); a
 * `mail-delivered` recorded after it means the failure has gone, and the subject clears as usual. A
 * subject saved without that ID, or a log that cannot be read, proves nothing: the subject is kept
 * until its check ends.
 */
export function mailboxFreeze(observation: Pick<ProjectObservation, 'projectId' | 'provider' | 'state' | 'lastMailCheckOutcome'>, open: readonly Incident[], report: (message: string) => void): string | null {
    if (observation.provider === 'github' || !mailboxErrorHidden(observation.state)) return null;
    const key = subjectKey({ projectId: observation.projectId, kind: 'provider', id: 'intake' });
    const intake = open.flatMap(incident => incident.subjects).filter(subject => subject.status === 'open' && subjectKey(subject) === key);
    if (!intake.length) return null;
    try {
        const outcome = observation.lastMailCheckOutcome();
        if (outcome?.kind === 'mail-delivered' && intake.every(subject => subject.mailCheckOutcomeId !== undefined && outcome.id > subject.mailCheckOutcomeId)) return null;
    } catch (error) {
        report(`Incident mailbox outcome could not read ${observation.projectId}: ${redactEvidence(String(error)).slice(0, 300)}`);
    }
    return key;
}
