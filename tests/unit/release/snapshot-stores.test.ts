import { expect, test } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { projectById } from '../../../server/office/projects';
import { snapshotGaps, snapshotStores, storesChangedSince } from '../../../server/release/snapshot-stores';
import { Store } from '../../../server/store/store';
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
    change(quiet.projectDb, "UPDATE state_parts SET body = 'true' WHERE key = 'paused' AND body = 'false'");
    expect(storesChangedSince(quiet.ctx, before)).toEqual(['brain: its contents changed']);
    const control = make(), earlier = snapshotStores(control.ctx);
    control.fence.acquire('a-token-0123456789abcdef', 'deploy-x');
    expect(storesChangedSince(control.ctx, earlier)).toEqual(['office-control: its contents changed']);
});

test('a store that cannot be read is a gap, and a missing or malformed earlier snapshot counts as changed', () => {
    const w = make(), junk = resolve(w.dataRoot, 'junk.sqlite');
    writeFileSync(junk, 'not a database '.repeat(40));
    w.ctx.databases = [...w.ctx.databases, { name: 'junk', path: junk }];
    w.ctx.projects = [...w.ctx.projects, { name: 'junk', path: junk }];
    expect(snapshotGaps(snapshotStores(w.ctx))).toEqual([expect.stringContaining('junk: admission cursor unreadable'), expect.stringContaining('junk: contents unreadable')]);
    const clean = make();
    expect(storesChangedSince(clean.ctx, undefined)).toEqual(['no store snapshot was recorded before the start']);
    expect(storesChangedSince(clean.ctx, { admissions: 'x' })).toEqual(['no store snapshot was recorded before the start']);
});

test('a project with no store yet is absent, not a gap, and compares unchanged until its store is created', () => {
    const w = make(), path = resolve(w.dataRoot, 'projects', 'cec', 'office.sqlite');
    w.ctx.projects = [...w.ctx.projects, { name: 'cec', path }];
    w.ctx.databases = [...w.ctx.databases, { name: 'cec', path }];
    const snapshot = snapshotStores(w.ctx);
    expect(snapshot.admissions).toContainEqual({ name: 'cec', cursor: null, absent: true, reason: expect.stringContaining('does not exist') });
    expect(snapshot.fingerprints).toContainEqual({ name: 'cec', digest: null, absent: true, reason: expect.stringContaining('does not exist') });
    expect(snapshotGaps(snapshot)).toEqual([]);
    const saved = JSON.parse(JSON.stringify(snapshot));
    expect(storesChangedSince(w.ctx, saved)).toEqual([]);
    mkdirSync(resolve(path, '..'), { recursive: true });
    new Store(path, projectById('cec'), resolve(path, '..')).close();
    expect(storesChangedSince(w.ctx, saved)).toEqual(['cec: created since the old service stopped', 'cec: created since the old service stopped']);
});

test('a missing control store is a gap, not absent', () => {
    const w = make(), control = w.ctx.databases.find(database => database.name === 'office-control')!;
    w.ctx.databases = w.ctx.databases.map(database => database === control ? { ...control, path: resolve(w.dataRoot, 'no-control.sqlite') } : database);
    const snapshot = snapshotStores(w.ctx);
    expect(snapshot.fingerprints.find(entry => entry.name === 'office-control')).not.toHaveProperty('absent');
    expect(snapshotGaps(snapshot)).toEqual([expect.stringContaining('office-control: contents unreadable')]);
});

test.each(['cursor', 'fingerprint'])('a project marked absent only by its %s is a gap, and never compares unchanged', side => {
    const w = make(), missing = { name: 'brain', path: resolve(w.dataRoot, 'missing.sqlite') }, readable = { name: 'brain', path: w.projectDb };
    // The same project name, one descriptor at a missing path and the other at the readable store.
    w.ctx.projects = [side === 'cursor' ? missing : readable];
    w.ctx.databases = [side === 'cursor' ? readable : missing, ...w.ctx.databases.filter(database => database.name !== 'brain')];
    const snapshot = snapshotStores(w.ctx);
    expect(snapshot.admissions[0].absent === true).toBe(side === 'cursor');
    expect(snapshot.fingerprints[0].absent === true).toBe(side === 'fingerprint');
    expect(snapshotGaps(snapshot)).toEqual(['brain: the admission cursor and the fingerprint disagree on whether the store exists']);
    // A repeated read disagrees the same way, and the comparison still refuses.
    expect(storesChangedSince(w.ctx, JSON.parse(JSON.stringify(snapshot)))).toEqual([
        "brain: the earlier snapshot's cursor and fingerprint disagree on whether the store exists",
        "brain: the later snapshot's cursor and fingerprint disagree on whether the store exists",
    ]);
});

test('an earlier snapshot whose marked entry has no counterpart counts as changed', () => {
    const w = make(), path = resolve(w.dataRoot, 'projects', 'cec', 'office.sqlite');
    w.ctx.projects = [...w.ctx.projects, { name: 'cec', path }];
    w.ctx.databases = [...w.ctx.databases, { name: 'cec', path }];
    const snapshot = JSON.parse(JSON.stringify(snapshotStores(w.ctx)));
    snapshot.fingerprints = snapshot.fingerprints.filter((entry: { name: string }) => entry.name !== 'cec');
    expect(storesChangedSince(w.ctx, snapshot)).toEqual([
        'cec: the earlier fingerprint does not cover it',
        "cec: the earlier snapshot's cursor and fingerprint disagree on whether the store exists",
    ]);
});

/** A project store as the earlier producer left it: three queued Harper requests bound to one follow-up. */
function seedDuplicates(path: string, dataRoot: string) {
    const store = new Store(path, projectById('brain'), dataRoot);
    const request = (id: string) => ({ id, requestId: id, from: 'knowledge' as const, to: 'pm' as const, ticket: '', actionId: 'harper:recovery:assignment-listener', body: 'Harper requests READ ONLY diagnosis', status: 'queued' as const, createdAt: '2026-11-20T02:00:00.000Z', sessionId: '', recheck: false, error: '', recipients: [], receipts: [] });
    store.state.messages.push(request('a'), request('b'), request('c'));
    store.state.knowledge!.followups = [{ id: 'recovery:assignment-listener', source: { kind: 'recovery', id: 'assignment-listener' }, key: '', fingerprint: '', owner: 'Morgan', nextAction: 'Listener read failed', evidence: [], disposition: 'needs-input', createdAt: '', updatedAt: '', history: [], handoffId: 'c', handoffIds: ['a', 'b', 'c'] }];
    store.save(); store.close();
}
/** What a start under the deployment fence does to a project store (`deploy-world.ts`). */
const fencedStart = (path: string, dataRoot: string) => { const store = new Store(path, projectById('brain'), dataRoot); store.recover(true); store.emit('office-opened', 'Brain office is open.'); store.close(); };

test('the first upgraded open settling queued duplicates changes the store\'s contents and leaves its admission cursor where it was', () => {
    const w = make();
    seedDuplicates(w.projectDb, w.dataRoot);
    const before = snapshotStores(w.ctx);
    fencedStart(w.projectDb, w.dataRoot);
    expect(storesChangedSince(w.ctx, before)).toEqual(['brain: its contents changed']);
    expect(snapshotStores(w.ctx).admissions).toEqual(before.admissions);
    // The same start on a store with nothing to settle compares unchanged.
    const clean = make(), earlier = snapshotStores(clean.ctx);
    fencedStart(clean.projectDb, clean.dataRoot);
    expect(storesChangedSince(clean.ctx, earlier)).toEqual([]);
});
