import {reconcileContinuationReview} from './implementation/continuation-review-readback';
import { handsOff } from '../harness/scope';
import { findingsBlock } from '../findings/advisory';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { recordJobApproach, acceptConflictRepair } from '../pipeline/approach';
import { ResultSchema } from '../../workers/agents';
import { containedFile } from '../../cec/workflow';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import { deliveryNextStage, hasUncertainEffects, pendingPreparationCheck } from '../pipeline/github-delivery';

export async function reconcileWrongLink(this: GitHubDelivery, key: string) {
    const job = this.jobs.find(j => j.key === key && j.status === 'blocked' && j.stage === 'lead-pr');
    if (!job || job.steps.some(s => s.stage !== 'lead-pr' || s.result.receipts.some(r => !/^get\b|^read\b/i.test(r.action))))
        throw new Error('Only a blocked read-only PR assessment can be reconciled this way');
    const p = await this.api(`pulls/${job.pr}`), issue = await this.api(`issues/${Number(key.slice(3))}`);
    const links = JSON.parse(await this.execute('gh', ['pr', 'view', String(job.pr), '--repo', this.store.project.repository, '--json', 'closingIssuesReferences'], { cwd: this.store.project.repo, timeout: 60000 }));
    if (p.state !== 'closed' || !p.merged_at || issue.state !== 'open' || links.closingIssuesReferences?.some((i: any) => i.url === issue.html_url))
        throw new Error('A closed unrelated PR and still-open issue must be verified');
    job.status = 'cancelled';
    job.detail = `PR #${job.pr} was already merged for another issue. The mistaken handoff is reconciled; ${key} remains open and has not been implemented by that PR.`;
    this.store.emit('pr-link-reconciled', `${key}: removed an unrelated historical PR from active delivery; original review retained.`, 'pm', key);
}

export async function reconcilePreparation(this: GitHubDelivery, key: string) {
    const job = this.jobs.find(j => j.key === key && j.stage === 'prepare-pr' && j.status === 'blocked');
    if (!job || this.store.state.workLog?.some(w => w.requestId === job.id && w.status === 'running'))
        throw new Error('A finished blocked preparation is required');
    let result = job.steps.at(-1)?.stage === 'prepare-pr' ? job.steps.at(-1)!.result : undefined;
    if (result?.outcome !== 'passed') {
        if (!/max_output_tokens/.test(job.detail))
            throw new Error('Saved passed preparation evidence is required');
        const path = resolve(this.store.dataRoot, 'ticket-work', job.id, 'prepare-refresh-result.json');
        if (!containedFile(path, resolve(this.store.dataRoot, 'ticket-work', job.id)))
            throw new Error('Saved preparation evidence is missing');
        const raw = JSON.parse(readFileSync(path, 'utf8'));
        if (raw.receipts?.some((r: any) => r.target !== job.prUrl || !/^PATCH PR state (closed|open)$/.test(r.action) || r.uncertain || !r.verified))
            throw new Error('Saved mutations need separate reconciliation');
        const receipts = raw.receipts?.map(({ id, action, target, verified, uncertain, detail }: any) => ({ id, action, target, verified, uncertain, detail }));
        result = ResultSchema.parse({ prerequisites: null, ...raw, receipts, previewUrl: '', qaRunDir: '' });
    }
    if (result.outcome !== 'passed' || result.commit !== job.head || result.prId !== job.pr || hasUncertainEffects('prepare-pr', result) || !result.evidence.length)
        throw new Error('Saved preparation result does not match this PR');
    const p = await this.verifyPR(job, true);
    if (p.state !== 'open' || p.head.sha !== job.head)
        throw new Error('Prepared PR state or exact head changed');
    const checksPending = await this.preparationChecksPending(job, result);
    if (findingsBlock(this.store, result.findings, f => f.status === 'open' && !pendingPreparationCheck(f, checksPending)))
        throw new Error('Saved preparation findings require reconciliation');
    const pages = JSON.parse(await this.execute('gh', ['api', `repos/${this.store.project.repository}/pulls?state=open&base=${encodeURIComponent(p.head.ref)}&per_page=100`, '--paginate', '--slurp'], { cwd: this.store.project.repo, timeout: 60000 }));
    if (!Array.isArray(pages) || pages.flat().length)
        throw new Error('Dependent bases remain unverified');
    job.steps.push({ stage: 'prepare-pr', result });
    job.stage = 'lead-pr';
    job.status = 'queued';
    job.detail = 'Saved preparation and current GitHub metadata verified by read-back; independent PR review queued. No mutation replayed.';
    this.store.emit('pr-preparation-reconciled', `${key}: preparation verified without replay; Sam will review the current head.`, 'lead', key);
}

