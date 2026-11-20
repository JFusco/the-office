import { expect, test } from 'vitest';
import { gateMark, neverStarted } from '../../../../server/maintenance/brain/not-started';

const mark = { slotDate: '2026-11-19', attempts: 0, active: '', completed: 'c1', head: 'h1', changes: '' };
const blocked = (extra: object = {}) => ({ status: 'blocked' as const, gateBefore: mark,
    steps: [{ role: 'pm' as const, stage: 'brain-maintenance', at: '', result: { outcome: 'blocked' as const, summary: '', ledger: '', blocker: 'ownership-coverage-incomplete', receipts: [], candidates: [] } }], ...extra }) as any;

test('a blocked run that left the nightly gate untouched and wrote nothing never started', () => {
    expect(neverStarted(blocked(), { ...mark })).toBe(true);
    expect(gateMark({ slotDate: 'd', attempts: 2, active: { id: 'a' }, completed: null }, { head: 'h', changes: ' M x' })).toEqual({ slotDate: 'd', attempts: 2, active: 'a', completed: '', head: 'h', changes: ' M x' });
});

test.each([
    ['the gate counted an attempt', blocked(), { ...mark, attempts: 1 }],
    ['a run is active at the gate', blocked(), { ...mark, active: 'a1' }],
    ['the completed run changed', blocked(), { ...mark, completed: 'c2' }],
    ['the slot rolled over', blocked(), { ...mark, slotDate: '2026-11-20' }],
    ['the checkout moved', blocked(), { ...mark, head: 'h2' }],
    ['the checkout has new uncommitted changes', blocked(), { ...mark, changes: ' M README.md' }],
    ['the checkout could not be read', blocked({ gateBefore: { ...mark, head: '' } }), { ...mark, head: '' }],
    ['a catalog refresh stopped', (() => { const r = blocked(); r.steps[0].result.blocker = 'catalog-refresh-incomplete'; return r; })(), mark],
    ['no mark was saved before dispatch', blocked({ gateBefore: undefined }), mark],
    ['a run was already active before dispatch', blocked({ gateBefore: { ...mark, active: 'a0' } }), { ...mark, active: '' }],
    ['the worker reported a receipt', (() => { const r = blocked(); r.steps[0].result.receipts = [{ id: 'x', action: 'git-push', target: 'main', verified: false, uncertain: true, detail: '' }]; return r; })(), mark],
    ['a read-back already ran', (() => { const r = blocked(); r.steps.push(r.steps[0]); return r; })(), mark],
    ['the run is interrupted, not blocked', blocked({ status: 'interrupted' }), mark],
    ['the worker did not return blocked', (() => { const r = blocked(); r.steps[0].result.outcome = 'passed'; return r; })(), mark],
])('it is read back as before when %s', (_name, run, now) => {
    expect(neverStarted(run, now)).toBe(false);
});
