import type { IncidentCandidate } from '../../src/contracts/incidents';
import { attributedRecords } from './attributed-records';
import { groupCandidates } from './candidates';
import type { IncidentChange, IncidentLedger } from './incident-ledger';
import type { OfficeObservation } from './observe-projects';
import type { IncidentCollector } from './observation';
import { redactEvidence } from './redact-evidence';
import { frozenKey, planSync } from './plan-sync';
import { COLLECTORS, SOURCE_OF } from './sources/collectors';

/**
 * One observation pass: every collector reads every project, the reports are grouped by cause, and
 * the difference from the ledger is recorded in one transaction. It reads project state and writes
 * only the ledger. What could not be seen is frozen, not cleared: a paused or draining project's
 * stopped work, a source whose collector failed for a project, and every source of a project that
 * could not be read at all.
 */
export function syncIncidents(ledger: IncidentLedger, { observations, unreadable }: OfficeObservation, now: Date, collectors: readonly IncidentCollector[] = COLLECTORS, report: (message: string) => void = console.error): IncidentChange {
    const frozen = new Set<string>();
    for (const { projectId, error } of unreadable) { frozen.add(frozenKey(projectId, '*')); report(`Incident observation could not read ${projectId}: ${error}`); }
    for (const observation of observations) if (observation.state.paused || observation.state.draining) frozen.add(frozenKey(observation.projectId, 'stopped-work'));
    const candidates: IncidentCandidate[] = [];
    for (const collect of collectors) for (const observation of observations) {
        try { candidates.push(...collect(observation)); }
        catch (error) {
            frozen.add(frozenKey(observation.projectId, SOURCE_OF.get(collect) ?? '*'));
            report(`Incident source ${collect.name || 'unnamed'} could not read ${observation.projectId}: ${redactEvidence(String(error)).slice(0, 300)}`);
        }
    }
    const observed = groupCandidates(candidates, attributedRecords(ledger.current(), frozen));
    const change = planSync(ledger.current(observed.keys()), observed, now, { frozen, history: (incident, subject) => ledger.subjectHistory(incident, subject) });
    ledger.record(change);
    return change;
}
