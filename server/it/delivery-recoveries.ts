import {savedActivationFailure,sourceConfigurationRecoveryTarget} from '../delivery/recovery/implementation/activation-recovery';
import { savedCandidateAdmission } from '../delivery/recovery/implementation/saved-candidate-admission';
import {scopeRepairResumeCandidate} from '../delivery/recovery/scope-repair/scope-repair-resume';
import { repeatConflictRepairAdmission } from '../delivery/repairs/conflict-chain';
import {conflictOnlyAssessment} from '../delivery/repairs/conflict-repair';
import {brainAuditRetryFingerprint} from '../maintenance/brain/brain-audit-reuse';
import {closeoutRecoveryCandidate} from '../delivery/recovery/closeout/closeout-recovery-evidence';
import { partialLocalCleanupCandidate } from '../delivery/recovery/closeout/local-worktree-removal';
import { completedConflictDraftCandidate, postConflictPreparationEvidence } from '../delivery/recovery/preparation/post-conflict-preparation';
import { publishedDraftConflictCandidate } from '../delivery/recovery/preparation/published-draft-conflict';
import {postConflictReadbackCandidate,preparationReadbackCandidate} from '../delivery/recovery/preparation/preparation-readback';
import { validationReadbackCandidate } from '../delivery/recovery/validation/validation-readback';
import { implementationRecoveryCandidate } from '../delivery/recovery/implementation/implementation-recovery';
import { nativeDeliveryReadbackCandidate } from '../maintenance/brain/brain-delivery-readback';
import { enqueueRequest } from '../scheduling/requests';
import { HOLDS } from '../office/config';
import { temporaryReadFailure, reconcileReadRetries } from '../scheduling/read-retries';
import type { ITContext } from './context';

/** Read-only recoveries for delivery, intake, provider and checkpoint failures of an unpaused project. */
export async function runDeliveryRecoveries(context: ITContext): Promise<void> {
    const { offices, store, engine, coordinator, state, it, actions, followUps, current, now, health, nextAt, retainedPartials, retainedCloseouts, services, activationBudget, recover } = context;
    if (!state.paused) {
        if (offices.sessions) {
            let inventory = offices.sessions.forProject(store);
            if (!inventory.complete || !inventory.fresh)
                await recover('session-visibility', 'Live Codex/Claude session inventory is incomplete.', async () => { await offices.sessions.refresh(); inventory = offices.sessions.forProject(store); return inventory.complete && inventory.fresh; }, 'Morgan investigates the failed session inventory source and its saved diagnostic. Session visibility is separate from login status; delivery ownership still requires complete live evidence.');
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
}
