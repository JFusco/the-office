import type { ITFollowUp } from '../shared';

/**
 * The follow-ups that are waiting on something. A routine one (a watch that only describes the
 * Office's view of its surroundings, such as whether other chat sessions could be listed) is still
 * listed, but it is not counted and never makes Ellis look busy, even while that watch is retrying.
 * Any other recovery in progress is counted, and so is anything addressed to Joe however it is flagged.
 */
export const outstandingFollowUps = <T extends Pick<ITFollowUp, 'routine'>>(followUps: readonly T[]): T[] => followUps.filter(followUp => !followUp.routine || (followUp as { owner?: string }).owner === 'You');

/** Ellis's state from the follow-ups: someone must act, a recovery is under way, or nothing is outstanding. */
export function followUpStatus(followUps: readonly Pick<ITFollowUp, 'owner' | 'routine'>[]): 'needs-attention' | 'retrying' | 'monitoring' {
    const outstanding = outstandingFollowUps(followUps);
    return outstanding.some(followUp => followUp.owner === 'You' || followUp.owner === 'Morgan') ? 'needs-attention' : outstanding.length ? 'retrying' : 'monitoring';
}
