import { backgroundHold, GRAPHQL_WORK, quotaLow } from '../github/quota-governor';
import type { ITContext } from './context';

/**
 * Whether a GitHub quota hold defers a GitHub project's provider recovery (the assignment listener's read, the
 * project refresh). While it does nothing is queued and no attempt is spent, and no recovery is created. One that
 * exists stays current, so its absence is not read as resolution, with its saved error, diagnostics and count as
 * they are. One routine follow-up says when observation resumes. A recovery already handed to Morgan is not
 * deferred: its own path queues nothing more and keeps that follow-up. Other providers are never deferred.
 */
export function quotaDeferred(context: Pick<ITContext, 'store' | 'engine' | 'it' | 'current' | 'followUps'>, id: string): boolean {
    // Both reads it would queue depend on GraphQL (the assignment board, the PR inventory), so both resources count.
    const held = backgroundHold(context.store.project, context.engine?.quota, GRAPHQL_WORK), recovery = context.it.recoveries[id];
    if (!held || recovery?.status === 'needs-human' && recovery.attempts >= 3) return false;
    context.current.add(id);
    context.followUps.push({ id, owner: 'IT', detail: quotaLow(held), nextAt: held.until, routine: true });
    return true;
}
