import { deliveryRepairProjection } from '../../src/delivery-repair-projection';
import {closeoutRequestResolved,verifiedCloseoutCleanupRequest} from '../delivery/recovery/closeout/closeout-recovery-evidence';
import {scopeRepairRequestResolved} from '../delivery/recovery/scope-repair/scope-repair-readback';
import {preparationRequestResolved} from '../delivery/recovery/preparation/preparation-readback';
import type { ScheduledWork } from './scheduler';
import type { Store } from '../store/store';
import type { Engine } from './engine';
import type { Conversations } from '../conversations/conversations';
import type { Coordinator } from './coordination';
import { conversationResolved } from '../conversations/outbox';
import { deferredPickup } from '../../src/pickup-state';
import { ROLE_NAMES, workKey, type WorkKind, type WorkEligibility } from '../../src/shared';
import { dependencyEligibility, validatePrerequisites, type DependencyStores } from '../delivery/pipeline/dependencies';
import { executeRequest, deterministicActions } from './requests';
import { TimeLedger } from '../time/time-ledger';
import { easternDay } from '../office/clock';
import { withAmendmentOwnership } from '../delivery/recovery/source-amendment/source-amendment';
export interface OfficeEntry {
    store: Store;
    engine: Engine;
    conversations: Conversations;
    coordinator?: Coordinator;
}
const eligible = (state: WorkEligibility['state'], reason: string, owner = 'Morgan'): WorkEligibility => ({ state, reason, owner, nextCheckAt: null });
/** One projection drives dispatch, queue counts, owner labels and next actions. */
export function scheduledWork(entry: OfficeEntry, stores: DependencyStores, now = new Date(), lane = 'delivery'): ScheduledWork[] {
    const { store, engine, conversations, coordinator } = entry;
    const items: ScheduledWork[] = [], c = store.state.coordination!;
    const add = (kind: WorkKind, record: {
        id: string;
        status: string;
        timing?: import('../../src/shared').QueueTiming[];
        stageEnqueuedAt?: string;
    }, stage: string, at: string, rank: number, execute: () => Promise<unknown>, condition?: WorkEligibility | null, timing?: ScheduledWork['timing']) => {
        const status = record.status;
        items.push({ store, work: { projectId: store.project.id, kind, id: record.id }, stage, rank, enqueuedAt: record.stageEnqueuedAt || at, afterStage: () => {
                if (record.status === 'queued')
                    record.stageEnqueuedAt = store.clock.now().toISOString();
            }, timing, saveTiming: measurement => (record.timing ??= []).push(measurement),
            eligibility: store.state.paused || store.state.draining ? eligible('blocked', store.state.draining ? 'Office is draining' : 'Project is paused') : condition || eligible(status === 'queued' ? 'runnable' : status === 'working' ? 'running' : ['completed', 'cancelled', 'answered', 'sent', 'reconciled', 'ready'].includes(status) ? 'terminal' : ['watching', 'held'].includes(status) ? 'waiting' : 'blocked', status === 'queued' ? 'Ready for scheduler claim' : `Work is ${status}`),
            identity: () => JSON.stringify([record.status, stage, 'head' in record ? record.head : null, 'stage' in record ? record.stage : null]), execute });
    };
    for (const message of store.state.messages.filter(message => ['human', 'cto', 'it', 'pm'].includes(message.from))) {
        const messageLane = message.to === 'cto' ? 'cto' : message.to === 'it' ? 'it' : 'delivery';
        if (messageLane !== lane) continue;
        const original = message.from === 'human' ? message : message.from === 'it' && message.actionId.startsWith('message:')
            ? store.state.messages.find(original => original.id === message.actionId.slice(8)) : undefined;
        add('conversation', message, `conversation:${message.to}`, message.createdAt, 3, () => message.to === 'cto' ? conversations.pumpCTO() : message.to === 'it' ? conversations.pumpIT() : conversations.pump(message.id),
            ['failed', 'interrupted'].includes(message.status) && original && conversationResolved(store.state, original) ? eligible('terminal', 'Original conversation has a verified read-back; failure history retained') : null);
    }
    for (const request of c.requests || [])
        if ((deterministicActions.has(request.action) ? 'operations' : request.lane) === lane)
            add('reconciliation', request, request.action, request.requestedAt, request.action==='cleanup-merged-candidate'&&verifiedCloseoutCleanupRequest(store,request)?0:2, () => executeRequest(store, engine, coordinator!, request, conversations.checkIT),
                requestResolved(store, request) ? eligible('terminal', 'Same durable reconciliation completed; prior failure retained') : null);
    if (lane === 'operations') {
        const publishingEnabled = store.project.provider === 'github' ? c.time?.githubField : !!c.time?.jiraActivatedAt && c.time.jiraEnabled !== false;
        const pendingTime = c.time?.enabled && publishingEnabled && c.time.entries.find(value => value.status === 'pending' && (store.project.provider === 'github' || value.date < easternDay(now)));
        if (pendingTime)
            add('reconciliation', { id: `time:${pendingTime.id}`, status: 'queued' }, 'time-publication', pendingTime.date, 3, () => new TimeLedger(store).sync());
        return withActiveClaims(store, lane, items);
    }
    if (lane !== 'delivery')
        return withActiveClaims(store, lane, items);
    for (const job of c.jobs || []) {
        const validation = validatePrerequisites(job.prerequisites || [], { projectId: store.project.id, kind: 'delivery', id: job.id }, stores);
        const dependency = validation ? eligible('blocked', validation) : dependencyEligibility(job.prerequisites || [], stores, now);
        const repair=deliveryRepairProjection(job),retryAt=repair&&'retryAt' in repair?repair.retryAt:undefined;
        const timeWait=job.status==='queued'&&retryAt&&Date.parse(retryAt)>now.getTime()?{...eligible('waiting',repair?.next||'Recorded source retry backoff is active',repair?.owner||'Alex'),nextCheckAt:retryAt}:null;
        add('delivery', job, job.stage, job.requestedAt, job.stage === 'closeout' && !!job.mergeCommit ? 0 : deliveryRepairProjection(job)?.rank || (job.repairReason && job.repairReason !== 'source' || (job.prerequisites?.length && !dependency) ? 1 : 3), () => withAmendmentOwnership(async () => {
            await coordinator!.sessionBridge?.refresh();
            const ownership = coordinator!.sessionBridge?.forProject(store, job.key, job.id);
            if (!ownership) throw new Error('Amendment ownership inventory is unavailable');
            return ownership as any;
        }, () => coordinator!.pump({ kind: 'delivery', id: job.id })), dependency||timeWait, job.timing);
    }
    for (const review of [...new Map(c.listener.reviews.map(review => [review.key, review])).values()].filter(review => !(c.jobs || []).some(job => job.key === review.key && job.status !== 'cancelled')))
        add('intake', review, 'assignment-review', review.queuedAt, 3, () => coordinator!.pump({ kind: 'intake', id: review.id }), review.prerequisiteError ? eligible('blocked', review.prerequisiteError) : ['owned', 'held'].includes(review.status) && deferredPickup(store.state, review.key) ? eligible('waiting', 'Backlog assignment is deferred until its pickup lane or an explicit Start') : null, review.timing);
    for (const checkpoint of c.checkpoints)
        add('checkpoint', checkpoint, 'checkpoint', checkpoint.requestedAt, 3, () => coordinator!.pump({ kind: 'checkpoint', id: checkpoint.id }), checkpoint.retryAt && Date.parse(checkpoint.retryAt) > now.getTime() ? eligible('waiting', 'Native retry backoff is active') : null);
    for (const run of store.state.maintenance?.runs || []) {
        add('maintenance', run, run.stage, run.requestedAt, 3, () => engine.drainMaintenance(run.id), null, run.timing);
        if (run.blockerFollowup)
            add('continuation', { id: run.id, status: run.blockerFollowup.status }, 'repair-followup', run.requestedAt, 1, () => coordinator!.pump({ kind: 'followup', id: run.id }));
        if (run.readbackRetry && ['blocked', 'interrupted'].includes(run.status) && !run.readbackRetry.exhausted)
            add('reconciliation', { id: `recovery:${run.id}`, status: 'queued' }, 'maintenance-readback', run.requestedAt, 2, () => coordinator!.pump({ kind: 'recovery', id: run.id }), run.readbackRetry.nextAt && Date.parse(run.readbackRetry.nextAt) > now.getTime() ? eligible('waiting', 'Read retry backoff is active') : null);
    }
    for (const continuation of c.continuations || [])
        if (continuation.status === 'waiting' || continuation.status === 'queued')
            add('continuation', { id: continuation.id, status: 'queued' }, 'native-continuation', store.state.coordination!.checkpoints.find(checkpoint => checkpoint.id === continuation.checkpointId)?.requestedAt || '', 1, async () => {
                const gate = await (engine.maintenance as import('../maintenance/brain/brain-maintenance').BrainMaintenance).readStatus();
                const { validateNativeContinuation } = await import('../maintenance/continuations');
                if (validateNativeContinuation(continuation, gate)) {
                    continuation.status = 'completed';
                    continuation.nativeSlot = gate.completed!.slotDate;
                    continuation.detail = 'Existing native continuation verified; original and repair history retained.';
                    store.emit('continuation-completed', continuation.detail, 'pm', continuation.originalIssue);
                }
                else {
                    await coordinator!.resumeRepairedMaintenance();
                    continuation.nextCheckAt = new Date(Date.now() + 300000).toISOString();
                    store.save();
                }
            }, continuation.nextCheckAt && Date.parse(continuation.nextCheckAt) > now.getTime() ? eligible('waiting', 'Native gate backoff is active') : null);
    for (const notice of c.notices?.entries || [])
        add('notice', notice, 'merge-notice', notice.createdAt, 4, () => coordinator!.pump({ kind: 'notice', id: notice.id }));
    for (const request of store.state.deliveryQueue || [])
        add('delivery', request, request.action, request.requestedAt, 3, () => engine.drainDelivery(request.id));
    for (const ticket of store.state.tickets.filter(ticket => ticket.pilot && !['complete', 'mailbox'].includes(ticket.stage) && !store.state.deliveryQueue?.some(request => request.key === ticket.key && ['queued', 'working'].includes(request.status)))) {
        let condition: WorkEligibility | null = ticket.activity === 'blocked' ? eligible('blocked', ticket.blocker) : null;
        if (ticket.stage === 'ready-for-staging' && ticket.results['ready-for-staging']?.outcome === 'passed')
            condition = eligible('waiting', ticket.blocker || 'Waiting for staging deployment');
        if (ticket.stage === 'ci' && ticket.blocker)
            condition = eligible('waiting', ticket.blocker);
        add('delivery', { id: `ticket:${ticket.key}`, status: ticket.activity === 'working' ? 'working' : 'queued' }, ticket.stage, ticket.updated, 3, () => engine.run(ticket.key), condition, ticket.timing);
    }
    const mail = store.state.pendingMail;
    if (mail)
        add('mail', { id: mail.id || mail.requestedAt, status: 'queued' }, 'mailbox', mail.requestedAt, 3, () => engine.drainMail());
    return withActiveClaims(store, lane, items);
}

