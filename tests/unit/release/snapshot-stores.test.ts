import { expect, test } from 'vitest';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { snapshotGaps, snapshotStores, storesChangedSince } from '../../../server/release/snapshot-stores';
import { make } from './step-fixture';

const change = (path: string, sql: string) => { const db = new DatabaseSync(path); db.exec(sql); db.close(); };

test('a snapshot covers every project cursor and every store, and compares clean against an unchanged machine', () => {
    const w = make(), snapshot = snapshotStores(w.ctx);
    expect(snapshot.admissions).toEqual([{ name: 'brain', cursor: 1 }]);
    expect(snapshot.fingerprints.map(entry => entry.name)).toEqual(['brain', 'office-control']);
    expect(snapshotGaps(snapshot)).toEqual([]);
    expect(storesChangedSince(w.ctx, JSON.parse(JSON.stringify(snapshot)))).toEqual([]);
});

test('an admitted request, a changed row without an admission, and a change to the control store are each reported', () => {
    const w = make(), snapshot = snapshotStores(w.ctx);
    change(w.projectDb, "INSERT INTO admissions (kind, ref, at) VALUES ('request', 'r2', '2026-11-20T03:05:00.000Z')");
    expect(storesChangedSince(w.ctx, snapshot)).toEqual(['brain: the cursor moved from 1 to 2', 'brain: its contents changed']);
    const quiet = make(), before = snapshotStores(quiet.ctx);
    // A requeue that changes an existing row leaves the admission cursor where it was.
    // A saved key that no admission accounts for: the state lives in its part rows, with or without a whole row.
    change(quiet.projectDb, "INSERT INTO state_parts(key,position,body) VALUES('requeued',9999,'1')");
    expect(storesChangedSince(quiet.ctx, before)).toEqual(['brain: its contents changed']);
    const control = make(), earlier = snapshotStores(control.ctx);
    control.fence.acquire('a-token-0123456789abcdef', 'deploy-x');
    expect(storesChangedSince(control.ctx, earlier)).toEqual(['office-control: its contents changed']);
});

test('a store that cannot be read is a gap, and a missing or malformed earlier snapshot counts as changed', () => {
    const w = make();
    w.ctx.databases = [...w.ctx.databases, { name: 'gone', path: resolve(w.dataRoot, 'gone.sqlite') }];
    w.ctx.projects = [...w.ctx.projects, { name: 'gone', path: resolve(w.dataRoot, 'gone.sqlite') }];
    expect(snapshotGaps(snapshotStores(w.ctx))).toEqual([expect.stringContaining('gone: admission cursor unreadable'), expect.stringContaining('gone: contents unreadable')]);
    const clean = make();
    expect(storesChangedSince(clean.ctx, undefined)).toEqual(['no store snapshot was recorded before the start']);
    expect(storesChangedSince(clean.ctx, { admissions: 'x' })).toEqual(['no store snapshot was recorded before the start']);
});
