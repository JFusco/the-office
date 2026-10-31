import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
afterEach(cleanupFakes);
import { admit, admitReadyCards } from '../../../../server/delivery/intake/admission';
import { coordination } from '../../../../server/scheduling/coordination';
import { HOLDS } from '../../../../server/office/config';

function context(f: ReturnType<typeof fakeGitHub>) {
    f.store.state.coordination ??= coordination();
    const state = f.store.state.coordination!;
    state.jobs ??= [];
    return { store: f.store, state, pickup: { enabled: true, status: 'Ready' }, dependencyStores: () => new Map([[f.store.project.id, f.store]]) };
}
const assigned = (lane = 'Ready') => [{ key: 'GH-5', summary: 'Restore', url: 'u', assignee: 'JFusco', status: 'open', statusId: '', updated: '', type: 'GitHub issue', subtask: false, pickupStatus: lane }];
test('a Ready card with no owner, hold or PR queues exactly one implementation without a model', () => {
    const f = fakeGitHub(), c = context(f);
    admitReadyCards(c, f.delivery, assigned(), new Date());
    admitReadyCards(c, f.delivery, assigned(), new Date());
    expect(c.state.jobs!.filter(j => j.key === 'GH-5')).toHaveLength(1);
    expect(c.state.jobs![0]).toMatchObject({ stage: 'implement', status: 'queued', automaticStatus: 'Ready' });
    expect(c.state.listener.reviews.filter(r => r.key === 'GH-5')).toHaveLength(1);
});
test('an old narrative-only hold is superseded once the card is Ready', () => {
    const f = fakeGitHub(), c = context(f);
    c.state.listener.reviews.push({ id: 'old', key: 'GH-5', summary: '', url: '', queuedAt: '', startedAt: '', endedAt: '', status: 'held', detail: 'Keep held per recorded deferral', owner: '' });
    admitReadyCards(c, f.delivery, assigned(), new Date());
    expect(c.state.jobs).toHaveLength(1);
    expect(c.state.listener.reviews.at(-1)).toMatchObject({ status: 'ready', parentReviewId: 'old' });
    expect(c.state.listener.reviews[0].status).toBe('held');
});
test('HOLDS, interrupted intake, non-Ready lanes and existing jobs admit nothing', () => {
    const f = fakeGitHub(), c = context(f);
    admitReadyCards(c, f.delivery, assigned('Backlog'), new Date());
    expect(c.state.jobs).toHaveLength(0);
    HOLDS['GH-5'] = 'Synthetic human hold';
    try {
        admitReadyCards(c, f.delivery, assigned(), new Date());
        admitReadyCards(c, f.delivery, assigned(), new Date());
        expect(c.state.jobs).toHaveLength(0);
        expect(c.state.listener.reviews.filter(r => r.status === 'held')).toHaveLength(1);
    } finally { delete HOLDS['GH-5']; }
    c.state.listener.reviews.push({ id: 'i', key: 'GH-5', summary: '', url: '', queuedAt: '', startedAt: '', endedAt: '', status: 'interrupted', detail: '', owner: '' });
    admitReadyCards(c, f.delivery, assigned(), new Date());
    expect(c.state.jobs).toHaveLength(0);
});
test('manual start is admitted outside the lane; automatic outside the lane is held; an owner is reported', () => {
    const f = fakeGitHub(), c = context(f);
    expect(admit(c, f.delivery, { key: 'GH-5', prerequisites: [] }, new Date()).status).toBe('held');
    expect(admit(c, f.delivery, { key: 'GH-5', workRequested: 'manual', prerequisites: [] }, new Date()).status).toBe('ready');
    expect(c.state.jobs![0].automaticStatus).toBeUndefined();
    expect(admit(c, f.delivery, { key: 'GH-5', workRequested: 'automatic', prerequisites: [] }, new Date())).toMatchObject({ status: 'owned', owner: c.state.jobs![0].id });
});
test('a blocked legacy-recovery job keeps owning its issue when the card returns to Ready', () => {
    const f = fakeGitHub(), c = context(f);
    c.state.jobs!.push({ ...f.candidate({ stage: 'scope-repair', status: 'blocked' }), key: 'GH-5', scopeRepairResumes: [{} as any] });
    const before = c.state.jobs!.length;
    admitReadyCards(c, f.delivery, assigned(), new Date());
    admitReadyCards(c, f.delivery, assigned(), new Date());
    expect(c.state.jobs).toHaveLength(before);
    expect(c.state.jobs!.find(j => j.key === 'GH-5')).toMatchObject({ stage: 'scope-repair', status: 'blocked' });
});
