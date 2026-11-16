import { expect, test } from 'vitest';
import { interruptAdoptions } from '../../../../../server/delivery/intake/dependency-bots/interrupted-adoptions';
import type { DependabotAdoption, OfficeSnapshot } from '../../../../../src/shared';

const record = (pr: number, status: DependabotAdoption['status']): DependabotAdoption => ({ id: `a${pr}`, pr, url: '', title: 'Bump', issue: 0, status, detail: 'original', at: '2026-11-15T12:00:00.000Z' });
const state = (adoptions?: DependabotAdoption[]) => ({ coordination: adoptions ? { adoptions } : undefined }) as unknown as OfficeSnapshot;

test('a restart marks unfinished adoptions blocked with a dated explanation and leaves settled ones alone', () => {
    const adoptions = [record(1, 'adopting'), record(2, 'adopted'), record(3, 'refused'), record(4, 'withdrawn'), record(5, 'blocked')];
    expect(interruptAdoptions(state(adoptions), new Date('2026-11-15T13:00:00Z'))).toBe(1);
    expect(adoptions[0]).toMatchObject({ status: 'blocked', at: '2026-11-15T13:00:00.000Z' });
    expect(adoptions[0].detail).toContain('PR #1 adoption was interrupted by a service restart');
    expect(adoptions.slice(1)).toEqual([record(2, 'adopted'), record(3, 'refused'), record(4, 'withdrawn'), record(5, 'blocked')]);
});

test('state without coordination or adoptions is left untouched', () => {
    expect(interruptAdoptions(state(), new Date())).toBe(0);
    expect(interruptAdoptions(state([]), new Date())).toBe(0);
});

test('service startup recovery marks an unfinished adoption so its question shows at once', async () => {
    const { Store } = await import('../../../../../server/store/store');
    const { coordination } = await import('../../../../../server/scheduling/coordination');
    const { projectOutbox } = await import('../../../../../server/conversations/outbox');
    const store = new Store(':memory:');
    try {
        store.state.coordination = coordination();
        store.state.coordination.adoptions = [record(7, 'adopting')];
        store.recover();
        expect(store.state.coordination.adoptions[0].status).toBe('blocked');
        expect(projectOutbox(store.state).filter(action => action.status === 'open').map(action => action.id)).toContain('dependabot:7');
    } finally { store.close(); }
});
