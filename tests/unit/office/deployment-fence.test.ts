import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DeploymentFence, fenceTokenDigest } from '../../../server/office/deployment-fence';
import { ControlStore } from '../../../server/store/control-store';

const TOKEN = 'deploy-token-0123456789', OTHER = 'other-token-9876543210';
const at = () => new Date('2026-11-19T20:00:00.000Z');
const roots: string[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { dbs.splice(0).forEach(db => db.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function fence() { const db = new DatabaseSync(':memory:'); dbs.push(db); return { db, fence: new DeploymentFence(db, at) }; }

test('an open fence is acquired once per token and released only by that token', () => {
    const { fence: f } = fence();
    expect(f.read()).toEqual({ status: 'open' });
    expect(f.held()).toBe(false);
    const held = f.acquire(TOKEN, 'release 4209f1d');
    expect(held).toEqual({ status: 'held', tokenDigest: fenceTokenDigest(TOKEN), deployment: 'release 4209f1d', acquiredAt: '2026-11-19T20:00:00.000Z' });
    expect(f.held()).toBe(true);
    // The same holder acquiring again is a read-back, not a second fence.
    expect(f.acquire(TOKEN, 'release 4209f1d')).toEqual(held);
    expect(() => f.acquire(OTHER, 'another deploy')).toThrow('held by release 4209f1d');
    expect(() => f.acquire(TOKEN, 'a different deployment')).toThrow('held by release 4209f1d');
    expect(() => f.release(OTHER)).toThrow('another token');
    expect(f.release(TOKEN)).toEqual({ status: 'open' });
    // A repeated release after a lost response is safe.
    expect(f.release(TOKEN)).toEqual({ status: 'open' });
});

test('the token is never stored; only its digest is', () => {
    const { db, fence: f } = fence();
    f.acquire(TOKEN, 'release x');
    expect((db.prepare('SELECT body FROM deployment_fence').get() as { body: string }).body).not.toContain(TOKEN);
});

test('short, long or non-string tokens and empty deployments are refused', () => {
    const { fence: f } = fence();
    for (const token of ['short', 'x'.repeat(201), 12345, undefined, `lone-surrogate-token-\ud800`]) expect(() => f.acquire(token, 'release x')).toThrow('16 to 200');
    expect(() => f.acquire(TOKEN, '  ')).toThrow();
    expect(f.held()).toBe(false);
});

test('an unreadable fence row counts as held and only clear-invalid removes it', () => {
    const { db, fence: f } = fence();
    db.prepare('INSERT INTO deployment_fence VALUES(1,?)').run('{"tokenDigest":"nope"');
    expect(f.read()).toMatchObject({ status: 'invalid' });
    expect(f.held()).toBe(true);
    expect(() => f.acquire(TOKEN, 'release x')).toThrow('clear it before acquiring');
    expect(() => f.release(TOKEN)).toThrow('only clear-invalid');
    expect(f.clearInvalid()).toEqual({ status: 'open' });
    f.acquire(TOKEN, 'release x');
    expect(() => f.clearInvalid()).toThrow('release it with its token');
    expect(f.held()).toBe(true);
});

test('a held fence survives ControlStore recovery and a reopened connection', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-fence-')); roots.push(root);
    const path = resolve(root, 'office-control.sqlite');
    const first = new ControlStore(path);
    new DeploymentFence(first.db, at).acquire(TOKEN, 'release x');
    first.recover();
    first.db.close();
    const reopened = new ControlStore(path); dbs.push(reopened.db);
    reopened.recover();
    expect(new DeploymentFence(reopened.db, at).read()).toMatchObject({ status: 'held', deployment: 'release x' });
});
