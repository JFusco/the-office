import { STAGES, type OfficeSnapshot, type WorkTime } from '../../../src/shared';

/** The latest start, heartbeat or end among the work-log entries `counts` picks, or null. */
function latest(state: Pick<OfficeSnapshot, 'workLog'>, counts: (work: WorkTime) => boolean): string | null {
    let last: string | null = null;
    for (const work of state.workLog ?? []) {
        if (!counts(work)) continue;
        for (const at of [work.startedAt, work.lastHeartbeatAt, work.endedAt]) if (at && !Number.isNaN(Date.parse(at)) && (!last || Date.parse(at) > Date.parse(last))) last = at;
    }
    return last;
}

/**
 * The last time a run worked for any of these records: the latest start, heartbeat or end among
 * the work-log entries filed under their IDs, or null. A run saves a heartbeat every few seconds
 * while it works, so a run in progress is recent activity. A job's own `updatedAt` is not read:
 * many changes of stage and status do not set it.
 */
export function lastActivity(state: Pick<OfficeSnapshot, 'workLog'>, ids: readonly string[]): string | null {
    return latest(state, work => ids.includes(work.requestId));
}

/** What a ticket's delivery is filed under in the work log: its pipeline stages, and the read-back, reconcile and Jira transition a resume makes. */
const TICKET_DELIVERY: ReadonlySet<string> = new Set([...STAGES, 'readback', 'reconcile', 'transition']);

/**
 * The same for a CEC pilot ticket. Its stage runs, read-backs and reconciles are filed under the
 * ticket's key with no request ID, so they are found by the key and the stage. A conversation, a
 * Slack send, a retrospective or an investigation about the ticket carries its key too and is not
 * its delivery moving.
 */
export function lastTicketActivity(state: Pick<OfficeSnapshot, 'workLog'>, key: string): string | null {
    return latest(state, work => work.ticket === key && TICKET_DELIVERY.has(work.stage));
}
