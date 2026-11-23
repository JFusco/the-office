import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, test, vi } from 'vitest';
import { admissionCursor } from '../../../server/store/admission-journal';
import { sanitizeObject } from '../../../server/office/security';
import { readSavedState } from '../../../server/store/read-saved-state';
import { SavedStateConflict } from '../../../server/store/saved-state';
import { Store } from '../../../server/store/store';
import { savedFingerprint } from './saved-fingerprint-fixture';
import { savedState } from './saved-state-fixture';

const WRITE_PART = 'sql: INSERT OR REPLACE INTO state_parts(key,position,body) VALUES(?,?,?)';
type Saved = { db: DatabaseSync };
let folder = '', stores: Saved[] = [];
afterEach(() => {
    vi.restoreAllMocks();
    for (const store of stores) if (store.db.isOpen) store.db.close();
    stores = [];
    if (folder) rmSync(folder, { recursive: true, force: true });
    folder = '';
});
// The real path: SQLite names a database by it.
function openStore(path = join(folder ||= realpathSync(mkdtempSync(join(tmpdir(), 'store-parts-'))), 'office.sqlite')) {
    const store = new Store(path, undefined, folder); stores.push(store); return { store, path };
}
const row = (store: Saved) => (store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined)?.body;
const partRows = (store: Saved) => store.db.prepare('SELECT key,position,body FROM state_parts ORDER BY position,key').all() as { key: string; position: number; body: string }[];
const partsText = (store: Saved) => `{${partRows(store)
    .map(part => `${JSON.stringify(part.key)}:${part.body}`).join(',')}}`;
const expected = (store: Store) => JSON.stringify(sanitizeObject(store.state));
const events = (store: Store) => (store.db.prepare('SELECT COUNT(*) AS n FROM events').get() as { n: number }).n;
const work = (store: Store) => ({ projectId: store.project.id, kind: 'delivery' as const, id: 'CEC-1' });
/** A store a previous release wrote, started by this one: the whole row beside the parts, the same text. */
function inherited() {
    const first = openStore();
    first.store.transaction(() => { first.store.state.pilotKey = 'CEC-1'; });
    first.store.db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(partsText(first.store));
    first.store.close();
    const { store, path } = openStore(first.path);
    expect([row(store), partsText(store)]).toEqual([expected(store), expected(store)]); // Its start kept the row in step.
    return { store, path };
}
/** What only a start changes. */
function startAgain(store: Store) {
    store.state.startedAt = store.state.serverTime = '2026-11-22T09:00:00.000Z';
    store.save();
}

test('state, the admission row and the event row commit together, and a restart reads what was saved', () => {
    const { store, path } = openStore();
    const claim = store.transaction(() => {
        store.state.pilotKey = 'CEC-1';
        const made = store.claimWork(work(store), 'owner', 'implement');
        store.emit('claimed', 'Claimed CEC-1');
        return made;
    });
    expect(claim).not.toBeNull();
    expect([admissionCursor(store.db), events(store)]).toEqual([1, 1]);
    expect([row(store), partsText(store)]).toEqual([undefined, expected(store)]);
    const saved = partsText(store);
    store.db.close();
    const reopened = openStore(path).store;
    // A restart writes only the keys its start changes, not the whole state again, and no whole row.
    const rewritten = reopened.timings.report().timings[WRITE_PART].calls;
    expect(rewritten).toBeGreaterThan(0);
    expect(rewritten).toBeLessThan(Object.keys(JSON.parse(saved)).length / 2);
    expect(reopened.state.pilotKey).toBe('CEC-1');
    expect(reopened.state.revision).toBe(JSON.parse(saved).revision);
    expect([row(reopened), partsText(reopened)]).toEqual([undefined, expected(reopened)]);
});

