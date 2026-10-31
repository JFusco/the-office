import { scopeRepairResumeInstruction, scopeRepairResumeNextStage } from '../recovery/scope-repair/scope-repair-resume';
import { requireSavedPrerequisites } from '../recovery/implementation/saved-prerequisite-handoff';
import { CurrentChecksWait } from '../readiness/github-check-selection';
import { verifyInitialDraftConflictPreparation } from '../recovery/preparation/post-conflict-preparation';
import { runSourceConfiguration } from '../recovery/implementation/activation-recovery';
import { outsideAmendmentFindingIds } from '../recovery/source-amendment/source-amendment-held';
import { HOLDS } from '../../office/config';
import { handsOff, harnessDelivers } from '../harness/scope';
import { findingsBlock } from '../findings/advisory';
import { runHarnessStage } from '../harness/run-harness-stage';
import { createCandidate } from '../candidate/create-candidate';
import { moveLane } from '../board/move-lane';
import { assertMayMutate } from '../harness/guards';
import { BOARD_RULE, DECISION_RULE, implementInstruction } from '../harness/stage-instructions';
import { REPAIR_DIAGNOSIS, verifyRepairCandidate } from '../repairs/delivery-repairs';
import { amendmentIssueSha256, requireSourceAmendmentAcceptance } from '../recovery/source-amendment/source-amendment';
import { reconcileNativeDelivery } from '../../maintenance/brain/brain-delivery-readback';
import * as readiness from '../readiness/github-readiness';
import * as closeout from '../recovery/closeout/github-closeout';
import { deliveryHumanInputs, deliveryInputSha256 } from '../../github/github-context';
import { ProjectProgress } from '../board/project-progress';
import { shortSummary } from '../../../src/work-summary';
import type { AssignedIssue } from '../../../src/shared';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../../store/store';
import type { Engine } from '../../scheduling/engine';
import type { TicketJob, StageResult, Role } from '../../../src/shared';
import { nextJobStage } from './approach';
import { ResultSchema } from '../../workers/agents';
import { command } from '../../workers/process';
import { implementationContinuationInstruction } from '../recovery/implementation/prompts/implementation-continuation';
import { discover, refreshDependencies, routeExisting } from '../intake/pr-discovery';
import { reconcileWrongLink, reconcilePreparation, reconcileReview, reconcileBaseUpdate } from '../recovery/stage-reconciliation';
import { approveMerge } from '../readiness/approve-merge';
import { observe } from './observe-prs';
import { queueConflictRepair, queueCIRepair, recoverMergeCI, queueSourceRepair } from '../repairs/queue-repairs';
import { continuationGuard } from '../recovery/implementation/continuation-guard';
import { preparationChecksPending } from '../readiness/preparation-checks';
import { stagePrompt } from './stage-prompts';
import { deliveryTask } from './delivery-task';
import { acceptStageResult } from './accept-stage-result';
export function hasUncertainEffects(stage: string, result: StageResult) {
    return result.receipts.some(r => r.uncertain || !r.verified && !(['review', 'lead-pr'].includes(stage) && /^(?:get|read|query|inspect)\b/i.test(r.action)));
}
export function pendingPreparationCheck(f: StageResult['findings'][number], checksPending = false) {
    if (['source-acceptance', 'review', 'supporting-references'].includes(f.id))
        return true; // Content and review gates carry into Lead review; metadata preparation never approves them.
    if (f.id === 'checks')
        return checksPending; // Only complete current-head provider observations may defer checks.
    return false; // Unknown findings block this stage, regardless of narrative wording.
}
export function deliveryNextStage(job: TicketJob): TicketJob['stage'] {
    const resumed = scopeRepairResumeNextStage(job); if (resumed) return resumed;
    if (job.implementationContinuation?.phase === 'acceptance' && ['review', 'validate'].includes(job.stage)) return job.stage === 'review' ? 'validate' : 'draft';
    if (job.sourceAmendment && ['implement', 'scope-repair', 'update-base', 'review', 'validate'].includes(job.stage)) {
        const issueSha256 = job.steps.filter(step => step.stage === 'review').at(-1)?.issueSha256;
        for (const stage of ['review', 'validate'] as const) {
            const latest = job.steps.filter(step => step.stage === stage).at(-1);
            if (latest?.result.outcome !== 'passed' || latest.result.commit !== job.head || !latest.workerId || !latest.issueSha256 || latest.issueSha256 !== issueSha256) return stage;
        }
        return 'draft';
    }
    return nextJobStage(job);
}
// Durable stages share the same Office lane as intake and maintenance. An
// interrupted writer is never implicitly retried by an observation or restart.
// Legacy workers used descriptive labels. Accept only the known meanings and
// canonical targets; live issue, board, comment and Actions checks still gate reconciliation.
export function closeoutReceipt(result: StageResult, action: string, issueUrl: string, boardUrl: string) {
    const aliases: Record<string, string> = { 'issue-close': 'Verify issue closure', 'issue-comment': 'Create focused issue closeout comment', 'board-status': 'Verify existing board card status' };
    return result.receipts.find(r => r.verified && !r.uncertain && (r.id === action || r.action === action || r.action === aliases[action] && (action === 'issue-comment' ? new RegExp(`^${issueUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#issuecomment-\\d+$`).test(r.target) : r.target === (action === 'board-status' ? boardUrl : issueUrl))));
}
export class GitHubDelivery {
    constructor(public store: Store, public engine: Engine, public execute: typeof command = command) { }
    get jobs() { return this.store.state.coordination!.jobs ??= []; }
    enqueue(key: string, pr = 0, automaticStatus?: string) {
        if (this.jobs.some(j => j.key === key && j.status !== 'cancelled'))
            return;
        const job: TicketJob = { id: crypto.randomUUID(), key, requestedAt: new Date().toISOString(), status: 'queued', stage: pr ? 'prepare-pr' : 'implement', detail: pr ? 'Existing PR routed to Sam; no duplicate development.' : 'Waiting for the Office team.', head: '', worktree: '', branch: '', pr, automaticStatus, prUrl: pr ? `https://github.com/${this.store.project.repository}/pull/${pr}` : '', existingPR: !!pr, steps: [] };
        this.jobs.push(job);
        this.store.emit('github-delivery-queued', `${key} queued for ${pr ? 'Lead PR review' : 'development'}.`, 'pm', key);
    }
    async reconcileNativeDelivery(key: string) { return reconcileNativeDelivery.call(this, key); }
    async api(path: string) { return JSON.parse(await this.execute('gh', ['api', `repos/${this.store.project.repository}${path ? `/${path}` : ''}`], { cwd: this.store.project.repo, timeout: 60000, readOnly: true })); }
    async readinessPolicy(head: string) { return readiness.readinessPolicy.call(this, head); }
    async verifyPR(job: TicketJob, requireTarget = false) { return readiness.verifyPR.call(this, job, requireTarget); }
    async preparationChecksPending(job: TicketJob, result: StageResult): Promise<boolean>  { return preparationChecksPending.call(this, job, result); }
    async discover(assigned: AssignedIssue[]) { return discover.call(this, assigned); }
    async merge(job: TicketJob) { return readiness.merge.call(this, job); }
    async refreshDependencies() { return refreshDependencies.call(this); }
    async routeExisting(key: string, pr: number) { return routeExisting.call(this, key, pr); }
    async reconcileWrongLink(key: string) { return reconcileWrongLink.call(this, key); }
    async reconcilePreparation(key: string) { return reconcilePreparation.call(this, key); }
    async reconcileReview(key: string,originalWorkId='') { return reconcileReview.call(this, key, originalWorkId); }
    async approveMerge(key: string, head: string) { return approveMerge.call(this, key, head); }
    async reconcileBaseUpdate(key: string) { return reconcileBaseUpdate.call(this, key); }
    async reconcileCloseout(key: string) { return closeout.reconcileCloseout.call(this, key); }
    async observe() { return observe.call(this); }
    async queueConflictRepair(key: string, reason: 'conflicts' | 'ci' = 'conflicts') { return queueConflictRepair.call(this, key, reason); }
    async queueCIRepair(job: TicketJob) { return queueCIRepair.call(this, job); }
    async recoverMergeCI(job: TicketJob) { return recoverMergeCI.call(this, job); }
    async finishLeadReview(job: TicketJob, result: StageResult, current?: any) { return readiness.finishLeadReview.call(this, job, result, current); }
    /** Refresh asynchronous facts, then repeat synchronous grant/claim/evidence fences at persistence. */
    async continuationGuard(job: TicketJob,reconciliation?:import('../../../src/shared').HarnessRequest) { return continuationGuard.call(this, job, reconciliation); }
    async queueSourceRepair(job: TicketJob, result: StageResult, root: string) { return queueSourceRepair.call(this, job, result, root); }
    async step(job: TicketJob) {
        job.status = 'working';
        this.store.emit('github-delivery-stage', `${job.key} · ${job.stage}`, 'pm', job.key);
        const project = this.store.project, root = resolve(this.store.dataRoot, 'ticket-work', job.id);
        mkdirSync(root, { recursive: true });
        try {
            if (job.implementationContinuation && (this.store.state.paused || HOLDS[job.key])) throw new Error('Continuation is paused or held');
            if (handsOff(this.store) && HOLDS[job.key]) throw new Error(`${job.key} is held: ${HOLDS[job.key]}`);
            if(job.savedPrerequisiteHandoff&&!await requireSavedPrerequisites(this,job)){
                job.status='queued';job.detail='Independent review waits for fresh verified prerequisite merge';return;
            }
            await new ProjectProgress(this.store, this.execute).reconcile(job);
            const issue = await this.api(`issues/${Number(job.key.slice(3))}`);
            if (issue.pull_request || !['closeout', 'ci-recovery'].includes(job.stage) && issue.state !== 'open' || !job.existingPR && !issue.assignees?.some((a: any) => a.login === 'JFusco'))
                throw new Error('Issue is closed or no longer assigned to Joe; delivery stopped');
            if (job.stage === 'implement' && job.automaticStatus) {
                const rule = this.store.state.coordination!.pickup, board = await this.engine.github.board();
                if (!board || board.error)
                    throw new Error(board?.error || 'Board unavailable');
                const status = board.items.find(i => i.repository === project.repository && i.number === issue.number)?.status;
                // A hands-off job may continue in In progress only after its own verified move there.
                const continuing = handsOff(this.store) && /^in progress$/i.test(status || '') && !!job.boardUpdates?.some(update => update.status === 'verified' && /^in progress$/i.test(update.target));
                if (rule?.enabled === false || rule?.status !== job.automaticStatus || status !== job.automaticStatus && !continuing)
                    throw new Error('Automatic pickup rule or live board lane changed before implementation');
            }
            if (harnessDelivers(this.store, job) && job.stage === 'implement') {
                await createCandidate(this.store, this.execute, job, issue);
                await moveLane(this.store, this.execute, job, 'In progress', () => assertMayMutate(this.store, this.jobs, job, job.head));
            }
            if (job.stage === 'update-base' && job.pr) {
                const current = await this.verifyPR(job, true);
                const expectedRemote = job.repairCycle?.phase === 'repair' ? job.repairCycle.publishedHead : job.head;
                if (current.state !== 'open' || current.head.sha !== expectedRemote || current.head.ref !== job.branch)
                    throw new Error('Published repair identity or draft state changed; reconcile before source work');
            }
            if (job.stage === 'draft' && job.approach && !job.sourceAmendment) {
                const next = nextJobStage({ ...job, stage: 'validate' });
                if (next !== 'draft') {
                    job.stage = next;
                    job.status = 'queued';
                    job.detail = 'The team selected additional current-head checks before draft publication.';
                    return;
                }
            }
            if (job.stage === 'ci-recovery') {
                await this.recoverMergeCI(job);
                return;
            }
            if (job.stage === 'merge') {
                this.store.agent('lead', { activity: 'working', ticket: job.key, task: `${job.key} · Checking and merging PR #${job.pr}` });
                await this.merge(job);
                return;
            }
            if (job.stage === 'lead-pr') {
                const saved = job.steps.filter(s => s.stage === 'lead-pr').at(-1)?.result;
                if ((job.reviewInputSha256 === deliveryInputSha256(this.store, job.key) || !job.reviewInputSha256 && !deliveryHumanInputs(this.store, job.key).length) && job.reviewContext?.issueUpdatedAt && job.reviewContext.prUpdatedAt && job.reviewContext.baseSha && job.reviewContext.issueUpdatedAt === issue.updated_at && job.reviewContext.step === job.steps.length - 1 && saved?.outcome === 'passed' && saved.prId === job.pr && !job.steps.some(s => hasUncertainEffects(s.stage, s.result)) && saved.evidence.length && !findingsBlock(this.store, saved.findings, f => f.status === 'open') && !hasUncertainEffects('lead-pr', saved)) {
                    const current = await this.verifyPR(job);
                    if (current.state === 'open' && current.base.ref === project.target && job.reviewContext.target === current.base.ref && job.reviewContext.baseSha === current.base.sha && job.reviewContext.prUpdatedAt === current.updated_at && job.reviewContext.head === current.head.sha && saved.commit === current.head.sha) {
                        await this.finishLeadReview(job, saved, current);
                        this.store.emit('pr-review-reused', `${job.key}: saved independent review reused for the unchanged PR head; current GitHub metadata reverified. No model rerun or external write.`, 'lead', job.key);
                        return;
                    }
                }
            }
            const inputSha256 = deliveryInputSha256(this.store, job.key);
            const discoveryNote = job.discoveryRecovery ? this.store.state.projectNotes.find(note => note.id === job.discoveryRecovery!.noteId && note.ticket === job.key) : undefined;
            if (job.discoveryRecovery && !discoveryNote)
                throw new Error('Revised discovery scope note is missing');
            if(job.implementationContinuation?.sourceConfig&&!job.implementationContinuation.sourceConfig.reviewedSha256&&['repair','technical-review'].includes(job.implementationContinuation.phase)){await runSourceConfiguration(this,job);return;}
            const technicalPhase = !!job.implementationContinuation && job.implementationContinuation.phase !== 'acceptance';
            const recoveredFindingIds = job.savedPrerequisiteHandoff?.findingIds || (job.implementationRecovery?.kind === 'candidate' ? job.candidateRecovery?.findingIds : job.discoveryRecovery?.findingIds);
            if (['review', 'lead-pr'].includes(job.stage) && !technicalPhase)
                await new ProjectProgress(this.store, this.execute).reviewStarted(job);
            const continuation = job.implementationContinuation && (!job.pr || technicalPhase) && ['review', 'scope-repair', 'validate'].includes(job.stage) ? await this.continuationGuard(job) : undefined;
            const reviewStart = job.stage === 'lead-pr' ? await this.verifyPR(job) : undefined;
            let policyInstruction = '';
            if (reviewStart) {
                const policy = await this.readinessPolicy(reviewStart.head.sha), path = resolve(root, `github-policy-${crypto.randomUUID()}.json`);
                writeFileSync(path, JSON.stringify(policy, null, 2));
                policyInstruction = `VERIFIED NATIVE GITHUB POLICY: ${JSON.stringify(policy)}. Saved at ${path}. These successful reads use the Office's existing gh authentication and include every repository/inherited ruleset page. When protectionDetailRequired=false, GitHub reports an unprotected target with no rulesets: the administrative /branches/{branch}/protection endpoint is unnecessary and MUST NOT be called. Preserve earlier connector denials as diagnostics for that unused operation; do not repeat the denied call or request broader permissions. This packet resolves only policy discovery, not source acceptance, required checks, review threads, holds or merge readiness. If protectionDetailRequired=true, inspect all applicable rules using permitted native reads; missing required policy evidence remains blocking. Prefer the configured native gh reader for GitHub readiness rather than mixing connector credentials. Reuse the saved source review and checks for the unchanged head; reassess only the remaining live readiness gates.`;
            }
            const role: Role = ({ 'ci-recovery': 'pm', implement: 'developer', 'scope-repair': 'developer', 'update-base': 'developer', review: 'lead', validate: 'qa', draft: 'developer', 'lead-pr': 'lead', 'prepare-pr': 'lead', closeout: 'pm' } as const)[job.stage];
            if (job.stage === 'prepare-pr') {
                const current = await this.verifyPR(job);
                job.head = current.head.sha;
                job.branch = current.head.ref || job.branch;
                await verifyInitialDraftConflictPreparation(this,job,current.draft===true);
                this.store.save();
            }
            const priorHeldFindings = await outsideAmendmentFindingIds(this,job);
            const readyChecks = ['review', 'validate'].every(stage => !job.sourceAmendment && (stage === 'review' && job.approach?.review === 'none' || stage === 'validate' && job.approach?.validation === 'developer-checks') || job.steps.some(s => s.stage === stage && s.result.outcome === 'passed' && s.result.commit === job.head && !findingsBlock(this.store, s.result.findings, f => f.status === 'open' && !priorHeldFindings.has(f.id))));
            if (job.sourceAmendment && ['draft', 'prepare-pr'].includes(job.stage))
                await requireSourceAmendmentAcceptance(this, job, job.stage === 'draft');
            let instructions = technicalPhase ? implementationContinuationInstruction(job, continuation!.notes) : stagePrompt({ store: this.store, project, job, root, issue, readyChecks });
            const issueSha256 = job.sourceAmendment && ['review', 'validate'].includes(job.stage) ? amendmentIssueSha256(await this.api('issues/91')) : undefined;
            const beforeWorkers = new Set((this.store.state.workLog || []).map(work => work.id));
            this.store.state.lastHandoff = { at: new Date().toISOString(), from: 'pm', to: role, ticket: job.key };
            if (job.stage === 'review' && job.repairCycle?.phase === 'diagnosis') {
                if (job.repairCycle.diagnosisAttempted) throw new Error('The bounded revised-approach assessment was already attempted; retain its result for reconciliation');
                job.repairCycle.diagnosisAttempted = true; this.store.save();
                instructions = REPAIR_DIAGNOSIS;
            }
            if (job.stage === 'update-base' && job.repairCycle?.phase === 'repair') {
                await verifyRepairCandidate(project, job, this.execute);
                instructions = `Repair only the scoped source/check defects on the existing owned candidate ${job.head}, branch ${job.branch}, worktree ${job.worktree}. Findings ${JSON.stringify(job.repairCycle.pendingFindingIds)} from ${job.repairCycle.sourceStage}; inspect the complete retained stage result, diagnostic paths and original receipts below. Verify exact origin, current HEAD, clean worktree, current issue/comments/holds and native ownership before editing. Preserve original commits and IDs. Make a follow-up commit on this SAME branch/worktree and run the required repository checks. No push, PR, source acceptance, issue/board write, reset, duplicate worktree or mutation retry. A genuine permission/service/scope/human hold must remain explicit. Return an actual disposition for every original finding. Independent current-head review and verification follow; do not reduce the approach to escape a failure.`;
            }
            if (harnessDelivers(this.store, job) && job.stage === 'implement' && !technicalPhase)
                instructions = implementInstruction(project, job, issue.number, root);
            instructions += `\n${scopeRepairResumeInstruction(this.store,job)}`;
            // The exceptional prepare-pr worker still owns its retarget/promotion steps.
            if (handsOff(this.store))
                instructions += `\n${job.stage === 'prepare-pr' || !harnessDelivers(this.store, job) ? '' : BOARD_RULE}\n${DECISION_RULE}`;
            const candidateAtStart = JSON.stringify({ id: job.id, stage: job.stage, head: job.head, branch: job.branch, worktree: job.worktree });
            const harnessResult = await runHarnessStage(this, job, root, readyChecks);
            const result: StageResult = harnessResult ?? await this.engine.agents.run(role, deliveryTask({ store: this.store, project, job, root, issue, instructions, policyInstruction, discoveryNote, technicalPhase, recoveredFindingIds }), ResultSchema, { artifactsRoot: root, cwd: job.worktree || project.repo, readOnly: ['review', 'lead-pr'].includes(job.stage), ticket: job.key, stage: `github-${job.stage}`, requestId: job.id, enqueuedAt: job.requestedAt, timeout: 60 * 60 * 1000 });
            await acceptStageResult.call(this, { job, result, project, root, issue, role, continuation, reviewStart, inputSha256, beforeWorkers, issueSha256, candidateAtStart, technicalPhase });
        }
        catch (error) {
            job = this.jobs.find(current => current.id === job.id) || job;
            const waiting = error instanceof CurrentChecksWait && job.stage === 'merge' && !job.mergeAttempt && !this.store.state.paused;
            job.status = this.store.state.paused ? 'interrupted' : waiting ? 'watching' : 'blocked';
            job.detail = String(error);
            this.store.emit(waiting ? 'github-checks-waiting' : 'github-delivery-blocked', shortSummary(job.detail), 'pm', job.key);
        }
        finally {
            if (job.stage === 'merge' && this.store.state.agents.find(a => a.id === 'lead')?.activity === 'working')
                this.store.agent('lead', { activity: 'idle', ticket: '', task: 'Merge preflight finished; see the ticket outcome', lastOutcome: { ticket: job.key, status: job.status, summary: shortSummary(job.detail), at: new Date().toISOString() } });
            job.updatedAt = new Date().toISOString();
            this.store.save();
        }
    }
}
