import type { WorkTime } from '../../src/shared';

/**
 * Whether a notice's last run is a recipient lookup that can be run again: the lookup is a read-only stage, so
 * one that was interrupted, blocked, finished or failed sent nothing. A failure the runner recorded as an effect
 * of unknown outcome (output past its limit, subprocesses left behind) is not such evidence.
 */
export function lookupSentNothing(work: Pick<WorkTime, 'stage' | 'status' | 'failure'>): boolean {
    if (work.stage !== 'slack-recipient') return false;
    if (work.status === 'failed') return !!work.failure && work.failure.category !== 'uncertain-effect' && !work.failure.code;
    return ['interrupted', 'completed', 'blocked'].includes(work.status);
}
