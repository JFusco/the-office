import type { IncidentCandidate } from '../../../src/contracts/incidents';
import type { OfficeSnapshot } from '../../../src/shared';
import { stoppedRecord } from './stopped-record';

/**
 * A stopped ticket that stopped work does not report, such as a blocked mailbox epic, is held by the
 * one stopped delivery request that only mirrors its blocker. That request takes in the run that last
 * worked the ticket's stage, so the run is not a subject of its own beside it. Updates `reports`, the
 * stopped-work candidates of this pass.
 */
export function foldMirroredTicketWorkers(state: OfficeSnapshot, projectId: string, reports: readonly IncidentCandidate[]): void {
    const delivery = new Map(reports.filter(report => report.subject.kind === 'delivery').map(report => [report.subject.id, report]));
    if (!delivery.size) return;
    const ticketIds = new Set((state.deliveryQueue ?? []).filter(request => delivery.has(request.id)).map(request => `ticket:${request.key}`));
    for (const id of ticketIds) {
        if (delivery.has(id)) continue;
        const ticket = stoppedRecord(state, { projectId, kind: 'delivery', id }, '');
        if (ticket?.standing !== 'stopped' || !ticket.lastWorker) continue;
        const mirrors = ticket.covers.filter(([kind, id]) => kind === 'delivery' && delivery.has(id));
        if (mirrors.length !== 1) continue;
        const report = delivery.get(mirrors[0][1])!;
        report.subject.lastWorker = ticket.lastWorker;
        (report.absorbs ??= []).push(`${projectId}/worker/${ticket.lastWorker}`);
    }
}
