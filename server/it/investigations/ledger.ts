import { captureLearning } from '../../knowledge/learning-events';
import { requeueInvestigationEvidence } from './requeue-evidence';
import { supersedingDelivery } from '../../conversations/slack/supersession-proof';
import { slackMessageUrl } from '../../../src/shared';
import type { ITInvestigation } from '../../../src/contracts/it-investigations';
import { completedExecution } from '../../workers/worker-completion';
import { investigationCandidates, investigationId } from './candidates';
import { notifyHelperResolution } from './notify-helper-survivor';
import { retriedReadResolution } from './retried-read';
import type { Store } from '../../store/store';

/** These saved receipts are populated by existing read-back contracts, never by Ellis's verdict. */
export function investigationResolution(store: Store, entry: ITInvestigation) {
    if (entry.source.kind === 'slack') {
        const delivery = store.state.slackDeliveries?.find(delivery => delivery.id === entry.source.id && delivery.requestId === entry.source.requestId && delivery.status === 'confirmed' && slackMessageUrl(delivery.permalink, delivery.channelId, delivery.messageTs));
        if (delivery) return { sourceId: delivery.id, receipt: delivery.permalink, kind: 'confirmed' as const };
        const original = store.state.slackDeliveries?.find(delivery => delivery.id === entry.source.id && delivery.requestId === entry.source.requestId);
        const replacement = original && supersedingDelivery(store.state, original);
        return replacement ? { sourceId: replacement.id, receipt: replacement.permalink, kind: 'superseded' as const } : undefined;
    }
    // Delivery recovery alone does not prove the subprocess defect; only the known notify helper explains it.
    if (entry.source.failureKind === 'surviving-subprocesses') return notifyHelperResolution(store, entry);
    const retried = retriedReadResolution(store, entry);
    if (retried) return retried;
    const recovery = store.state.workLog?.find(work => work.originalId === entry.source.id && work.requestId === entry.source.requestId && work.status === 'completed' && completedExecution(store, work));
    return recovery ? { kind: 'confirmed' as const, sourceId: recovery.id, receipt: `sessions/${recovery.id}/execution-completion.json` } : undefined;
}
/** Admit once and settle only from the original delivery or an explicitly bound successful recovery. */
export function syncInvestigations(store: Store, now = store.clock.now()): void {
    const it = store.state.it;
    if (!it) return;
    const entries = it.investigations ??= [];
    for (const source of investigationCandidates(store.project.id, store.state)) {
        const id = investigationId(store.project.id, source);
        const existing = entries.find(entry => entry.id === id);
        if (existing) existing.source.workerIds = [...new Set([...existing.source.workerIds, ...source.workerIds])];
        else entries.push({ id, source, status: 'queued', createdAt: now.toISOString(), updatedAt: now.toISOString(), attempts: 0, nextAt: '', lastError: '' });
    }
    for (const entry of entries) {
        requeueInvestigationEvidence(store, entry);
        const resolution = investigationResolution(store, entry);
        if (resolution) {
            if (entry.status !== 'resolved') {
                entry.status = 'resolved'; entry.nextAt = ''; entry.updatedAt = now.toISOString();
                entry.resolution = { ...resolution, at: now.toISOString() };
                captureLearning(store, { kind: 'investigation', id: entry.id }, entry.source.ticket, 'recovery', resolution.sourceId, resolution, 'Source-bound operational resolution verified.', 'work', true);
                store.emit('it-investigation-resolved', resolution.kind === 'superseded' ? 'Earlier warning closed by a verified replacement; original outcome remains unknown.' : 'Original operational failure reconciled against a verified receipt.', 'it', entry.source.ticket);
            }
        } else if (entry.status === 'resolved') {
            // A stale resolved flag cannot hide a reactivated source or lost receipt.
            entry.status = 'blocked'; entry.resolution = undefined; entry.lastError = 'Resolution receipt no longer matches the original source; Morgan must reconcile it.';
        }
    }
}
