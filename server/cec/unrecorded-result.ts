import { sanitize } from '../office/security';
import type { Store } from '../store/store';
import type { Stage, StageResult, Ticket } from '../../src/shared';

export interface UnrecordedResult { attemptId: string; result: StageResult }

/**
 * A stage result the runner accepted from its worker and saved to the attempt record, but which
 * never reached the ticket: the ticket still shows the stage with an older result or none. The
 * worker returned normally, so nothing is run again; the stage takes this result under the same
 * attempt, which keeps its already-verified writes (the QA comment) from being repeated.
 */
export function unrecordedStageResult(store: Store, ticket: Ticket, stage: Stage): UnrecordedResult | undefined {
    if (ticket.stage !== stage) return;
    const row = store.db.prepare('SELECT id,status,body FROM attempts WHERE ticket=? AND stage=? ORDER BY rowid DESC LIMIT 1').get(ticket.key, stage) as { id: string; status: string; body: string } | undefined;
    // A reroute is handled without a ticket result, and an attempt is applied this way once only: if applying it failed, the stage runs again.
    if (!row || row.status === 'running' || row.status === 'reroute' || ticket.recoveredAttemptId === row.id) return;
    const { startedAt, endedAt, elapsedMs, ...result } = JSON.parse(row.body) as StageResult & { startedAt?: string; endedAt?: string; elapsedMs?: number };
    void elapsedMs;
    // Only a run that returned its own result: a stopped run has its own continuation and reconstruction routes.
    const work = store.state.workLog?.filter(entry => entry.ticket === ticket.key && entry.stage === stage).at(-1);
    if (!work || work.executionStatus !== 'completed' || work.failure || !work.endedAt || !startedAt || !endedAt) return;
    if (work.startedAt < startedAt || work.endedAt > endedAt || result.commit !== ticket.commit) return;
    const recorded = ticket.results[stage];
    // The ticket is saved redacted and the attempt is not, so its words are compared as both would be saved.
    if (recorded && recorded.outcome === result.outcome && recorded.commit === result.commit && sanitize(recorded.summary) === sanitize(result.summary)) return;
    return { attemptId: row.id, result: result as StageResult };
}
