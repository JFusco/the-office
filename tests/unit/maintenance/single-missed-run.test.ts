import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { projectOutbox } from '../../../server/conversations/outbox';
import { leftToNextRun } from '../../../server/maintenance/single-missed-run';
import { maintenanceNeedsFollowup } from '../../../server/maintenance/follow-up-alerts';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
type Night = [day: number, status: string, extra?: Record<string, unknown>];
/** Nights of November as daily runs, each with its checkpoint; read-backs are used up on a stopped one. */
function nights(project: string, ...rows: Night[]) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-single-miss-')); roots.push(root);
    const store = new Store(':memory:', projectById(project), root); stores.push(store);
    store.state.coordination = coordination();
    const day = (n: number) => String(n).padStart(2, '0');
    store.state.maintenance = { runs: rows.map(([n, status, extra]) => ({ id: `run-${n}`, requestedAt: `2026-11-${day(n)}T22:00:00Z`, status, stage: status === 'completed' ? 'brain-completed' : 'brain-maintenance', weekly: false, steps: [],
        error: status === 'completed' ? '' : 'incomplete-live-session-inventory', checkpointId: `checkpoint-${n}`, ...(status === 'completed' || status === 'reconciled' ? {} : { readbackRetry: { attempts: 3, nextAt: '', history: [], exhausted: true } }), ...extra })), lastDaily: '', lastWeekly: '', ledger: '' } as any;
    store.state.coordination.checkpoints = rows.map(([n, status]) => ({ id: `checkpoint-${n}`, date: `2026-11-${day(n)}`, runId: `run-${n}`, status: ['completed', 'reconciled'].includes(status) ? 'completed' : 'blocked', detail: 'incomplete-live-session-inventory' })) as any;
    const open = () => projectOutbox(store.state).filter(item => item.status === 'open').map(item => item.id);
    const run = (n: number) => store.state.maintenance!.runs.find(candidate => candidate.id === `run-${n}`)!;
    return { store, open, run };
}

test('one missed night on a hands-off project is left to the next scheduled run: no outbox item, and the record is untouched', () => {
    const f = nights('brain', [18, 'completed'], [19, 'blocked']);
    expect(leftToNextRun(f.store.state, f.run(19))).toBe(true);
    expect(f.open()).toEqual([]);
    // Morgan's maintenance view still has it, so the daily checkpoint stays merged with its run.
    expect(maintenanceNeedsFollowup(f.store.state, f.run(19))).toBe(true);
    expect(f.run(19)).toMatchObject({ status: 'blocked', error: 'incomplete-live-session-inventory' });
});

test('a second stopped night in a row reaches a person as one item; the first belongs to the run that took it over', () => {
    const f = nights('brain', [18, 'completed'], [19, 'blocked'], [20, 'blocked', { supersedes: ['run-19'] }]);
    expect([leftToNextRun(f.store.state, f.run(19)), leftToNextRun(f.store.state, f.run(20))]).toEqual([true, false]);
    expect(f.open()).toEqual(['maintenance:run-20']);
});

test('the first run ever, an interrupted run, and a miss after a reconciled night are single misses too', () => {
    expect(nights('brain', [19, 'blocked']).open()).toEqual([]);
    expect(nights('brain', [18, 'completed'], [19, 'interrupted']).open()).toEqual([]);
    expect(nights('brain', [18, 'reconciled'], [19, 'blocked']).open()).toEqual([]);
});

test('a later completed night closes everything, as before', () => {
    const f = nights('brain', [19, 'blocked'], [20, 'blocked', { supersedes: ['run-19'] }], [21, 'completed', { supersedes: ['run-20'] }]);
    expect(f.open()).toEqual([]);
});

test.each<[string, () => ReturnType<typeof nights>, string[]]>([
    ['the project is not hands-off', () => nights('cec', [18, 'completed'], [19, 'blocked']), ['maintenance:run-19']],
    ['the run is weekly', () => nights('brain', [18, 'completed'], [19, 'blocked', { weekly: true }]), ['maintenance:run-19']],
    ['an older stopped run was never taken over and a later one stopped too', () => nights('brain', [18, 'blocked'], [19, 'blocked']), ['maintenance:run-19', 'maintenance:run-18']],
])('the item is shown as before when %s', (_name, build, expected) => {
    expect(build().open().sort()).toEqual([...expected].sort());
});

test('a weekly run between two nights does not hide a second daily miss', () => {
    const f = nights('brain', [17, 'blocked'], [18, 'completed', { weekly: true, stage: 'weekly' }], [19, 'blocked', { supersedes: ['run-17'] }]);
    expect(leftToNextRun(f.store.state, f.run(19))).toBe(false);
});
