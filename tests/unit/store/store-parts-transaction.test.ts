import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { admissionCursor } from '../../../server/store/admission-journal';
import { sanitizeObject } from '../../../server/office/security';
import { Store } from '../../../server/store/store';

let folder = '', stores: Store[] = [];
afterEach(() => { for (const store of stores) if (store.db.isOpen) store.db.close(); stores = []; if (folder) rmSync(folder, { recursive: true, force: true }); });
function openStore(path = join(folder ||= mkdtempSync(join(tmpdir(), 'store-parts-')), 'office.sqlite')) {
    const store = new Store(path, undefined, folder); stores.push(store); return { store, path };
}
const row = (store: Store) => (store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string }).body;
const partRows = (store: Store) => store.db.prepare('SELECT key,position,body FROM state_parts ORDER BY position,key').all() as { key: string; position: number; body: string }[];
const partsText = (store: Store) => `{${partRows(store)
    .map(part => `${JSON.stringify(part.key)}:${part.body}`).join(',')}}`;
const events = (store: Store) => (store.db.prepare('SELECT COUNT(*) AS n FROM events').get() as { n: number }).n;
const work = (store: Store) => ({ projectId: store.project.id, kind: 'delivery' as const, id: 'CEC-1' });

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
    expect(row(store)).toBe(JSON.stringify(sanitizeObject(store.state)));
    expect(partsText(store)).toBe(row(store));
    const saved = row(store);
    store.db.close();
    const reopened = openStore(path).store;
    // A restart writes only the keys its start changes (the start time, the agents), not the whole state again.
    const rewritten = reopened.timings.report().timings['sql: INSERT OR REPLACE INTO state_parts(key,position,body) VALUES(?,?,?)'].calls;
    expect(rewritten).toBeGreaterThan(0);
    expect(rewritten).toBeLessThan(Object.keys(JSON.parse(saved)).length / 2);
    expect(reopened.state.pilotKey).toBe('CEC-1');
    expect(reopened.state.revision).toBe(JSON.parse(saved).revision);
    expect(partsText(reopened)).toBe(row(reopened));
});

test('a refusal thrown inside a transaction, after an inner save and an admission, leaves nothing written and memory restored', () => {
    const { store } = openStore();
    store.transaction(() => { store.state.pilotKey = 'CEC-1'; });
    const saved = row(store), parts = partsText(store), cursor = admissionCursor(store.db), emitted = events(store), revision = store.state.revision;
    expect(() => store.transaction(() => {
        store.state.pilotKey = 'CEC-2';
        store.save(); // Callers save inside transactions; this write must go with the rollback.
        store.claimWork(work(store), 'owner', 'implement');
        store.emit('claimed', 'Claimed CEC-1');
        throw new Error('refused');
    })).toThrow('refused');
    expect([row(store), partsText(store), admissionCursor(store.db), events(store)]).toEqual([saved, parts, cursor, emitted]);
    expect([store.state.pilotKey, store.state.revision]).toEqual(['CEC-1', revision]);
    // What the store remembers as written went back too: the next change is written, not skipped.
    store.transaction(() => { store.state.pilotKey = 'CEC-2'; });
    expect(JSON.parse(row(store)).pilotKey).toBe('CEC-2');
    expect(partsText(store)).toBe(row(store));
    expect(row(store)).toBe(JSON.stringify(sanitizeObject(store.state)));
});

test('a state row left by the previous release after a rollback is what the next start reads', () => {
    const { store, path } = openStore();
    store.transaction(() => { store.state.pilotKey = 'CEC-1'; });
    const older = JSON.parse(row(store));
    store.db.prepare('INSERT OR REPLACE INTO state(id,body) VALUES(1,?)').run(JSON.stringify({ ...older, pilotKey: 'CEC-9' }));
    store.db.close();
    const next = openStore(path).store;
    expect(next.state.pilotKey).toBe('CEC-9');
    expect(partsText(next)).toBe(row(next));
});

test('catching a save that triggered a SQLite rollback cannot persist the final save', () => {
    const { store } = openStore();
    store.transaction(() => { store.state.pilotKey = 'CEC-1'; });
    const persisted = () => [row(store), partRows(store), admissionCursor(store.db), events(store)];
    const saved = persisted(), revision = store.state.revision;
    store.db.exec(`CREATE TEMP TRIGGER refuse_state BEFORE INSERT ON state
        WHEN json_extract(NEW.body, '$.pilotKey') = 'CEC-2' BEGIN SELECT RAISE(ROLLBACK, 'rejected'); END;`);

    expect(() => store.transaction(() => {
        expect(store.claimWork(work(store), 'owner', 'implement')).not.toBeNull();
        store.emit('claimed', 'Claimed CEC-1');
        store.state.pilotKey = 'CEC-2';
        expect(() => store.save()).toThrow('rejected');
        expect(store.db.isTransaction).toBe(false);
        store.state.pilotKey = 'CEC-3';
    })).toThrow('SQLite rolled back the active Store transaction');

    expect(persisted()).toEqual(saved);
    expect([store.state.pilotKey, store.state.revision]).toEqual(['CEC-1', revision]);
    store.state.pilotKey = 'CEC-3';
    store.save();
    expect(JSON.parse(row(store)).pilotKey).toBe('CEC-3');
    expect(partsText(store)).toBe(row(store));
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
    expect(JSON.parse(row(store)).pilotKey).toBe('CEC-2');
    expect(partsText(store)).toBe(row(store));
});
