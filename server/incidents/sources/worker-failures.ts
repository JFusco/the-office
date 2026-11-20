import { expectedWait } from '../expected-block';
import { boundedEvidence } from '../bounded-evidence';
import { normalizeCause } from '../normalize-cause';
import type { IncidentCollector } from '../observation';

export const FAILURE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Runs that failed after they were dispatched, by the category the harness gave the failure. A
 * failed run is a moment, not a state, so each is counted for 24 hours after it ended; the same
 * failure on several runs in a day is what makes it an incident worth a look. A run the harness
 * cancelled itself, or whose saved result the stage accepted anyway, is not a failure.
 */
export const workerFailures: IncidentCollector = ({ projectId, state, now }) => (state.workLog ?? [])
    .filter(run => ['failed', 'interrupted'].includes(run.status) && run.failure?.dispatched && run.failure.category !== 'cancelled' && !run.completionAccepted
        && now.getTime() - Date.parse(run.endedAt) < FAILURE_WINDOW_MS)
    .map(run => ({
        subject: { projectId, kind: 'worker', id: run.id, episode: run.endedAt, stage: run.stage, stop: null, lastWorker: run.id, head: '', unsettledEffect: false },
        cause: { source: 'worker-failure' as const, provider: run.provider, stage: run.stage, kind: run.failure!.code ?? run.failure!.category, text: normalizeCause(run.failure!.detail), author: 'harness' as const },
        expected: expectedWait({ failure: run.failure!.category }),
        evidence: boundedEvidence(run.failure!.detail),
    }));