export async function reconcileReview(this: GitHubDelivery, key: string,originalWorkId='') {
    if(originalWorkId&&this.jobs.some(job=>job.key===key&&job.implementationContinuation&&job.stage!=='lead-pr'))return reconcileContinuationReview(this,key,originalWorkId);
    const job = this.jobs.find(j => j.key === key && j.stage === 'lead-pr' && ['blocked', 'interrupted'].includes(j.status));
    const work = job && this.store.state.workLog?.filter(w => w.requestId === job.id && w.stage === 'github-lead-pr').at(-1);
    if (!job || !work || work.status !== 'completed' || !work.sessionId || this.store.state.workLog?.some(w => w.requestId === job.id && w.status === 'running'))
        throw new Error('A completed independent PR review is required');
    const root = resolve(this.store.dataRoot, 'sessions', work.id), providerPath = resolve(root, 'provider.json'), resultPath = resolve(root, 'result.json');
    if (!containedFile(providerPath, root) || !containedFile(resultPath, root))
        throw new Error('Saved review evidence is missing');
    const provider = JSON.parse(readFileSync(providerPath, 'utf8')), saved = JSON.parse(readFileSync(resultPath, 'utf8'));
    if (provider.project !== this.store.project.id || provider.repository !== this.store.project.repository || provider.role !== 'lead' || provider.readOnly !== true || saved.session !== work.sessionId)
        throw new Error('Saved review identity does not match this project');
    const result = ResultSchema.parse({ prerequisites: null, ...saved.result });
    if (result.outcome !== 'passed' || result.commit !== job.head || result.prId !== job.pr || result.paidRuns !== 0 || findingsBlock(this.store, result.findings, f => f.status === 'open') || hasUncertainEffects('lead-pr', result) || !result.evidence.some(e => e.kind === 'review'))
        throw new Error('Saved review is incomplete or uncertain');
    const p = await this.verifyPR(job, true), issue = await this.api(`issues/${Number(key.slice(3))}`);
    const start = Date.parse(work.startedAt);
    if (p.state !== 'open' || p.draft || p.head.sha !== job.head || !Number.isFinite(start) || !p.updated_at || !issue.updated_at || Date.parse(p.updated_at) > start || Date.parse(issue.updated_at) > start)
        throw new Error('PR or issue changed since review began; a fresh assessment is required');
    if (job.steps.at(-1)?.result !== result)
        job.steps.push({ stage: 'lead-pr', result });
    if (result.approach)
        recordJobApproach(job, result.approach, 'lead', false, handsOff(this.store));
    job.reviewContext = { head: job.head, issueUpdatedAt: issue.updated_at, prUpdatedAt: p.updated_at, baseSha: p.base.sha || '', target: p.base.ref, step: job.steps.length - 1 };
    await this.finishLeadReview(job, result, p);
    job.detail = `Sam’s saved independent review verified for the unchanged PR head. ${job.stage === 'merge' ? 'Office merge queued under the existing authorization.' : 'Existing merge authorization and readiness requirements remain in force.'} No provider write was repeated.`;
    this.store.emit('pr-review-reconciled', `${key}: saved independent review and unchanged current PR/issue verified. No model or provider write repeated.`, 'lead', key);
}

