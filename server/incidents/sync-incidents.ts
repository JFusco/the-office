import { subjectKey, type IncidentCandidate } from '../../src/contracts/incidents';
import { attributedRecords } from './attributed-records';
import { groupCandidates } from './candidates';
import type { IncidentChange, IncidentLedger } from './incident-ledger';
import type { OfficeObservation } from './observe-projects';
import type { IncidentCollector, ProjectObservation } from './observation';
import { mailboxFreeze } from './mailbox-freeze';
import { redactEvidence } from './redact-evidence';
import { frozenKey, planSync } from './plan-sync';
import { releasedFallbacks } from './released-fallbacks';
import { RUNNER_PROJECT } from './runner-report';
import { COLLECTORS, SOURCE_OF } from './sources/collectors';
import { stoppedCoverage } from './stopped-coverage';

/**
 * One observation pass: every collector reads every project, the reports are grouped by cause, and
 * the difference from the ledger is recorded in one transaction. It reads project state and writes
 * only the ledger. What could not be seen is frozen, not cleared: a paused or draining project's
 * stopped work, a Jira mailbox's error while a check under way has blanked it, a source whose
 * collector failed for a project, and every source of a project that could not be read at all. The
 * outbox reader is told which records stopped work holds this pass. Saved items can be released on
 * the same coverage after a readable outbox pass, or on fresh stopped-work reports during an outage.
 */
export function syncIncidents(ledger: IncidentLedger, { observations, unreadable }: OfficeObservation, now: Date, collectors: readonly IncidentCollector[] = COLLECTORS, report: (message: string) => void = console.error): IncidentChange {
    // The runner's subject is written by its own reports (record-runner-failure.ts); no project observation sees it.
    const frozen = new Set<string>([frozenKey(RUNNER_PROJECT, 'runner')]), open = ledger.current();
    for (const { projectId, error } of unreadable) { frozen.add(frozenKey(projectId, '*')); report(`Incident observation could not read ${projectId}: ${error}`); }
    for (const observation of observations) {
        if (observation.state.paused || observation.state.draining) frozen.add(frozenKey(observation.projectId, 'stopped-work'));
        const mailbox = mailboxFreeze(observation, open, report);
        if (mailbox) frozen.add(mailbox);
    }
    // What stopped work reported for each project, null where it could not read it.
    const candidates: IncidentCandidate[] = [], stopped = new Map<string, readonly IncidentCandidate[] | null>();
    const outboxCoverage = new Map<string, ReadonlySet<string>>();
    for (const collect of collectors) for (const observation of observations) {
        const source = SOURCE_OF.get(collect);
        try {
            // A view over the observation, not a copy: reading the outbox must not read what stopped work could not.
            const covered = source === 'outbox' && stopped.has(observation.projectId)
                ? stoppedCoverage(observation, stopped.get(observation.projectId) ?? null, open, frozen) : null;
            const found = collect(covered ? Object.create(observation, { covered: { value: covered, enumerable: true } }) as ProjectObservation : observation);
            if (covered) outboxCoverage.set(observation.projectId, covered);
            candidates.push(...found);
            if (source === 'stopped-work') stopped.set(observation.projectId, found);
        }
        catch (error) {
            frozen.add(frozenKey(observation.projectId, source ?? '*'));
            if (source === 'stopped-work') stopped.set(observation.projectId, null);
            report(`Incident source ${collect.name || 'unnamed'} could not read ${observation.projectId}: ${redactEvidence(String(error)).slice(0, 300)}`);
        }
    }
    const released = new Set<string>();
    for (const observation of observations) {
        const { projectId } = observation, reports = stopped.get(projectId);
        const covered = outboxCoverage.get(projectId) ?? (frozen.has(frozenKey(projectId, 'outbox')) && reports
            ? new Set(reports.map(candidate => subjectKey(candidate.subject))) : null);
        if (covered?.size) for (const key of releasedFallbacks(open, observation, covered)) released.add(key);
    }
    const observed = groupCandidates(candidates, attributedRecords(open, frozen, released));
    const change = planSync(ledger.current(observed.keys()), observed, now, { frozen, released, history: (incident, subject) => ledger.subjectHistory(incident, subject) });
    ledger.record(change);
    return change;
}
