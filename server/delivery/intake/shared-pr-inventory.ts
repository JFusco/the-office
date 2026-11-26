import { openPullInventory } from './pr-inventory';
import type { GitHubDelivery } from '../pipeline/github-delivery';

/**
 * One complete open-PR inventory shared by an assignment poll's readers (bot adoptions, alerts, discovery,
 * dependency refresh and merge notices), so a write-free poll traverses the list once.
 */
export interface PullInventory {
    /** The complete open list, read on first use. A failed or incomplete read is shared too: it is never evidence that a PR is absent. */
    read(): Promise<any[]>;
    /** A PR-body PATCH was dispatched, whatever its outcome: the next reader gets a new complete inventory. */
    invalidate(): void;
}

/** Poll-local: made for one pass and dropped with it, so nothing outlives the poll that read it. */
export function sharedPullInventory(source: Pick<GitHubDelivery, 'store' | 'execute'>): PullInventory {
    let rows: Promise<any[]> | undefined;
    return {
        read: async () => [...await (rows ??= openPullInventory(source))],
        invalidate: () => { rows = undefined; },
    };
}

/** The open list from the poll's shared inventory, or one complete read of its own outside a poll. */
export const openPulls = (source: Pick<GitHubDelivery, 'store' | 'execute'>, inventory?: PullInventory) => (inventory ?? sharedPullInventory(source)).read();
