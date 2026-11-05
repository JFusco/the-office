import { expect, test } from 'vitest';
import { featureGate, predecessorComplete, assertEnrollable } from '../../../server/features/enrollment-gate';
import { assertFeatureApproach } from '../../../server/features/delivery-binding';
const feature = () => ({ id: 'feature', sourceTicket: 'GH-1', revision: 1, paused: false, approvals: [], publication: [] } as any);
test('feature holds survive intake replacement and active work cannot be enrolled', () => {
    const f = feature(), store = { project: { provider: 'github' }, state: { features: [f], tickets: [], coordination: { jobs: [], listener: { reviews: [] } } }, activeClaims: () => [] } as any;
    expect(featureGate(store, 'GH-1').allowed).toBe(false);
    store.state.coordination.listener.reviews = [{ id: 'replacement', key: 'GH-1', status: 'ready' }];
    expect(featureGate(store, 'GH-1').allowed).toBe(false);
    store.state.coordination.jobs = [{ id: 'owner', key: 'GH-2', status: 'queued', steps: [] }];
    expect(() => assertEnrollable(store, 'GH-2')).toThrow('already owns');
});
test('CEC successors require accepted staging verification, not merge or resolved status', () => {
    const f = feature(); f.publication = [{ id: 'one', key: 'CEC-1', ownerId: 'run', startedApprovalId: 'approval' }];
    const approval = { manifest: { items: [{ id: 'two', predecessor: 'one' }] } } as any;
    const ticket = { key: 'CEC-1', runId: 'run', stage: 'ready-for-staging', status: 'Resolved', results: {} } as any;
    const store = { project: { provider: 'azure' }, state: { tickets: [ticket] } } as any;
    expect(predecessorComplete(store, f, 'two', approval)).toBe(false);
    ticket.stage = 'complete'; expect(predecessorComplete(store, f, 'two', approval)).toBe(false);
    ticket.results['staging-qa'] = { outcome: 'passed' }; expect(predecessorComplete(store, f, 'two', approval)).toBe(true);
});
test('ordinary feature approach selection cannot skip independent review', () => {
    expect(() => assertFeatureApproach({ featureBinding: {} as any }, { review: 'none' } as any)).toThrow('independent review');
    expect(() => assertFeatureApproach({}, { review: 'none' } as any)).not.toThrow();
});
