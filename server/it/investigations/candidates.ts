import type { OfficeSnapshot } from '../../../src/shared';
import type { ITInvestigation } from '../../../src/contracts/it-investigations';

/** Saved source identities, never error prose or a model recommendation, authorize diagnosis. */
export function investigationCandidates(projectId: string, state: OfficeSnapshot): ITInvestigation['source'][] {
    const deliveries = state.slackDeliveries || [], workers = state.workLog || [];
    const slack = deliveries.filter(delivery => delivery.status === 'uncertain').map(delivery => ({
        kind: 'slack' as const, id: delivery.id, requestId: delivery.requestId,
        ticket: state.coordination?.notices?.entries.find(notice => notice.id === delivery.requestId)?.key || state.messages.find(message => message.id === delivery.requestId)?.ticket || '',
        failureKind: 'unconfirmed-delivery', workerIds: workers.filter(work => work.requestId === delivery.requestId).map(work => work.id),
    }));
    const process = workers.filter(work => work.stage !== 'it-investigation' && ['failed', 'interrupted'].includes(work.status) && work.failure?.dispatched && work.failure.category !== 'cancelled' && !deliveries.some(delivery => delivery.requestId === work.requestId))
        .map(work => ({ kind: 'worker' as const, id: work.id, requestId: work.requestId, ticket: work.ticket, failureKind: work.failure!.category, workerIds: workers.filter(other => other.requestId === work.requestId).map(other => other.id) }));
    return [...slack, ...process];
}
export const investigationId = (projectId: string, source: ITInvestigation['source']) => `investigation:${projectId}:${source.kind}:${source.id}:${source.failureKind}`;
