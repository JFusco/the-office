import { selectCurrentChecks, checksFailed } from '../readiness/github-check-selection';
import { digest } from '../../store/readback-evidence';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

/** All failed check types enter diagnosis; only native Actions identities permit a retry. */
export async function readCIFailure(delivery: GitHubDelivery, job: TicketJob) {
    const pr = await delivery.verifyPR(job, true);
    if (pr.state !== 'open' || pr.merged_at || pr.head.sha !== job.head) return null;
    const checks = await delivery.api(`commits/${job.head}/check-runs?per_page=100`);
    const statuses = await delivery.api(`commits/${job.head}/status`);
    const selection = await selectCurrentChecks(delivery, job, checks, pr, statuses);
    if (!checksFailed(selection, statuses, job.head)) return null;
    const failed = selection.effective.filter((c: any) => c.status === 'completed' && ['failure', 'timed_out', 'action_required'].includes(c.conclusion));
    const runs: any[] = [], logs: { checkId: number; text: string }[] = [];
    for (const check of failed) {
        if (check.app?.slug !== 'github-actions') continue;
        const native = await delivery.api(`actions/jobs/${check.id}`);
        const run = await delivery.api(`actions/runs/${native.run_id}`);
        if (native.id !== check.id || native.head_sha !== job.head || native.conclusion !== check.conclusion ||
            run.id !== native.run_id || run.head_sha !== job.head || run.repository?.full_name !== delivery.store.project.repository ||
            run.head_repository?.full_name !== delivery.store.project.repository || run.head_branch !== pr.head.ref ||
            !run.pull_requests?.some((p: any) => p.number === job.pr) || run.run_attempt !== native.run_attempt)
            throw new Error('Failed Actions job/run identity changed');
        if (!runs.some(r => r.id === run.id)) runs.push(run);
        const text = await delivery.execute('gh', ['api', `repos/${delivery.store.project.repository}/actions/jobs/${check.id}/logs`], { cwd: delivery.store.project.repo, readOnly: true, timeout: 60000 });
        logs.push({ checkId: check.id, text });
    }
    const fingerprint = digest({ head: job.head, base: pr.base.sha, metadata: [pr.title, pr.body], checks: selection.effective.map((c: any) => [c.id, c.status, c.conclusion]).sort((a, b) => a[0] - b[0]), statuses: statuses.statuses.map((s: any) => [s.id, s.context, s.state]).sort((a: any[], b: any[]) => a[0] - b[0]), runs: runs.map(r => [r.id, r.run_attempt]).sort((a, b) => a[0] - b[0]) });
    return { pr, selection, statuses, runs, logs, fingerprint };
}
export type CIFailure = NonNullable<Awaited<ReturnType<typeof readCIFailure>>>;
