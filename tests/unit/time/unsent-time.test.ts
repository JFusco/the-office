import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { coordination } from '../../../server/scheduling/coordination';
import { timeLedger, TimeLedger } from '../../../server/time/time-ledger';
import { dueReadback } from '../../../server/time/time-readback';
import { dueUnsent, releaseUnsent, unsentWait } from '../../../server/time/unsent-time';
import { projectById } from '../../../server/office/projects';
const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(s => s.close()));

const START = '2026-11-16T22:53:55.000Z';
const at = (minutes: number) => new Date(Date.parse(START) + minutes * 60000);
/** A day marked uncertain by a failed read: three earlier writes are verified, the board holds the last of them, and 245s are measured. */
function failedRead(project = 'brain') {
    const store = new Store(':memory:', projectById(project)); stores.push(store);
    store.state.coordination = coordination();
    let clock = at(0);
    (store as any).clock = { now: () => clock };
    const l = timeLedger(store);
    Object.assign(l, { activatedAt: '2026-10-28T00:00:00Z', enabled: true, githubField: true });
    l.entries = [{ id: 'GH-395:2026-11-16', key: 'GH-395', date: '2026-11-16', seconds: 245, sourceIds: [], status: 'uncertain', detail: 'Time sync needs read-back; no automatic retry: Error: gh exited 1: gh: HTTP 499', url: '' }] as any;
    l.baselines = { 'GH-395': { baseline: 0, lastWritten: 0.0356, itemId: 'ITEM' } };
    l.publications = [{ id: 'p3', provider: 'github', key: 'GH-395', status: 'verified', projectId: project, itemId: 'ITEM', fieldId: 'FIELD', worklogId: '', baseline: 0, previousValue: 0.0219, intendedValue: 0.0356, covered: [{ id: 'GH-395:2026-11-16', revision: 8, seconds: 128 }], payload: {}, createdAt: '2026-11-16T22:51:13.489Z', detail: '' }];
    let board = 0.0356, writes = 0, failReads = false;
    const execute = async (_b: string, _a: string[], opts: any) => {
        const { query, variables } = JSON.parse(opts.input);
        if (query.includes('mutation')) { writes++; board = variables.hours; return '{}'; }
        if (failReads) throw new Error('gh exited 1: gh: HTTP 499');
        if (query.includes('user(login:')) return JSON.stringify({ data: { user: { projectV2: { id: 'PROJECT', fields: { nodes: [{ id: 'FIELD', name: 'Time Spent (Hours)', dataType: 'NUMBER' }], pageInfo: { hasNextPage: false } } } } } });
        if (query.includes('items(first:')) return JSON.stringify({ data: { node: { items: { nodes: [{ id: 'ITEM', content: { number: 395, repository: { nameWithOwner: store.project.repository } }, fieldValues: { nodes: [{ number: board, field: { id: 'FIELD' } }], pageInfo: { hasNextPage: false } } }], pageInfo: { hasNextPage: false } } } } });
        return JSON.stringify({ data: { node: { fieldValues: { nodes: [{ number: board, field: { id: 'FIELD' } }], pageInfo: { hasNextPage: false } } } } });
    };
    /** One scheduler pass at this minute: release a due day, then run the ordinary sync. */
    const pass = async (minutes: number) => { clock = at(minutes); const due = dueUnsent(store, clock); if (due) releaseUnsent(store, due.id); await new TimeLedger(store, execute as any).sync(); return due; };
    return { store, l, pass, execute: execute as any, board: () => board, writes: () => writes, setBoard: (v: number) => { board = v; }, failReads: (v: boolean) => { failReads = v; }, setClock: (m: number) => { clock = at(m); } };
}

test('a day marked uncertain with no write behind it is returned to pending and the current total is written with read-back', async () => {
    const x = failedRead();
    // The read-back has nothing to check: no write for this ticket is uncertain.
    expect(dueReadback(x.store, at(0))).toBeNull();
    expect(dueUnsent(x.store, at(0))?.id).toBe('GH-395:2026-11-16');
    await x.pass(0);
    expect(x.l.entries[0]).toMatchObject({ status: 'posted', detail: '245s of measured Office work attributed to Joe; board total 0.0681h. Baseline 0h preserved.' });
    expect([x.board(), x.writes()]).toEqual([0.0681, 1]);
    expect(x.l.publications!.at(-1)).toMatchObject({ status: 'verified', previousValue: 0.0356, intendedValue: 0.0681 });
    // A day that posted starts afresh.
    expect(x.l.entries[0].unsentReleases).toBeUndefined();
    expect(x.store.state.events.some(event => event.kind === 'time-unsent-released')).toBe(true);
});

test('a sync that stops before writing says nothing was sent and is tried again with growing pauses, with no last try', async () => {
    const x = failedRead();
    x.failReads(true);
    await x.pass(0);
    expect(x.l.entries[0]).toMatchObject({ status: 'uncertain', unsentReleases: 1, detail: 'Time sync stopped before writing, so nothing was sent; the Office tries again: Error: gh exited 1: gh: HTTP 499' });
    expect(x.l.publications).toHaveLength(1);
    // Paced from the failure: fifteen minutes after the first retry, forty-five after the second.
    expect([unsentWait(0), unsentWait(1), unsentWait(2), unsentWait(9)].map(ms => ms / 60000)).toEqual([5, 15, 45, 360]);
    expect(dueUnsent(x.store, at(14))).toBeNull();
    await x.pass(15);
    expect(x.l.entries[0].unsentReleases).toBe(2);
    expect(dueUnsent(x.store, at(59))).toBeNull();
    expect(dueUnsent(x.store, at(60))?.id).toBe('GH-395:2026-11-16');
    // Once the board can be read again, the next try posts and the day starts afresh.
    x.failReads(false);
    await x.pass(60);
    expect(x.l.entries[0]).toMatchObject({ status: 'posted' });
    expect(x.l.entries[0].unsentReleases).toBeUndefined();
    expect([x.board(), x.writes()]).toEqual([0.0681, 1]);
});

