import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { coordination } from '../../../server/scheduling/coordination';
import { ADOPTION_STALLED_MS, projectOutbox } from '../../../server/conversations/outbox';
import type { DependabotAdoption } from '../../../src/shared';

const stores: Store[] = [];
afterEach(() => { for (const store of stores.splice(0)) store.close(); });
const at = '2026-11-15T12:00:00.000Z';
function questions(status: DependabotAdoption['status'], now: Date) {
    const store = new Store(':memory:');
    stores.push(store);
    store.state.coordination = coordination();
    store.state.coordination.adoptions = [{ id: 'a', pr: 374, url: 'https://github.com/JFusco/brain/pull/374', title: 'Bump', issue: 0, status, detail: 'pin-courier PR #374 adoption started.', at, bot: 'pin-courier' }];
    return projectOutbox(store.state, now).filter(action => action.status === 'open' && action.id === 'dependabot:374');
}

test('an adoption in progress is not a question for Joe', () => {
    expect(questions('adopting', new Date(Date.parse(at) + 49_000))).toEqual([]);
    expect(questions('adopted', new Date(Date.parse(at) + 49_000))).toEqual([]);
});

test('a refused, blocked or stalled adoption still is', () => {
    expect(questions('refused', new Date(at))).toHaveLength(1);
    expect(questions('blocked', new Date(at))).toHaveLength(1);
    expect(questions('adopting', new Date(Date.parse(at) + ADOPTION_STALLED_MS + 1))).toMatchObject([{ title: 'pin-courier PR #374 was not adopted' }]);
});
