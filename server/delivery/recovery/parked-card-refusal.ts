import { holdReason } from '../../office/project-holds';
import { BLOCK, harnessBlockMove } from '../board/harness-parked-card';
import { hasUncertainEffects } from '../pipeline/github-delivery';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

const REFUSAL = /^Error: PullRequest card is in "block(ed)?", a human lane; the harness will not move it to \s*in progress\s*$/i;

/**
 * Queues again, once, a job that stopped because the harness refused to move the pull request's card it
 * had parked itself. Only the refusal at the start of update-base is recovered: that board move comes
 * before any source work, so nothing ran and nothing is repeated. The job must no longer be parked, every
 * recorded board move and step receipt must be settled, and every card the job last recorded in Block
 * must be there by the harness's own write; the board move then checks the live card again.
 */
export function requeueParkedCardRefusals(store: Store, jobs: TicketJob[]): string[] {
    const queued: string[] = [];
    if (store.state.paused || store.state.draining) return queued;
    for (const job of jobs) {
        if (job.status !== 'blocked' || job.stage !== 'update-base' || !job.pr || job.parked || job.parkedCardRequeuedAt || !REFUSAL.test(job.detail) || holdReason(store.project, job.key) ||
            job.boardUpdates?.some(update => update.status !== 'verified') || job.steps.some(step => hasUncertainEffects(step.stage, step.result))) continue;
        // Every card whose latest record is Block must be there by the harness's own write: one it only found there is a person's.
        const inBlock = [...new Set((job.boardUpdates || []).map(update => update.item))].filter(item => BLOCK.test(job.boardUpdates!.filter(update => update.item === item).at(-1)!.target.trim()));
        if (!inBlock.length || inBlock.some(item => !harnessBlockMove(job.boardUpdates, item))) continue;
        job.parkedCardRequeuedAt = store.clock.now().toISOString();
        job.status = 'queued';
        job.detail = 'The pull request card the Office parked is its own to move; continuing update-base. Prior reviews, effects and repair budgets retained.';
        store.emit('delivery-resumed', `${job.key}: ${job.detail}`, 'pm', job.key);
        queued.push(job.key);
    }
    return queued;
}