test('a refusal thrown inside a transaction, after an inner save and an admission, leaves nothing written and memory restored', () => {
    const { store } = openStore();
    store.transaction(() => { store.state.pilotKey = 'CEC-1'; });
    const parts = partRows(store), cursor = admissionCursor(store.db), emitted = events(store), revision = store.state.revision;
    expect(() => store.transaction(() => {
        store.state.pilotKey = 'CEC-2';
        store.save(); // Callers save inside transactions; this write must go with the rollback.
        expect(JSON.parse(partsText(store)).pilotKey).toBe('CEC-2');
        store.claimWork(work(store), 'owner', 'implement');
        store.emit('claimed', 'Claimed CEC-1');
        throw new Error('refused');
    })).toThrow('refused');
    expect([row(store), partRows(store), admissionCursor(store.db), events(store)]).toEqual([undefined, parts, cursor, emitted]);
    expect([store.state.pilotKey, store.state.revision]).toEqual(['CEC-1', revision]);
    // What the store remembers as written went back too: the next change is written, not skipped.
    store.transaction(() => { store.state.pilotKey = 'CEC-2'; });
    expect(JSON.parse(partsText(store)).pilotKey).toBe('CEC-2');
    expect([row(store), partsText(store)]).toEqual([undefined, expected(store)]);
});

test('a store whose whole row and parts disagree is refused by every reader, and nothing in it is changed', () => {
    const { store, path } = openStore();
    store.transaction(() => { store.state.pilotKey = 'CEC-1'; });
    // A release from before parts existed ran after a rollback: it rewrote the row and knows nothing of parts.
    store.db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(JSON.stringify({ ...JSON.parse(partsText(store)), pilotKey: 'CEC-9' }));
    store.close();
    const connection = { db: new DatabaseSync(path) }; stores.push(connection);
    const saved = () => [row(connection), partRows(connection), savedFingerprint(connection)], before = saved();
    const closed = vi.spyOn(DatabaseSync.prototype, 'close');
    for (const read of [() => new Store(path, undefined, folder), () => readSavedState(path), () => savedState(connection)]) {
        let refusal: unknown;
        try { read(); } catch (error) { refusal = error; }
        expect(refusal).toBeInstanceOf(SavedStateConflict);
        expect((refusal as Error).message).toContain(path);
        expect((refusal as Error).message).toContain('docs/office-process.md');
    }
    expect(closed).toHaveBeenCalledTimes(2); // The store that was not opened and the read-only reader each closed their own.
    expect(saved()).toEqual(before);
    expect(JSON.parse(before[0] as string).pilotKey).toBe('CEC-9');
    expect(JSON.parse(partsText(connection)).pilotKey).toBe('CEC-1');
});

test('catching a save that triggered a SQLite rollback cannot persist the final save', () => {
    const { store } = openStore();
    store.transaction(() => { store.state.pilotKey = 'CEC-1'; });
    const persisted = () => [row(store), partRows(store), admissionCursor(store.db), events(store)];
    const saved = persisted(), revision = store.state.revision;
    let notified = 0;
    store.listeners.add(() => notified++);
    // The event's own keys are written first; the part after them ends the whole transaction.
    store.db.exec(`CREATE TEMP TRIGGER refuse_part BEFORE INSERT ON state_parts
        WHEN NEW.key = 'pilotKey' AND NEW.body = '"CEC-2"' BEGIN SELECT RAISE(ROLLBACK, 'rejected'); END;`);

    expect(() => store.transaction(() => {
        expect(store.claimWork(work(store), 'owner', 'implement')).not.toBeNull();
        store.emit('claimed', 'Claimed CEC-1');
        store.state.pilotKey = 'CEC-2';
        expect(() => store.save()).toThrow('rejected');
        expect(store.db.isTransaction).toBe(false);
        store.state.pilotKey = 'CEC-3';
    })).toThrow('SQLite rolled back the active Store transaction');

    expect(persisted()).toEqual(saved);
    expect([store.state.pilotKey, store.state.revision, notified]).toEqual(['CEC-1', revision, 0]);
    store.state.pilotKey = 'CEC-3';
    store.save();
    expect(JSON.parse(partsText(store)).pilotKey).toBe('CEC-3');
    expect([row(store), partsText(store)]).toEqual([undefined, expected(store)]);
});

