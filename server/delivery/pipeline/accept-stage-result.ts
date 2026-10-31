import {completedExecution} from '../../workers/worker-completion';
import { teamReviewedHead, mergeAuthorized } from '../readiness/team-review';
import { assertScopeRepairResumeFindings } from '../recovery/scope-repair/scope-repair-resume';
import { handoffSavedPrerequisites, savedPrerequisiteFindingsResolved, savedPrerequisiteJobEligible } from '../recovery/implementation/saved-prerequisite-handoff';
import { routeReadyPostConflictPublication } from '../recovery/preparation/post-conflict-preparation';
import {enqueueRequest} from '../../scheduling/requests';
import { conflictOnlyAssessment } from '../repairs/conflict-repair';
import {outsideAmendmentFindingIds,amendmentRepairView} from '../recovery/source-amendment/source-amendment-held';
import { HOLDS } from '../../office/config';
import { handsOff, harnessDelivers } from '../harness/scope';
import { findingsBlock } from '../findings/advisory';
import { needsDecision, park } from '../parking/park';
import { repairDispositions, revisedRepair, retainRepairEvidence } from '../repairs/delivery-repairs';
import { discoveryReviewSatisfied } from '../recovery/implementation/discovery-recovery';
import { recoveredFindingsResolved } from '../recovery/implementation/implementation-recovery';
import { requireSourceAmendmentAcceptance } from '../recovery/source-amendment/source-amendment';
import { sourceHash, sourceJson } from '../recovery/source-amendment/source-amendment-scope';
import { deliveryInputSha256 } from '../../github/github-context';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../../store/store';
import type { TicketJob, StageResult, Role } from '../../../src/shared';
import { recordJobApproach, acceptConflictRepair } from './approach';
import { containedFile } from '../../cec/workflow';
import { implementationContinuationDecision, negativeTechnicalReview } from '../recovery/implementation/implementation-continuation';
import {publishedDraftConflictCandidate,reconcilePublishedDraftConflict} from '../recovery/preparation/published-draft-conflict';
import { continuationWorkerProof, continuationReviewArtifacts, assertContinuationWorker } from '../recovery/implementation/continuation-evidence';
import { artifact, digest } from '../../store/readback-evidence';
import { currentAssignment } from '../../workers/assignment-context';
import { isDeepStrictEqual } from 'node:util';
import type { GitHubDelivery } from './github-delivery';
import { deliveryNextStage, hasUncertainEffects, pendingPreparationCheck, closeoutReceipt } from './github-delivery';

