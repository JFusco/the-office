import { CurrentChecksWait, selectCurrentChecks, checksFailed } from '../readiness/github-check-selection';
import { conflictOnlyAssessment, readConflictRepairProof } from './conflict-repair';
import {repeatConflictRepairAdmission} from './conflict-chain';
import {outsideAmendmentFindingIds,amendmentRepairView} from '../recovery/source-amendment/source-amendment-held';
import { HOLDS } from '../../office/config';
import { handsOff } from '../harness/scope';
import { githubRepairEligible, reserveRepair, enqueueRepairDiagnosis, approachFingerprint, verifyRepairCandidate, retainRepairEvidence } from './delivery-repairs';
import { z } from 'zod';
import { GITHUB_ISSUE_SKILL } from '../../github/github-context';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { TicketJob, StageResult } from '../../../src/shared';
import { recordJobApproach } from '../pipeline/approach';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import { hasUncertainEffects } from '../pipeline/github-delivery';

export async function queueConflictRepair(this: GitHubDelivery, key: string, reason: 'conflicts' | 'ci' = 'conflicts') {
    const job = this.jobs.find(j => j.key === key && j.stage === 'lead-pr' && (['watching', 'blocked'].includes(j.status) || reason === 'conflicts' && j.status === 'interrupted'));
    const interrupted = job?.status === 'interrupted' ? repeatConflictRepairAdmission(this.store, job, conflictOnlyAssessment) : undefined;
    const review = job?.steps.filter(s => s.stage === 'lead-pr').at(-1)?.result;
    if (!job?.pr || !job.worktree || !job.branch || !review || review.commit !== job.head || !(reason === 'ci' || conflictOnlyAssessment(review)) || job.mergeAttempt || job.steps.some(s => hasUncertainEffects(s.stage, s.result)) || job.status === 'interrupted' && !interrupted)
        throw new Error('A certain owned published candidate with verified merge conflicts is required');
    if (job.steps.filter(s => s.stage === 'update-base').length >= 3)
        throw new Error('Repeated base changes need Morgan reconciliation before another repair');
    const proof = reason === 'conflicts' ? await readConflictRepairProof(this, job, review) : undefined;
    if (interrupted && (this.jobs.find(j => j.id === job.id) !== job || job.status !== 'interrupted' || repeatConflictRepairAdmission(this.store, job, conflictOnlyAssessment)?.id !== interrupted.id))
        throw new Error('Interrupted original conflict qualification changed during readback');
    let evidence: StageResult['evidence'] = [];
    if (proof) {
        const root = resolve(this.store.dataRoot, 'ticket-work', job.id), path = resolve(root, `conflict-readback-${crypto.randomUUID()}.json`);
        mkdirSync(root, { recursive: true, mode: 0o700 });
        writeFileSync(path, JSON.stringify(proof, null, 2), { mode: 0o600, flag: 'wx' });
        evidence = [{ id: crypto.randomUUID(), kind: 'provider', summary: 'Harness verified exact conflict-only candidate and provider head/base identity; source acceptance remains separate.', path, commit: job.head, environment: 'Office read-only GitHub conflict readback', url: job.prUrl, observedAt: proof.observedAt }];
    }
    this.store.transaction(() => {
        if (proof) job.steps.push({ stage: 'conflict-readback', result: { ...review, evidence: [...review.evidence, ...evidence] } });
        job.repairReason = reason;
        job.stage = 'update-base';
        job.status = 'queued';
        job.detail = `Alex repairs PR #${job.pr}'s ${reason === 'ci' ? 'failing current-head checks' : 'conflicts'} in its existing worktree and runs required checks. ${reason === 'conflicts' ? 'The same PR is then updated without repeating source review.' : 'The team-selected verification follows.'}`;
        this.store.emit('pr-conflict-repair-queued', job.detail, 'developer', key);
    });
}

