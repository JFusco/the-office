import type { OfficeSnapshot } from '../../../src/shared';

/**
 * The last time a run worked for any of these records: the latest start, heartbeat or end among
 * the work-log entries filed under their IDs, or null. A run saves a heartbeat every few seconds
 * while it works, so a run in progress is recent activity. A job's own `updatedAt` is not read:
 * many changes of stage and status do not set it.
 */
export function lastActivity(state: Pick<OfficeSnapshot, 'workLog'>, ids: readonly string[]): string | null {
    let last: string | null = null;
    for (const work of state.workLog ?? []) {
        if (!ids.includes(work.requestId)) continue;
        for (const at of [work.startedAt, work.lastHeartbeatAt, work.endedAt]) if (at && !Number.isNaN(Date.parse(at)) && (!last || Date.parse(at) > Date.parse(last))) last = at;
    }
    return last;
}
