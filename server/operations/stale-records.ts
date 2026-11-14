import type { DailyCheckpoint, MaintenanceRun, TeamMessage, Ticket } from '../../src/shared';
import { workKey, type HarnessRequest, type WorkRef } from '../../src/contracts/work';

/**
 * Deterministic supersession for retained records that stopped and will never run again. Each rule returns the
 * reason a record is now history, or undefined. Pure: records keep their saved status; only the scheduler
 * projection reads them as terminal. Unconfirmed effects are never covered: they are settled by read-back only,
 * so a record linked to an unsettled write stays stopped (see `touchesUnsettled`).
 */
const STOPPED = new Set(['failed', 'blocked', 'interrupted']);

/** Writes still dispatching or uncertain in the Effects ledger, by work key and by attempt id. */
export interface UnsettledEffects { workKeys: ReadonlySet<string>; attempts: ReadonlySet<string> }

/** True when any of these records owns, or was the attempt behind, a write that is not yet settled. */
export function touchesUnsettled(unsettled: UnsettledEffects, refs: readonly WorkRef[]): boolean {
    return refs.some(ref => unsettled.workKeys.has(workKey(ref)) || unsettled.attempts.has(ref.id));
}

/** A recovery request for a ticket that has since closed has nothing left to recover. */
export function closedTicketRequest(request: Pick<HarnessRequest, 'status' | 'key'>, tickets: readonly Pick<Ticket, 'key' | 'status'>[]): string | undefined {
    if (!STOPPED.has(request.status) || !request.key) return;
    return tickets.some(ticket => ticket.key === request.key && ticket.status === 'closed') ? `Superseded: ${request.key} is closed; the stopped request is kept as history` : undefined;
}

/**
 * A missed daily checkpoint is history once a later day's checkpoint completed. A checkpoint with a recorded
 * re-run path (a repair resume or a native continuation) is left alone so that path can still finish it.
 */
export function supersededCheckpoint(checkpoint: Pick<DailyCheckpoint, 'id' | 'date' | 'status' | 'repairResume' | 'continuationId'>, checkpoints: readonly Pick<DailyCheckpoint, 'id' | 'date' | 'status'>[]): string | undefined {
    if (!STOPPED.has(checkpoint.status) || checkpoint.repairResume || checkpoint.continuationId) return;
    const later = checkpoints.filter(other => other.id !== checkpoint.id && other.status === 'completed' && other.date > checkpoint.date).map(other => other.date).sort()[0];
    return later ? `Superseded: the ${later} checkpoint completed; this day's stopped checkpoint is kept as history` : undefined;
}

/** Completed stages that re-observed sources, as in maintenanceSuperseded: a gate skip is also 'completed' but re-checked nothing. */
const REOBSERVED = new Set(['complete', 'brain-completed']);

/**
 * A stopped maintenance run is history once a later run completed or a later run recorded that it proceeded past it.
 * A run whose read-back recovery is still active is left alone, so recovery can settle it first.
 */
export function supersededRun(run: Pick<MaintenanceRun, 'id' | 'status' | 'requestedAt' | 'readbackRetry'>, runs: readonly Pick<MaintenanceRun, 'id' | 'status' | 'stage' | 'requestedAt' | 'supersedes'>[]): string | undefined {
    if (!STOPPED.has(run.status) || (run.readbackRetry && !run.readbackRetry.exhausted)) return;
    const later = runs.filter(other => other.id !== run.id && other.requestedAt > run.requestedAt);
    if (later.some(other => other.supersedes?.includes(run.id))) return 'Superseded: a later maintenance run proceeded past this one; it is kept as history';
    return later.some(other => other.status === 'completed' && REOBSERVED.has(other.stage)) ? 'Superseded: a later maintenance run completed; this stopped run is kept as history' : undefined;
}

/**
 * Harper's follow-ups are advisory and nothing retries a failed one. A `harper:` diagnosis hand-off is read-only, so
 * an unverified receipt in its reply was a failed read (see team-conversation-pump.ts). A follow-up that verifies an
 * original message's effects is retired only when no reply to it recorded an unverified or uncertain receipt.
 */
export function retiredFollowup(message: Pick<TeamMessage, 'id' | 'from' | 'status' | 'actionId' | 'requestId'>, messages: readonly Pick<TeamMessage, 'id' | 'requestId' | 'receipts'>[]): string | undefined {
    if (message.from !== 'knowledge' || message.status !== 'failed') return;
    const readOnly = message.actionId.startsWith('harper:');
    const unverified = messages.some(reply => reply.id !== message.id && reply.requestId === message.requestId && (reply.receipts || []).some(receipt => !receipt.verified || receipt.uncertain));
    return readOnly || !unverified ? 'Advisory follow-up failed and is not retried; kept as history' : undefined;
}
