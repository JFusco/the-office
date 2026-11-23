import type { WorkTime } from '../../src/shared';

/**
 * Whether a notice's last run is a recipient lookup that may be run again: one that was interrupted, blocked,
 * finished or failed. A failure the runner recorded as an effect of unknown outcome (output past its limit,
 * subprocesses left behind), or a failed run with no recorded failure, is not accepted.
 *
 * This says the harness dispatched no send for that run. It is not proof the worker could not have: the lookup
 * is told never to send and runs under a read-only launch, but its connected Slack tools are not removed. What
 * prevents a second notice is the saved delivery record, which the caller checks and the sender checks again.
 */
export function lookupSentNothing(work: Pick<WorkTime, 'stage' | 'status' | 'failure'>): boolean {
    if (work.stage !== 'slack-recipient') return false;
    if (work.status === 'failed') return !!work.failure && work.failure.category !== 'uncertain-effect' && !work.failure.code;
    return ['interrupted', 'completed', 'blocked'].includes(work.status);
}
