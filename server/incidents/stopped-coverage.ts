import { subjectKey, type Incident, type IncidentCandidate } from '../../src/contracts/incidents';
import type { ProjectObservation } from './observation';
import { retainedSubjectKeys } from './plan-sync';
import { stoppedRecord } from './sources/stopped-record';

/**
 * The stopped-work subject keys of one project that stand open after this pass: what stopped work
 * reported now, saved subjects the ledger keeps through a source outage, and while
 * the project is paused or draining, every stopped record the pause stands for. `reports` is null when
 * stopped work could not read the project, so a failed first read covers nothing new.
 */
export function stoppedCoverage(observation: Pick<ProjectObservation, 'projectId' | 'state' | 'progression'>, reports: readonly IncidentCandidate[] | null, open: readonly Incident[], frozen: ReadonlySet<string>): Set<string> {
    const { projectId, state } = observation, keys = new Set((reports ?? []).map(candidate => subjectKey(candidate.subject)));
    const retained = retainedSubjectKeys(open, frozen);
    for (const incident of open) if (incident.cause.source === 'stopped-work')
        for (const subject of incident.subjects) {
            if (subject.status !== 'open' || subject.projectId !== projectId) continue;
            const key = subjectKey(subject);
            if (retained.has(key)) keys.add(key);
        }
    if (state.paused || state.draining)
        for (const { work, stage } of observation.progression) if (work.projectId === projectId && stoppedRecord(state, work, stage)?.standing === 'stopped') keys.add(subjectKey(work));
    return keys;
}
