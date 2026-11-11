import type { LiveSession } from './session-bridge';

/** An absent optional runtime socket can be covered by complete, explicit process activity. */
export function completeSessionCoverage(results: PromiseSettledResult<LiveSession[]>[]): boolean {
    const [native, claude, desktop] = results;
    if (claude.status !== 'fulfilled' || desktop.status !== 'fulfilled') return false;
    if (native.status === 'fulfilled') return true;
    return native.reason?.code === 'ENOENT' && desktop.value.every(session =>
        session.context?.activity !== undefined && session.context.activity !== 'unknown' && session.status !== 'loaded');
}
