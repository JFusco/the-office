import { afterEach, expect, test } from 'vitest';
import { packed165Fixture } from '../support/packed165';
import { cleanupFakes } from '../support/fake-github';
import { enqueuePacked165, assertPacked165Original } from '../../../../server/delivery/recovery/packed165-intent';
import { PACKED165 } from '../../../../server/delivery/recovery/packed165-policy';
import { scheduledWork } from '../../../../server/scheduling/scheduled-work';
import { deterministicActions } from '../../../../server/scheduling/requests';

afterEach(cleanupFakes);
test('the one original command remains on the exclusive delivery lane, including after a blocked attempt', () => {
    const f = packed165Fixture(); f.request.status = 'blocked';
    expect(f.enqueue()).toBe(f.request);
    const entries = scheduledWork({ store: f.store, engine: f.engine, conversations: {} as any }, new Map(), new Date(), 'delivery');
    expect(entries.find(item => item.work.id === f.request.id)?.slot).toBeUndefined();
    expect(entries.some(item => item.work.id === f.request.id)).toBe(true);
    expect(deterministicActions.has(PACKED165.action)).toBe(false);
});
test('a generic number, bot head or another project cannot authorize this administrative repair', () => {
    const f = packed165Fixture();
    expect(() => enqueuePacked165(f.store, 'GH-164', PACKED165.head)).toThrow('exact approved');
    expect(() => enqueuePacked165(f.store, 'GH-165', 'other')).toThrow('exact approved');
    f.store.project.repository = 'other/repo';
    expect(() => enqueuePacked165(f.store, 'GH-165', PACKED165.head)).toThrow('exact approved');
});
test('a drained project cannot admit a new request; a consumed request is not recreated', () => {
    const f = packed165Fixture(); f.store.state.draining = true;
    expect(() => assertPacked165Original(f.store, f.job)).toThrow('disposition');
    f.request.status = 'interrupted'; expect(f.enqueue()).toBe(f.request);
    expect(f.store.state.coordination!.requests).toHaveLength(1);
});