test('a commit that fails after SQLite has already rolled back does not leave the store believing its parts were written', () => {
    const { store } = openStore();
    store.transaction(() => { store.state.pilotKey = 'CEC-1'; });
    const exec = store.db.exec.bind(store.db);
    store.db.exec = (sql: string) => { if (sql === 'COMMIT') { exec('ROLLBACK'); throw new Error('disk full'); } return exec(sql); };
    expect(() => store.transaction(() => { store.state.pilotKey = 'CEC-2'; })).toThrow('disk full');
    store.db.exec = exec;
    expect(store.state.pilotKey).toBe('CEC-1');
    store.state.pilotKey = 'CEC-2';
    store.save();
    expect(JSON.parse(partsText(store)).pilotKey).toBe('CEC-2');
    expect([row(store), partsText(store)]).toEqual([undefined, expected(store)]);
});

test.each(['the transaction throws after an inner save removed the row', 'the commit fails and SQLite rolls back'])('a store opened with the whole row still has it, and keeps it in step, when %s', scenario => {
    const { store, path } = inherited();
    const before = [row(store), partRows(store)];
    let removed = false;
    if (scenario.startsWith('the transaction throws')) {
        expect(() => store.transaction(() => {
            store.state.pilotKey = 'CEC-2';
            store.save();
            removed = row(store) === undefined;
            throw new Error('refused');
        })).toThrow('refused');
    } else {
        const exec = store.db.exec.bind(store.db);
        store.db.exec = (sql: string) => { if (sql === 'COMMIT') { removed = row(store) === undefined; exec('ROLLBACK'); throw new Error('disk full'); } return exec(sql); };
        expect(() => store.transaction(() => { store.state.pilotKey = 'CEC-2'; })).toThrow('disk full');
        store.db.exec = exec;
    }
    expect([removed, row(store), partRows(store), store.state.pilotKey]).toEqual([true, ...before, 'CEC-1']);
    // The row came back, so the store must remember it is there: a start writes it again, equal to the parts.
    startAgain(store);
    expect([row(store), partsText(store)]).toEqual([expected(store), expected(store)]);
    expect(row(store)).not.toBe(before[0]);
    store.close();
    const reopened = openStore(path).store; // Two copies that disagreed would stop it here.
    expect(reopened.state.pilotKey).toBe('CEC-1');
    expect([row(reopened), partsText(reopened)]).toEqual([expected(reopened), expected(reopened)]);
});

test.each(['on its own', 'inside a transaction that then commits other work'])('a save %s that fails after removing the whole row leaves the row and the parts as they were, and a retry saves the change', owner => {
    const { store, path } = inherited();
    const before = [row(store), partRows(store)], cursor = admissionCursor(store.db);
    store.db.exec("CREATE TRIGGER refuse_retirement AFTER DELETE ON state BEGIN SELECT RAISE(ABORT, 'rejected after retirement'); END;");
    if (owner === 'on its own') {
        store.state.pilotKey = 'CEC-2';
        expect(() => store.save()).toThrow('rejected after retirement');
        expect(store.db.isTransaction).toBe(false);
        expect([row(store), partRows(store)]).toEqual(before);
    } else {
        expect(store.transaction(() => {
            store.state.pilotKey = 'CEC-2';
            expect(() => store.save()).toThrow('rejected after retirement');
            expect(store.db.isTransaction).toBe(true); // Only the save was undone.
            store.state.pilotKey = 'CEC-1';
            return store.claimWork(work(store), 'owner', 'implement');
        })).not.toBeNull();
        expect([row(store), partRows(store), admissionCursor(store.db)]).toEqual([...before, cursor + 1]);
        expect(readSavedState(path)?.pilotKey).toBe('CEC-1');
    }
    store.db.exec('DROP TRIGGER refuse_retirement');
    store.state.pilotKey = 'CEC-2';
    store.save();
    expect([row(store), partsText(store)]).toEqual([undefined, expected(store)]);
    store.close();
    const reopened = openStore(path).store;
    expect(reopened.state.pilotKey).toBe('CEC-2');
    expect([row(reopened), partsText(reopened)]).toEqual([undefined, expected(reopened)]);
});
