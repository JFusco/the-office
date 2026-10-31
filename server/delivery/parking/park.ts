import { moveLane } from '../board/move-lane';
import { assertMayMutate } from '../harness/guards';
import { harnessEffect } from '../harness/effect';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';

/** Human decisions and external waits (e.g. an upstream release) both belong on the board, not in a hidden blocker. */
const DECISION_KINDS = new Set(['human-hold', 'scope', 'permission', 'provider-wait']);

/** Only a structured blocked outcome that names a human decision parks; findings on a passed result never do. */
export function needsDecision(result: StageResult): boolean {
    return result.outcome === 'blocked' && !!result.resolution && DECISION_KINDS.has(result.resolution.kind);
}

/** Retains the job, candidate, PR and stage; asks on the issue and moves the card to Block. */
export async function park(delivery: GitHubDelivery, job: TicketJob, result: StageResult): Promise<void> {
    const { store, execute } = delivery, repository = store.project.repository, issueNumber = Number(job.key.slice(3));
    const reason = (result.blocker || result.summary).trim(), head = job.head;
    const guard = () => assertMayMutate(store, delivery.jobs, job, head);
    job.parked = { stage: job.stage, reason, at: new Date().toISOString(), published: false };
    job.status = 'blocked';
    job.detail = `Decision needed: ${reason}`;
    store.save();
    const marker = `Office decision ${job.id}:${job.steps.length}`;
    const findComment = async () => {
        const pages = JSON.parse(await execute('gh', ['api', `repos/${repository}/issues/${issueNumber}/comments?per_page=100`, '--paginate', '--slurp'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
        const found = pages.flat().find((comment: any) => comment.body?.includes(marker));
        return found ? { id: found.id as number, url: found.html_url as string } : null;
    };
    const body = `${marker}: ${reason}\n\nThe Office paused this ticket at ${job.stage}. Move the card back to Ready to resume from the same stage.`;
    const comment = await findComment() || await harnessEffect(store, job, { key: `park-comment:${job.steps.length}`, operation: 'github-issue-comment', target: `https://github.com/${repository}/issues/${issueNumber}`, payload: { marker },
        guard,
        dispatch: async () => { await execute('gh', ['api', `repos/${repository}/issues/${issueNumber}/comments`, '-f', `body=${body}`], { cwd: store.project.repo, timeout: 60000 }); return findComment(); },
        readBack: findComment });
    if (!comment)
        throw new Error('Decision comment could not be read back');
    await moveLane(store, execute, job, 'Block', guard);
    job.parked.published = true;
    store.emit('delivery-parked', `${job.key}: decision needed — ${reason}`, 'pm', job.key);
    store.save();
}
