import type { LiveSession } from './session-bridge';
import type { DesktopSessions } from './codex-process-inventory';

const knownActivity = (session: LiveSession) =>
    session.context?.activity !== undefined && session.context.activity !== 'unknown' && session.status !== 'loaded';

/** Coverage requires every Codex PID accounted for and known current-turn activity for every loaded session. */
export function completeSessionCoverage(results: PromiseSettledResult<LiveSession[]>[]): boolean {
    const [native, claude, desktop] = results;
    if (claude.status !== 'fulfilled' || desktop.status !== 'fulfilled') return false;
    // Every inventoried Codex PID must be accounted for; a missing report is never complete.
    const unaccounted = (desktop.value as LiveSession[] & Partial<Pick<DesktopSessions, 'unaccounted'>>).unaccounted;
    if (!Array.isArray(unaccounted) || unaccounted.length) return false;
    // An absent optional runtime socket can be covered by complete, explicit process activity.
    if (native.status === 'rejected') return native.reason?.code === 'ENOENT' && desktop.value.every(knownActivity);
    // Native unknown activity (notLoaded/systemError) is not coverage; a known native status resolves only its own identity.
    if (native.value.some(session => session.status === 'loaded')) return false;
    const resolved = new Set(native.value.map(session => session.id));
    return desktop.value.every(session => knownActivity(session) || resolved.has(session.id));
}