export interface StageContext { job: TicketJob; result: StageResult; project: Store['project']; root: string; issue: any; role: Role; continuation: Awaited<ReturnType<GitHubDelivery['continuationGuard']>> | undefined; reviewStart: any; inputSha256: string; beforeWorkers: Set<string>; issueSha256: string | undefined; candidateAtStart: string; technicalPhase: boolean }
/** Validates and applies one stage result: identity fences, proofs, parking, repairs, gates and the next stage. */
export async function acceptStageResult(this: GitHubDelivery, context: StageContext): Promise<void> {
    const { job, result, project, root, issue, role, continuation, reviewStart, inputSha256, beforeWorkers, issueSha256, candidateAtStart, technicalPhase } = context;
    if (this.jobs.find(current => current.id === job.id) !== job || this.store.state.paused || HOLDS[job.key] || candidateAtStart !== JSON.stringify({ id: job.id, stage: job.stage, head: job.head, branch: job.branch, worktree: job.worktree })) {
        job.steps.push({ stage: 'superseded-stage-result', result });
        throw new Error('Delivery ownership, candidate, hold or pause state changed during this stage; result retained for reconciliation');
    }
    let nativeProof: { workerId?: string; nativeResultSha256?: string; issueSha256?: string } = issueSha256 ? { issueSha256 } : {};
    let continuationWorker: ReturnType<typeof continuationWorkerProof> | undefined;
    let reviewDiagnostics: ReturnType<typeof continuationReviewArtifacts> = [];
    if (continuation) {
        const workers = (this.store.state.workLog || []).filter(w => !beforeWorkers.has(w.id) && w.requestId === job.id && w.stage === `github-${job.stage}`);
        if (workers.length !== 1 || workers[0].role !== role || !['completed', 'blocked','failed'].includes(workers[0].status)) throw new Error('One actual independent continuation stage worker required');
        continuationWorker = continuationWorkerProof(this.store, job, workers[0], ['review', 'lead-pr'].includes(job.stage), job.worktree);
        if (!isDeepStrictEqual(continuationWorker.result, result) || continuationWorker.assignment.claimId !== currentAssignment()?.claim.id || job.steps.some(s => s.workerId === workers[0].id)) throw new Error('Continuation native result disagrees or worker was reused');
        if (job.stage === 'review') reviewDiagnostics = continuationReviewArtifacts(this.store,job,result);
        if (job.stage === 'review' && !negativeTechnicalReview(result,job) && !result.evidence.some(e => e.kind === 'review' && e.commit === job.head)) throw new Error('Actual current-head independent review evidence required');
        nativeProof = { workerId: workers[0].id, nativeResultSha256: digest(result) };
    }
    if(continuation&&job.implementationContinuation?.phase==='activation'&&result.outcome==='failed'){
        await continuation.verify(result);assertContinuationWorker(this.store,continuationWorker!,job);
        job.steps.push({...nativeProof,stage:job.stage,result:structuredClone(result)});
        job.status='blocked';job.detail='Negative activation result retained. Exact original native/effects readback is required before any source-input repair or retry.';
        enqueueRequest(this.store,'reconcile-activation',job.key,continuationWorker!.worker.id);
        this.store.emit('activation-negative',job.detail,'pm',job.key);return;
    }
    if (job.scopeRepairResumes?.length && ['review','validate'].includes(job.stage)) {
        const workers=(this.store.state.workLog||[]).filter(w=>!beforeWorkers.has(w.id)&&w.requestId===job.id&&w.stage===`github-${job.stage}`);
        // Hands-off: a completed execution with a blocked verdict is still a real verdict; route it instead of hiding it.
        const verdictStatuses=handsOff(this.store)?['completed','blocked']:['completed'];
        if(workers.length!==1||workers[0].role!==role||!verdictStatuses.includes(workers[0].status)||!completedExecution(this.store,workers[0]))throw new Error('One completed actual independent resumed scope-repair worker required');
        const proof=continuationWorkerProof(this.store,job,workers[0],job.stage==='review',job.worktree);
        if(!isDeepStrictEqual(proof.result,result)||proof.assignment.claimId!==currentAssignment()?.claim.id)throw new Error('Resumed independent result/claim differs');
        nativeProof={...nativeProof,workerId:workers[0].id,nativeResultSha256:digest(result)};
    }
    if (job.sourceAmendment && ['review', 'validate'].includes(job.stage)) {
        const workers = (this.store.state.workLog || []).filter(work => !beforeWorkers.has(work.id) && work.requestId === job.id && work.stage === `github-${job.stage}`);
        if (workers.length !== 1 || workers[0].role !== role || !workers[0].sessionId || !workers[0].endedAt) {
            job.steps.push({ ...nativeProof, stage: job.stage, result });
            throw new Error('Amendment requires one correlated actual independent worker for this stage');
        }
        nativeProof = { ...nativeProof, workerId: workers[0].id, nativeResultSha256: sourceHash(sourceJson(result)) };
    }
    if (job.stage === 'review' && result.commit === job.head && result.evidence.length) {
        const path = resolve(root, `code-review-${job.steps.length}.json`);
        writeFileSync(path, JSON.stringify({ head: job.head, review: result, ...(reviewDiagnostics.length ? { diagnostics: reviewDiagnostics } : {}) }, null, 2));
        result.evidence.push({ id: crypto.randomUUID(), kind: 'review', summary: 'Saved independent candidate review', path, commit: job.head, environment: 'Office code review', url: '', observedAt: new Date().toISOString() });
    }
    const heldFindings = await outsideAmendmentFindingIds(this,job,result.commit,result);
    if (result.approach) {
        const failedWorker = (this.store.state.workLog || []).filter(w => w.requestId === job.id).some(w => ['failed', 'interrupted', 'blocked'].includes(w.status) && !(this.store.state.workLog || []).some(later => later.requestId === job.id && later.stage === w.stage && later.startedAt > w.startedAt && later.status === 'completed'));
        try {
            if (job.implementationContinuation && (result.approach.review !== 'full' || result.approach.validation === 'developer-checks')) throw new Error('Continuation requires retained full independent review and QA');
            if (job.scopeRepairResumes?.length && (result.approach.review !== 'full' || result.approach.validation === 'developer-checks')) throw new Error('Resumed scope repair requires full independent review and QA');
            if (job.sourceAmendment && (result.approach.review === 'none' || result.approach.validation === 'developer-checks'))
                throw new Error('Amendment requires retained independent review and QA');
            if (job.stage === 'implement' && (job.implementationRecovery || job.discoveryRecovery)) {
                result.approach = { ...result.approach,
                    review: result.approach.review === 'full' || job.approach?.review === 'full' ? 'full' : 'focused',
                    validation: result.approach.validation === 'browser' || job.approach?.validation === 'browser' ? 'browser' : 'independent-checks' };
            }
            else if ((job.implementationRecovery || job.discoveryRecovery || job.savedPrerequisiteHandoff) && (result.approach.review === 'none' ||
                job.approach?.review === 'full' && result.approach.review !== 'full' ||
                result.approach.validation === 'developer-checks' ||
                job.approach?.validation === 'browser' && result.approach.validation !== 'browser'))
                throw new Error('Recovered implementation requires retained independent review and QA');
            recordJobApproach(job, result.approach, role, failedWorker, handsOff(this.store));
        }
        catch (error) {
            job.steps.push({ ...nativeProof, stage: job.stage, result });
            throw error;
        }
        this.store.emit('team-approach', `${job.key}: ${result.approach.review === 'none' ? 'no separate code review' : result.approach.review === 'focused' ? 'quick code review' : 'full implementation review'} · ${result.approach.reason}`, role, job.key);
    }
    if (job.stage === 'review' && job.repairCycle?.phase === 'diagnosis') {
        job.steps.push({ ...nativeProof, stage: 'repair-diagnosis', result });
        if (deliveryInputSha256(this.store, job.key) !== inputSha256 || hasUncertainEffects('review', result) || result.worktree !== job.worktree || result.branch !== job.branch || !retainRepairEvidence(result, 'repair-diagnosis', root, job.worktree))
            throw new Error('Revised approach identity, human input or diagnostic evidence is unverified');
        const revised = revisedRepair(job.repairCycle, amendmentRepairView(result,heldFindings), handsOff(this.store));
        if (!revised || revised.phase !== 'repair') throw new Error(result.blocker || 'No permitted changed technical approach was established; Morgan retains the concrete restriction and original repair evidence');
        job.repairCycle = revised; job.stage = 'update-base'; job.status = 'queued';
        job.detail = 'Sam established one changed technical approach. Alex continues the same candidate within the extended bounded window; original counters are retained.';
        this.store.emit('delivery-repair-revised', job.detail, 'developer', job.key);
        return;
    }
    if (result.outcome === 'reroute') {
        if (continuation || job.scopeRepairResumes?.length) throw new Error('Continuation cannot reroute its mandatory independent gates');
        if (!result.approach || result.receipts.length || result.paidRuns !== 0 || !['review', 'validate', 'lead-pr', 'implement'].includes(job.stage))
            throw new Error('A route change must precede work and include a reason, with no effects to replay');
        if (result.findings.some(f => f.status !== 'verified'))
            throw new Error('Resolve new findings before changing the route');
        if (job.steps.filter(s => s.result.outcome === 'reroute' && s.result.commit === result.commit).length >= 3)
            throw new Error('Repeated approach changes need team reconciliation before another worker call');
        job.steps.push({ ...nativeProof, stage: job.stage, result });
        this.store.emit('review-route-changed', `${job.key}: ${result.approach.reason}`, role, job.key);
        job.status = 'queued';
        job.detail = result.approach.reason;
        if (['review', 'validate'].includes(job.stage))
            job.stage = deliveryNextStage(job);
        return;
    }
    if (job.stage === 'review' && !result.approach && job.approach)
        result.approach = job.approach;
    job.steps.push({ ...nativeProof, stage: job.stage, result });
    if (job.skippedStages)
        delete job.skippedStages[job.stage];
    if (job.stage === 'lead-pr' && reviewStart && result.commit === reviewStart.head.sha)
        job.reviewContext = { head: result.commit, issueUpdatedAt: issue.updated_at || '', prUpdatedAt: reviewStart.updated_at || '', baseSha: reviewStart.base.sha || '', target: reviewStart.base.ref, step: job.steps.length - 1 };
    if (job.stage === 'lead-pr') job.reviewInputSha256 = inputSha256;
    this.store.save();
    if (deliveryInputSha256(this.store, job.key) !== inputSha256) {
        if (['review', 'lead-pr'].includes(job.stage) && !hasUncertainEffects(job.stage, result) && !job.steps.some(step => hasUncertainEffects(step.stage, step.result))) {
            job.status = 'queued'; delete job.reviewContext;
            job.detail = 'New authenticated human input arrived during the saved read-only assessment; current-head reassessment queued for the scheduler before effects.';
            this.store.emit('delivery-input-reassessment', job.detail, 'lead', job.key);
            return;
        }
        throw new Error('Human delivery inputs changed during this stage; retained result requires reassessment before effects');
    }
    if (hasUncertainEffects(job.stage, result))
        throw new Error('Uncertain external effect; read back original session before continuing');
    if (handsOff(this.store) && needsDecision(result)) {
        await park(this, job, result);
        return;
    }
    if(savedPrerequisiteJobEligible(this.store,job)&&result.outcome==='passed'&&result.prerequisites?.length){
        const workers=(this.store.state.workLog||[]).filter(w=>!beforeWorkers.has(w.id)&&w.requestId===job.id&&w.stage===`github-${job.stage}`);
        if(workers.length!==1)throw new Error('One actual original writer required for prerequisite handoff');
        if(workers[0].provider==='claude'){await handoffSavedPrerequisites(this,job,workers[0].id);return;}
    }
    if (continuation) {
        const evidence = result.evidence.filter(e => e.commit === result.commit && containedFile(e.path, root) && (job.stage === 'review' ? e.kind === 'review' : e.kind === 'checks'));
        if (!evidence.length) throw new Error('Continuation exact-head evidence missing');
        const files = evidence.map(e => artifact(this.store, e.path));
        const diagnosticFiles = () => continuationReviewArtifacts(this.store,job,continuationWorker!.result as StageResult);
        const implementationChanged = await continuation.verify(result);
        const decision = implementationContinuationDecision({ ...job, steps: job.steps.slice(0, -1) }, result, implementationChanged);
        if (decision?.action === 'blocked') throw new Error(decision.reason);
        const assertFinal = () => {
            continuation.assertCurrent(); assertContinuationWorker(this.store, continuationWorker!,job);
            const workers = (this.store.state.workLog || []).filter(w => !beforeWorkers.has(w.id) && w.requestId === job.id && w.stage === `github-${job.stage}`);
            if (workers.length !== 1 || workers[0].id !== continuationWorker!.worker.id) throw new Error('Continuation stage worker inventory changed');
            if (!isDeepStrictEqual(diagnosticFiles(),reviewDiagnostics)) throw new Error('Continuation diagnostic evidence changed');
            if (files.some(file => !isDeepStrictEqual(artifact(this.store, file.path), file))) throw new Error('Continuation check/review evidence changed');
        };
        if (decision) {
            this.store.transaction(() => {
                assertFinal();
                job.implementationContinuation = decision.next;
                job.head = result.commit;
                job.stage = decision.action === 'technical-review' || decision.action === 'acceptance' ? 'review' : 'scope-repair';
                job.candidateRecovery!.findingIds = [...new Set([...job.candidateRecovery!.findingIds, ...decision.next.pendingFindingIds, ...decision.next.repairFindingIds, ...result.findings.map(f => f.id)])];
                job.status = 'queued'; job.detail = decision.reason;
                this.store.emit('implementation-continuation', decision.reason, job.stage === 'review' ? 'lead' : 'developer', job.key);
            });
            return;
        }
        // Ordinary acceptance still uses the existing original-finding gates.
        if (!discoveryReviewSatisfied(job, job.stage, result) || !recoveredFindingsResolved(job, job.stage, result) || result.outcome !== 'passed' ||
            result.commit !== job.head || result.findings.some(f => f.status === 'open') || new Set(result.findings.map(f => f.id)).size !== result.findings.length || result.paidRuns !== 0) throw new Error('Continuation ordinary review/QA has unresolved original or technical findings');
        this.store.transaction(() => {
            assertFinal(); job.stage = deliveryNextStage(job); job.status = 'queued'; job.detail = result.summary;
            this.store.emit('implementation-acceptance-stage', `${job.key}: ordinary independent stage passed; remaining delivery gates retained.`, role, job.key);
        });
        return;
    }
    if (job.stage === 'prepare-pr') {
        if (result.outcome !== 'passed' || result.commit !== job.head || hasUncertainEffects(job.stage, result))
            throw new Error(result.blocker || result.summary || 'PR preparation did not pass');
        const p = await this.verifyPR(job, true);
        if (p.state !== 'open' || p.head.sha !== job.head)
            throw new Error('Prepared PR state or exact head is unverified');
        const checksPending = await this.preparationChecksPending(job, result);
        if (findingsBlock(this.store, result.findings, f => f.status === 'open' && !heldFindings.has(f.id) && !pendingPreparationCheck(f, checksPending)))
            throw new Error(result.blocker || result.summary || 'PR preparation findings require reconciliation');
        const childPages = JSON.parse(await this.execute('gh', ['api', `repos/${project.repository}/pulls?state=open&base=${encodeURIComponent(p.head.ref)}&per_page=100`, '--paginate', '--slurp'], { cwd: project.repo, timeout: 60000 }));
        if (!Array.isArray(childPages) || childPages.flat().some((child: any) => child.base?.ref === p.head.ref))
            throw new Error('Dependent PR bases must be retargeted before merge or branch cleanup');
        if (this.store.state.github) {
            const observed = this.store.state.github.prs.find(pr => pr.number === job.pr);
            if (observed)
                Object.assign(observed, { state: p.state, base: p.base.ref, head: p.head.sha, mergedAt: p.merged_at || '', draft: p.draft });
        }
        if (teamReviewedHead(this.store, job) && !p.draft && mergeAuthorized(this.store, job)) {
            job.stage = 'merge';
            job.status = 'queued';
            job.detail = 'PR prepared. The team already reviewed and verified this exact head, so the guarded merge runs without a second readiness review.';
            this.store.emit('pr-prepared', `${job.key}: PR prepared; team-reviewed head goes to the guarded merge.`, 'lead', job.key);
            return;
        }
        job.stage = 'lead-pr';
        job.status = 'queued';
        job.detail = 'PR metadata and dependent bases verified; Sam will assess current-head checks and the final diff.';
        this.store.emit('pr-prepared', `${job.key}: PR metadata prepared; current-head review queued.`, 'lead', job.key);
        return;
    }
    if (job.stage === 'lead-pr') {
        if (!conflictOnlyAssessment(result) && await this.queueSourceRepair(job, result, root)) return;
        await this.finishLeadReview(job, result);
        return;
    }
    if (await this.queueSourceRepair(job, result, root)) return;
    if (!discoveryReviewSatisfied(job, job.stage, result))
        throw new Error('Discovery continuation requires independent disposition of each original finding');
    if (!recoveredFindingsResolved(job, job.stage, result)||!savedPrerequisiteFindingsResolved(job,job.stage,result))
        throw new Error('Recovered implementation findings require explicit independent disposition');
    if (job.repairCycle && job.repairCycle.phase !== 'diagnosis' && ['update-base', 'review', 'validate'].includes(job.stage) && !repairDispositions(job.repairCycle, result, job.stage === 'validate'))
        throw new Error('Repair must retain every original finding and its explicit current-head disposition');
    if(result.outcome==='passed')assertScopeRepairResumeFindings(this.store,job,job.stage,result,heldFindings);
    const openBlocks = (f: StageResult['findings'][number]) => f.status === 'open' && !heldFindings.has(f.id) && !(['update-base', 'draft'].includes(job.stage) && f.id === 'draft-blocks-merge');
    // Verdict stages are advisory for hands-off projects; a draft publication's findings describe its technical state.
    if (result.outcome !== 'passed' || (job.stage === 'draft' ? result.findings.some(openBlocks) : findingsBlock(this.store, result.findings, openBlocks)))
    {
        const published=job.stage==='draft'?publishedDraftConflictCandidate(this.store,job,true):undefined;
        if(published){await reconcilePublishedDraftConflict(this,job,published.work.id);return;}
        throw new Error(result.blocker || result.summary || 'Stage did not pass');
    }
    if (!/^[a-f0-9]{40}$/i.test(result.commit))
        throw new Error('Exact candidate commit is missing');
    if (!['implement', 'scope-repair', 'update-base'].includes(job.stage) && (job.stage === 'closeout' ? job.mergeCommit : job.head) && (job.stage === 'closeout' ? job.mergeCommit : job.head) !== result.commit)
        throw new Error('Candidate changed since independent review');
    if (!result.evidence.some(e => e.commit === result.commit && containedFile(e.path, root) && (['review'].includes(job.stage) ? e.kind === 'review' : ['implement', 'scope-repair', 'validate'].includes(job.stage) ? e.kind === 'checks' : true)))
        throw new Error('Saved current-commit evidence is missing');
    if (job.stage === 'closeout') {
        const p = await this.verifyPR(job, true), closed = await this.api(`issues/${issue.number}`);
        const board = await this.engine.github.board();
        if (!p.merged_at || p.merge_commit_sha !== job.mergeCommit || closed.state !== 'closed' || !board || board.error || board.items.find(i => i.number === issue.number && i.repository === project.repository)?.status !== 'Done' || !['issue-close', 'issue-comment', 'board-status'].every(action => closeoutReceipt(result, action, issue.html_url, project.githubProject?.url || '')))
            throw new Error('Issue closure and Done lane read-back are incomplete');
        if (this.store.state.github) {
            this.store.state.github.board = board;
            const issue = this.store.state.github.issues.find(i => i.key === job.key);
            if (issue)
                issue.state = 'closed';
        }
        const ticket = this.store.ticket(job.key);
        ticket.status = 'closed';
        ticket.stage = 'complete';
        ticket.activity = 'idle';
        job.status = 'completed';
        job.detail = job.ciFollowupKey ? `Original merge checks failed; repair ${job.ciFollowupKey} merged and passed verification. Issue closure and Done lane verified; original failures retained.` : 'PR merged, merge Actions passed, issue closed, and Done lane verified.';
        this.store.emit('github-closeout', `${job.key}: merged, verified and closed out.`, 'pm', job.key);
        return;
    }
    if (['implement', 'scope-repair', 'update-base'].includes(job.stage)) {
        if (['scope-repair', 'update-base'].includes(job.stage) && (result.prId !== (job.pr || 0) || result.worktree !== job.worktree || result.branch !== job.branch))
            throw new Error('Base update must preserve the owned candidate identity');
        if (job.stage === 'scope-repair') {
            if (!job.candidateRecovery || result.findings.some(finding => !job.candidateRecovery!.findingIds.includes(finding.id)) || job.candidateRecovery.findingIds.some(id => !result.findings.some(finding => finding.id === id && (finding.status !== 'open' || heldFindings.has(id)))))
                throw new Error('Saved finding identity or resolution is incomplete');
            await this.execute('git', ['merge-base', '--is-ancestor', job.candidateRecovery.head, result.commit], { cwd: job.worktree, readOnly: true });
        }
        if (!result.worktree || result.worktree === project.repo || !result.branch)
            throw new Error('An isolated candidate worktree and branch are required');
        if (harnessDelivers(this.store, job) && job.stage === 'implement' && job.worktree && (result.worktree !== job.worktree || result.branch !== job.branch))
            throw new Error('Implementation must stay in the Office-created worktree and branch');
        const head = (await this.execute('git', ['rev-parse', 'HEAD'], { cwd: result.worktree, timeout: 10000 })).trim();
        if (head !== result.commit)
            throw new Error('Worktree HEAD does not match the candidate');
        if (job.stage === 'update-base' && job.repairCycle?.phase === 'repair')
            await this.execute('git', ['merge-base', '--is-ancestor', job.head, result.commit], { cwd: result.worktree, timeout: 10000, readOnly: true });
        if (job.stage === 'update-base' && job.repairCycle?.phase !== 'repair') {
            const base = await this.api(`commits/${project.target}`);
            if (!/^[a-f0-9]{40}$/.test(base.sha || ''))
                throw new Error('Current main identity is unavailable');
            await this.execute('git', ['merge-base', '--is-ancestor', base.sha, result.commit], { cwd: result.worktree, timeout: 10000 });
        }
        job.head = result.commit;
        job.worktree = result.worktree;
        job.branch = result.branch;
        if (job.stage === 'update-base' && job.repairReason === 'conflicts' && !job.sourceAmendment)
            acceptConflictRepair(job, result, handsOff(this.store));
    }
    if (job.stage === 'validate' && job.sourceAmendment)
        await requireSourceAmendmentAcceptance(this, job, true);
    if (job.stage === 'draft') {
        await requireSourceAmendmentAcceptance(this, job);
        if (job.pr && result.prId !== job.pr)
            throw new Error('Existing PR identity changed during publication');
        job.pr = result.prId;
        if (!job.pr)
            throw new Error('PR identity is missing');
        const p = await this.verifyPR(job, true);
        job.prUrl = p.html_url;
        if (job.repairCycle?.publishedHead) job.repairCycle.publishedHead = p.head.sha;
        if (!p.draft && !job.repairReason || p.head.sha !== job.head)
            throw new Error('Draft state or exact PR head is unverified');
        const linked = JSON.parse(await this.execute('gh', ['pr', 'view', String(job.pr), '--repo', project.repository, '--json', 'closingIssuesReferences'], { cwd: project.repo, timeout: 60000 }));
        if (!linked.closingIssuesReferences?.some((i: any) => i.url === issue.html_url))
            throw new Error('GitHub has not confirmed the native issue-to-PR link');
        const comments = JSON.parse(await this.execute('gh', ['api', `repos/${project.repository}/issues/${issue.number}/comments?per_page=100`, '--paginate', '--slurp'], { cwd: project.repo, timeout: 60000 }));
        const marker = `Office delivery ${job.id}`;
        if (!comments.flat().some((c: any) => c.body?.includes(marker))) {
            // Job is durably working before this single write. Timeout/restart blocks replay.
            const comment = JSON.parse(await this.execute('gh', ['api', `repos/${project.repository}/issues/${issue.number}/comments`, '-f', `body=${marker}: Draft PR ${p.html_url} is linked to this issue. Team-selected checks cover ${job.head}; ${job.approach ? `review=${job.approach.review}, validation=${job.approach.validation}. ${job.approach.reason}` : 'the retained independent review and validation apply.'} Sam will check PR readiness; maintainer merge and release gates still apply.`], { cwd: project.repo, timeout: 60000 }));
            const saved = await this.api(`issues/comments/${comment.id}`);
            if (!saved.body?.includes(marker) || !saved.body.includes(p.html_url))
                throw new Error('Issue comment read-back failed');
        }
        this.store.ticket(job.key).prId = job.pr;
        this.store.emit('github-pr-linked', `${job.key} linked to draft PR #${job.pr}; handing off to Sam.`, 'lead', job.key);
        if (await routeReadyPostConflictPublication(this,job,result)) return;
    }
    if (job.repairCycle && job.repairCycle.phase !== 'diagnosis') {
        if (job.stage === 'update-base') job.repairCycle.phase = 'review';
        else if (job.stage === 'review') job.repairCycle.phase = 'verify';
        else if (job.stage === 'validate') job.repairCycle.pendingFindingIds = [];
    }
    job.stage = deliveryNextStage(job);
    job.status = 'queued';
    job.detail = result.summary;
}