export async function reconcileBaseUpdate(this: GitHubDelivery, key: string) {
    const job = this.jobs.find(j => j.key === key && j.stage === 'update-base' && ['blocked', 'interrupted'].includes(j.status));
    if (job?.pr) {
        const result = job.steps.filter(s => s.stage === 'update-base').at(-1)?.result;
        if (!result || result.outcome !== 'passed' || result.worktree !== job.worktree || result.branch !== job.branch || result.prId !== job.pr || hasUncertainEffects('update-base', result) || result.findings.some(f => f.status === 'open' && f.id !== 'draft-blocks-merge') || this.store.state.workLog?.some(w => w.requestId === job.id && w.status === 'running'))
            throw new Error('A completed, certain published-PR repair is required');
        const current = await this.verifyPR(job, true);
        if (current.state !== 'open' || current.head.sha !== job.head || current.head.ref !== job.branch)
            throw new Error('Published repair identity changed; reconcile before publication');
        await this.engine.maintenance.verifyCandidate({ issue: Number(key.slice(3)), worktree: job.worktree, branch: job.branch, head: result.commit, summary: 'Read back completed conflict repair' });
        const base = await this.api(`commits/${this.store.project.target}`);
        for (const ancestor of [job.head, base.sha])
            await this.execute('git', ['merge-base', '--is-ancestor', ancestor, result.commit], { cwd: job.worktree, readOnly: true });
        if (!result.evidence.some(e => e.kind === 'checks' && e.commit === result.commit && containedFile(e.path, resolve(this.store.dataRoot, 'ticket-work', job.id))))
            throw new Error('Saved repaired-head check evidence is missing');
        job.head = result.commit;
        if (job.repairReason === 'conflicts' && !job.sourceAmendment)
            acceptConflictRepair(job, result, handsOff(this.store));
        job.stage = deliveryNextStage(job);
        job.status = 'queued';
        job.detail = 'Completed conflict repair and its checks read back. Publishing the same PR next; no repeated source review.';
        this.store.emit('candidate-base-reconciled', job.detail, 'pm', key);
        return;
    }
    if (!job || job.pr || !job.worktree || !job.branch || job.steps.some(s => hasUncertainEffects(s.stage, s.result)) || this.store.state.workLog?.some(w => w.requestId === job.id && w.status === 'running'))
        throw new Error('A finished unpublished base update with certain prior effects is required');
    const head = (await this.execute('git', ['rev-parse', 'HEAD'], { cwd: job.worktree })).trim();
    if (!/^[a-f0-9]{40}$/.test(head) || head === job.head)
        throw new Error('A recovered committed candidate is required; finish and verify the local merge first');
    await this.engine.maintenance.verifyCandidate({ issue: Number(key.slice(3)), worktree: job.worktree, branch: job.branch, head, summary: 'Recovered local base update' });
    const base = await this.api(`commits/${this.store.project.target}`);
    if (!/^[a-f0-9]{40}$/.test(base.sha || ''))
        throw new Error('Current base identity is unavailable');
    for (const ancestor of [job.head, base.sha])
        await this.execute('git', ['merge-base', '--is-ancestor', ancestor, head], { cwd: job.worktree });
    const prs = JSON.parse(await this.execute('gh', ['pr', 'list', '--repo', this.store.project.repository, '--head', job.branch, '--state', 'all', '--json', 'number'], { cwd: this.store.project.repo }));
    const remote = (await this.execute('git', ['ls-remote', '--heads', 'origin', `refs/heads/${job.branch}`], { cwd: job.worktree })).trim();
    if (!Array.isArray(prs) || prs.length || remote)
        throw new Error('Candidate publication must be reconciled separately');
    const root = resolve(this.store.dataRoot, 'ticket-work', job.id);
    mkdirSync(root, { recursive: true, mode: 0o700 });
    const path = resolve(root, `base-recovery-${Date.now()}.json`);
    writeFileSync(path, JSON.stringify({ oldHead: job.head, head, base: base.sha, branch: job.branch, worktree: job.worktree, clean: true, unpublished: true }, null, 2), { mode: 0o600 });
    job.steps.push({ stage: 'base-update-readback', result: { outcome: 'passed', summary: 'Recovered local commit verified; independent review and QA remain required.', commit: head, blocker: '', findings: [], receipts: [], evidence: [{ id: crypto.randomUUID(), kind: 'checks', summary: 'Clean candidate identity, original/base ancestry and unpublished state read back; no source acceptance asserted.', path, commit: head, environment: 'local Git read-back', url: '', observedAt: new Date().toISOString() }], worktree: job.worktree, branch: job.branch, prId: 0, previewUrl: '', qaRunDir: '', paidRuns: 0 } });
    job.head = head;
    job.stage = 'review';
    job.status = 'queued';
    job.detail = 'Interrupted base update reconciled from the recovered local commit. Independent review and QA queued; original failure retained.';
    this.store.emit('candidate-base-reconciled', job.detail, 'lead', key);
}
