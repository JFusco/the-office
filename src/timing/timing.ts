import { ROLE_NAMES, type OfficeSnapshot } from '../shared';
export function durationLabel(ms: number | null | undefined): string {
    if (ms == null || !Number.isFinite(ms))
        return 'Not recorded';
    const seconds = Math.max(0, Math.round(ms / 1000));
    if (seconds < 60)
        return `${seconds}s`;
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds / 60) % 60}m ${String(seconds % 60).padStart(2, '0')}s`;
}
// Compare runs using their observed endpoint; stale observations never keep ticking.
export function observedDuration(start: string | undefined, end: string | undefined, observedAt: string): number | null {
    const a = Date.parse(start || ''), b = Date.parse(end || observedAt);
    return Number.isFinite(a) && Number.isFinite(b) && b >= a ? b - a : null;
}
export function timeReport(state: OfficeSnapshot, ticket = '') {
    const workers = (state.workLog || []).filter(w => !ticket || w.ticket === ticket), builds = (state.ciHistory || []).filter(b => !ticket || b.linkedTickets?.includes(ticket));
    const byRole = Object.entries(ROLE_NAMES).map(([role, name]) => ({ role, name, elapsedMs: workers.filter(w => w.role === role).reduce((n, w) => n + w.elapsedMs, 0) }));
    return { ticket: ticket || 'Office', workerMs: workers.reduce((n, w) => n + w.elapsedMs, 0), workerRuns: workers.length, workerQueueMs: workers.reduce((n, w) => n + w.queuedMs, 0), partialRuns: workers.filter(w => w.durationUncertain).length, byRole,
        buildMs: builds.reduce((n, b) => n + (b.durationMs ?? 0), 0), buildQueueMs: builds.reduce((n, b) => n + (b.queueMs ?? 0), 0), buildRuns: builds.length, buildsWithoutDuration: builds.filter(b => b.durationMs == null).length };
}
