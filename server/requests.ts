import {hasSavedPrerequisiteResult,handoffSavedPrerequisites} from './saved-prerequisite-handoff';
import {publishedDraftConflictCandidate,reconcilePublishedDraftConflict} from './published-draft-conflict';
import {completedConflictDraftCandidate,reconcileCompletedConflictDraft} from './post-conflict-preparation';
import {reconcileActivation} from './activation-recovery';
import {reconcileScopeRepairReadback} from './scope-repair-readback';
import {reconcileOriginalCloseout} from './closeout-recovery';
import {cleanupMergedCandidate,resumeCloseoutCleanup} from './merged-candidate-cleanup';
import {postConflictReadbackCandidate,preparationReadbackCandidate,reconcilePreparationReadback} from './preparation-readback';
import { reconcileValidation } from './validation-readback';
import { correctRecoveryClassification } from './time-classification';
import { closeNativeRefresh } from './brain-refresh-closeout';
import { adoptCandidate } from './candidate-adoption';
import { recoverDiscovery } from './discovery-recovery';
import { recoverImplementation } from './implementation-recovery';
import { authorizeSourceAmendment, validateAmendmentIntent } from './source-amendment';
import { observePrerequisites } from './dependencies';
import type { HarnessRequest } from '../src/shared';
import {CloseoutSupervisionProofRef,readCloseoutSupervisionProof} from './closeout-supervision-proof';
import {isDeepStrictEqual} from 'node:util';
import type { Store } from './store';
import type { Engine } from './engine';
import type { Coordinator } from './coordination';
import { GitHubDelivery } from './github-delivery';
import { TimeLedger } from './time-ledger';
const actions = new Set(['reconcile-activation', 'repair-pr-conflicts', 'reconcile-scope-repair', 'cleanup-merged-candidate', 'reconcile-validation', 'resume-discovery', 'correct-recovery-time', 'reconcile-implementation', 'refresh', 'poll', 'observe-dependencies', 'check-it', 'reconcile-time', 'retry-checkpoint', 'reconcile-maintenance', 'reconcile-preparation', 'approve-merge', 'reconcile-review', 'reconcile-base-update', 'reconcile-closeout', 'reconcile-pr-link', 'defer-non-ready', 'adopt-candidate', 'reconcile-native-refresh', 'reconcile-native-delivery', 'reconcile-native-checkpoint']);
export const deterministicActions = new Set(['correct-recovery-time', 'refresh', 'poll', 'observe-dependencies', 'reconcile-time']);
export function enqueueSourceAmendment(store: Store, input: unknown): HarnessRequest {
    const authorization = validateAmendmentIntent(store, input);
    const prior = store.state.coordination!.requests?.find(request => request.action === 'authorize-source-amendment' && ['queued', 'working', 'completed'].includes(request.status) && JSON.stringify(request.sourceAmendment) === JSON.stringify(authorization));
    if (prior) return prior;
    return store.transaction(() => {
        const request: HarnessRequest = { id: crypto.randomUUID(), action: 'authorize-source-amendment', key: 'GH-91', head: authorization.originalHead, sourceAmendment: authorization,
            lane: 'delivery', requestedAt: store.clock.now().toISOString(), status: 'queued', detail: 'Waiting for scheduler validation of bounded source repair permission.' };
        (store.state.coordination!.requests ??= []).push(request);
        store.emit('source-amendment-intent', 'Bounded GH-91 amendment intent queued; no source acceptance or adoption yet.', undefined, 'GH-91');
        return request;
    });
}
export function enqueueRequest(store: Store, action: string, key = '', head = '', lane: HarnessRequest['lane'] = 'delivery'): HarnessRequest {
    if (!actions.has(action))
        throw new Error('Unknown harness operation');
    if (deterministicActions.has(action))
        lane = 'operations';
    const requests = store.state.coordination!.requests ??= [];
    const pendingCleanup = store.state.coordination?.jobs?.some(job => job.key === key && job.closeoutRecovery?.status === 'cleanup-pending');
    const completedIsDuplicate = action === 'reconcile-implementation' && !!head && !!store.state.coordination?.jobs?.some(job=>job.key===key&&job.savedPrerequisiteHandoff?.originalWorkId===head) || action === 'reconcile-activation' || action === 'reconcile-validation' || !!head && (['reconcile-preparation','reconcile-scope-repair'].includes(action) || action === 'reconcile-closeout' && !pendingCleanup);
    const old = requests.find(request => request.action === action && request.key === key && request.head === head && (['queued', 'working'].includes(request.status) || completedIsDuplicate && request.status === 'completed'));
    if (old)
        return old;
    const request: HarnessRequest = { id: crypto.randomUUID(), action, key, head, lane, requestedAt: store.clock.now().toISOString(), status: 'queued', detail: 'Waiting for scheduler ownership.' };
    requests.push(request);
    store.emit('operation-queued', `${action} queued for the harness.`, undefined, key);
    return request;
}
/** A deliberately supplied historical proof belongs to this new exact-original read intent only. */
export function enqueueCloseoutReconciliation(store:Store,key:string,head:string,input?:unknown){
 const descriptor=input===undefined?undefined:CloseoutSupervisionProofRef.parse(input),pendingCleanup=store.state.coordination?.jobs?.some(j=>j.key===key&&j.closeoutRecovery?.status==='cleanup-pending');
 const old=store.state.coordination?.requests?.find(r=>r.action==='reconcile-closeout'&&r.key===key&&r.head===head&&(['queued','working'].includes(r.status)||!!head&&!pendingCleanup&&r.status==='completed'));
 if(old){if(!isDeepStrictEqual(old.closeoutSupervisionProof,descriptor))throw Error('Existing closeout intent has different historical supervision proof');return old;}
 if(descriptor){
  const jobs=store.state.coordination?.jobs?.filter(j=>j.key===key&&j.status!=='cancelled'),work=store.state.workLog?.find(w=>w.id===head);
  if(!head||pendingCleanup||jobs?.length!==1||!work)throw Error('Exact original closeout required for historical supervision proof');
  readCloseoutSupervisionProof(store,jobs[0],work,descriptor);
 }
 return store.transaction(()=>{const request=enqueueRequest(store,'reconcile-closeout',key,head);if(descriptor)request.closeoutSupervisionProof=descriptor;store.save();return request;});
}
export async function executeRequest(store: Store, engine: Engine, coordinator: Coordinator, request: HarnessRequest, checkIT?: () => Promise<void>): Promise<void> {
    if (request.status !== 'queued')
        return;
    request.status = 'working';
    store.save();
    try {
        const delivery = new GitHubDelivery(store, engine);
        switch (request.action) {
            case 'reconcile-activation': await reconcileActivation(delivery,request.key,request.head); break;
            case 'correct-recovery-time': correctRecoveryClassification(store, request); break;
            case 'authorize-source-amendment':
                await authorizeSourceAmendment(delivery, request, async () => {
                    await coordinator.sessionBridge?.refresh();
                    const ownership = coordinator.sessionBridge?.forProject(store, request.key, request.id);
                    if (!ownership) throw new Error('Amendment ownership inventory is unavailable');
                    return ownership as any;
                });
                break;
            case 'reconcile-native-delivery':
                await delivery.reconcileNativeDelivery(request.key);
                break;
            case 'reconcile-native-checkpoint':
                await coordinator.readBackCheckpoint(request.key);
                break;
            case 'reconcile-native-refresh':
                await closeNativeRefresh(store, engine, request.key, request.head, request.id);
                break;
            case 'resume-discovery':
            case 'reconcile-implementation':
            case 'reconcile-validation': {
                const ownership = async () => {
                    await coordinator.sessionBridge?.refresh();
                    const value = coordinator.sessionBridge?.forProject(store, request.key, request.id);
                    if (!value) throw new Error('Implementation ownership inventory is unavailable');
                    return value;
                };
                if (request.action === 'resume-discovery') await recoverDiscovery(delivery, request, ownership as any);
                else if (request.action === 'reconcile-validation') await reconcileValidation(delivery, request.key, request.head, ownership as any, request.id);
                else {
                    const saved=delivery.jobs.find(j=>j.key===request.key&&j.status!=='cancelled');
                    if(saved&&hasSavedPrerequisiteResult(store,saved,request.head))await handoffSavedPrerequisites(delivery,saved,request.head,ownership as any,request.id);
                    else await recoverImplementation(delivery, request.key, request.head, ownership as any);
                }
                break;
            }
            case 'adopt-candidate': {
                await coordinator.sessionBridge?.refresh();
                const ownership = coordinator.sessionBridge?.forProject(store, request.key, request.id);
                if (!ownership)
                    throw new Error('Candidate ownership inventory is unavailable');
                await adoptCandidate(delivery, request.key, ownership as any, async () => {
                    await coordinator.sessionBridge?.refresh();
                    const current=coordinator.sessionBridge?.forProject(store,request.key,request.id);
                    if(!current)throw new Error('Candidate ownership inventory is unavailable');
                    return current as any;
                });
                break;
            }
            case 'refresh':
                await engine.observe();
                break;
            case 'observe-dependencies':
                await observePrerequisites([...coordinator.state.listener.reviews.flatMap(review => review.prerequisites || []), ...(coordinator.state.jobs || []).flatMap(job => job.prerequisites || [])], coordinator.dependencyStores());
                break;
            case 'poll':
                await coordinator.poll();
                break;
            case 'check-it':
                await checkIT?.();
                break;
            case 'reconcile-time':
                await new TimeLedger(store).sync(request.key);
                break;
            case 'retry-checkpoint':
                await coordinator.retryCheckpoint(request.key);
                break;
            case 'reconcile-maintenance':
                await engine.reconcileMaintenance(request.key);
                break;
            case 'defer-non-ready':
                await coordinator.deferNonReady(request.key);
                break;
            case 'reconcile-scope-repair':
                await reconcileScopeRepairReadback(delivery,request.key,request.head,async()=>{
                    await coordinator.sessionBridge?.refresh();
                    const ownership=coordinator.sessionBridge?.forProject(store,request.key,request.id);
                    if(!ownership)throw new Error('Scope repair ownership inventory is unavailable');
                    return ownership as any;
                },request.id);
                break;
            case 'reconcile-preparation': {
                const job=delivery.jobs.find(job=>job.key===request.key&&job.status!=='cancelled');
                if(request.head || job && (publishedDraftConflictCandidate(store,job)||completedConflictDraftCandidate(store,job)||postConflictReadbackCandidate(store,job)||preparationReadbackCandidate(store,job))){
                    const ownership=async()=>{
                        await coordinator.sessionBridge?.refresh();
                        const value=coordinator.sessionBridge?.forProject(store,request.key,request.id);
                        if(!value)throw new Error('Preparation ownership inventory is unavailable');
                        return value;
                    };
                    // Native-checkpoint recovery requires a new exact-original intent; legacy empty-head recovery stays unchanged.
                    if(!request.head)throw new Error('An exact original preparation worker intent is required');
                    if(job?.stage==='draft'&&publishedDraftConflictCandidate(store,job))await reconcilePublishedDraftConflict(delivery,job,request.head,request.id,ownership as any);
                    else if(job?.stage==='draft')await reconcileCompletedConflictDraft(delivery,request.key,request.head,ownership as any,request.id);
                    else await reconcilePreparationReadback(delivery,request.key,request.head,ownership as any,request.id);
                }else await delivery.reconcilePreparation(request.key);
                break;
            }
            case 'approve-merge':
                await delivery.approveMerge(request.key, request.head);
                break;
            case 'reconcile-review':
                await delivery.reconcileReview(request.key,request.head);
                break;
            case 'repair-pr-conflicts': {
                const job = delivery.jobs.find(job => job.key === request.key && job.status !== 'cancelled');
                if (request.head && job?.head !== request.head) throw new Error('Conflict repair requested head changed');
                await delivery.queueConflictRepair(request.key);
                break;
            }
            case 'reconcile-base-update':
                await delivery.reconcileBaseUpdate(request.key);
                break;
            case 'cleanup-merged-candidate':
            case 'reconcile-closeout': {
                const ownership=async()=>{await coordinator.sessionBridge?.refresh();const value=coordinator.sessionBridge?.forProject(store,request.key,request.id);if(!value)throw new Error('Closeout ownership inventory unavailable');return value as any;};
                if(request.action==='cleanup-merged-candidate')await cleanupMergedCandidate(delivery,request,ownership);
                else if(request.head){if(delivery.jobs.some(j=>j.key===request.key&&j.closeoutRecovery?.status==='cleanup-pending'))await resumeCloseoutCleanup(delivery,request,ownership);else await reconcileOriginalCloseout(delivery,request.key,request.head,ownership,request.id);}
                else await delivery.reconcileCloseout(request.key);
                break;
            }
            case 'reconcile-pr-link':
                await delivery.reconcileWrongLink(request.key);
                break;
            default: throw new Error('Operation has no registered handler');
        }
        request.status = 'completed';
        request.detail = 'Harness operation finished; provider and work records contain the verified disposition.';
    }
    catch (error) {
        request = store.state.coordination!.requests?.find(current => current.id === request.id) || request;
        request.status = store.state.paused ? 'interrupted' : 'blocked';
        request.detail = String(error);
    }
    store.emit('operation-finished', request.detail, undefined, request.key);
}
