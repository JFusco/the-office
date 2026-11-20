import { afterEach, expect, test } from 'vitest';
import { improvements } from '../../../../server/incidents/sources/improvements';
import type { Store } from '../../../../server/store/store';
import { observe, projectStore } from '../incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store(id?: string) { const s = projectStore(id); stores.push(s); return s; }
const P = 'cms-field-vocabulary';

test('open proposals addressed to the Office harness', () => {
    const s = store();
    s.state.knowledge = { improvements: [
        { id: 'imp-1', destination: 'office-harness', status: 'needs-input', cause: 'Reviews restart from scratch after a timeout', digest: 'd1' },
        { id: 'imp-2', destination: 'office-harness', status: 'uncertain', cause: 'c', digest: 'd2' },
        { id: 'imp-3', destination: 'office-harness', status: 'closed', cause: 'c', digest: 'd3' },
        { id: 'imp-4', destination: P, status: 'open', cause: 'c', digest: 'd4' },
    ] } as any;
    const found = improvements(observe(s));
    expect(found.map(f => [f.subject.id, f.subject.episode, f.cause.author, f.expected, f.subject.unsettledEffect])).toEqual([['imp-1', 'd1', 'model', null, false], ['imp-2', 'd2', 'model', 'uncertain-effect', true]]);
    expect(found[0].evidence).toBe('Reviews restart from scratch after a timeout');
});

test('in the Office\'s own project a proposal saved under that project\'s ID is addressed to the harness', () => {
    const s = store();
    s.state.knowledge = { improvements: [{ id: 'imp-1', destination: s.project.id, status: 'open', cause: 'c', digest: 'd' }] } as any;
    expect(improvements(observe(s))).toEqual([]);
    expect(improvements({ ...observe(s), repository: 'JFusco/the-office' }).map(f => f.subject.id)).toEqual(['imp-1']);
});
