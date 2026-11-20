import { afterEach, expect, test } from 'vitest';
import { LANES, observeProjects } from '../../../server/incidents/observe-projects';
import type { Store } from '../../../server/store/store';
import { AT, item, projectStore } from './incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));

test('each project is observed once, with every lane of the scheduler\'s projection and its unsettled writes', () => {
    const a = projectStore('brain'), b = projectStore('cms-field-vocabulary'); stores.push(a, b);
    b.db.prepare("INSERT INTO effects(id, work_key, status, body) VALUES('e1', 'cms-field-vocabulary:delivery:job-1', 'uncertain', ?)").run(JSON.stringify({ attemptId: 'attempt-1' }));
    const asked: [string, string][] = [];
    const { observations, unreadable } = observeProjects([{ store: a }, { store: b }], (entry, lane) => {
        asked.push([entry.store.project.id, lane]);
        return [{ ...item('delivery', `${lane}-item`, lane, 'blocked', 'x', 'unclassified', entry.store.project.id), rank: 3, execute: () => { throw new Error('never run'); } } as any];
    }, AT);
    expect(asked).toEqual(['brain', 'cms-field-vocabulary'].flatMap(id => LANES.map(lane => [id, lane])));
    expect(observations.map(o => [o.projectId, o.provider, o.now])).toEqual([['brain', 'github', AT], ['cms-field-vocabulary', 'github', AT]]);
    expect(observations[0].state).toBe(a.state);
    expect(observations[0].progression.map(p => p.work.id)).toEqual(LANES.map(lane => `${lane}-item`));
    // Only what a collector reads is carried: no executor comes along.
    expect(Object.keys(observations[0].progression[0]).sort()).toEqual(['eligibility', 'stage', 'work']);
    expect([...observations[0].unsettled.workKeys]).toEqual([]);
    expect([...observations[1].unsettled.workKeys]).toEqual(['cms-field-vocabulary:delivery:job-1']);
    expect([...observations[1].unsettled.attempts]).toEqual(['attempt-1']);
    expect(unreadable).toEqual([]);
    expect(Object.isFrozen(observations[0].holds)).toBe(true);
});

test('a project that cannot be read is named and left out; the others are still observed', () => {
    const a = projectStore('brain'), b = projectStore('cms-field-vocabulary'); stores.push(a, b);
    const { observations, unreadable } = observeProjects([{ store: a }, { store: b }], entry => { if (entry.store.project.id === 'brain') throw new Error('projection failed'); return []; }, AT);
    expect(observations.map(o => o.projectId)).toEqual(['cms-field-vocabulary']);
    expect(unreadable).toEqual([{ projectId: 'brain', error: 'Error: projection failed' }]);
});
