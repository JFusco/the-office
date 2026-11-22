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
