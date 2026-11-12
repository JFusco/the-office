import { expect, test } from 'vitest';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { investigationFixture } from './fixture';

/** A read-only worker that failed transiently, with no Slack delivery for its request. */
function readFixture() {
    const f = investigationFixture();
    Object.assign(f.worker, { id: 'reader', requestId: 'read', stage: 'knowledge-read', role: 'knowledge', failure: { category: 'transient-read', dispatched: true, detail: 'read timed out' } });
    f.store.state.slackDeliveries = [];
    return f;
}
const later = { id: 'retry', requestId: 'read', stage: 'knowledge-read', role: 'knowledge', status: 'completed', startedAt: '2026-11-08T02:05:00Z', endedAt: '2026-11-08T02:06:00Z' };

test('a later completed attempt of the same read at the same stage settles a transient read failure', () => {
    const f = readFixture(); try {
        syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0];
        expect(entry.status).toBe('queued');
        f.store.state.workLog!.push(later as never); syncInvestigations(f.store);
        expect(entry).toMatchObject({ status: 'resolved', resolution: { sourceId: 'retry', receipt: 'worker:retry' } });
    } finally { f.close(); }
});
test('a later completed read of another ticket does not settle a failure that recorded no request', () => {
    const f = readFixture(); try {
        Object.assign(f.worker, { requestId: '', stage: 'readback' });
        f.store.state.workLog!.push({ ...later, requestId: '', stage: 'readback', ticket: 'GH-351' } as never); syncInvestigations(f.store);
        expect(f.store.state.it!.investigations![0].status).not.toBe('resolved');
    } finally { f.close(); }
});
test.each([
    ['it started before the failure', { startedAt: '2026-11-08T01:00:00Z' }],
    ['it belongs to another request', { requestId: 'other' }],
    ['it ran a different stage', { stage: 'knowledge-other' }],
    ['it did not complete', { status: 'failed' }],
])('another worker does not settle it when %s', (_case, change) => {
    const f = readFixture(); try {
        f.store.state.workLog!.push({ ...later, ...change } as never); syncInvestigations(f.store);
        expect(f.store.state.it!.investigations![0].status).not.toBe('resolved');
    } finally { f.close(); }
});
