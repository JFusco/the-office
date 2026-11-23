import { expect, test } from 'vitest';
import { investigationCandidates, investigationId } from '../../../../server/it/investigations/candidates';
import { investigationFixture } from './fixture';

test('a Slack failure uses one project/delivery/failure identity, not one per helper', () => {
    const f = investigationFixture(); try {
        f.store.state.workLog!.push({ ...f.worker, id: 'verifier', stage: 'slack-verify' });
        const candidates = investigationCandidates('brain', f.store.state);
        expect(candidates).toHaveLength(1); expect(candidates[0].workerIds).toEqual(['sender', 'verifier']);
        expect(investigationId('brain', candidates[0])).not.toBe(investigationId('other', candidates[0]));
        f.delivery.status = 'confirmed'; expect(investigationCandidates('brain', f.store.state)).toEqual([]);
    } finally { f.close(); }
});
test('only dispatched typed worker failures qualify; model outcomes, cancellations and diagnosis failures do not recurse', () => {
    const f = investigationFixture(); try {
        f.store.state.slackDeliveries = [];
        expect(investigationCandidates('brain', f.store.state)).toHaveLength(1);
        for (const change of [{ failure: undefined }, { failure: { category: 'cancelled', dispatched: true } }, { failure: { category: 'provider-limit', dispatched: true } }, { failure: { category: 'other', dispatched: false } }, { stage: 'it-investigation' }]) {
            f.store.state.workLog = [{ ...f.worker, ...change } as any]; expect(investigationCandidates('brain', f.store.state)).toEqual([]);
        }
    } finally { f.close(); }
});
test('a read-back the provider refused at its usage limit is not investigated; the same run failing for another reason is', () => {
    const f = investigationFixture(); try {
        f.store.state.slackDeliveries = [];
        const refused = { ...f.worker, id: 'read-back', requestId: 'harper-followup:one', stage: 'conversation-readback', status: 'failed', failure: { category: 'other', dispatched: true, detail: 'codex exited 1: stream disconnected' } } as any;
        f.store.state.workLog = [refused];
        expect(investigationCandidates('brain', f.store.state)).toEqual([expect.objectContaining({ kind: 'worker', id: 'read-back', failureKind: 'other', workerIds: ['read-back'] })]);
        refused.failure = { category: 'provider-limit', dispatched: true, detail: 'codex exited 1: You’ve hit your usage limit.', retryAt: '2026-11-24T16:50:00.000Z' };
        expect(investigationCandidates('brain', f.store.state)).toEqual([]);
    } finally { f.close(); }
});
test('workers without a request ID do not absorb unrelated empty-ID workers into their history', () => {
    const f = investigationFixture(); try {
        f.store.state.slackDeliveries = [];
        f.store.state.workLog = [{ ...f.worker, requestId: '' }, { ...f.worker, id: 'unrelated', requestId: '', status: 'running', failure: undefined }];
        const [source] = investigationCandidates('brain', f.store.state);
        expect(source.workerIds).toEqual([f.worker.id]);
    } finally { f.close(); }
});
