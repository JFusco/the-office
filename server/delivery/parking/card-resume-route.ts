import { defaultPickupStatus } from '../intake/default-pickup';
import { BLOCK } from '../board/harness-parked-card';
import { projectCards, statusField, type Execute } from '../board/project-graphql';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** The board's name for the lane a parked card resumes from, or why moving a card cannot resume this job. */
export type CardResumeRoute = { pickup: string } | { missing: string };

/**
 * Whether returning the issue card can resume a park of this job (`resume.ts`): a configured board, pickup
 * turned on, exactly one lane named as the pickup status and one Block lane, and one existing card for the
 * issue. Read-only; a read that fails is an error, not a missing route.
 */
export async function cardResumeRoute(store: Store, execute: Execute, job: Pick<TicketJob, 'key'>): Promise<CardResumeRoute> {
    if (!store.project.githubProject) return { missing: 'this project has no configured board' };
    const pickup = store.state.coordination?.pickup ?? { enabled: true, status: defaultPickupStatus(store.project) };
    if (!pickup.enabled) return { missing: 'automatic pickup is turned off' };
    const field = await statusField(store, execute);
    // `resumeParked` compares the card's lane with the pickup status exactly.
    const lanes = field.options.filter(option => option.name === pickup.status);
    if (lanes.length !== 1) return { missing: `the board has ${lanes.length} "${pickup.status}" lanes, not one` };
    const blocks = field.options.filter(option => BLOCK.test(option.name.trim())).length;
    if (blocks !== 1) return { missing: `the board has ${blocks} Block lanes, not one` };
    const cards = await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number: Number(job.key.slice(3)) }]);
    if (cards.length !== 1) return { missing: cards.length ? 'the issue has more than one card on the board' : 'the issue has no card on the board' };
    return { pickup: lanes[0].name };
}
