import { moveLane } from '../board/move-lane';
import { assertDeliveryMayMutate } from '../harness/guards';
import { activeEffectId, harnessEffect } from '../harness/effect';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';
import { recordParked } from '../../knowledge/record-trigger';

export { needsDecision } from './needs-decision';

/** A park the harness words itself: its reason, and how to resume, stored on the park and posted under its decision marker. */
export interface HarnessPark { reason: string; instruction: string }

/** The marker of a park's decision comment: the job and its step count when it parked. */
export const decisionMarker = (job: Pick<TicketJob, 'id' | 'steps'>) => `Office decision ${job.id}:${job.steps.length}`;

/**
 * Retains the job, candidate, PR and stage; asks on the issue and moves the card to Block. With `harness`, the
 * park says what the harness wrote instead of the result's blocker, and each card move is one lane Effect keyed
 * to this park's step (`lane-effect.ts`), so entering the same park again settles what it already sent.
 */
export async function park(delivery: GitHubDelivery, job: TicketJob, result: StageResult, harness?: HarnessPark): Promise<void> {
    const { store, execute } = delivery, repository = store.project.repository, issueNumber = Number(job.key.slice(3));
    const reason = (harness ? harness.reason : result.blocker || result.summary).trim(), head = job.head;
    const guard = () => assertDeliveryMayMutate(store, delivery.jobs, job, head);
    guard();
    const release = result.resolution?.kind === 'provider-wait' ? result.resolution.release : undefined;
    const marker = decisionMarker(job), key = `park-comment:${job.steps.length}`;
    job.parked = { stage: job.stage, reason, at: new Date().toISOString(), published: false, ...(release ? { release } : {}), ...(harness ? { instruction: harness.instruction, marker } : {}) };
    job.detail = `Decision needed: ${reason}`;
    store.save();
    const findComment = async () => {
        const pages = JSON.parse(await execute('gh', ['api', `repos/${repository}/issues/${issueNumber}/comments?per_page=100`, '--paginate', '--slurp'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
        const found = pages.flat().find((comment: any) => comment.body?.includes(marker));
        return found ? { id: found.id as number, url: found.html_url as string } : null;
    };
    const body = `${marker}: ${reason}\n\n${harness ? harness.instruction : `The Office paused this ticket at ${job.stage}. Move the card back to Ready to resume from the same stage.`}`;
    try {
    // A harness park settles its own earlier attempt by read-back, so a comment that landed unread does not stay unsettled.
    const earlier = harness && store.getEffect(activeEffectId(store, `harness:${job.id}:${key}`));
    const comment = !earlier && await findComment() || await harnessEffect(store, job, { key, operation: 'github-issue-comment', target: `https://github.com/${repository}/issues/${issueNumber}`, payload: { marker },
        guard,
        dispatch: async () => { await execute('gh', ['api', `repos/${repository}/issues/${issueNumber}/comments`, '-f', `body=${body}`], { cwd: store.project.repo, timeout: 60000 }); return findComment(); },
        readBack: findComment });
    if (!comment)
        throw new Error('Decision comment could not be read back');
    await moveLane(store, execute, job, 'Block', guard, job.pr, harness && { id: `park:${job.id}:${job.steps.length}` });
    job.parked.published = true;
    recordParked(store, job, reason);
    store.emit('delivery-parked', `${job.key}: decision needed — ${reason}`, 'pm', job.key);
    } finally { job.status = 'blocked'; store.save(); }
}
