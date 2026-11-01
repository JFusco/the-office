import { CurrentChecksWait, resumeReviewedMerge } from '../readiness/github-check-selection';
import { conflictOnlyAssessment } from '../repairs/conflict-repair';
import { refreshConflicted, refreshEligible } from '../repairs/refresh-conflicted';
import { deliveryInputSha256 } from '../../github/github-context';
import { queueMergeNotice } from '../../conversations/notifications';
import type { GitHubDelivery } from './github-delivery';

export async function observe(this: GitHubDelivery) {
    for (const job of this.jobs.filter(j => j.status === 'watching' || j.stage === 'merge' && ['blocked', 'interrupted'].includes(j.status))) {
        try {
            const p = await this.verifyPR(job);
            if (p.merged_at) {
                job.status = 'watching';
                job.mergeCommit = p.merge_commit_sha;
                const linkedIssue = await this.api(`issues/${Number(job.key.slice(3))}`);
                queueMergeNotice(this.store, { key: job.key, prUrl: job.prUrl || p.html_url, mergeCommit: p.merge_commit_sha, mergedAt: p.merged_at, summary: 'GitHub Actions are monitored separately by the Office.', assignees: (linkedIssue.assignees || []).map((u: any) => ({ id: u.login })), reporter: linkedIssue.user ? { id: linkedIssue.user.login } : undefined });
                const runs = await this.api(`actions/runs?head_sha=${encodeURIComponent(p.merge_commit_sha)}&per_page=100`);
                const actual = runs.workflow_runs?.filter((r: any) => r.head_sha === p.merge_commit_sha && r.event === 'push' && r.head_branch === this.store.project.target);
                if (!actual?.length) {
                    job.detail = 'Merged; waiting for GitHub Actions on the merge commit.';
                    continue;
                }
                if (runs.total_count > 100)
                    throw new Error('Merge Actions pagination is incomplete');
                if (actual.some((r: any) => r.status !== 'completed')) {
                    job.detail = 'Merged; GitHub Actions are running.';
                    continue;
                }
                if (actual.some((r: any) => !['success', 'skipped', 'neutral'].includes(r.conclusion))) {
                    if (job.ciFollowupKey) {
                        const repair = this.jobs.find(j => j.key === job.ciFollowupKey);
                        if (repair?.status === 'completed') {
                            job.stage = 'closeout';
                            job.status = 'queued';
                            job.detail = `Original merge checks failed; follow-up ${repair.key} was merged and verified. Morgan will close out with the recovery chain, preserving the original failed runs.`;
                        }
                        else {
                            job.stage = 'ci-recovery';
                            job.status = 'watching';
                            job.detail = `Waiting for ${job.ciFollowupKey} to repair the original merge failure; original failed Actions remain recorded.`;
                        }
                    }
                    else {
                        job.stage = 'ci-recovery';
                        job.status = 'queued';
                        job.detail = 'Morgan will diagnose the exact merge-commit failure and create or adopt its scoped repair delivery. No workflow run is blindly retried.';
                    }
                }
                else {
                    job.stage = 'closeout';
                    job.status = 'queued';
                    job.detail = 'Merge Actions passed; Morgan will verify issue closure and finish the board update.';
                }
                this.store.emit('github-delivery-observed', job.detail, 'lead', job.key);
                continue;
            }
            if (job.mergeApprovalRequired && p.head.sha === job.head) {
                job.detail = `Sam’s current-head review is saved. Joe must approve merging PR #${job.pr}; no new review or merge was dispatched.`;
                continue;
            }
            if (job.mergeAttempt) {
                job.detail = 'Merge attempt has not been confirmed; Morgan must reconcile before any further write.';
                continue;
            }
            if (refreshConflicted(this.store, job, p))
                continue;
            if(job.stage==='merge'&&['blocked','interrupted','watching'].includes(job.status)&&!job.mergeAttempt){await resumeReviewedMerge(this,job,p);continue;}
            if (p.state !== 'open') {
                job.status = 'blocked';
                job.detail = 'PR closed without merge; needs Morgan’s reconciliation.';
                continue;
            }
            // Readiness changes (including draft -> ready) trigger a new Lead read,
            // never another implementation. API failures retain the previous state.
            const checks = await this.api(`commits/${p.head.sha}/check-runs?per_page=100`);
            if (checks.total_count > 100)
                throw new Error('PR checks pagination is incomplete');
            const statuses = await this.api(`commits/${p.head.sha}/status`);
            if (statuses.total_count > 100)
                throw new Error('PR status pagination is incomplete');
            const conflict = job.steps.filter(step => step.stage === 'lead-pr').at(-1)?.result;
            let conflictRepairError = '';
            if (p.mergeable === false && !refreshEligible(this.store, job, p) && conflict && conflict.commit === p.head.sha && conflictOnlyAssessment(conflict)) {
                try {
                    await this.queueConflictRepair(job.key);
                    continue;
                }
                catch (error) {
                    job.detail = conflictRepairError = `Conflict repair unavailable: ${String(error)}`;
                }
            }
            // A rejected conflict proof permits reassessment, never a CI writer fallback.
            if (!conflictRepairError && await this.queueCIRepair(job))
                continue;
            const fingerprint = JSON.stringify([p.head.sha, p.base.ref, p.base.sha, p.draft, p.mergeable, p.updated_at, deliveryInputSha256(this.store, job.key), checks.check_runs.map((c: any) => [c.id, c.status, c.conclusion]), statuses.state]);
            if (job.lastPRFingerprint !== fingerprint) {
                job.lastPRFingerprint = fingerprint;
                job.status = 'queued';
                job.stage = 'lead-pr';
                job.detail = `PR changed; queued for Sam’s current-head review.${conflictRepairError ? ` ${conflictRepairError}` : ''}`;
            }
        }
        catch (error) {
            if (error instanceof CurrentChecksWait) {
                job.status = 'watching';
                job.detail = `Waiting for current GitHub check coverage: ${error.message}`;
            }
            else {
                if (job.stage === 'merge' && job.status === 'watching' && !job.mergeAttempt && !job.mergeCommit) job.status = 'blocked';
                job.detail = `PR observation unavailable: ${String(error)}`;
            }
        }
    }
}