export async function queueCIRepair(this: GitHubDelivery, job: TicketJob) {
    if (job.stage !== 'lead-pr' || job.status !== 'watching' || job.mergeApprovalRequired || !job.worktree || !job.branch)
        return false;
    const p = await this.verifyPR(job, true);
    if (p.state !== 'open' || p.head.sha !== job.head)
        return false;
    const checks = await this.api(`commits/${job.head}/check-runs?per_page=100`), statuses = await this.api(`commits/${job.head}/status`);
    if (checks.total_count > 100 || statuses.total_count > 100)
        throw new Error('Failed-check coverage is incomplete');
    let selection;
    try { selection = await selectCurrentChecks(this,job,checks,p,statuses); }
    catch (error) {
        if (error instanceof CurrentChecksWait) return false;
        throw error;
    }
    const failed = checksFailed(selection,statuses,job.head);
    if (!failed)
        return false;
    await this.queueConflictRepair(job.key, 'ci');
    return true;
}

export async function recoverMergeCI(this: GitHubDelivery, job: TicketJob) {
    const p = await this.verifyPR(job, true);
    if (!p.merged_at || !job.mergeCommit || p.merge_commit_sha !== job.mergeCommit)
        throw new Error('Merged CI recovery identity changed');
    if (job.ciFollowupKey) {
        job.status = 'watching';
        return;
    }
    const schema = z.object({ outcome: z.enum(['repair-issue', 'needs-human']), issue: z.number().int().min(0), summary: z.string(), receipts: z.array(z.object({ id: z.string(), action: z.string(), target: z.string(), verified: z.boolean(), uncertain: z.boolean(), detail: z.string() }).strict()) }).strict();
    const priorAttempt = job.ciRecoveryAttemptAt;
    job.ciRecoveryAttemptAt ||= new Date().toISOString();
    this.store.save();
    const marker = `Office CI recovery ${job.id} ${job.mergeCommit}`;
    const result = await this.engine.agents.run('pm', `Diagnose post-merge CI for ${job.prUrl} at EXACT merge commit ${job.mergeCommit}. Read current AGENTS, actual failed push run/job logs and issue acceptance. Preserve the original failure; do not rerun Actions, edit source, reopen the completed issue or claim the old run passed. This is Joe's authorized hands-off CI repair workflow. Classify source/check defects versus access, billing, environment or provider failures. For source defects, use GitHub Issue Creator at ${GITHUB_ISSUE_SKILL} to create or adopt ONE concrete scoped repair issue in ${this.store.project.repository}, assigned to JFusco, labeled with discovered repository labels, linked to the exact failed runs/merged PR/commit and acceptance checks. Include exact marker ${JSON.stringify(marker)}. Read existing matching issues/comments first to prevent duplicates. Add the verified issue's existing/new card to ${this.store.project.githubProject?.url} in its discovered Ready lane, then read back issue, assignment, body and card. Return repair-issue only after every effect is verified; the normal Office developer/reviewer/QA/merge workflow owns implementation. Do not merge, release, push or bypass protections. If the failure requires credentials, payment, new permissions or an ambiguous/out-of-scope decision, return needs-human with exact next owner and steps, issue=0. Never invent a source edit for an infrastructure failure.
${priorAttempt ? 'READ-BACK ONLY: an earlier recovery attempt exists. Do not create or mutate anything. Reconcile that exact attempt from its saved session and current provider records; adopt only its uniquely verified existing repair issue. An empty search does not prove no issue was created.' : 'The persisted attempt marker precedes the only issue/card creation attempt. Every attempted write needs a verified/uncertain receipt; never retry an uncertain mutation.'}
Save no source changes. Prior job/evidence: ${JSON.stringify(job)}.`, schema, { readOnly: !!priorAttempt, ticket: job.key, stage: 'ci-recovery', requestId: job.id, timeout: 15 * 60 * 1000 });
    if (result.outcome !== 'repair-issue' || !result.issue || result.receipts.some(r => r.uncertain || !r.verified))
        throw new Error(result.summary || 'CI repair requires a specific human decision or effect read-back');
    const issue = await this.api(`issues/${result.issue}`);
    if (issue.pull_request || issue.state !== 'open' || !issue.body?.includes(marker) || !issue.assignees?.some((a: any) => a.login === 'JFusco'))
        throw new Error('CI follow-up issue identity or assignment could not be verified');
    job.ciFollowupKey = `GH-${result.issue}`;
    this.enqueue(job.ciFollowupKey);
    job.status = 'watching';
    job.detail = `Morgan routed the original merge failure to ${job.ciFollowupKey}; the normal team will repair, review, verify and deliver it. Original failed checks remain evidence.`;
    this.store.emit('merge-ci-repair-queued', job.detail, 'pm', job.key);
}

