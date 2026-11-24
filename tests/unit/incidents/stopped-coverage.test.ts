import { afterEach, expect, test } from 'vitest';
import { groupCandidates } from '../../../server/incidents/candidates';
import { frozenKey, planSync } from '../../../server/incidents/plan-sync';
import { stoppedCoverage } from '../../../server/incidents/stopped-coverage';
import type { Store } from '../../../server/store/store';
import { AT, candidate, item, observe, projectStore } from './incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store() { const s = projectStore('brain'); stores.push(s); return s; }
const open = planSync([], groupCandidates([candidate({ id: 'job-saved' }), candidate({ projectId: 'cms-field-vocabulary', id: 'elsewhere' }),
    candidate({ kind: 'outbox', id: 'ticket:GH-1:x' }, { cause: { source: 'outbox', provider: 'github', stage: 'x', kind: 'x', text: 't', author: 'harness' } })]), AT).incidents;

test('what stopped work reported now; the subjects the ledger keeps only while stopped work cannot be read', () => {
    const s = store(), reports = [candidate({ id: 'job-now' })];
    expect([...stoppedCoverage(observe(s), reports, open, new Set())]).toEqual(['brain/delivery/job-now']);
    expect([...stoppedCoverage(observe(s), reports, open, new Set([frozenKey('brain', 'stopped-work')]))].sort()).toEqual(['brain/delivery/job-now', 'brain/delivery/job-saved']);
    // A failed first read covers nothing new.
    expect([...stoppedCoverage(observe(s), null, [], new Set([frozenKey('brain', 'stopped-work')]))]).toEqual([]);
});

test('while the project is paused, every stopped record the pause stands for', () => {
    const s = store();
    s.state.paused = true;
    s.state.coordination!.jobs = [{ id: 'job-1', key: 'GH-1', status: 'blocked', stage: 'review', detail: 'd', head: 'h', requestedAt: 'r', steps: [] }, { id: 'job-2', key: 'GH-2', status: 'queued', stage: 'review', detail: '', head: 'h', requestedAt: 'r', steps: [] }] as any;
    const projected = [item('delivery', 'job-1', 'review', 'waiting', 'Paused', undefined, 'brain'), item('delivery', 'job-2', 'review', 'waiting', 'Paused', undefined, 'brain')];
    expect([...stoppedCoverage(observe(s, projected), [], [], new Set())]).toEqual(['brain/delivery/job-1']);
});