test('a first sync that stops before its baseline is read sends nothing and is tried again with growing pauses until it posts', async () => {
    const x = failedRead();
    Object.assign(x.l.entries[0], { status: 'pending', detail: '' });
    x.l.baselines = {}; x.l.publications = [];
    x.setBoard(0.5);
    x.failReads(true);
    await x.pass(0);
    expect(x.l.entries[0]).toMatchObject({ status: 'uncertain', unsentReleases: 0, detail: 'Time sync stopped before writing, so nothing was sent; the Office tries again: Error: gh exited 1: gh: HTTP 499' });
    expect([x.writes(), x.l.publications, x.l.baselines]).toEqual([0, [], {}]);
    expect(dueUnsent(x.store, at(4))).toBeNull();
    expect(dueUnsent(x.store, at(5))?.id).toBe('GH-395:2026-11-16');
    await x.pass(5);
    expect(x.l.entries[0]).toMatchObject({ status: 'uncertain', unsentReleases: 1 });
    expect(dueUnsent(x.store, at(19))).toBeNull();
    expect(dueUnsent(x.store, at(20))?.id).toBe('GH-395:2026-11-16');
    expect(x.writes()).toBe(0);
    // Once the board can be read, the baseline is captured and the absolute total is written once and read back.
    x.failReads(false);
    await x.pass(20);
    expect(x.l.entries[0]).toMatchObject({ status: 'posted', detail: '245s of measured Office work attributed to Joe; board total 0.5681h. Baseline 0.5h preserved.' });
    expect(x.l.entries[0].unsentReleases).toBeUndefined();
    expect(x.l.entries[0].unsentCheckedAt).toBeUndefined();
    expect([x.board(), x.writes()]).toEqual([0.5681, 1]);
    expect(x.l.baselines!['GH-395']).toMatchObject({ baseline: 0.5, lastWritten: 0.5681 });
    expect(x.l.publications!.map(publication => publication.status)).toEqual(['verified']);
});

test('a board changed outside the Office is never overwritten: the day says so and stays visible', async () => {
    const x = failedRead();
    x.setBoard(0.5);
    await x.pass(0);
    expect(x.l.entries[0]).toMatchObject({ status: 'uncertain', detail: 'Time sync stopped before writing, so nothing was sent; the Office tries again: Error: Board hours changed outside the Office; reconcile before overwriting' });
    expect([x.board(), x.writes()]).toEqual([0.5, 0]);
});

test('a reconcile asked for a day with no write outstanding writes the current total instead of refusing', async () => {
    const x = failedRead();
    await new TimeLedger(x.store, x.execute).sync('GH-395');
    expect(x.l.entries[0]).toMatchObject({ status: 'posted', detail: expect.stringContaining('board total 0.0681h') });
    expect([x.board(), x.writes()]).toEqual([0.0681, 1]);
});

test('a ticket with no saved baseline is not this rule\'s: a legacy uncertain day keeps its explicit reconciliation', async () => {
    const x = failedRead();
    x.l.baselines = {};
    expect(dueUnsent(x.store, at(0))).toBeNull();
    await new TimeLedger(x.store, x.execute).sync('GH-395');
    expect(x.l.entries[0]).toMatchObject({ status: 'uncertain', detail: expect.stringContaining('Time sync needs read-back; no automatic retry: Error: Frozen publication identity is missing') });
    expect(x.writes()).toBe(0);
    // A failed reconcile does not make it one: it is never released, and an ordinary sync leaves it alone.
    expect(x.l.entries[0].unsentReleases).toBeUndefined();
    expect(dueUnsent(x.store, at(600))).toBeNull();
    await x.pass(600);
    expect([x.l.entries[0].status, x.writes()]).toEqual(['uncertain', 0]);
});

test('a day whose write may have landed keeps its read-back and is never released by this rule', () => {
    const x = failedRead();
    x.l.publications!.push({ ...x.l.publications![0], id: 'p4', status: 'uncertain', previousValue: 0.0356, intendedValue: 0.0681, createdAt: START });
    expect(dueUnsent(x.store, at(0))).toBeNull();
    // Nor is one an ordinary sync recorded as stopped before writing, while that write is unsettled.
    x.l.entries[0].unsentReleases = 0;
    expect(dueUnsent(x.store, at(0))).toBeNull();
    expect(dueReadback(x.store, at(6))?.id).toBe('p4');
    releaseUnsent(x.store, 'GH-395:2026-11-16');
    expect(x.l.entries[0].status).toBe('uncertain');
});

test('a posted or pending day, a disabled ledger and a Jira project are left alone', () => {
    const x = failedRead();
    x.l.entries[0].status = 'posted';
    expect(dueUnsent(x.store, at(0))).toBeNull();
    x.l.entries[0].status = 'uncertain';
    x.l.enabled = false;
    expect(dueUnsent(x.store, at(0))).toBeNull();
    const jira = failedRead('cec');
    expect(dueUnsent(jira.store, at(0))).toBeNull();
});
