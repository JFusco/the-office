import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { currentOutbox } from '../../../server/conversations/current-outbox';
import { projectOutbox } from '../../../server/conversations/outbox';
import { REPAIR_WAIT_MS } from '../../../server/incidents/repair/repair-wait';
import { apiRoute } from '../../../server/office/http/api-routes';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { Store } from '../../../server/store/store';
import { markAwaitingRepair } from '../incidents/repair/mark-fixture';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { vi.useRealTimers(); stores.splice(0).forEach(store => { try { store.close(); } catch { /* closed by the test */ } }); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
const PROGRESS = new Date('2026-11-20T12:00:00.000Z'), EXPIRY = PROGRESS.getTime() + REPAIR_WAIT_MS;
const stoppedJob = () => ({ id: 'job', key: 'GH-173', status: 'blocked', stage: 'lead-pr', requestedAt: '2026-11-19T19:00:00Z', detail: 'Error: Worktree is missing', head: 'abc1234', stop: { kind: 'unclassified', at: '2026-11-19T19:46:40.000Z' }, steps: [], pr: 176, prUrl: 'https://example.test/pr/176', retry: { attempts: 3, nextAt: '', history: [], exhausted: true } });
/** A project store on its own clock, holding one stopped job a harness repair covers. The system clock is set far past the wait, so only the store's clock can keep it in effect. */
function held(path = ':memory:', root = mkdtempSync(resolve(tmpdir(), 'office-current-outbox-'))) {
    if (!roots.includes(root)) roots.push(root);
    const time = { now: new Date(EXPIRY - 1) };
    const store = new Store(path === ':memory:' ? path : resolve(root, path), projectById('brain'), root, { now: () => time.now, monotonic: () => 0 }); stores.push(store);
    store.state.coordination ??= coordination();
    store.state.coordination.jobs = [stoppedJob()] as never;
    markAwaitingRepair(store.state, 'brain', { kind: 'delivery', id: 'job' }, 'lead-pr', { since: PROGRESS.toISOString(), progressAt: PROGRESS.toISOString() });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(EXPIRY + 3_600_000);
    return { store, time, root };
}
const open = (actions: { id: string; status: string }[]) => actions.filter(action => action.status === 'open').map(action => action.id);

test('the current outbox hides what a repair wait holds, by the store\'s own clock and the project\'s writes as they are now', () => {
    const { store, time } = held();
    expect(open(projectOutbox(store.state, time.now))).toEqual(['ticket-job:job']);
    expect(open(currentOutbox(store))).toEqual([]);
    // A write for the job turns uncertain: it is Joe's to read back at once.
    store.db.prepare("INSERT INTO effects(id, work_key, status, body) VALUES('e1', 'brain:delivery:job', 'uncertain', '{}')").run();
    expect(open(currentOutbox(store))).toEqual(['ticket-job:job']);
    store.db.prepare("DELETE FROM effects WHERE id='e1'").run();
    expect(open(currentOutbox(store))).toEqual([]);
    // A scoped copy of the state is what is projected, with the same reads: its own records decide what it shows.
    const scoped = { ...store.state, coordination: { ...store.state.coordination!, jobs: [{ ...stoppedJob(), id: 'scoped', key: 'GH-200' }] } } as never;
    expect(open(currentOutbox(store, scoped))).toEqual(['ticket-job:scoped']);
    expect(open(currentOutbox(store, { ...store.state }))).toEqual([]);
    time.now = new Date(EXPIRY);
    expect(open(currentOutbox(store))).toEqual(['ticket-job:job']);
    expect(open(currentOutbox(store, scoped))).toEqual(['ticket-job:scoped']);
});

test('an event saves the outbox that way, and saves the request back once the wait has run out', () => {
    const { store, time } = held();
    store.emit('note', 'something happened');
    expect(open(store.state.outbox)).toEqual([]);
    time.now = new Date(EXPIRY);
    store.emit('note', 'something else happened');
    expect(open(store.state.outbox)).toEqual(['ticket-job:job']);
});

test('start-up recovery saves the outbox that way too', () => {
    const { store, time, root } = held('office.sqlite');
    store.save();
    store.close();
    const reopened = new Store(resolve(root, 'office.sqlite'), projectById('brain'), root, { now: () => time.now, monotonic: () => 0 }); stores.push(reopened);
    reopened.recover();
    expect(reopened.state.coordination!.jobs![0].status).toBe('blocked');
    expect(open(reopened.state.outbox)).toEqual([]);
    time.now = new Date(EXPIRY);
    reopened.recover();
    expect(open(reopened.state.outbox)).toEqual(['ticket-job:job']);
});

test('the messages endpoint serves the outbox as it reads now, whatever was last saved', async () => {
    const { store, time } = held();
    const url = new URL('http://127.0.0.1:4318/api/messages');
    const served = async () => open((await (await apiRoute(new Request(url), url, { store, offices: { stores: () => new Map(), entries: new Map() }, engine: { features: {} }, project: 'brain' } as never))!.json()).outbox);
    store.state.outbox = projectOutbox(store.state, time.now);
    expect(open(store.state.outbox)).toEqual(['ticket-job:job']);
    expect(await served()).toEqual([]);
    time.now = new Date(EXPIRY);
    expect(await served()).toEqual(['ticket-job:job']);
});
