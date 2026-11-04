import { harnessEffect } from '../harness/effect';
import { guardCIRepair } from './ci-guard';
import { isDeepStrictEqual } from 'node:util';
import { resolve } from 'node:path';
import { verifyRepairCandidate } from './delivery-repairs';
import { verifyCIHooks } from './ci-checkout';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import type { CIRepair } from '../../../src/contracts/ci-repair';
import type { CIFailure } from './ci-evidence';

/** Fixed operations only. Every write retains intent, exact-head guard and provider read-back. */
export async function publishCIRepair(delivery: GitHubDelivery, job: TicketJob, repair: CIRepair, failure: CIFailure) {
    const { store, execute } = delivery, plan = repair.plan!, repo = store.project.repository;
    const guard = async () => {
        const current = await guardCIRepair(delivery, job, repair);
        if (current.title !== failure.pr.title || current.body !== failure.pr.body) throw new Error('PR metadata changed during CI repair');
        if (plan.kind === 'commit-messages') {
            const cwd = resolve(store.dataRoot, 'ticket-work', job.id, `ci-${repair.id}`, 'candidate');
            if (repair.worktree !== cwd || !/^[a-f0-9]{40}$/.test(repair.repairedHead || '')) throw new Error('Owned reworded candidate required');
            await verifyRepairCandidate(store.project, { head: repair.repairedHead!, branch: repair.branch, worktree: cwd }, execute);
            await verifyCIHooks(delivery, { ...job, worktree: cwd });
            const tree = async (head: string) => (await execute('git', ['rev-parse', `${head}^{tree}`], { cwd, readOnly: true })).trim();
            if (await tree(repair.head) !== await tree(repair.repairedHead!)) throw new Error('Message repair changed source content');
            const children = JSON.parse(await execute('gh', ['api', `repos/${repo}/pulls?state=open&base=${encodeURIComponent(repair.branch)}&per_page=100`, '--paginate', '--slurp'], { cwd: store.project.repo, readOnly: true }));
            if (!Array.isArray(children) || children.some(page => !Array.isArray(page)) || children.flat().length)
                throw new Error('Commit rewording cannot rewrite a branch used by dependent PRs');
        }
        if (plan.kind === 'retry') {
            const before = failure.runs.find(r => r.id === plan.runId), live = await delivery.api(`actions/runs/${plan.runId}`);
            if (!before || live.head_sha !== repair.head || live.run_attempt !== before.run_attempt || live.status !== 'completed' || !['failure', 'timed_out'].includes(live.conclusion))
                throw new Error('CI retry execution changed');
        }
    };
    const readBack = async () => {
        if (plan.kind === 'retry') {
            const before = failure.runs.find(r => r.id === plan.runId), run = await delivery.api(`actions/runs/${plan.runId}`);
            return run.head_sha === repair.head && run.id === plan.runId && run.run_attempt > before.run_attempt ? { runId: run.id, attempt: run.run_attempt } : null;
        }
        const pr = await delivery.verifyPR(job, true);
        if (pr.state !== 'open' || pr.head.ref !== repair.branch || pr.base.sha !== repair.base) return null;
        if (plan.kind === 'commit-messages') return pr.head.sha === repair.repairedHead ? { head: pr.head.sha } : null;
        return pr.head.sha === repair.head && pr.title === plan.title && pr.body === plan.body ? { head: pr.head.sha, title: pr.title, body: pr.body } : null;
    };
    if (plan.kind === 'retry') {
        const run = failure.runs.find(r => r.id === plan.runId);
        if (!run || run.event !== 'pull_request' || run.status !== 'completed' || !['failure', 'timed_out'].includes(run.conclusion) ||
            store.project.id === 'brain' && !['.github/workflows/quality.yml', '.github/workflows/commitlint.yml', '.github/workflows/wiki-check.yml'].includes(run.path) ||
            job.ciRepairs?.some(r => r !== repair && r.plan?.kind === 'retry' && r.plan.runId === plan.runId))
            throw new Error('Only one diagnosed retry of an ordinary failed PR workflow is allowed');
    }
    if (!['commit-messages', 'pr-metadata', 'retry'].includes(plan.kind)) throw new Error('Unsupported CI publication');
    const payload = { head: repair.head, base: repair.base, branch: repair.branch, plan, repairedHead: repair.repairedHead || '' };
    const prior = store.getEffect(`harness:${job.id}:ci-repair:${repair.id}`);
    if (prior && (prior.operation !== `ci-${plan.kind}` || prior.target !== job.prUrl || !isDeepStrictEqual(prior.payload, payload)))
        throw new Error('Saved CI effect differs from the diagnosed operation');
    if (prior?.status === 'verified') {
        if (!await readBack()) throw new Error('Previously verified CI repair changed; preserve its receipt for reconciliation');
        return;
    }
    await harnessEffect(store, job, {
        key: `ci-repair:${repair.id}`, operation: `ci-${plan.kind}`, target: job.prUrl,
        payload, guard,
        readBack,
        dispatch: async () => {
            if (plan.kind === 'commit-messages') {
                if (!repair.worktree || !/^[a-f0-9]{40}$/.test(repair.repairedHead || '')) throw new Error('Validated reworded candidate required');
                await execute('git', ['push', `--force-with-lease=refs/heads/${repair.branch}:${repair.head}`, 'origin', `${repair.repairedHead}:refs/heads/${repair.branch}`], { cwd: repair.worktree, timeout: 15 * 60000 });
            } else if (plan.kind === 'pr-metadata') {
                await execute('gh', ['api', `repos/${repo}/pulls/${job.pr}`, '--method', 'PATCH', '--input', '-'], { cwd: store.project.repo, input: JSON.stringify({ title: plan.title, body: plan.body }), timeout: 60000 });
            } else {
                await execute('gh', ['api', `repos/${repo}/actions/runs/${plan.runId}/rerun-failed-jobs`, '--method', 'POST'], { cwd: store.project.repo, timeout: 60000 });
            }
            return readBack();
        },
    });
}
