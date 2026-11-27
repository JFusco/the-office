import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { reconcileReadRetries } from '../../../../server/scheduling/read-retries';
import type { ReadRetry, TicketJob } from '../../../../src/shared';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => { try { store.close(); } catch { /* closed */ } }); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
const HEAD = 'a'.repeat(40), SERVER_ERROR = 'Error: gh exited 1: gh: HTTP 503', T0 = new Date('2026-11-27T12:00:00.000Z');
const job = (id: string, retry: ReadRetry, extra: Partial<TicketJob> = {}) => ({ id, key: `GH-${id.length}`, stage: 'review', status: 'blocked', detail: SERVER_ERROR, head: HEAD, branch: 'b', worktree: '', pr: 0, prUrl: '',
    requestedAt: T0.toISOString(), stop: { kind: 'transient', at: T0.toISOString() }, steps: [], retry, ...extra }) as unknown as TicketJob;

/** Saves records as the old planner left them, then loads them again as a deploy does. */
function reload(jobs: TicketJob[]) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-legacy-retry-')); roots.push(root);
    const path = resolve(root, 'office.sqlite'), project = projectById('brain');
    const before = new Store(path, project, root);
    before.state.coordination = coordination(); before.state.coordination.jobs = jobs; before.save(); before.close();
    const store = new Store(path, project, root); stores.push(store);
    store.state.paused = false;
    return { store, find: (id: string) => store.state.coordination!.jobs!.find(candidate => candidate.id === id)! };
}

test('a spent legacy allowance stays spent on deploy, whether or not the old planner marked it, even for a server error', () => {
    const { store, find } = reload([
        job('explicit', { attempts: 3, nextAt: '', history: [], exhausted: true }),
        job('unmarked', { attempts: 3, nextAt: '', history: [], exhausted: false }),
    ]);
    expect(find('explicit').retry).toMatchObject({ stage: 'review', head: HEAD, exhausted: true, limit: 3 });
    expect(find('unmarked').retry).toMatchObject({ stage: 'review', head: HEAD, exhausted: true, limit: 3 });
    for (let hour = 0; hour < 4; hour++) reconcileReadRetries(store, new Date(T0.getTime() + hour * 3600_000));
    for (const id of ['explicit', 'unmarked']) {
        expect(find(id).retry).toMatchObject({ attempts: 3, nextAt: '', exhausted: true });
        expect(find(id).status).toBe('blocked');
    }
});

test('a valid outstanding legacy timer is kept and fires once; a queued final try runs once and is then spent', () => {
    const timer = new Date(T0.getTime() + 60_000).toISOString();
    const { store, find } = reload([
        job('timer', { attempts: 1, nextAt: timer, history: [{ at: T0.toISOString(), detail: SERVER_ERROR }], exhausted: false }),
        job('final', { attempts: 3, nextAt: '', history: [], exhausted: false }, { status: 'queued', detail: 'Automatic read-only retry 3/3 queued. Original failure retained in retry history.' }),
    ]);
    expect(find('timer').retry).toMatchObject({ stage: 'review', head: HEAD, attempts: 1, nextAt: timer, history: [{ detail: SERVER_ERROR }] });
    expect(find('final').retry).toMatchObject({ stage: 'review', head: HEAD, attempts: 3, exhausted: false, limit: 3 });
    reconcileReadRetries(store, new Date(timer));
    expect(find('timer')).toMatchObject({ status: 'queued', retry: { attempts: 2, nextAt: '' } });
    expect(find('timer').retry!.binding).toMatchObject({ mode: 'read', stop: T0.toISOString(), stage: 'review', head: HEAD });
    // The final try is still queued, untouched; when it fails, nothing more is planned.
    expect(find('final').status).toBe('queued');
    Object.assign(find('final'), { status: 'blocked', detail: SERVER_ERROR, stop: { kind: 'transient', at: new Date(T0.getTime() + 120_000).toISOString() } });
    reconcileReadRetries(store, new Date(T0.getTime() + 180_000));
    expect(find('final').retry).toMatchObject({ attempts: 3, exhausted: true, nextAt: '' });
});

test('a genuinely new stop at another stage or head gets a fresh allowance, the six-step one for a server error', () => {
    const { store, find } = reload([job('moved', { attempts: 3, nextAt: '', history: [], exhausted: true })]);
    const moved = find('moved');
    Object.assign(moved, { stage: 'lead-pr', stop: { kind: 'transient', at: new Date(T0.getTime() + 60_000).toISOString() } });
    reconcileReadRetries(store, new Date(T0.getTime() + 61_000));
    expect(moved.retry).toMatchObject({ stage: 'lead-pr', head: HEAD, attempts: 0, exhausted: false, limit: 6 });
    expect(moved.retry!.nextAt).toBeTruthy();
});
