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
