import type { ITInvestigation } from '../../../src/contracts/it-investigations';
import type { WorkRef } from '../../../src/contracts/work';
import type { OfficeSnapshot } from '../../../src/shared';
import { stoppedRecord } from '../../incidents/sources/stopped-record';

/**
 * The stopped record a failed run was working, from the investigation's recorded source. A run
 * with a request belongs to the record that request is: a delivery job or request, an assignment
 * review, a maintenance run, a checkpoint, a harness request, a notice or a conversation. A
 * delivery request that only repeats its ticket's stop is that ticket. A
 * stage run without a request (a Jira or Azure stage) belongs to a ticket only when that ticket's
 * stop names the run as the one that worked it. A Slack delivery, and a run bound to nothing, is about no record.
 */
export function investigatedRecord(state: OfficeSnapshot, source: ITInvestigation['source']): Pick<WorkRef, 'kind' | 'id'> | null {
    if (source.kind !== 'worker') return null;
    const c = state.coordination, id = source.requestId;
    if (id) {
        if (c?.jobs?.some(job => job.id === id)) return { kind: 'delivery', id };
        const request = state.deliveryQueue?.find(request => request.id === id);
        if (request) {
            // A request that only mirrors its ticket's stop is part of the ticket's subject, so the ticket is the record, and holds the marker.
            const ticket = state.tickets.find(ticket => ticket.key === request.key), work = { projectId: state.project?.id ?? '', kind: 'delivery' as const, id: `ticket:${request.key}` };
            const record = ticket && stoppedRecord(state, work, ticket.stage);
            // Only a ticket that is itself stopped absorbs the request; beside a ticket that could run, the request is its own subject.
            return record?.standing === 'stopped' && record.covers.some(([kind, covered]) => kind === 'delivery' && covered === id) ? { kind: work.kind, id: work.id } : { kind: 'delivery', id };
        }
        if (c?.listener.reviews.some(review => review.id === id)) return { kind: 'intake', id };
        if (state.maintenance?.runs.some(run => run.id === id)) return { kind: 'maintenance', id };
        if (c?.checkpoints.some(checkpoint => checkpoint.id === id)) return { kind: 'checkpoint', id };
        if (c?.requests?.some(request => request.id === id)) return { kind: 'reconciliation', id };
        if (c?.notices?.entries.some(notice => notice.id === id)) return { kind: 'notice', id };
        const message = state.messages.find(message => message.requestId === id);
        return message ? { kind: 'conversation', id: message.id } : null;
    }
    const runs = new Set([source.id, ...source.workerIds]), project = state.project?.id ?? '';
    for (const ticket of state.tickets) {
        const work = { projectId: project, kind: 'delivery' as const, id: `ticket:${ticket.key}` };
        if (stoppedRecord(state, work, ticket.stage)?.covers.some(([kind, run]) => kind === 'worker' && runs.has(run))) return { kind: work.kind, id: work.id };
    }
    return null;
}
