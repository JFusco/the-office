import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, test, vi } from 'vitest';
import { projectById } from '../../../server/office/projects';
import { sanitizeObject } from '../../../server/office/security';
import { readSavedState } from '../../../server/store/read-saved-state';
import { SavedStateConflict } from '../../../server/store/saved-state';
import { Store } from '../../../server/store/store';
import { initializeStoreSchema } from '../../../server/store/store-schema';
import { savedFingerprint } from './saved-fingerprint-fixture';
import { savedState, savedStateText } from './saved-state-fixture';
import { reconcileBlockerFollowups } from '../../../server/knowledge/blocker-followups';
import { coordination } from '../../../server/scheduling/coordination';
import { scheduledWork, type OfficeEntry } from '../../../server/scheduling/scheduled-work';
import type { TeamMessage } from '../../../src/shared';

let folder = '', open: DatabaseSync[] = [];
afterEach(() => {
    vi.restoreAllMocks();
    for (const db of open) if (db.isOpen) db.close();
    open = [];
    if (folder) rmSync(folder, { recursive: true, force: true });
    folder = '';
});
// The real path: SQLite names a database by it.
const file = () => join(folder = realpathSync(mkdtempSync(join(tmpdir(), 'store-open-'))), 'office.sqlite');
const connect = (path: string) => { const db = new DatabaseSync(path); open.push(db); return db; };
const start = (path: string) => { const store = new Store(path, projectById('brain'), folder); open.push(store.db); return store; };
const schema = (db: DatabaseSync) => db.prepare('SELECT type,name,sql FROM sqlite_master ORDER BY type,name').all();

test('a new store on a new file, which has no state table to read, creates its schema and saves its first state', () => {
    const path = file(), store = start(path);
    expect(store.db.prepare('PRAGMA journal_mode').get()).toEqual({ journal_mode: 'wal' });
    expect(schema(store.db).map(entry => entry.name)).toEqual(expect.arrayContaining(['state', 'state_parts', 'effects_work_key']));
    expect(savedStateText(store)).toBe(JSON.stringify(sanitizeObject(store.state)));
    expect(store.db.prepare('SELECT COUNT(*) AS n FROM state').get()).toEqual({ n: 0 });
    expect(readSavedState(path)?.startedAt).toBe(store.state.startedAt);
});

test('a store whose saved copies disagree is refused before its journal mode, schema or rows are touched', () => {
    const path = file(), made = connect(path);
    made.exec('PRAGMA journal_mode=DELETE');
    initializeStoreSchema(made);
    made.exec(`DROP INDEX effects_work_key; INSERT INTO state_parts VALUES('pilotKey',0,'"CEC-1"'); INSERT INTO state VALUES(1,'{"pilotKey":"CEC-9"}')`);
    made.close();
    const db = connect(path);
    const saved = () => [db.prepare('PRAGMA journal_mode').get(), schema(db), db.prepare('SELECT * FROM state').all(),
        db.prepare('SELECT * FROM state_parts ORDER BY position,key').all(), savedFingerprint({ db })];
    const before = saved();
    expect(before[0]).toEqual({ journal_mode: 'delete' });
    for (const read of [() => start(path), () => readSavedState(path), () => savedState({ db })]) {
        let refusal: unknown;
        try { read(); } catch (error) { refusal = error; }
        expect(refusal).toBeInstanceOf(SavedStateConflict);
        expect((refusal as SavedStateConflict).database).toBe(path);
        expect((refusal as Error).message).toContain(path);
        // Opening used to set WAL and create what the schema lacked before it read the two copies.
        expect(saved()).toEqual(before);
    }
    expect(schema(db).map(entry => entry.name)).not.toContain('effects_work_key');
});

test('a store whose first save fails closes its connection and reports that failure', () => {
    const path = file(), made = connect(path);
    initializeStoreSchema(made);
    made.exec("CREATE TRIGGER refuse_part BEFORE INSERT ON state_parts BEGIN SELECT RAISE(ABORT, 'refused at open'); END;");
    made.close();
    const closed = vi.spyOn(DatabaseSync.prototype, 'close');
    expect(() => start(path)).toThrow('refused at open');
    // Only a refused load used to close it: a failure in any later step left the connection open.
    expect(closed.mock.contexts.map(db => (db as DatabaseSync).isOpen)).toEqual([false]); // The one connection made since: the store's own.
    const after = connect(path);
    expect(after.prepare('SELECT COUNT(*) AS n FROM state_parts').get()).toEqual({ n: 0 });
});

