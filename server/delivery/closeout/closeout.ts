import { moveLane } from '../board/move-lane';
import { assertMayMutate } from '../harness/guards';
import { harnessEffect } from '../harness/effect';
import { harnessStageResult, receipt } from '../harness/stage-result';
import type { GitHubDelivery } from '../../github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';

const PASSING = ['success', 'skipped', 'neutral'];

/** Verifies merge-commit Actions, or the completed CI repair chain, before any closeout write. */
export async function verifyMergeActions(delivery: GitHubDelivery, job: TicketJob): Promise<string> {
    if (job.ciFollowupKey) {
        const repair = delivery.jobs.find(candidate => candidate.key === job.ciFollowupKey);
        if (repair?.status !== 'completed' || !repair.mergeCommit)
            throw new Error(`CI repair ${job.ciFollowupKey} has not completed with a verified merge`);
        return `Original merge Actions failed; repair ${job.ciFollowupKey} merged at ${repair.mergeCommit.slice(0, 7)} and passed.`;
    }
    const runs = await delivery.api(`actions/runs?head_sha=${encodeURIComponent(job.mergeCommit!)}&per_page=100`);
    if (runs.total_count > 100)
        throw new Error('Merge Actions pagination is incomplete');
    const actual = (runs.workflow_runs || []).filter((run: any) => run.head_sha === job.mergeCommit && run.event === 'push' && run.head_branch === delivery.store.project.target);
    if (!actual.length || actual.some((run: any) => run.status !== 'completed' || !PASSING.includes(run.conclusion)))
        throw new Error('Merge-commit Actions are missing, running or failed');
    return `Merge Actions passed: ${actual.map((run: any) => run.name).join(', ')}.`;
}

/** Model-free `closeout`: verify, close the issue if still open, one marker comment, card to Done. */
export async function harnessCloseout(delivery: GitHubDelivery, job: TicketJob, root: string): Promise<StageResult> {
    const { store, execute } = delivery, repository = store.project.repository, issueNumber = Number(job.key.slice(3));
    const p = await delivery.verifyPR(job, true);
    if (!p.merged_at || !job.mergeCommit || p.merge_commit_sha !== job.mergeCommit)
        throw new Error('Merged PR and exact merge commit are unverified');
    const actions = await verifyMergeActions(delivery, job);
    const head = job.head, guard = () => assertMayMutate(store, delivery.jobs, job, head);
    guard();
    const issueUrl = `https://github.com/${repository}/issues/${issueNumber}`;
    const issueClosed = async () => (await delivery.api(`issues/${issueNumber}`)).state === 'closed' ? { closed: true } : null;
    if (!await issueClosed())
        await harnessEffect(store, job, { key: 'issue-close', operation: 'github-issue-close', target: issueUrl, payload: { issue: issueNumber }, guard,
            dispatch: async () => { await execute('gh', ['issue', 'close', String(issueNumber), '--repo', repository, '--reason', 'completed'], { cwd: store.project.repo, timeout: 60000 }); return issueClosed(); },
            readBack: issueClosed });
    const marker = `Office closeout ${job.id}`;
    const findComment = async () => {
        const pages = JSON.parse(await execute('gh', ['api', `repos/${repository}/issues/${issueNumber}/comments?per_page=100`, '--paginate', '--slurp'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
        const found = pages.flat().find((comment: any) => comment.body?.includes(marker));
        return found ? { id: found.id as number, url: found.html_url as string } : null;
    };
    const body = `${marker}: Delivered in PR ${p.html_url} (merge ${job.mergeCommit.slice(0, 7)}). ${actions}`;
    const comment = await findComment() || await harnessEffect(store, job, { key: 'closeout-comment', operation: 'github-issue-comment', target: issueUrl, payload: { issue: issueNumber, marker }, guard,
        dispatch: async () => { await execute('gh', ['api', `repos/${repository}/issues/${issueNumber}/comments`, '-f', `body=${body}`], { cwd: store.project.repo, timeout: 60000 }); return findComment(); },
        readBack: findComment });
    if (!comment)
        throw new Error('Closeout comment could not be read back');
    const lane = await moveLane(store, execute, job, 'Done', guard);
    return harnessStageResult(job, root, {
        stage: 'closeout', commit: job.mergeCommit, summary: `PR #${job.pr} merged and verified; issue closed, closeout comment posted, card ${lane || 'Done'}.`,
        receipts: [receipt('issue-close', 'Verify issue closure', issueUrl, 'Issue closed state read back'), receipt('issue-comment', 'Create focused issue closeout comment', comment.url, 'Marker comment read back'), receipt('board-status', 'Verify existing board card status', store.project.githubProject?.url || '', `${lane || 'Done'} read back`)],
        evidence: { pr: p.html_url, mergeCommit: job.mergeCommit, actions, comment, lane },
    });
}
