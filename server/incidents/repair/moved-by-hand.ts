import type { Store } from '../../store/store';

/**
 * The project events only an operator's command emits when it moves a delivery job: PR
 * preparation, a candidate base update, a candidate or PR review recheck
 * (server/scheduling/operator-commands.ts) and a requeued implementation
 * (server/delivery/recovery/implementation/requeue-waited-implement.ts). Each carries the
 * ticket's key. The job itself records no actor, so these are the only trace of such a move.
 */
export const OPERATOR_MOVES: readonly string[] = ['pr-preparation-queued', 'candidate-base-update', 'candidate-review-recheck', 'pr-review-recheck', 'implement-requeued'];

/**
 * The first operator's command that moved this ticket's job after a given project event, or
 * null. Read from the project's own events by ID, which only grows, so "after" needs no clock.
 * A recovery request an operator queues by command leaves no such event and is not seen here.
 */
export function movedByHand(store: Pick<Store, 'db'>, ticket: string, after: number): { kind: string; at: string } | null {
    const row = store.db.prepare(`SELECT body FROM events WHERE id>? AND json_extract(body,'$.ticket')=? AND json_extract(body,'$.kind') IN (${OPERATOR_MOVES.map(() => '?').join(',')}) ORDER BY id LIMIT 1`)
        .get(after, ticket, ...OPERATOR_MOVES) as { body: string } | undefined;
    if (!row) return null;
    const event = JSON.parse(row.body) as { kind: string; at: string };
    return { kind: event.kind, at: event.at };
}

/** What `queueCheckpointRetry` (server/maintenance/checkpoint-retry.ts) begins its event's message with, for one original run. */
const retryQueued = (run: string) => `Original maintenance ${run} reconciled. Brain checkpoint will retry after `;

/**
 * The first retry queued for a checkpoint's original run after a given project event, or null.
 * `checkpoint-retry-queued` names the run in its message and carries no checkpoint and no actor:
 * a person's retry, IT's, the not-started recovery and the refresh continuation all emit it the
 * same way, so any of them moves the checkpoint here. It is this checkpoint's because a resume is
 * admitted only while no other checkpoint points to that run, and none is linked to it after (see
 * checkpoint-eligibility.ts). The message is compared by its beginning, literally, with the run
 * bound as a value. Read from the project's own events by ID, so "after" needs no clock and an
 * event older than the hundred held in memory is still found.
 */
export function checkpointRetried(store: Pick<Store, 'db'>, run: string, after: number): { kind: string; at: string } | null {
    const prefix = retryQueued(run);
    const row = store.db.prepare(`SELECT body FROM events WHERE id>? AND json_extract(body,'$.kind')=? AND substr(json_extract(body,'$.message'),1,length(?))=? ORDER BY id LIMIT 1`)
        .get(after, 'checkpoint-retry-queued', prefix, prefix) as { body: string } | undefined;
    if (!row) return null;
    const event = JSON.parse(row.body) as { kind: string; at: string };
    return { kind: event.kind, at: event.at };
}