// One open Harper diagnosis per follow-up (issue 535): the survivor is chosen before start-up recovery.
const request = (id: string, status: TeamMessage['status']): TeamMessage => ({ id, requestId: id, from: 'knowledge', to: 'pm', ticket: '', actionId: 'harper:recovery:assignment-listener', body: 'Harper requests READ ONLY diagnosis', status, createdAt: '2026-11-24T14:00:00.000Z', sessionId: '', recheck: false, error: '', recipients: [], receipts: [] });
/** A store saved by the earlier producer: an assignment-listener follow-up and its bound requests, written as they were saved. */
function saveFollowup(path: string, messages: TeamMessage[], bindings: { handoffId?: string; handoffIds?: string[] }, claimed?: string) {
    const store = start(path), detail = 'HTTP 403: API rate limit exceeded for user ID 486049.';
    // A scheduler claim commits before its message leaves the queue.
    if (claimed) expect(store.claimWork({ projectId: 'brain', kind: 'conversation', id: claimed }, 'scheduler', 'conversation:pm')).not.toBeNull();
    store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], investigations: [], recoveries: { 'assignment-listener': { attempts: 3, nextAt: '', status: 'needs-human', detail } } };
    store.state.knowledge!.followups = [{ id: 'recovery:assignment-listener', source: { kind: 'recovery', id: 'assignment-listener' }, key: '', fingerprint: 'saved', owner: 'Morgan', nextAction: detail, evidence: [], disposition: 'needs-input', createdAt: '', updatedAt: '', history: [{ at: '2026-11-24T14:00:00.000Z', disposition: 'needs-input', fingerprint: 'saved', detail }], ...bindings }];
    store.state.messages.push(...messages);
    store.save(); store.close();
}
const followupOf = (store: Store) => store.state.knowledge!.followups![0];
const byId = (store: Store, id: string) => store.state.messages.find(message => message.id === id)!;
const runnableDiagnoses = (store: Store) => scheduledWork({ store, engine: {}, conversations: {}, coordinator: {} } as OfficeEntry, new Map([[store.project.id, store]]), new Date('2026-11-24T15:00:00Z'), 'delivery')
    .filter(item => item.work.kind === 'conversation' && item.eligibility.state === 'runnable');

test('an older working hand-off outranks a newer queued current binding before recovery; once interrupted, unchanged material admits nothing', () => {
    const path = file();
    saveFollowup(path, [request('older', 'working'), request('newer', 'queued')], { handoffId: 'newer', handoffIds: ['older', 'newer'] });
    let store = start(path);
    // Pinned on construction, before `recover()` can interrupt it.
    expect(followupOf(store).handoffId).toBe('older');
    expect(byId(store, 'older').status).toBe('working');
    store.recover();
    expect(byId(store, 'older').status).toBe('interrupted');
    store.close(); store = start(path);
    expect(byId(store, 'newer')).toMatchObject({ status: 'failed', supersededByHandoffId: 'older', error: "Superseded by this follow-up's current hand-off (older); not run." });
    store.state.coordination ??= coordination();
    reconcileBlockerFollowups(store); reconcileBlockerFollowups(store);
    expect(store.state.messages.map(message => message.id)).toEqual(['older', 'newer']);
    expect(runnableDiagnoses(store)).toEqual([]);
});

test('of two queued hand-offs the claimed older one survives before recovery finishes its claim, and stays runnable', () => {
    const path = file();
    saveFollowup(path, [request('older', 'queued'), request('newer', 'queued')], { handoffId: 'newer', handoffIds: ['older', 'newer'] }, 'older');
    const store = start(path);
    expect(followupOf(store).handoffId).toBe('older');
    expect(store.activeClaims().map(claim => claim.work.id)).toEqual(['older']);
    expect(byId(store, 'newer')).toMatchObject({ status: 'failed', supersededByHandoffId: 'older' });
    store.recover();
    expect(store.activeClaims()).toEqual([]);
    expect(byId(store, 'older').status).toBe('queued');
    store.state.coordination ??= coordination();
    expect(runnableDiagnoses(store).map(item => item.work.id)).toEqual(['older']);
});

test('an item saved with historical bindings only keeps one survivor, its last', () => {
    const path = file();
    saveFollowup(path, [request('a', 'queued'), request('b', 'queued'), request('c', 'queued')], { handoffIds: ['a', 'b', 'c'] });
    const store = start(path);
    expect(followupOf(store).handoffId).toBe('c');
    expect(store.state.messages.map(message => [message.id, message.status, message.supersededByHandoffId])).toEqual([['a', 'failed', 'c'], ['b', 'failed', 'c'], ['c', 'queued', undefined]]);
    expect(readSavedState(path)!.messages.filter(message => message.status === 'queued').map(message => message.id)).toEqual(['c']);
});
