import {currentMergeChecks} from './github-check-selection';
import { teamReviewedHead } from './team-review';
import {conflictOnlyAssessment} from '../repairs/conflict-repair';
import {outsideAmendmentFindingIds} from '../recovery/source-amendment/source-amendment-held';
import { requireSourceAmendmentAcceptance } from '../recovery/source-amendment/source-amendment';
import { Effects } from '../../store/effects';
import { z } from 'zod';
import { GITHUB_ISSUE_SKILL } from '../../github/github-context';
import { ProjectProgress } from '../board/project-progress';
import { shortSummary } from '../../../src/work/work-summary';
import type { AssignedIssue } from '../../../src/shared';
import { queueMergeNotice } from '../../conversations/notifications';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../../store/store';
import type { Engine } from '../../scheduling/engine';
import type { TicketJob, StageResult, Role } from '../../../src/shared';
import { APPROACH_GUIDANCE, recordJobApproach, nextJobStage, reviewInstructions, acceptConflictRepair } from '../pipeline/approach';
import { ResultSchema } from '../../workers/agents';
import { command } from '../../workers/process';
import { containedFile } from '../../cec/workflow';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import { hasUncertainEffects, closeoutReceipt } from '../pipeline/github-delivery';
import { HOLDS } from '../../office/config';
import { findingsBlock } from '../findings/advisory';
import { refreshEligible } from '../repairs/refresh-conflicted';
export async function readinessPolicy(this: GitHubDelivery, head: string) {
    const project = this.store.project;
    const [branch, pages] = await Promise.all([
        this.api(`branches/${encodeURIComponent(project.target)}`),
        this.execute('gh', ['api', `repos/${project.repository}/rulesets?includes_parents=true&per_page=100`, '--paginate', '--slurp'], { cwd: project.repo, timeout: 60000, readOnly: true }).then(JSON.parse)
    ]);
    if (branch.name !== project.target || typeof branch.protected !== 'boolean' || !Array.isArray(pages) || pages.some(page => !Array.isArray(page)))
        throw new Error('GitHub merge-policy coverage is incomplete');
    const rulesets = pages.flat();
    if (rulesets.some(rule => !rule.id || !['active', 'disabled', 'evaluate'].includes(rule.enforcement)))
        throw new Error('GitHub ruleset identity or enforcement is unavailable');
    return { repository: project.repository, branch: branch.name, head, observedAt: new Date().toISOString(), branchProtected: branch.protected, rulesets, protectionDetailRequired: branch.protected || rulesets.length > 0 };
}
export async function verifyPR(this: GitHubDelivery, job: TicketJob, requireTarget = false) {
    const p = await this.api(`pulls/${job.pr}`);
    if (!p.head?.sha || !p.html_url?.startsWith(`https://github.com/${this.store.project.repository}/pull/`))
        throw new Error('Canonical PR identity is unavailable');
    if (p.base?.repo?.full_name !== this.store.project.repository || requireTarget && p.base.ref !== this.store.project.target)
        throw new Error('PR repository or target does not match this project');
    const links = JSON.parse(await this.execute('gh', ['pr', 'view', String(job.pr), '--repo', this.store.project.repository, '--json', 'closingIssuesReferences'], { cwd: this.store.project.repo, timeout: 60000 }));
    const issueUrl = `https://github.com/${this.store.project.repository}/issues/${Number(job.key.slice(3))}`;
    // GitHub does not populate closingIssuesReferences until a stacked PR targets
    // the default branch. A same-repository closing directive routes review only.
    const directive = new RegExp(`(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#${Number(job.key.slice(3))}(?![0-9])`, 'i');
    if (!links.closingIssuesReferences?.some((i: any) => i.url === issueUrl) && !(p.base.ref !== this.store.project.target && !requireTarget && directive.test(p.body || '')))
        throw new Error('PR is not natively linked to this exact project issue');
    return p;
}
export async function merge(this: GitHubDelivery, job: TicketJob) {
    if (this.store.state.paused || job.mergeApprovalRequired || job.mergeAuthorization && job.mergeAuthorization.head !== job.head || !this.store.state.coordination?.merges?.enabled && job.mergeAuthorization?.head !== job.head)
        throw new Error('Office merging is paused, disabled, or awaiting this PR’s approval');
    if (HOLDS[job.key])
        throw new Error(`${job.key} is held: ${HOLDS[job.key]}`);
    await requireSourceAmendmentAcceptance(this, job);
    const priorIntent = this.store.getEffect<{ sha: string }>(job.mergeIntentId || `merge:${job.id}:${job.head}`);
    if (job.mergeAttempt || priorIntent && ['dispatching', 'uncertain', 'verified'].includes(priorIntent.status))
        throw new Error('Prior merge attempt needs read-back; it will not be repeated');
    const p = await this.verifyPR(job, true), lead = job.steps.filter(s => s.stage === 'lead-pr').at(-1)?.result;
    // A Lead review of an older head never counts; the team's exact-head review does for hands-off jobs.
    const review = lead?.commit === job.head ? lead : teamReviewedHead(this.store, job) ?? lead;
    const heldFindings=review ? await outsideAmendmentFindingIds(this,job,review.commit,review) : new Set<string>();
    if (p.merged_at) {
        job.mergeCommit = p.merge_commit_sha;
        job.status = 'watching';
        return;
    }
    if (p.state !== 'open' || p.draft || !p.mergeable || p.head.sha !== job.head || review?.outcome !== 'passed' || review.commit !== p.head.sha || findingsBlock(this.store, review.findings, f => f.status === 'open' && !heldFindings.has(f.id)))
        throw new Error('PR readiness or reviewed commit changed; Sam must reassess');
    await currentMergeChecks(this,job,p);
    const query = `query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){headRefOid baseRefName mergeStateStatus reviewDecision reviewThreads(first:100){nodes{isResolved} pageInfo{hasNextPage}}}}}`;
    const [owner, name] = this.store.project.repository.split('/');
    const graph = JSON.parse(await this.execute('gh', ['api', 'graphql', '--input', '-'], { input: JSON.stringify({ query, variables: { owner, name, number: job.pr } }), cwd: this.store.project.repo, timeout: 60000 }));
    const live = graph.data?.repository?.pullRequest;
    if (graph.errors?.length || !live || live.headRefOid !== job.head || live.baseRefName !== this.store.project.target || live.mergeStateStatus !== 'CLEAN' || ['CHANGES_REQUESTED', 'REVIEW_REQUIRED'].includes(live.reviewDecision) || live.reviewThreads.pageInfo.hasNextPage || live.reviewThreads.nodes.some((t: any) => !t.isResolved))
        throw new Error('GitHub merge rules, reviews, or unresolved threads block this PR');
    const children = JSON.parse(await this.execute('gh', ['api', `repos/${this.store.project.repository}/pulls?state=open&base=${encodeURIComponent(p.head.ref)}&per_page=100`, '--paginate', '--slurp'], { cwd: this.store.project.repo, timeout: 60000 }));
    if (!Array.isArray(children))
        throw new Error('Dependent PR coverage is unavailable');
    if (children.flat().some((child: any) => child.base?.ref === p.head.ref)) {
        job.stage = 'prepare-pr';
        job.status = 'queued';
        job.detail = 'A dependent PR needs retargeting before this branch can merge safely.';
        return;
    }
    const repo = await this.api('');
    const method = repo.allow_merge_commit ? 'merge' : repo.allow_squash_merge ? 'squash' : repo.allow_rebase_merge ? 'rebase' : '';
    if (!method)
        throw new Error('No repository merge method is available');
    if (this.store.state.paused || !this.store.state.coordination?.merges?.enabled && job.mergeAuthorization?.head !== job.head)
        throw new Error('Office merging was paused or disabled before the write');
    // Reuse prepared intents only for the same head. Attempted effects never repeat.
    const defaultIntentId = `merge:${job.id}:${job.head}`;
    const intent = priorIntent?.status === 'prepared' && priorIntent.payload.sha === job.head ? priorIntent : this.store.getEffect(defaultIntentId);
    const intentId = intent?.status === 'rejected' && !intent.dispatchedAt
        ? `${defaultIntentId}:${crypto.randomUUID()}`
        : intent?.id || defaultIntentId;
    job.mergeIntentId = intentId;
    this.store.save();
    const payload = { sha: job.head, method };
    const merged = await new Effects(this.store).execute({ id: intentId, work: { projectId: this.store.project.id, kind: 'delivery', id: job.id }, attemptId: job.id, operation: 'github-merge', target: job.prUrl, authorization: this.store.state.coordination!.merges?.authorizedAt || job.mergeAuthorization?.head || '', payload, expectedState: { head: job.head, base: this.store.project.target },
        preflight: async () => {
            if (this.jobs.find(candidate => candidate.id === job.id) !== job || job.stage !== 'merge' || !this.store.state.coordination?.merges?.enabled && job.mergeAuthorization?.head !== job.head)
                throw new Error('Merge work identity or authorization changed');
            if (HOLDS[job.key])
                throw new Error(`${job.key} is held: ${HOLDS[job.key]}`);
            await requireSourceAmendmentAcceptance(this, job);
            const current = await this.verifyPR(job, true);
            if (current.head.sha !== payload.sha || current.state !== 'open' || current.draft)
                throw new Error('Merge candidate changed immediately before dispatch');
            await currentMergeChecks(this,job,current);
        },
        dispatch: async (value) => {
            job.mergeAttempt = { head: value.sha, at: this.store.clock.now().toISOString() };
            this.store.save();
            return JSON.parse(await this.execute('gh', ['api', `repos/${this.store.project.repository}/pulls/${job.pr}/merge`, '--method', 'PUT', '-f', `sha=${value.sha}`, '-f', `merge_method=${value.method}`], { cwd: this.store.project.repo, timeout: 60000 }));
        },
        verify: async (receipt) => { const saved = await this.verifyPR(job, true); return receipt.merged === true && !!saved.merged_at && saved.merge_commit_sha === receipt.sha && saved.head.sha === payload.sha; } });
    const saved = await this.verifyPR(job, true);
    const observed = this.store.state.github?.prs.find(pr => pr.number === job.pr);
    if (observed) {
        observed.state = 'closed';
        observed.mergedAt = saved.merged_at;
    }
    job.mergeCommit = saved.merge_commit_sha;
    job.status = 'watching';
    job.detail = 'Sam merged the reviewed PR. Morgan is watching merge Actions before closing out the board.';
    this.store.emit('github-merged', `${job.key}: PR #${job.pr} merged; watching Actions.`, 'lead', job.key);
}
export async function finishLeadReview(this: GitHubDelivery, job: TicketJob, result: StageResult, current?: any) {
    if (hasUncertainEffects('lead-pr', result))
        throw new Error('Uncertain review effects require reconciliation');
    const root = resolve(this.store.dataRoot, 'ticket-work', job.id), p = current || await this.verifyPR(job);
    job.head = p.head.sha;
    if (result.commit === p.head.sha && result.evidence.length) {
        const path = resolve(root, `lead-review-${job.steps.length}-${crypto.randomUUID()}.json`);
        writeFileSync(path, JSON.stringify({ pr: p.html_url, head: p.head.sha, review: result }, null, 2));
        result.evidence.push({ id: crypto.randomUUID(), kind: 'review', summary: 'Sam’s saved current-head review', path, commit: p.head.sha, environment: 'Office Lead review', url: p.html_url, observedAt: new Date().toISOString() });
    }
    const heldFindings=await outsideAmendmentFindingIds(this,job,result.commit,result);
    const ready = result.outcome === 'passed' && result.commit === p.head.sha && !findingsBlock(this.store, result.findings, f => f.status === 'open' && !heldFindings.has(f.id)) && result.evidence.some(e => e.commit === p.head.sha && containedFile(e.path, root) && e.kind === 'review') && !p.draft && p.base.ref === this.store.project.target;
    if (job.mergeAuthorization && job.mergeAuthorization.head !== job.head)
        job.mergeApprovalRequired = true;
    job.status = ready && !job.mergeApprovalRequired && (this.store.state.coordination?.merges?.enabled || job.mergeAuthorization?.head === job.head) ? 'queued' : 'watching';
    if (job.status === 'queued')
        job.stage = 'merge';
    job.detail = `Sam: ${shortSummary(result.summary)}${result.blocker ? ` · ${shortSummary(result.blocker)}` : ''} ${job.status === 'queued' ? 'Office merge queued; no approval needed.' : 'Watching for readiness or dependency changes.'}`;
    this.store.emit('pr-review-finished', `${job.key}: ${job.detail}`, 'lead', job.key);
    if (!ready && job.worktree && job.branch && p.mergeable === false && conflictOnlyAssessment(result)) {
        // A refreshable hands-off job stays watching; the PR observer refreshes it without leaving harness delivery.
        if (!refreshEligible(this.store, job, p)) await this.queueConflictRepair(job.key);
    }
    else if (!ready)
        await this.queueCIRepair(job);
}
