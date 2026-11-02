import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { coordination } from '../../../server/scheduling/coordination';
import { timeLedger, TimeLedger } from '../../../server/time/time-ledger';
import { dueReadback, readBackTime } from '../../../server/time/time-readback';
import { projectById } from '../../../server/office/projects';
const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(s => s.close()));

const ATTEMPT = '2026-11-02T14:50:00.000Z';
const at = (minutes: number) => new Date(Date.parse(ATTEMPT) + minutes * 60000);
/** An HTTP 499 hours write: the board held 0.0189h before the attempt, which tried 0.0608h. */
function uncertain(project = 'cms-field-vocabulary') {
    const store = new Store(':memory:', projectById(project)); stores.push(store);
    store.state.coordination = coordination();
    let clock = at(0);
    (store as any).clock = { now: () => clock };
    const l = timeLedger(store);
    Object.assign(l, { activatedAt: '2026-10-28T00:00:00Z', enabled: true, githubField: true });
    l.entries = [{ id: 'GH-122:2026-11-02', key: 'GH-122', date: '2026-11-02', seconds: 219, sourceIds: [], status: 'uncertain', detail: 'Time sync needs read-back; no automatic retry: HTTP 499', url: '' }] as any;
    l.baselines = { 'GH-122': { baseline: 0, lastWritten: 0.0189, itemId: 'ITEM' } };
    l.publications = [{ id: 'p1', provider: 'github', key: 'GH-122', status: 'uncertain', projectId: project, itemId: 'ITEM', fieldId: 'FIELD', worklogId: '', baseline: 0, previousValue: 0.0189, intendedValue: 0.0608, covered: [{ id: 'GH-122:2026-11-02', revision: 1, seconds: 219 }], payload: {}, createdAt: ATTEMPT, detail: '' }];
    let board = 0.0189, writes = 0, failWrites = false;
    const execute = async (_b: string, _a: string[], opts: any) => {
        const { query, variables } = JSON.parse(opts.input);
        if (query.includes('mutation')) { writes++; if (failWrites) throw new Error('gh: HTTP 504'); board = variables.hours; return '{}'; }
        if (query.includes('user(login:')) return JSON.stringify({ data: { user: { projectV2: { id: 'PROJECT', fields: { nodes: [{ id: 'FIELD', name: 'Time Spent (Hours)', dataType: 'NUMBER' }], pageInfo: { hasNextPage: false } } } } } });
        if (query.includes('items(first:')) return JSON.stringify({ data: { node: { items: { nodes: [{ id: 'ITEM', content: { number: 122, repository: { nameWithOwner: store.project.repository } }, fieldValues: { nodes: [{ number: board, field: { id: 'FIELD' } }], pageInfo: { hasNextPage: false } } }], pageInfo: { hasNextPage: false } } } } });
        return JSON.stringify({ data: { node: { fieldValues: { nodes: [{ number: board, field: { id: 'FIELD' } }], pageInfo: { hasNextPage: false } } } } });
    };
    const readback = async (minutes: number) => { clock = at(minutes); const due = dueReadback(store, clock); if (due) await readBackTime(store, due.id, execute as any); return due; };
    return { store, l, execute: execute as any, readback, setClock: (m: number) => { clock = at(m); }, setBoard: (v: number) => { board = v; }, failWrites: (v: boolean) => { failWrites = v; }, writes: () => writes };
}

test('a write that landed is verified by read-back with no new write', async () => {
    const x = uncertain();x.setBoard(0.0608);
    await x.readback(6);
    expect(x.l.entries[0].status).toBe('posted');
    expect(x.writes()).toBe(0);
});
test('a write that never landed becomes terminal and one fresh write posts the total', async () => {
    const x = uncertain();
    await x.readback(6);
    expect(x.l.entries[0].status).toBe('uncertain');
    expect(dueReadback(x.store, at(8))).toBeNull();
    await x.readback(12);
    expect(x.l.entries[0].status).toBe('pending');
    expect(x.l.publications![0]).toMatchObject({ status: 'not-landed' });
    x.setClock(13);
    await new TimeLedger(x.store, x.execute).sync();
    expect(x.l.entries[0].status).toBe('posted');
    expect(x.writes()).toBe(1);
});
test('a second miss is never resent automatically; it is reported once for Joe', async () => {
    const x = uncertain();
    await x.readback(12);
    x.failWrites(true);x.setClock(13);
    await new TimeLedger(x.store, x.execute).sync();
    expect(x.l.entries[0].status).toBe('uncertain');
    await x.readback(30);
    expect(x.l.entries[0].status).toBe('uncertain');
    expect(x.l.entries[0].detail).toContain('resends only once');
    const events = () => x.store.state.events.filter(e => e.kind === 'time-readback' && e.message.includes('resends only once')).length;
    await x.readback(40);
    expect(events()).toBe(1);
    expect(x.writes()).toBe(1);
});
test('a board someone else changed, and Jira worklogs, stay with Joe', async () => {
    const edited = uncertain();edited.setBoard(1.5);
    await edited.readback(30);
    expect(edited.l.entries[0].status).toBe('uncertain');
    expect(edited.l.entries[0].detail).toContain('someone else changed them');
    const jira = uncertain('cec');
    expect(dueReadback(jira.store, at(30))).toBeNull();
});