/** A persisted execution claim is authoritative while synthetic source rows change. */
function withActiveClaims(store: Store, lane: string, items: ScheduledWork[]): ScheduledWork[] {
    const indexed = new Map(items.map(item => [workKey(item.work), item]));
    for (const claim of store.activeClaims()) {
        if (claim.work.projectId !== store.project.id || (claim.lane || 'delivery') !== lane) continue;
        const worker = store.state.workLog?.slice().reverse().find(work => work.claimId === claim.id && ['running', 'stopping'].includes(work.status));
        const owner = worker ? ROLE_NAMES[worker.role] : 'Office';
        const eligibility = eligible('running', claim.status === 'stopping' || worker?.status === 'stopping' ? 'Waiting for confirmed process termination' : `${owner} is handling this stage`, owner);
        const current = indexed.get(workKey(claim.work));
        if (current) { current.stage = claim.stage; current.eligibility = eligibility; }
        else {
            const item: ScheduledWork = { store, work: claim.work, stage: claim.stage, rank: 3, enqueuedAt: claim.claimedAt, eligibility,
                identity: () => claim.id, execute: async () => { throw new Error('Claimed work is already executing'); } };
            items.push(item); indexed.set(workKey(claim.work), item);
        }
    }
    return items;
}

/** Only these idempotent read-back contracts reconcile earlier attempts of the exact same intent. */
function requestResolved(store: Store, request: import('../../src/shared').HarnessRequest): boolean {
    if (!['blocked', 'interrupted'].includes(request.status)) return false;
    const c = store.state.coordination!;
    if (request.action === 'reconcile-closeout') return closeoutRequestResolved(store,request);
    if (request.action === 'reconcile-scope-repair') return scopeRepairRequestResolved(store,request);
    if (request.action === 'reconcile-preparation') return preparationRequestResolved(store,request);
    if (request.action === 'reconcile-validation') {
        const job = c.jobs?.find(job => job.key === request.key && job.status !== 'cancelled');
        return !!job?.steps.some(step => step.stage === 'validate' && step.result.outcome === 'passed' && step.result.receipts.some(receipt => receipt.action === 'validation-readback' && receipt.target === request.head && receipt.verified && !receipt.uncertain)) && !!c.requests?.some(success => success.id !== request.id && success.action === request.action && success.key === request.key && success.head === request.head && success.status === 'completed');
    }
    if (request.action === 'authorize-source-amendment') {
        const job = c.jobs?.find(job => job.key === request.key && job.status !== 'cancelled');
        return !!request.sourceAmendment && !!job?.sourceAmendment?.adoptedAt && JSON.stringify(job.sourceAmendment.authorization) === JSON.stringify(request.sourceAmendment) && !!c.requests?.some(success => success.id !== request.id && success.action === request.action && success.key === request.key && success.head === request.head && success.status === 'completed' && JSON.stringify(success.sourceAmendment) === JSON.stringify(request.sourceAmendment));
    }
    if (request.action === 'correct-recovery-time') {
        const input = request.timeClassification;
        return !!input && input.expectedSha256 === request.head && input.workIds.every(id => store.state.workLog?.some(work => work.id === id && work.effortKind === 'administrative' && work.effortCorrection?.originalDigest === request.head)) && !!c.requests?.some(success => success.id !== request.id && success.action === request.action && success.head === request.head && success.status === 'completed' && success.timeClassification?.expectedSha256 === input.expectedSha256);
    }
    if (request.action === 'resume-discovery') {
        const job = c.jobs?.find(job => job.key === request.key && job.status !== 'cancelled');
        return !!job && [...(job.discoveryRecoveryHistory || []), ...(job.discoveryRecovery ? [job.discoveryRecovery] : [])].some(recovery => recovery.originalWorkId === request.head) && !!c.requests?.some(success => success.id !== request.id && success.action === request.action && success.key === request.key && success.head === request.head && success.status === 'completed' && !!request.discoveryResume && !!success.discoveryResume && success.discoveryResume?.workDigest === request.discoveryResume?.workDigest && success.discoveryResume?.jobDigest === request.discoveryResume?.jobDigest && success.discoveryResume?.scopeDigest === request.discoveryResume?.scopeDigest);
    }
    if (['retry-checkpoint', 'reconcile-native-checkpoint'].includes(request.action)) {
        const checkpoint = c.checkpoints.find(checkpoint => checkpoint.id === request.key);
        const original = store.state.maintenance?.runs.find(run => run.id === checkpoint?.runId);
        return checkpoint?.status === 'completed' && !!original?.steps.some(step => step.stage === 'checkpoint-native-readback' &&
            step.result.outcome === 'passed' && step.result.receipts.some(receipt => receipt.action === 'native-checkpoint-readback' && receipt.verified && !receipt.uncertain));
    }
    if (!['reconcile-native-refresh', 'reconcile-native-delivery', 'reconcile-implementation'].includes(request.action)) return false;
    return !!c.requests?.some(success => success.id !== request.id && success.status === 'completed' &&
        success.action === request.action && success.key === request.key && success.head === request.head &&
        Date.parse(success.requestedAt) >= Date.parse(request.requestedAt));
}