export async function queueSourceRepair(this: GitHubDelivery, job: TicketJob, result: StageResult, root: string) {
    const held=await outsideAmendmentFindingIds(this,job,result.commit,result),repairView=amendmentRepairView(result,held);
    const named = handsOff(this.store), ids = githubRepairEligible(job, repairView, named);
    const publishedAccepted = !!job.pr && job.implementationContinuation?.phase === 'acceptance';
    const nativeAdoptionPending = !!(job.implementationContinuation || job.discoveryRecovery || job.implementationRecovery) && !publishedAccepted;
    if (!ids || nativeAdoptionPending || HOLDS[job.key] || this.jobs.find(current => current.id === job.id) !== job || job.status !== 'working' || this.store.state.paused || job.steps.some(step => hasUncertainEffects(step.stage, step.result))) return false;
    if (!retainRepairEvidence(repairView, job.stage, root, result.worktree, named)) return false;
    if (job.repairCycle?.pendingFindingIds.some(id => !result.findings.some(f => f.id === id))) return false;
    if (result.worktree === this.store.project.repo || result.paidRuns !== 0) return false;
    let publishedHead: string | undefined;
    if (job.pr) {
        const published = await this.verifyPR(job, true);
        const lastPublished = job.steps.filter(step => ['lead-pr', 'draft'].includes(step.stage)).at(-1)?.result.commit;
        const expectedRemote = job.stage === 'lead-pr' ? job.head : job.repairCycle?.publishedHead || lastPublished || job.head;
        if (!expectedRemote || published.state !== 'open' || published.merged_at || published.head.sha !== expectedRemote || published.head.ref !== job.branch)
            throw new Error('Published repair PR identity or exact remote head changed; reconcile before source work');
        publishedHead = expectedRemote;
        await this.execute('git', ['merge-base', '--is-ancestor', publishedHead, result.commit], { cwd: result.worktree, timeout: 10000, readOnly: true });
    }
    await verifyRepairCandidate(this.store.project, { head: result.commit, branch: result.branch, worktree: result.worktree }, this.execute);
    if (job.head && job.head !== result.commit)
        await this.execute('git', ['merge-base', '--is-ancestor', job.head, result.commit], { cwd: result.worktree, timeout: 10000, readOnly: true });
    job.head = result.commit; job.worktree = result.worktree; job.branch = result.branch;
    job.repairCycle = reserveRepair(job.repairCycle, ids, job.stage, job.head);
    if (publishedHead) { job.repairCycle.publishedHead = publishedHead; job.repairReason = 'source'; }
    if (!job.approach || job.approach.review === 'none' || job.approach.validation === 'developer-checks') {
        recordJobApproach(job, { plan: job.approach?.plan || 'none', review: job.approach?.review === 'full' ? 'full' : 'focused', validation: job.approach?.validation === 'browser' ? 'browser' : 'independent-checks', checks: job.approach?.checks || ['Required current-head repository checks'], reason: 'A concrete source defect requires independent review and verification of the repaired candidate.' }, 'developer');
    }
    if (job.repairCycle.phase === 'diagnosis') {
        enqueueRepairDiagnosis(this.store, job);
        job.repairCycle.exhaustedApproach ??= approachFingerprint(job.approach);
        job.status = job.repairCycle.diagnosisAttempted || job.repairCycle.approachRevision ? 'blocked' : 'queued';
        if (job.status === 'queued') job.stage = 'review';
        job.detail = job.status === 'queued' ? 'Sam will assess one revised technical approach; Ellis independently checks Office operations. Alex retains delivery ownership and all counters/evidence.' : 'Bounded original and revised repair windows exhausted. Morgan must resolve the diagnosed concrete restriction; original evidence and developer ownership are retained.';
    } else {
        // Existing unpublished-candidate writer capability; the scheduler alone claims this follow-on.
        job.stage = 'update-base'; job.status = 'queued';
        job.detail = `Alex retains delivery ownership and repairs ${ids.join(', ')} on the same candidate (round ${job.repairCycle.attempts}/6).`;
    }
    this.store.emit('delivery-repair-requested', job.detail, 'developer', job.key);
    return true;
}
