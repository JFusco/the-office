import { selectLessons } from './lesson-selection';
import type { BlockerFollowup, LearningSubject, TeamMessage } from '../../src/shared';
import type { Store } from '../store/store';
import { enqueueRequest } from '../scheduling/requests';
import { investigationResolution } from '../it/investigations/ledger';
import { nativeDeliveryResolved } from '../it/native-delivery-resolved';
import { conversationResolved } from '../conversations/outbox';
import { conversationReadbackReady, uncertainConversations, queueConversationReadback } from '../conversations/conversation-recovery';
import { HOLDS } from '../office/config';
import { captureLearning, learningDigest } from './learning-events';

/** Positive binding, not a prose tag, grants only read-only diagnosis. */
export function harperHandoff(store: Store, message: TeamMessage): boolean {
    return message.from === 'knowledge' && message.to === 'pm' && !!store.state.knowledge?.followups?.some(item => (item.handoffId === message.id || item.handoffIds?.includes(message.id)));
}
function handoff(store: Store, item: BlockerFollowup, original?: TeamMessage) {
    const id = `harper-followup:${item.id}:${learningDigest(item.nextAction)}`;
    if (item.handoffId === id || store.state.messages.some(message => message.id === id) || store.state.paused || store.state.draining || HOLDS[item.key]) return;
    if (original && !conversationReadbackReady(store, original)) return;
    item.handoffId = id; (item.handoffIds ??= []).push(id);
    store.state.messages.push({ id, requestId: id, from: 'knowledge', to: 'pm', ticket: item.key,
        actionId: original ? `message:${original.id}` : `harper:${item.id}`, body: `Harper requests READ ONLY diagnosis and source read-back. ${item.nextAction}\nSource: ${JSON.stringify(item.source)}\nDo not retry writes, change goals, pickup, notes, or send messages. Preserve original failure evidence. ${original ? `Verify EVERY original effect, and return conversation-readback targeting ${original.id} only when accounted for.` : 'Report the exact remaining dependency and owner. A diagnosis does not resolve the source.'}`,
        status: 'queued', createdAt: store.clock.now().toISOString(), sessionId: '', recheck: false, error: '', recipients: [], receipts: [] });
}
/** Reconciles references to owner records. Never changes source status or recovery attempts. */
export function reconcileBlockerFollowups(store: Store): void {
    const knowledge = store.state.knowledge;
    if (!knowledge) return;
    const before = JSON.stringify([knowledge.followups, store.state.messages.length]), now = store.clock.now().toISOString();
    const records = knowledge.followups ??= [], observed = new Set<string>();
    const observe = (source: LearningSubject, key: string, detail: string, disposition: BlockerFollowup['disposition'], proof: unknown, refs: Partial<BlockerFollowup> = {}) => {
        const id = `${source.kind}:${source.id}`, fingerprint = learningDigest([disposition, proof, detail]);
        observed.add(id);
        let item = records.find(item => item.id === id);
        if (!item) { item = { id, source, key, fingerprint: '', owner: 'Morgan', nextAction: detail, evidence: [], disposition, createdAt: now, updatedAt: now, history: [] }; records.push(item); }
        if (item.fingerprint !== fingerprint) {
            item.history.push({ at: now, disposition, fingerprint, detail }); item.updatedAt = now;
            Object.assign(item, { fingerprint, disposition, nextAction: detail, lessonRefs: selectLessons(store, { stage: 'repair' }).selected, ...refs });
            if (disposition === 'confirmed') item.resolvedAt = now; else delete item.resolvedAt;
            item.evidence = [{ kind: 'learning', ref: id, url: '', detail: JSON.stringify(proof).slice(0, 1500) }];
            // Initial unresolved inventory is baselined; subsequent material changes are learning. An unknown outcome proves nothing.
            if (item.history.length > 1 && disposition !== 'unknown') captureLearning(store, source, key, 'recovery', fingerprint, { disposition, proof }, detail);
        }
        // A source resolution does not prove the diagnostic nudge caused it. Procedure outcome stays unknown.
        return item;
    };
    for (const entry of store.state.it?.investigations || []) {
        const proof = investigationResolution(store, entry);
        const item = observe({ kind: 'investigation', id: entry.id }, entry.source.ticket, proof ? proof.kind === 'superseded' ? 'A verified replacement superseded this incident; original outcome remains unknown.' : 'Original source has verified resolution evidence.' : entry.lastError || entry.report?.summary || 'Ellis owns source diagnosis; wait for verified recovery.', proof?.kind || (entry.status === 'blocked' ? 'needs-input' : 'unresolved'), proof || { status: entry.status, attempts: entry.attempts }, { investigationId: entry.id, owner: proof ? 'Ellis' : entry.status === 'blocked' ? 'Morgan' : 'Ellis' });
        if (item.disposition === 'needs-input' && knowledge.enabled) handoff(store, item);
    }
    for (const [id, recovery] of Object.entries(store.state.it?.recoveries || {})) {
        const positive = nativeDeliveryResolved(store, id, recovery.requestId);
        const item = observe({ kind: 'recovery', id }, '', recovery.detail, positive ? 'confirmed' : recovery.status === 'resolved' ? 'unknown' : recovery.status === 'needs-human' ? 'needs-input' : 'unresolved', { requestId: recovery.requestId, status: recovery.status, positive }, { recoveryId: id, requestId: recovery.requestId, owner: recovery.status === 'needs-human' ? 'Morgan' : 'Ellis' });
        if (item.disposition === 'needs-input' && knowledge.enabled) handoff(store, item);
    }
    for (const job of store.state.coordination?.jobs || []) {
        const old = records.find(item => item.source.kind === 'job' && item.source.id === job.id);
        if (!old && !['blocked', 'interrupted'].includes(job.status)) continue;
        const resolved = nativeDeliveryResolved(store, `native-delivery:${job.id}`);
        const recovery = Object.entries(store.state.it?.recoveries || {}).find(([id]) => id.split(':').includes(job.id));
        // Only material alert state is fingerprinted; ordinary stage, head and detail progress after the block is not a new incident.
        const blocked = ['blocked', 'interrupted'].includes(job.status);
        const detail = blocked ? job.detail : resolved ? 'Owning delivery source has verified resolution evidence.' : 'Delivery source no longer blocked; recovery proof unknown.';
        const item = observe({ kind: 'job', id: job.id }, job.key, detail, resolved ? job.status === 'cancelled' ? 'superseded' : 'confirmed' : blocked ? 'unresolved' : 'unknown', { status: blocked ? job.status : '', resolved }, { recoveryId: recovery?.[0], requestId: recovery?.[1].requestId, owner: 'Ellis' });
        if (!resolved && !recovery && !item.nudgeId && knowledge.enabled && !store.state.paused && !store.state.draining && !HOLDS[job.key]) {
            item.nudgeId = store.state.coordination?.requests?.find(request => request.action === 'check-it' && ['queued', 'working'].includes(request.status))?.id || enqueueRequest(store, 'check-it', '', '', 'it').id;
            (knowledge.procedureUses ??= []).push({ id: `check-it:${item.id}`, operation: 'check-it', source: item.source, requestId: item.nudgeId, at: now, outcome: 'unknown' });
        }
    }
    for (const original of store.state.messages.filter(message => message.from === 'human' && ['failed', 'interrupted'].includes(message.status))) {
        const resolved = conversationResolved(store.state, original);
        const item = observe({ kind: 'message', id: original.id }, original.ticket, `Reconcile the original conversation: ${original.error}`, resolved ? 'confirmed' : 'unresolved', { resolved, error: original.error });
        const pending = store.state.messages.find(message => message.actionId === `message:${original.id}` && ['queued', 'working'].includes(message.status));
        if (pending) item.handoffId = pending.id;
        else if (!resolved && knowledge.enabled) {
            if (uncertainConversations(store).some(message => message.id === original.id) && conversationReadbackReady(store, original)) item.handoffId = queueConversationReadback(store, original).id;
            else handoff(store, item, original);
        }
    }
    for (const ticket of store.state.tickets) {
        if (!ticket.runId || !ticket.parked && !records.some(item => item.source.kind === 'ticket' && item.source.id === ticket.runId)) continue;
        const completed = ticket.pilot && ticket.stage === 'complete';
        const item = observe({ kind: 'ticket', id: ticket.runId }, ticket.key, completed ? 'Owning CEC pipeline verified staging completion.' : ticket.parked?.reason || 'CEC source no longer blocked; recovery proof unknown.', completed ? 'confirmed' : ticket.parked ? 'unresolved' : 'unknown', { completed, parked: ticket.parked?.marker });
        // An unparked ticket is progressing again; it needs no diagnosis merely because completion is unproved.
        if (ticket.parked && knowledge.enabled) handoff(store, item);
    }
    for (const run of store.state.maintenance?.runs || []) {
        if (!['blocked', 'interrupted'].includes(run.status) && !records.some(item => item.source.kind === 'maintenance' && item.source.id === run.id)) continue;
        const replacement = store.state.maintenance?.runs.find(other => other.id !== run.id && other.supersedes?.includes(run.id));
        const item = observe({ kind: 'maintenance', id: run.id }, '', replacement ? `Maintenance owner superseded this run with ${replacement.id}; original outcome remains unverified. ${run.error}` : run.error || 'Maintenance effects need source read-back; a later run does not resolve this one.', replacement ? 'superseded' : ['blocked', 'interrupted'].includes(run.status) ? 'unresolved' : 'unknown', { status: run.status, error: run.error, replacement: replacement?.id }, { owner: 'Morgan' });
        if (item.disposition === 'unresolved' && knowledge.enabled) handoff(store, item);
    }
    for (const feature of store.state.features || []) {
        if (feature.status !== 'blocked' && !records.some(item => item.source.kind === 'feature' && item.source.id === feature.id)) continue;
        const item = observe({ kind: 'feature', id: feature.id }, '', feature.detail, feature.status === 'blocked' ? 'needs-input' : 'unknown', { phase: feature.phase, status: feature.status }, { owner: 'Morgan' });
        if (item.disposition === 'needs-input' && knowledge.enabled) handoff(store, item);
    }
    for (const improvement of knowledge.improvements || []) {
        if (!['needs-input', 'uncertain'].includes(improvement.status)) continue;
        const item = observe({ kind: 'orchestration', id: improvement.id }, improvement.providerId || '', improvement.detail, 'needs-input', { digest: improvement.digest, effects: improvement.effectIds, status: improvement.status }, { owner: 'Morgan', improvementId: improvement.id });
        if (knowledge.enabled) handoff(store, item);
    }
    for (const item of records) if (!observed.has(item.id)) {
        // Losing a record is not resolution. Preserve its earlier proof as history.
        for (const use of knowledge.procedureUses || []) if (use.source.kind === item.source.kind && use.source.id === item.source.id) use.outcome = 'unknown';
        observe(item.source, item.key, 'Original source is no longer retained; outcome unknown.', 'unknown', { sourceMissing: true });
    }
    if (before !== JSON.stringify([knowledge.followups, store.state.messages.length])) store.save();
}
