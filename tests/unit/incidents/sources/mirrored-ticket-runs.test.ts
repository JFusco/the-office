import { expect, test } from 'vitest';
import { foldMirroredTicketWorkers } from '../../../../server/incidents/sources/mirrored-ticket-runs';
import { candidate } from '../incident-fixture';

const P = 'cec', blocker = 'Error: epic blocker';
const state = (requests: unknown[], over: Record<string, unknown> = {}) => ({
    tickets: [{ key: 'CEC-7', stage: 'mailbox', activity: 'blocked', blocker, results: {}, commit: '', runId: 'r', attempt: 1 }],
    deliveryQueue: requests, workLog: [{ id: 'run-t', ticket: 'CEC-7', stage: 'mailbox', status: 'failed' }], coordination: {}, ...over,
}) as any;
const request = (id: string, error = blocker) => ({ id, key: 'CEC-7', status: 'blocked', error, action: 'start-pilot', requestedAt: 'r' });
const reported = (...ids: string[]) => ids.map(id => candidate({ projectId: P, kind: 'delivery', id }));

test('the one stopped request that mirrors an unreported ticket takes in the ticket stage\'s run', () => {
    const reports = reported('req-1');
    foldMirroredTicketWorkers(state([request('req-1')]), P, reports);
    expect(reports[0]).toMatchObject({ subject: { lastWorker: 'run-t' }, absorbs: [`${P}/worker/run-t`] });
});

test('a ticket reported itself, two mirrors, a request that does not mirror it or a ticket with no run keep their runs apart', () => {
    for (const [requests, ids, over] of [
        [[request('req-1')], ['req-1', 'ticket:CEC-7'], {}],
        [[request('req-1'), request('req-2')], ['req-1', 'req-2'], {}],
        [[request('req-1', 'Error: something else')], ['req-1'], {}],
        [[request('req-1')], ['req-1'], { workLog: [] }],
    ] as const) {
        const reports = reported(...ids);
        foldMirroredTicketWorkers(state([...requests], over), P, reports);
        expect(reports.every(report => !report.absorbs?.length && report.subject.lastWorker === '')).toBe(true);
    }
});
