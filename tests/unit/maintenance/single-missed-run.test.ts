import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { projectOutbox } from '../../../server/conversations/outbox';
import { leftToNextRun, NEXT_RUN_DUE_MS } from '../../../server/maintenance/single-missed-run';
import { maintenanceNeedsFollowup } from '../../../server/maintenance/follow-up-alerts';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
const HOUR = 60 * 60 * 1000, EXHAUSTED = { readbackRetry: { attempts: 3, nextAt: '', history: [], exhausted: true } };
type Row = [id: string, hoursAgo: number, status: string, extra?: Record<string, unknown>];
/** Daily runs at the given ages; a stopped one has used up its automatic read-backs unless told otherwise. */
function runs(project: string, ...rows: Row[]) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-single-miss-')); roots.push(root);
    const store = new Store(':memory:', projectById(project), root); stores.push(store);
    store.state.coordination = coordination();
    // Anchored at 23:00 UTC so that "an hour ago" and "a day ago" fall on different nights.
    const now = new Date('2026-11-20T23:00:00Z');
    store.state.maintenance = { runs: rows.map(([id, hoursAgo, status, extra]) => ({ id, requestedAt: new Date(now.getTime() - hoursAgo * HOUR).toISOString(), status, stage: status === 'completed' ? 'brain-completed' : 'brain-maintenance', weekly: false, steps: [],
        error: status === 'completed' ? '' : 'incomplete-live-session-inventory', ...(['blocked', 'interrupted'].includes(status) ? EXHAUSTED : {}), ...extra })), lastDaily: '', lastWeekly: '', ledger: '' } as any;
    const open = (at = now) => projectOutbox(store.state, at).filter(item => item.status === 'open').map(item => item.id).sort();
    const run = (id: string) => store.state.maintenance!.runs.find(candidate => candidate.id === id)!;
    const left = (id: string, at = now) => leftToNextRun(store.state, run(id), at);
    return { store, now, open, run, left };
}

test('one missed night after a completed one is left to the next scheduled run, and the record is untouched', () => {
    const f = runs('brain', ['mon', 25, 'completed'], ['tue', 1, 'blocked']);
    expect(f.left('tue')).toBe(true);
    // Morgan's maintenance view still has it, so the daily checkpoint stays merged with its run.
    expect(maintenanceNeedsFollowup(f.store.state, f.run('tue'))).toBe(true);
    expect(f.run('tue')).toMatchObject({ status: 'blocked', error: 'incomplete-live-session-inventory' });
});

test('the first night on record and an interrupted run are single misses too', () => {
    expect(runs('brain', ['tue', 1, 'blocked']).left('tue')).toBe(true);
    expect(runs('brain', ['mon', 25, 'completed'], ['tue', 1, 'interrupted']).left('tue')).toBe(true);
});

test('a second stopped night in a row reaches a person as one item, the later run\'s', () => {
    const f = runs('brain', ['sun', 49, 'completed'], ['mon', 25, 'blocked'], ['tue', 1, 'blocked']);
    expect([f.left('mon'), f.left('tue')]).toEqual([true, false]);
});

test('once the next night\'s run is overdue the item appears, whatever happened since', () => {
    const f = runs('brain', ['mon', 25, 'completed'], ['tue', 1, 'blocked']);
    const due = new Date(Date.parse(f.run('tue').requestedAt) + NEXT_RUN_DUE_MS);
    expect([f.left('tue', new Date(due.getTime() - 1)), f.left('tue', due)]).toEqual([true, false]);
    // A later run that re-observed nothing does not keep it hidden: a gate skip, a run only read back, one still queued.
    for (const [status, stage] of [['completed', 'skipped'], ['reconciled', 'brain-maintenance'], ['queued', 'brain-maintenance']]) {
        const g = runs('brain', ['sun', 50, 'completed'], ['mon', 27, 'blocked'], ['tue', 1, status, { stage }]);
        expect(g.left('mon')).toBe(false);
    }
});

test('a night that only ended in a read-back, or in never-started retries, counts as missed', () => {
    // Last night's attempts were marked reconciled and tried again, and the last one stopped; tonight stops as well.
    const f = runs('brain', ['mon-1', 25.4, 'reconciled'], ['mon-2', 25.2, 'reconciled'], ['mon-3', 25, 'blocked'], ['tue-1', 1.2, 'reconciled'], ['tue-2', 1, 'blocked']);
    expect([f.left('mon-3'), f.left('tue-2')]).toEqual([true, false]);
    // Tonight's earlier attempts are the same night: after a completed night, tonight's last stop is still one miss.
    const g = runs('brain', ['mon', 25, 'completed'], ['tue-1', 1.2, 'reconciled'], ['tue-2', 1, 'blocked']);
    expect(g.left('tue-2')).toBe(true);
    // A night that ended reconciled is not a completed night.
    const h = runs('brain', ['mon', 25, 'reconciled'], ['tue', 1, 'blocked']);
    expect(h.left('tue')).toBe(false);
});

test.each<[string, () => ReturnType<typeof runs>]>([
    ['the project is not hands-off', () => runs('cec', ['mon', 25, 'completed'], ['tue', 1, 'blocked'])],
    ['the run is weekly', () => runs('brain', ['mon', 25, 'completed'], ['tue', 1, 'blocked', { weekly: true }])],
    ['its automatic read-backs are not used up', () => runs('brain', ['mon', 25, 'completed'], ['tue', 1, 'blocked', { readbackRetry: { attempts: 1, nextAt: '', history: [], exhausted: false } }])],
    ['the project has no automatic read-back', () => runs('cms-field-vocabulary', ['mon', 25, 'completed'], ['tue', 1, 'blocked', { readbackRetry: undefined }])],
    ['the run is not stopped', () => runs('brain', ['mon', 25, 'completed'], ['tue', 1, 'completed'])],
])('the rule does not apply when %s', (_name, build) => {
    expect(build().left('tue')).toBe(false);
});

test('a weekly run between two nights does not stand in for a completed night', () => {
    const f = runs('brain', ['sun', 49, 'blocked'], ['mon', 25, 'completed', { weekly: true }], ['tue', 1, 'blocked']);
    expect(f.left('tue')).toBe(false);
});

test('in the outbox: nothing for one miss, one item for two in a row, nothing once a later night completes', () => {
    expect(runs('brain', ['mon', 25, 'completed'], ['tue', 1, 'blocked']).open()).toEqual([]);
    expect(runs('brain', ['sun', 49, 'completed'], ['mon', 25, 'blocked'], ['tue', 1, 'blocked']).open()).toEqual(['maintenance:tue']);
    expect(runs('brain', ['sun', 49, 'blocked'], ['mon', 25, 'blocked'], ['tue', 1, 'completed']).open()).toEqual([]);
    expect(runs('cec', ['mon', 25, 'completed'], ['tue', 1, 'blocked']).open()).toEqual(['maintenance:tue']);
});
