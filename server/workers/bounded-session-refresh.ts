import type { SessionBridge } from './session-bridge';

/** How long a worker's sessions read waits for a live inventory; its own request deadline is 15 seconds. */
export const SESSION_READ_WAIT = 8000;

/**
 * Waits for a live inventory refresh for at most `ms`. A slower refresh keeps running;
 * the caller answers from the inventory in hand, which states its own age and coverage.
 */
export async function refreshWithin(bridge: Pick<SessionBridge, 'refresh'>, ms = SESSION_READ_WAIT): Promise<void> {
    let timer: NodeJS.Timeout | undefined;
    try { await Promise.race([bridge.refresh(), new Promise<void>(resolve => { timer = setTimeout(resolve, ms); })]); }
    finally { clearTimeout(timer); }
}

/** How long a worker's sessions read waits for a complete inventory; its own request deadline is 15 seconds. */
export const SESSION_COMPLETE_WAIT = 10000;

/**
 * Waits for a complete inventory for at most `ms`, reading again when a read comes back incomplete:
 * a log that changed mid-read or a slow scan often succeeds on the next try. The caller still answers
 * from the inventory in hand, complete or not.
 */
export async function refreshUntilComplete(bridge: Pick<SessionBridge, 'refresh'> & { current: { complete: boolean; expiresAt: string } }, ms = SESSION_COMPLETE_WAIT, now: () => number = Date.now): Promise<void> {
    const until = now() + ms;
    for (let attempt = 0; attempt < 4; attempt++) {
        const left = until - now();
        if (left <= 0) return;
        await refreshWithin(bridge, left);
        if (bridge.current.complete && now() <= Date.parse(bridge.current.expiresAt)) return;
        // A read that fails at once is not read again in a tight loop.
        await new Promise(resolve => setTimeout(resolve, Math.max(0, Math.min(1000, until - now()))));
    }
}
