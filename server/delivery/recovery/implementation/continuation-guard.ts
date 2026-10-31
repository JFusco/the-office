import { assertSourceConfiguration } from './activation-recovery';
import { HOLDS } from '../../../office/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { TicketJob, StageResult } from '../../../../src/shared';
import { continuationScope, assertContinuationWorker, continuationJsonArtifact, continuationWorktree } from './continuation-evidence';
import { artifact, digest } from '../../../store/readback-evidence';
import { readValidationProviderContext, validationProviderVersion } from '../validation/validation-provider-context';
import { SessionBridge } from '../../../workers/session-bridge';
import { currentAssignment } from '../../../workers/assignment-context';
import { GitOperations } from '../../../github/git-operations';
import { parseBrainStatus } from '../../../maintenance/brain/brain-status';
import { isDeepStrictEqual } from 'node:util';
import { workKey } from '../../../../src/shared';
import type { GitHubDelivery } from '../../pipeline/github-delivery';

export async function continuationGuard(this: GitHubDelivery, job: TicketJob,reconciliation?:import('../../../../src/shared').HarnessRequest) {
    const { store } = this, state = job.implementationContinuation!, scope = continuationScope(store, job);
    if (state.phase === 'technical-review' ? job.stage !== 'review' : state.phase === 'acceptance' ? !['review', 'validate'].includes(job.stage) : job.stage !== 'scope-repair') throw new Error('Continuation phase/stage mismatch');
    const {file: proofFile, value: proof} = continuationJsonArtifact(store, state.proofPath);
    if (proofFile.sha256 !== state.proofSha256 || proof.originalWorkId !== state.originalWorkId || proof.prior?.steps?.at(-1)?.result.commit !== state.originalHead ||
        scope.scopeSha256 !== state.scopeSha256 || !isDeepStrictEqual(scope.noteIds, state.noteIds) || !isDeepStrictEqual(proof.scope, scope)) throw new Error('Frozen continuation scope or original audit changed');
    const identity = () => ({ project: store.project, id: job.id, key: job.key, head: job.head, worktree: job.worktree, branch: job.branch, stage: job.stage,
        pr: job.pr, existingPR: job.existingPR, mergeAttempt: job.mergeAttempt, mergeIntentId: job.mergeIntentId, continuation: job.implementationContinuation,
        discovery: job.discoveryRecovery, history: job.discoveryRecoveryHistory, recovery: job.candidateRecovery });
    let expected = digest(identity()); const expectedReconciliation=reconciliation?digest(reconciliation):'', assignment = currentAssignment(), claim = assignment ? structuredClone(assignment.claim) : undefined;
    const bridge = new SessionBridge(() => [store], this.execute);
    const assertCurrent = () => {
        const visibility = bridge.forProject(store, job.key, job.id);
        if (store.state.paused || HOLDS[job.key] || !claim || assignment?.lane !== 'delivery' || claim.lane !== 'delivery' || claim.status !== 'running' ||
            claim.work.projectId !== store.project.id || claim.work.kind !== (reconciliation?'reconciliation':'delivery') || claim.work.id !== (reconciliation?.id||job.id) || claim.stage !== (reconciliation?.action||job.stage) ||
            reconciliation&&(store.project.id!=='brain'||!(state.phase==='technical-review'&&reconciliation.action==='reconcile-review'||reconciliation.action==='reconcile-activation'&&(state.phase==='activation'||!!state.sourceConfig?.reservation&&['repair','technical-review'].includes(state.phase)))||reconciliation.key!==job.key||!reconciliation.head||reconciliation.status!=='working'||reconciliation.lane!=='delivery'||digest(reconciliation)!==expectedReconciliation||store.state.coordination?.requests?.filter(r=>r.id===reconciliation.id).length!==1||!store.state.coordination.requests.some(r=>r===reconciliation)) ||
            !isDeepStrictEqual(currentAssignment()?.claim, claim) || !store.activeClaims().some(active => isDeepStrictEqual(active, claim)) ||
            this.jobs.find(current => current.id === job.id) !== job || digest(identity()) !== expected || job.pr || job.existingPR || job.mergeAttempt || job.mergeIntentId ||
            !visibility.complete || !visibility.fresh || visibility.ownership.status !== 'clear' || continuationScope(store, job).scopeSha256 !== state.scopeSha256 ||
            job.boardUpdates?.some(update => update.status !== 'verified') || !isDeepStrictEqual(artifact(store, proofFile.path), proofFile) ||
            !isDeepStrictEqual(continuationWorktree(job.worktree),proof.worktreeIdentity)) throw new Error('Continuation scope, ownership, pause or admitted claim changed');
        if(state.sourceConfig){
            const config=state.sourceConfig;assertSourceConfiguration(store,job);
            if(config.maxAttempts!==2||!Number.isSafeInteger(config.attempts)||config.attempts<0||config.attempts>2||!Number.isFinite(Date.parse(config.retryAt))||artifact(store,config.proofPath).sha256!==config.proofSha256||config.history?.some(file=>artifact(store,file.path).sha256!==file.sha256))throw new Error('Source configuration proof changed');
            if(!reconciliation&&state.phase==='activation'&&(!config.proposal||config.reviewedSha256!==digest(config.proposal)||config.proposalSha256!==config.reviewedSha256||store.clock.now().getTime()<Date.parse(config.retryAt)))throw new Error('Reviewed source configuration or native retry time required');
        }
        assertContinuationWorker(store, proof.original); assertContinuationWorker(store, proof.reader);
        if (proof.historyFiles.some((file: ReturnType<typeof artifact>) => !isDeepStrictEqual(artifact(store, file.path), file))) throw new Error('Original discovery evidence changed');
        const effects = store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[];
        if (effects.some(row => JSON.parse(row.body).status !== 'verified')) throw new Error('Continuation effects require reconciliation');
    };
    const candidate = async (result?: StageResult) => {
        const head = result?.commit || job.head;
        if (result && (result.worktree !== job.worktree || result.branch !== job.branch || result.prId !== 0)) throw new Error('Continuation changed the owned candidate');
        await this.engine.maintenance.verifyCandidate({ issue: Number(job.key.slice(3)), worktree: job.worktree, branch: job.branch, head, summary: 'Continuation fence' });
        await new GitOperations(store, this.execute).candidate(job.worktree, head);
        await this.execute('git', ['merge-base', '--is-ancestor', job.head, head], { cwd: job.worktree, readOnly: true });
        let implementationChanged = false;
        if (state.phase === 'activation' && result) {
            const changedCode = await this.execute('git', ['diff', job.head, head, '--', '*.ts', '*.tsx', '*.js', '*.jsx', '*.mjs', '*.cjs', '*.py', '*.sh'], { cwd: job.worktree, readOnly: true });
            implementationChanged = !!changedCode.trim();
        }
        if(state.sourceConfig&&state.phase==='activation'&&!reconciliation){
            const config=state.sourceConfig,run=JSON.parse(readFileSync(resolve(job.worktree,'.state/official-runs.json'),'utf8'))[config.sourceId];
            if(!result&&(!run||!Number.isFinite(Date.parse(run.nextAttemptAt))||Date.parse(run.nextAttemptAt)<Date.parse(config.retryAt)||Date.parse(run.nextAttemptAt)>store.clock.now().getTime()))throw new Error('Current native source backoff must remain intact and expire before activation');
            if(result&&result.outcome==='passed'){
                const old=JSON.parse(await this.execute('git',['show',`${job.head}:official/sources.json`],{cwd:job.worktree,readOnly:true})),current=JSON.parse(readFileSync(resolve(job.worktree,'official/sources.json'),'utf8'));
                if(!Array.isArray(old.sources)||!Array.isArray(current.sources)||current.sources.filter((entry:any)=>entry.id===config.sourceId).length!==1||!isDeepStrictEqual(current.sources.find((entry:any)=>entry.id===config.sourceId),config.proposal!.entry)||!isDeepStrictEqual({...current,sources:current.sources.filter((entry:any)=>entry.id!==config.sourceId)},{...old,sources:old.sources.filter((entry:any)=>entry.id!==config.sourceId)})||run?.failures!==0||!run.lastSuccess||Date.parse(run.lastSuccess)<Date.parse(config.retryAt))throw new Error('Successful activation requires exactly the reviewed registry entry and actual later native success; unrelated sources remain unchanged');
            }
        }
        const prs = JSON.parse(await this.execute('gh', ['pr', 'list', '--repo', store.project.repository, '--head', job.branch, '--state', 'all', '--json', 'number'], { cwd: store.project.repo, readOnly: true }));
        const remote = (await this.execute('git', ['ls-remote', '--heads', 'origin', `refs/heads/${job.branch}`], { cwd: job.worktree, readOnly: true })).trim();
        if (!Array.isArray(prs) || prs.length || remote) throw new Error('Continuation candidate is published or publication is unknown');
        if (parseBrainStatus(JSON.parse(await this.execute('node', ['scripts/nightly.mjs', 'status'], { cwd: store.project.repo, readOnly: true }))).active) throw new Error('Native Brain claim is active');
        for (const [args, expectedValue] of [[['rev-parse', 'HEAD'], head], [['branch', '--show-current'], job.branch], [['status', '--porcelain=v1', '--untracked-files=all'], '']] as [string[], string][]) {
            if ((await this.execute('git', args, { cwd: job.worktree, readOnly: true })).trim() !== expectedValue) throw new Error('Continuation exact head, branch or clean worktree changed');
        }
        return implementationChanged;
    };
    await bridge.refresh();
    const providerBefore = await readValidationProviderContext(this, job.key);
    await candidate(); assertCurrent();
    return { notes: scope.notes, assertCurrent, reserveSourceConfiguration: () => {
        assertCurrent();
        const config=state.sourceConfig;
        if(reconciliation||!config||!['repair','technical-review'].includes(state.phase)||config.reservation||config.attemptOpen||state.phase==='repair'&&config.attempts>=config.maxAttempts||store.state.workLog?.some(work=>work.claimId===claim!.id))throw new Error('Fresh guarded offline source reservation required');
        const reservation={claimId:claim!.id,phase:state.phase as 'repair'|'technical-review',head:job.head,stage:job.stage,at:store.clock.now().toISOString(),priorAttempts:config.attempts,proposalSha256:config.proposalSha256||'',providerVersion:validationProviderVersion(providerBefore)};
        if(config.readRetry?.nextAt&&(Date.parse(config.readRetry.nextAt)>store.clock.now().getTime()||config.readRetry.exhausted||config.readRetry.attempts>=3))throw new Error('Confirmed read-only retry is not eligible');
        store.transaction(()=>{
            assertCurrent();
            if(state.phase==='repair')config.attempts++;
            config.attemptOpen=true;config.reservation=reservation;
            if(config.readRetry?.nextAt){
                config.readRetry.attempts++;config.readRetry.nextAt='';
            }
            expected=digest(identity());store.save();
        });
        return structuredClone(reservation);
    }, verify: async (result: StageResult) => {
        await bridge.refresh();
        const providerAfter = await readValidationProviderContext(this, job.key);
        if (validationProviderVersion(providerBefore) !== validationProviderVersion(providerAfter)) throw new Error('Continuation issue/comments/holds/board changed');
        const implementationChanged = await candidate(result); assertCurrent();
        return implementationChanged;
    } };
}
