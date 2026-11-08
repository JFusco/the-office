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
        for (const change of [{ failure: undefined }, { failure: { category: 'cancelled', dispatched: true } }, { failure: { category: 'other', dispatched: false } }, { stage: 'it-investigation' }]) {
            f.store.state.workLog = [{ ...f.worker, ...change } as any]; expect(investigationCandidates('brain', f.store.state)).toEqual([]);
        }
    } finally { f.close(); }
});
