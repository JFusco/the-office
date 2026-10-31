import {savedActivationFailure,sourceConfigurationRecoveryTarget} from './activation-recovery';
import {savedCandidateAdmission,savedAdmissionUnresolved} from './saved-candidate-admission';
import {scopeRepairResumeCandidate} from './scope-repair-resume';
import {artifact} from './readback-evidence';
import {repeatConflictRepairAdmission,repeatConflictRepairUnresolved} from './conflict-chain';
import {conflictOnlyAssessment} from './conflict-repair';
import {brainAuditRetryFingerprint} from './brain-audit-reuse';
import {closeoutRecoveryCandidate} from './closeout-recovery-evidence';
import {partialLocalCleanupCandidate,partialLocalCleanupKey} from './local-worktree-removal';
import {completedConflictDraftCandidate,completedConflictDraftUnresolved,postConflictPreparationEvidence} from './post-conflict-preparation';
import {publishedDraftConflictCandidate,publishedDraftConflictUnresolved} from './published-draft-conflict';
import {postConflictReadbackCandidate,preparationReadbackCandidate} from './preparation-readback';
import { validationReadbackCandidate } from './validation-readback';
import { implementationRecoveryCandidate } from './implementation-recovery';
import { nativeDeliveryReadbackCandidate } from './brain-delivery-readback';
import { uncertainConversations, conversationReadbackReady, queueConversationReadback } from './conversation-recovery';
import type { TeamMessage } from '../src/shared';
import { enqueueRequest } from './requests';
import { HOLDS } from './config';
import type { Offices } from './offices';
import type { ServiceHealthChecks } from './service-health';
import type { ITFollowUp, ITReport, ITState, Role } from '../src/shared';
import { temporaryReadFailure, reconcileReadRetries } from './read-retries';
import { GitHubDelivery } from './github-delivery';
const team: Role[] = ['pm', 'developer', 'lead', 'qa'];
const delays = [30000, 120000, 300000];
// Separate operational capacity: no model, source edits, login changes or writes
// to providers. Only existing read-back and read-only retry contracts are used.
export class ITSpecialist {
    running = false;
    nextAt = 0;
    constructor(private offices: Offices, private health: ServiceHealthChecks) { }
    async tick(now = new Date(), force = false) {
        if (this.running || !force && now.getTime() < this.nextAt)
            return;
        this.running = true;
        if (!force || this.nextAt <= now.getTime())
            this.nextAt = now.getTime() + 60000;
        try {
            const entries = [...this.offices.entries.values()];
            const health = await this.health.report(entries.map(e => e.store.state));
            for (const { store, engine, coordinator } of entries) {
                const state = store.state, it: ITState = state.it ??= { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], recoveries: {}, services: [] };
                const actions: string[] = [], followUps: ITFollowUp[] = [];
                const retainedCloseouts = new Set((state.coordination?.jobs || []).filter(job => {
                    const key = partialLocalCleanupKey(job), recovery = key ? it.recoveries[key] : undefined;
                    return !['completed', 'cancelled'].includes(job.status) && recovery && (recovery.attempts > 0 || recovery.requestId);
                }).map(job => `closeout:${job.id}`));
                const retainedPartials = (state.coordination?.jobs || []).flatMap(job => {
                    const key=partialLocalCleanupKey(job), recovery=key?it.recoveries[key]:undefined;
                    return !['completed','cancelled'].includes(job.status)&&key&&recovery&&(recovery.attempts>0||recovery.requestId)?[{job,key,recovery}]:[];
                });
                const current = new Set<string>([...retainedCloseouts,...retainedPartials.map(value=>value.key)]); // Eligibility loss is not resolution.
                const activationBudget=(id:string)=>{
                    const match=/^(activation-readback|source-config-readback):([^:]+):([^:]+)$/.exec(id);
                    if(!match||store.project.id!=='brain'||state.project?.id!==store.project.id)return;
                    const jobs=state.coordination?.jobs?.filter(job=>job.id===match[2])||[];if(jobs.length!==1)return;
                    const job=jobs[0],source=match[1]==='source-config-readback',reservation=job.implementationContinuation?.sourceConfig?.reservation;
                    const originals=(state.workLog||[]).filter(work=>work.id===match[3]&&work.requestId===job.id&&work.ticket===job.key&&work.lane==='delivery'&&(source?work.claimId===reservation?.claimId:work.stage==='github-scope-repair'&&work.role==='developer'));
                    if(source?!(reservation&&(match[3]===reservation.claimId||originals.length===1)):originals.length!==1)return;
                    const requests=(state.coordination?.requests||[]).filter(request=>request.action==='reconcile-activation'&&request.key===job.key&&request.head===match[3]&&request.lane==='delivery');
                    const foreignPending=(state.coordination?.requests||[]).some(request=>request.action==='reconcile-activation'&&request.key===job.key&&request.head===match[3]&&request.lane!=='delivery'&&['queued','working','completed'].includes(request.status));
                    return {job,requests,pending:requests.find(request=>['queued','working'].includes(request.status)),foreignPending,source};
                };
                // Repair historical undercounts from exact original intent identities, including while paused/draining.
                for(const [id,recovery] of Object.entries(it.recoveries)){
                    const budget=activationBudget(id);if(budget)recovery.attempts=Math.max(recovery.attempts,new Set(budget.requests.map(request=>request.id)).size);
                }
                async function recover(id: string, detail: string, run: () => Promise<boolean | string | import('../src/shared').HarnessRequest | TeamMessage>, nextStep: string, owner: ITFollowUp['owner'] = 'Morgan') {
                    current.add(id);
                    const r = it.recoveries[id] ??= { attempts: 0, nextAt: '', status: 'retrying', detail };
                    r.detail = detail;
                    const auditBinding = id.startsWith('implementation-audit-binding:')||id.startsWith('saved-candidate-adoption:'), oneShot = auditBinding || id.startsWith('partial-local-cleanup:') || id.startsWith('post-conflict-draft:') || id.startsWith('initial-draft-conflict:') || id.startsWith('closeout-core:') || id.startsWith('scope-repair-resume:');
                    const originalBudget=activationBudget(id);
                    if(originalBudget)r.attempts=Math.max(r.attempts,new Set(originalBudget.requests.map(request=>request.id)).size);
                    if (r.status === 'resolved' && !oneShot && !originalBudget) {
                        r.status = 'retrying';
                        r.attempts = 0;
                        r.nextAt = '';
                    }
                    const pending = originalBudget?originalBudget.pending:r.requestId && (state.coordination?.requests?.find(request => request.id === r.requestId) || state.messages.find(message => message.id === r.requestId));
                    if (pending && ['queued', 'working'].includes(pending.status)) {
                        r.status = 'retrying';
                        followUps.push({ id, owner: 'IT', detail: `${'action' in pending ? pending.action : 'conversation-readback'} is ${pending.status}; scheduler owns execution.` });
                        return;
                    }
                    if(originalBudget?.foreignPending){
                        r.status='needs-human';followUps.push({id,owner,detail:'A conflicting non-delivery original readback intent requires inspection; no intent is adopted or repeated.'});return;
                    }
                    if(originalBudget?.requests.some(request=>request.status==='completed')){
                        r.status='needs-human';followUps.push({id,owner,detail:'The exact original readback already completed; unresolved source state requires inspection, not another counted attempt.'});return;
                    }
                    if (oneShot && (r.requestId || r.attempts > 0)) {
                        r.status = 'needs-human';
                        r.nextAt = '';
                        followUps.push({ id, owner, detail: `${nextStep} Saved binding request remains unresolved${pending && 'action' in pending ? `: ${pending.detail}` : '.'}` });
                        return;
                    }
                    if (r.attempts >= 3) {
                        r.status = 'needs-human';
                        followUps.push({ id, owner, detail: nextStep });
                        return;
                    }
                    if (r.nextAt && Date.parse(r.nextAt) > now.getTime()) {
                        followUps.push({ id, owner: 'IT', detail: `Read-only recovery ${r.attempts}/3 did not finish. Next check ${r.nextAt}.`, nextAt: r.nextAt });
                        return;
                    }
                    r.attempts++;
                    try {
                        const result = await run();
                        if (result && typeof result === 'object') {
                            r.requestId = result.id;
                            r.status = 'retrying';
                            r.nextAt = new Date(now.getTime() + delays[Math.min(r.attempts - 1, 2)]).toISOString();
                            actions.push(`${'action' in result ? result.action : 'conversation-readback'} queued for scheduler execution; verification is pending.`);
                            followUps.push({ id, owner: 'IT', detail: 'Recovery intent saved; waiting for the scheduler.', nextAt: r.nextAt });
                            return;
                        }
                        if (result) {
                            r.status = 'resolved';
                            r.nextAt = '';
                            actions.push(typeof result === 'string' ? result : `${id}: recovered and read back successfully after ${r.attempts} check${r.attempts === 1 ? '' : 's'}.`);
                            return;
                        }
                    }
                    catch { /* Original provider/session evidence stays in its source record. */ }
                    r.nextAt = new Date(now.getTime() + delays[Math.min(r.attempts - 1, 2)]).toISOString();
                    r.status = r.attempts >= 3 ? 'needs-human' : 'retrying';
                    followUps.push({ id, owner: r.status === 'needs-human' ? owner : 'IT', detail: r.status === 'needs-human' ? nextStep : `Read-only recovery ${r.attempts}/3 did not finish; retry scheduled.`, nextAt: r.status === 'needs-human' ? undefined : r.nextAt });
                }
                for (const original of uncertainConversations(store)) {
                    const id = `conversation:${original.id}`;
                    current.add(id);
                    if (!conversationReadbackReady(store, original)) {
                        followUps.push({ id, owner: 'IT', detail: state.paused || state.draining ? 'Read-back waits while this project is paused or draining.' : 'Read-back waits for confirmed original process termination.' });
                        continue;
                    }
                    await recover(id, original.error, async () => queueConversationReadback(store, original), `Morgan reads back the original conversation ${original.id}; no issue creation or other write may be retried.`, 'Morgan');
                }
                if (!state.paused) {
                    if (this.offices.sessions) {
                        let inventory = this.offices.sessions.forProject(store);
                        if (!inventory.complete || !inventory.fresh)
                            await recover('session-visibility', 'Live Codex/Claude session inventory is incomplete.', async () => { await this.offices.sessions.refresh(); inventory = this.offices.sessions.forProject(store); return inventory.complete && inventory.fresh; }, 'Morgan investigates the failed session inventory source and its saved diagnostic. Session visibility is separate from login status; delivery ownership still requires complete live evidence.');
                        if (inventory.complete && inventory.fresh) {
                            const latest = [...new Map((state.coordination?.listener.reviews || []).map(r => [r.key, r])).values()];
                            for (const r of latest) {
                                const assigned = state.coordination!.listener.assigned.find(i => i.key === r.key);
                                const pickup = state.coordination!.pickup?.status || (store.project.provider === 'github' ? 'Ready' : 'To Do');
                                if (HOLDS[r.key] || state.coordination!.pickup?.enabled === false && r.workRequested !== 'manual' || r.status !== 'blocked' || !/(?:session.*(?:visibility|inventory|read)|task.claim)/i.test(r.detail) || !/(?:unavailable|incomplete|missing|restore|not available|lacks)/i.test(r.detail) || !assigned || (assigned.pickupStatus ?? assigned.status) !== pickup || state.coordination!.jobs?.some(j => j.key === r.key && !['cancelled', 'completed'].includes(j.status)))
                                    continue;
                                if ((r.itRecoveryAttempts || 0) >= 3) {
                                    followUps.push({ id: `ownership:${r.id}`, owner: 'Morgan', detail: `${r.key}: three IT ownership read-backs did not resolve the failure. Inspect the exact failed bridge source and saved intake sessions before another attempt.` });
                                    continue;
                                }
                                r.itRecoveryAttempts = (r.itRecoveryAttempts || 0) + 1;
                                r.retry ??= { attempts: 0, nextAt: '', history: [], exhausted: false };
                                r.retry.history.push({ at: now.toISOString(), detail: r.detail });
                                r.retry.nextAt = '';
                                r.status = 'queued';
                                r.queuedAt = now.toISOString();
                                r.detail = `Ellis verified current complete session visibility. Read-only ownership intake queued (${r.itRecoveryAttempts}/3); prior failure retained. Development still requires Morgan’s verified intake.`;
                                actions.push(`${r.key}: complete live session visibility verified; ownership intake requeued for Morgan (${r.itRecoveryAttempts}/3). No development or provider write replayed.`);
                            }
                        }
                    }
                    const before = new Set((state.coordination?.jobs || []).filter(j => j.status === 'queued').map(j => j.id));
                    reconcileReadRetries(store, now);
                    for (const job of state.coordination?.jobs || [])
                        if (job.status === 'queued' && !before.has(job.id))
                            actions.push(`${job.key}: safe read-only review retry queued; completion awaits the team.`);
                    if (coordinator && state.coordination?.listener.error) {
                        const detail = state.coordination.listener.error;
                        if (temporaryReadFailure(detail))
                            await recover('assignment-listener', detail, async () => { return enqueueRequest(store, 'poll'); }, `Morgan investigates ${store.project.name}'s saved listener read failure and provider resource access. A timeout alone does not require a login change.`);
                        else
                            followUps.push({ id: 'assignment-listener', owner: 'Morgan', detail: `Assignment listening requires a read-back of its saved failure: ${detail}` });
                    }
                    const source = store.project.provider === 'github' ? state.github : state.azure;
                    if (source?.error) {
                        if (temporaryReadFailure(source.error))
                            await recover('project-progress', source.error, async () => { return enqueueRequest(store, 'refresh'); }, `Morgan investigates the saved ${store.project.provider} read diagnostic and resource access. Preserve the last verified project view; a timeout alone does not require a login change.`);
                        else
                            followUps.push({ id: 'project-progress', owner: 'Morgan', detail: `Project refresh is blocked. Read the saved ${store.project.provider} error and check its resource permissions before retrying.` });
                    }
                    for(const job of state.coordination?.jobs||[]){
                        const admission=savedCandidateAdmission(store,job);
                        if(admission)await recover(admission.id,job.detail,async()=>enqueueRequest(store,admission.action,admission.key,admission.head),admission.detail,'Morgan');
                    }
                    for (const job of state.coordination?.jobs || []) {
                        const qa = !state.draining && validationReadbackCandidate(store, job);
                        if (qa) await recover(`validation:${job.id}:${qa.work.id}`, job.detail, async () => enqueueRequest(store, 'reconcile-validation', job.key, qa.work.id),
                            `Riley independently reads the complete original QA execution for ${job.key}; no checks or writes are replayed.`, 'Morgan');
                        const original = implementationRecoveryCandidate(store, job);
                        if (original) {
                            const auditFingerprint=brainAuditRetryFingerprint(store,job,original.work.id);
                            if(auditFingerprint) {
                                current.add(`implementation:${job.id}`); // Preserve the original recovery counts and failure evidence.
                                await recover(`implementation-audit-binding:${job.id}:${auditFingerprint}`, job.detail,
                                    async()=>enqueueRequest(store,'reconcile-implementation',job.key,original.work.id),
                                    `Reuse the unchanged completed native audit for ${job.key}; changed scope or incomplete binding requires repair, never another identical full audit.`, 'Morgan');
                            } else await recover(`implementation:${job.id}`, job.detail, async () => enqueueRequest(store, 'reconcile-implementation', job.key, original.work.id),
                                `Sam reads the saved implementation and native session for ${job.key}. No writer may repeat uncertain effects; source holds remain in force.`, 'Morgan');
                        }
                    }
                    for (const job of state.coordination?.jobs || [])
                        if (nativeDeliveryReadbackCandidate(store, job))
                            await recover(`native-delivery:${job.id}`, job.detail, async () => enqueueRequest(store, 'reconcile-native-delivery', job.key),
                                `Morgan reads the native publication, exact merged PR, Actions and Done card for ${job.key}. Original jobs stay stopped until that evidence agrees.`, 'Morgan');
                    // This queues original readback, never a writer or source retry.
                    if(!state.draining)for(const job of state.coordination?.jobs||[]){
                        const pending=sourceConfigurationRecoveryTarget(store,job);
                        if(pending)await recover(`source-config-readback:${job.id}:${pending}`,job.detail,async()=>enqueueRequest(store,'reconcile-activation',job.key,pending),'Morgan reconciles the exact offline reservation/worker; unknown effects remain stopped and source/native budgets stay intact.','Morgan');
                        const original=(state.workLog||[]).filter(work=>work.requestId===job.id&&work.stage==='github-scope-repair').at(-1);
                        if(original&&savedActivationFailure(store,job,original.id))await recover(`activation-readback:${job.id}:${original.id}`,job.detail,async()=>enqueueRequest(store,'reconcile-activation',job.key,original.id),'Morgan reconciles the exact failed activation; source findings and native backoff remain intact.','Morgan');
                    }
                    // Successful metadata work can hand off to Lead without repeating writes.
                    for (const job of state.coordination?.jobs || []) {
                        const stoppedCloseout = state.draining ? undefined : closeoutRecoveryCandidate(store,job), pendingCleanup = !state.draining && job.closeoutRecovery?.status === 'cleanup-pending' ? job.closeoutRecovery.originalWorkId : '';
                        if (job.stage === 'closeout' && ['blocked', 'interrupted'].includes(job.status) && (stoppedCloseout || pendingCleanup || job.steps.filter(s => s.stage === 'closeout').at(-1)?.result.outcome === 'passed') && !engine.busy && !engine.agents.active.size) {
                            const partial=partialLocalCleanupCandidate(store,job);
                            if(stoppedCloseout&&'kind'in stoppedCloseout&&stoppedCloseout.kind==='core-passed'){
                                current.add(`closeout:${job.id}`); // Preserve the prior consumed budget; this material proof has its own single readback.
                                const key=`closeout-core:${job.id}:${stoppedCloseout.work.id}:${stoppedCloseout.checkpointSha256}`;
                                if(it.recoveries[key]){current.add(key);const existing=it.recoveries[key],pending=state.coordination?.requests?.find(r=>r.id===existing.requestId&&['queued','working'].includes(r.status));existing.status=pending?'retrying':'needs-human';}
                                else await recover(key,job.detail,async()=>enqueueRequest(store,'reconcile-closeout',job.key,stoppedCloseout.work.id),'Morgan verifies the original completed core closeout and exact checkpoint before any new cleanup effect; no closeout writes are replayed.','Morgan');
                            } else if(partial){
                                current.add(`closeout:${job.id}`); // Keep the original exhausted three attempts and their evidence.
                                await recover(partial.key,job.detail,async()=>enqueueRequest(store,'reconcile-closeout',job.key,partial.originalWorkId),`Morgan reconciles the same local cleanup effect for ${job.key}; the scheduler must prove the strict partial inventory before its single continuation.`, 'Morgan');
                            } else if(!retainedCloseouts.has(`closeout:${job.id}`)) await recover(`closeout:${job.id}`, job.detail, async () => { return enqueueRequest(store, 'reconcile-closeout', job.key, stoppedCloseout?.work.id || pendingCleanup); }, `Morgan reconciles ${job.key}'s original closeout effects; unresolved writes remain stopped.`, 'Morgan');
                        }
                        if (state.draining) continue;
                        if(state.coordination?.enabled&&!state.paused&&!HOLDS[job.key]&&!job.scopeRepairResumes?.length){
                            const resume=scopeRepairResumeCandidate(store,job);
                            if(resume){
                                const key=`scope-repair-resume:${store.project.id}:${job.id}:${job.candidateRecovery!.head}:${job.scopeRepairReadback?.proofSha256||'no-prior-readback'}`;
                                if(it.recoveries[key]){current.add(key);const existing=it.recoveries[key],pending=state.coordination.requests?.find(r=>r.id===existing.requestId&&['queued','working'].includes(r.status));existing.status=pending?'retrying':'needs-human';continue;}
                                await recover(key,job.detail,async()=>enqueueRequest(store,'reconcile-scope-repair',job.key,resume.work.id),'Morgan verifies the exact stopped source repair on the same candidate; this single automatic readback never resets repair or source-acceptance budgets.','Morgan');continue;
                            }
                        }
                        const initialDraft=publishedDraftConflictCandidate(store,job);
                        if(initialDraft){await recover(initialDraft.id,job.detail,async()=>enqueueRequest(store,'reconcile-preparation',job.key,initialDraft.work.id),'Morgan verifies the original completed initial draft and current provider conflicts; the scheduler integrates the same PR without replaying publication or accepting sources.','Morgan');continue;}
                        const completedDraft=completedConflictDraftCandidate(store,job);
                        if(completedDraft){await recover(completedDraft.id,job.detail,async()=>enqueueRequest(store,'reconcile-preparation',job.key,completedDraft.work.id),'Morgan verifies the exact completed conflict publication and current ready PR without repeating its model or mutation operations.','Morgan');continue;}
                        const postConflict=postConflictReadbackCandidate(store,job),preparation = postConflict||preparationReadbackCandidate(store,job);
                        if (!preparation && (job.stage !== 'prepare-pr' || job.status !== 'blocked' || job.steps.at(-1)?.result.outcome !== 'passed' || (()=>{try{return postConflictPreparationEvidence(store,job);}catch{return undefined;}})()))
                            continue;
                        await recover(postConflict?`post-conflict-preparation:${job.id}:${postConflict.work.id}`:`pr-preparation:${job.id}`, job.detail, async () => { return enqueueRequest(store, 'reconcile-preparation', job.key, preparation?.work.id || ''); }, `Morgan must inspect ${job.key}'s saved PR preparation and current PR #${job.pr}. Uncertain effects or changed heads need read-back; no metadata write has been repeated.`, 'Morgan');
                    }
                    for(const job of state.coordination?.jobs||[]){
                        const repeat=repeatConflictRepairAdmission(store,job,conflictOnlyAssessment);
                        if(repeat)await recover(repeat.id,job.detail,async()=>enqueueRequest(store,'repair-pr-conflicts',job.key,repeat.head),'Morgan verifies the original completed conflict-only assessment and retained native source approval chain; the scheduler rechecks current provider and ownership before repairing the same PR.','Morgan');
                    }
                    for (const job of state.coordination?.jobs || []) {
                        if (job.stage !== 'lead-pr' || !['blocked', 'interrupted'].includes(job.status) || !job.detail.includes('before reducing review or verification'))
                            continue;
                        await recover(`pr-review-readback:${job.id}`, job.detail, async () => { return enqueueRequest(store, 'reconcile-review', job.key); }, `Morgan must inspect ${job.key}’s saved review and current PR metadata before any fresh read-only review. No merge or original effect was repeated.`, 'Morgan');
                    }
                    for (const checkpoint of state.coordination?.checkpoints || []) {
                        const original = state.maintenance?.runs.find(r => r.id === checkpoint.runId);
                        if (!coordinator || !['blocked', 'interrupted'].includes(checkpoint.status) || store.project.id !== 'brain' || original?.status !== 'reconciled')
                            continue;
                        if (original.blockerFollowup) {
                            const f = original.blockerFollowup;
                            if (['blocked', 'interrupted'].includes(f.status))
                                followUps.push({ id: `maintenance-blocker:${original.id}`, owner: 'Morgan', detail: f.detail });
                            // Source repair intake owns the next action. Do not repeatedly attempt
                            // the exhausted nightly gate or label this a login/approval problem.
                            continue;
                        }
                        const old = it.recoveries[`checkpoint:${checkpoint.id}`];
                        if (!old || old.attempts < 3 || old.status !== 'needs-human')
                            await recover(`checkpoint:${checkpoint.id}`, checkpoint.detail, async () => enqueueRequest(store, 'retry-checkpoint', checkpoint.id),
                                'Morgan must inspect Brain nightly status: active work, completed dates and the daily retry limit cannot be bypassed.', 'Morgan');
                        else {
                            // The pure read-back route cannot claim or retry native maintenance after the old retry budget is exhausted.
                            current.add(`checkpoint:${checkpoint.id}`);
                            await recover(`checkpoint-readback:${checkpoint.id}`, checkpoint.detail, async () => enqueueRequest(store, 'reconcile-native-checkpoint', checkpoint.id),
                                'Morgan must inspect the existing native completion. Missing evidence keeps this checkpoint stopped; no nightly retry is permitted through this read-back.', 'Morgan');
                        }
                    }
                }
                const services = health.services.filter(s => !s.id.startsWith('listener:') || s.id === `listener:${store.project.id}`);
                for (const service of services) {
                    if (service.status === 'disconnected')
                        followUps.push({ id: `login:${service.id}`, owner: 'You', detail: service.nextStep || `Restore ${service.name} access in the Office service account.` });
                    // Unknown is evidence of an incomplete probe, never proof of logout.
                    if (service.status === 'unknown' && !['slack'].includes(service.id) && !service.id.startsWith('listener:'))
                        await recover(`probe:${service.id}`, service.detail, async () => false, `Morgan investigates ${service.name}'s incomplete status check in the Office environment. No logout is established; do not change credentials without an authentication failure.`);
                }
                for(const {job,key,recovery} of retainedPartials){
                    const pending=state.coordination?.requests?.find(request=>request.id===recovery.requestId&&request.action==='reconcile-closeout'&&request.key===job.key&&request.head===job.closeoutRecovery?.originalWorkId&&['queued','working'].includes(request.status))
                        ||state.coordination?.requests?.find(request=>request.id===job.closeoutRecovery?.cleanupRequestId&&request.action==='cleanup-merged-candidate'&&['queued','working'].includes(request.status));
                    recovery.status=pending?'retrying':'needs-human';if(!pending)recovery.nextAt='';
                    if(!followUps.some(f=>f.id===key||f.id===`closeout:${job.id}`))followUps.push({id:`closeout:${job.id}`,owner:pending?'IT':'Morgan',detail:pending?'The same partial cleanup readback is queued or working; scheduler owns execution.':'The single partial local cleanup continuation was used; the same cleanup effect stays uncertain until Morgan reviews it.'});
                }
                for (const [id, r] of Object.entries(it.recoveries)) {
                    if(current.has(id))continue;
                        const budget=activationBudget(id),config=budget?.job.implementationContinuation?.sourceConfig;
                        const unresolvedActivation=budget&&!['completed','cancelled'].includes(budget.job.status)&&(!!budget.pending||(budget.source?!!config?.attemptOpen||!!config?.reservation:budget.job.stage==='scope-repair'&&budget.job.implementationContinuation?.phase==='activation'&&(state.workLog||[]).filter(work=>work.requestId===budget.job.id&&work.stage==='github-scope-repair').at(-1)?.id===id.split(':')[2]));
                        if(unresolvedActivation){
                            r.status=budget.pending||r.attempts<3?'retrying':'needs-human';
                            current.add(id);followUps.push({id,owner:r.status==='needs-human'?'Morgan':'IT',detail:state.paused||state.draining?'Original readback waits for project controls; its consumed budget and queued intent remain unchanged.':budget.pending?'The exact original readback is queued or working; scheduler owns execution.':'The original activation/source-configuration readback remains unresolved; its consumed budget is retained.',nextAt:r.nextAt||undefined});continue;
                        }
                        if(r.status==='resolved')continue;
                        const checkpointId = id.startsWith('checkpoint-readback:') ? id.slice(20) : id.startsWith('checkpoint:') ? id.slice(11) : null;
                        const unresolvedCheckpoint = checkpointId !== null && state.coordination?.checkpoints.find(checkpoint => checkpoint.id === checkpointId)?.status !== 'completed';
                        const unresolvedDelivery = id.startsWith('native-delivery:') && state.coordination?.jobs?.find(job => job.id === id.slice(16))?.status !== 'completed';
                        const unresolvedImplementation = (id.startsWith('implementation:') || id.startsWith('implementation-audit-binding:')) && state.coordination?.jobs?.some(job => job.id === id.split(':')[1] && job.stage === 'implement' && ['blocked', 'interrupted'].includes(job.status));
                        const unresolvedValidation = id.startsWith('validation:') && state.coordination?.jobs?.some(job => job.id === id.split(':')[1] && job.stage === 'validate' && ['blocked', 'interrupted'].includes(job.status));
                        const unresolvedPreparation = (id.startsWith('pr-preparation:') || id.startsWith('post-conflict-preparation:')) && state.coordination?.jobs?.some(job => job.id === id.split(':')[1] && job.stage === 'prepare-pr' && ['blocked', 'interrupted'].includes(job.status));
                        const unresolvedCore=id.startsWith('closeout-core:')&&state.coordination?.jobs?.some(job=>job.id===id.split(':')[1]&&job.stage==='closeout'&&!['completed','cancelled'].includes(job.status));
                        const resumeJob=id.startsWith('scope-repair-resume:')?state.coordination?.jobs?.find(job=>job.id===id.split(':')[2]):undefined;
                        const resumeRequest=resumeJob&&state.coordination?.requests?.find(request=>request.id===r.requestId&&request.action==='reconcile-scope-repair'&&request.key===resumeJob.key);
                        const resumeApplied=!!resumeJob?.scopeRepairResumes?.some(proof=>{try{return proof.intentId===resumeRequest?.id&&proof.originalWorkId===resumeRequest.head&&artifact(store,proof.proofPath).sha256===proof.proofSha256;}catch{return false;}});
                        const unresolvedResume=resumeJob&&!['completed','cancelled'].includes(resumeJob.status)&&!resumeApplied;
                        if (unresolvedCheckpoint || unresolvedDelivery || unresolvedImplementation || unresolvedValidation || unresolvedPreparation || unresolvedCore || unresolvedResume || savedAdmissionUnresolved(store,id) || repeatConflictRepairUnresolved(store,id) || completedConflictDraftUnresolved(store,id) || publishedDraftConflictUnresolved(store,id)) {
                            current.add(id);
                            followUps.push({ id, owner: 'IT', detail: state.paused ? 'Recovery waits while this project is paused; the source record remains unresolved.' : 'Recovery waits for the original source record to complete.', nextAt: r.nextAt || undefined });
                            continue;
                        }
                        r.status = 'resolved';
                        r.nextAt = '';
                        actions.push(`${id}: current read-back confirms the reported failure cleared.`);
                    }
                const status = followUps.some(f => f.owner === 'You' || f.owner === 'Morgan') ? 'needs-attention' : followUps.length ? 'retrying' : 'monitoring';
                const fingerprint = JSON.stringify({ status, followUps: followUps.map(f => ({ id: f.id, owner: f.owner, detail: f.detail, nextAt: f.nextAt })), actions });
                const previous = it.reports.at(-1);
                // Quiet while unchanged. Operational reports stay with delivery; Avery reads
                // them on demand or through the daily review, and receives goal-specific PM updates.
                const changed = !previous || previous.status !== status || JSON.stringify(previous.followUps) !== JSON.stringify(followUps);
                if (actions.length || changed) {
                    const summary = actions.length ? `Ellis completed ${actions.length} operational recovery check${actions.length === 1 ? '' : 's'} for ${store.project.name}. ${followUps.length ? `${followUps.length} follow-up${followUps.length === 1 ? '' : 's'} remain.` : 'No operational follow-up remains.'}` : followUps.length ? `Ellis checked ${store.project.name}. ${followUps.length} operational follow-up${followUps.length === 1 ? '' : 's'} remain.` : `Ellis checked ${store.project.name}; monitored connections are available.`;
                    const report: ITReport = { id: crypto.randomUUID(), at: now.toISOString(), status, summary, actions, followUps, notified: team, fingerprint };
                    it.reports.push(report);
                    store.emit('it-report', `${summary} Report shared with Morgan, Alex, Sam and Riley.`, 'pm');
                }
                it.checkedAt = now.toISOString();
                it.nextCheckAt = new Date(this.nextAt).toISOString();
                it.status = status;
                it.services = services;
                store.save();
            }
        }
        finally {
            this.running = false;
        }
    }
}
