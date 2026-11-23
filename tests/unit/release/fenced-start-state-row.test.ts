import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { projectById } from '../../../server/office/projects';
import { changedStores, fingerprintStores, type StoreFingerprint } from '../../../server/release/store-fingerprint';
import { Store } from '../../../server/store/store';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => {
    for (const store of stores.splice(0)) if (store.db.isOpen) store.close();
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

const SECRET = 'password=hunter2 and more';
/** What a service start does to a project store before it can admit anything (`Offices`, then `server/index.ts`). */
function start(path: string, root: string) {
    const store = new Store(path, projectById('brain'), root); stores.push(store);
    store.recover(true);
    store.emit('office-opened', 'Brain office is open.');
    return store;
}
const inspect = <T>(path: string, read: (db: DatabaseSync) => T) => { const db = new DatabaseSync(path); try { return read(db); } finally { db.close(); } };
const row = (path: string) => inspect(path, db => (db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined)?.body);
const partsText = (path: string) => inspect(path, db => `{${(db.prepare('SELECT key,body FROM state_parts ORDER BY position,key').all() as { key: string; body: string }[])
    .map(part => `${JSON.stringify(part.key)}:${part.body}`).join(',')}}`);
/** The rollback comparison, as the deployment controller makes it for a project store. */
const fingerprint = (path: string, since?: StoreFingerprint[]) => fingerprintStores([{ name: 'brain', path }], { projects: ['brain'], since });

/**
 * A project store in service: started more than once, holding a secret in a key no start writes, and stopped.
 * `withRow` is the store a previous release wrote, with the whole row beside the parts; without it, the store
 * this release leaves once any other key was saved.
 */
function served(withRow: boolean) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-start-row-')); roots.push(root);
    const path = resolve(root, 'office.sqlite'), first = start(path, root);
    (first.state as unknown as Record<string, unknown>).probe = { note: SECRET };
    first.save();
    first.close();
    start(path, root).close();
    expect(row(path)).toBeUndefined();
    if (withRow) inspect(path, db => db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(partsText(path)));
    const before = JSON.parse(JSON.stringify(fingerprint(path))) as StoreFingerprint[];
    expect(before).toEqual([{ name: 'brain', digest: expect.stringMatching(/^[0-9a-f]{64}$/), eventsThrough: expect.any(Number) }]);
    return { root, path, before };
}
const changed = (path: string, before: StoreFingerprint[]) => changedStores(before, fingerprint(path, before));

test.each([['with the whole row a previous release wrote', true], ['without the whole row', false]])('a start of a store %s leaves it comparing as unchanged, and the row as it found it', (_name, withRow) => {
    const { root, path, before } = served(withRow);
    const store = start(path, root);
    expect(changed(path, before)).toEqual([]); // While the release runs,
    store.close();
    expect(changed(path, before)).toEqual([]); // and once it has stopped.
    expect(fingerprint(path, before)).toEqual([{ name: 'brain', digest: before[0].digest, eventsThrough: before[0].eventsThrough }]);
    // The start did write: the row, where there is one, is the new state and not the one the baseline read.
    expect(row(path)).toBe(withRow ? partsText(path) : undefined);
    expect(JSON.parse(partsText(path)).revision).toBeGreaterThan(before[0].eventsThrough!);
    start(path, root).close();
    expect(changed(path, before)).toEqual([]);
    expect(row(path)).toBe(withRow ? partsText(path) : undefined);
});

test('a save that changes only a secret, stored redacted as before, keeps the whole row and still compares as unchanged', () => {
    const { root, path, before } = served(true);
    const store = start(path, root), saved = partsText(path);
    const probe = (store.state as unknown as { probe: { note: string } }).probe;
    expect(probe.note).toBe('password=[redacted]');
    probe.note = 'password=another and more';
    store.save();
    store.close();
    expect([row(path), partsText(path)]).toEqual([saved, saved]);
    expect(changed(path, before)).toEqual([]);
});

test('a save that changes what is stored for a key no start writes removes the whole row and compares as changed', () => {
    const { root, path, before } = served(true);
    const store = start(path, root);
    store.state.paused = !store.state.paused;
    store.save();
    store.close();
    expect(row(path)).toBeUndefined();
    expect(JSON.parse(partsText(path)).paused).toBe(true);
    expect(changed(path, before)).toEqual([{ name: 'brain', reason: 'its contents changed' }]);
});
