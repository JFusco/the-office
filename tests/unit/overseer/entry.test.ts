import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { DatabaseSync } from 'node:sqlite';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { expect, test } from 'vitest';
import type { OfficeProject } from '../../../src/shared';
import { runnerPaths } from '../../../server/overseer/config';
import { acquirePassLock } from '../../../server/overseer/single-flight';
import { admissionCursor, recordAdmission } from '../../../server/store/admission-journal';
import { Store } from '../../../server/store/store';
import { snapshot, tempDir } from './runner-world';

const run = promisify(execFile);
const repository = resolve(__dirname, '../../..'), entry = join(repository, 'server/overseer.ts'), recorder = resolve(__dirname, 'record-loads.mjs');
const BOOTSTRAP = ['server/overseer.ts', 'server/overseer/config.ts', 'server/overseer/runner-root.ts'];

/** Runs the entry as launchd will, in a fresh process, recording which repository modules it loads. */
async function pass(env: NodeJS.ProcessEnv, args = ['pass']) {
    const loads = join(tempDir(), 'loads.txt');
    writeFileSync(loads, '');
    const child: NodeJS.ProcessEnv = { ...process.env, ...env, OVERSEER_LOAD_LOG: loads };
    for (const [key, value] of Object.entries(env)) if (value === undefined) delete child[key];
    let result: { code: number; stdout: string; stderr: string };
    try { result = { code: 0, ...await run(process.execPath, ['--import', 'tsx', '--import', recorder, entry, ...args], { env: child, encoding: 'utf8', timeout: 60_000 }) }; }
    catch (error) { const failed = error as { code: number; stdout: string; stderr: string }; result = { code: failed.code, stdout: failed.stdout, stderr: failed.stderr }; }
    const loaded = readFileSync(loads, 'utf8').split('\n').filter(url => url.startsWith(`file://${repository}/`) && !url.includes('/node_modules/')).map(url => url.slice(`file://${repository}/`.length));
    return { ...result, loaded, record: result.stdout.trim() ? JSON.parse(result.stdout.trim().split('\n').at(-1)!) : null };
}

async function closedPort(): Promise<number> {
    const server = createServer();
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    const { port } = server.address() as AddressInfo;
    await new Promise(done => server.close(done));
    return port;
}

test('the entry has static imports only of its two built-in-only bootstrap modules', () => {
    const imports = (file: string) => [...readFileSync(join(repository, file), 'utf8').matchAll(/^import .* from '([^']+)';$/gm)].map(match => match[1]);
    expect(imports('server/overseer.ts')).toEqual(['./overseer/config', './overseer/runner-root']);
    for (const file of BOOTSTRAP.slice(1)) for (const specifier of imports(file)) expect(specifier, file).toMatch(/^(node:|\.\/config$)/);
});

test('an unsafe root, a bad verb or a non-loopback Office is refused before any Office module loads, and nothing is written', async () => {
    const base = tempDir(), office = join(base, 'office-data'), marked = join(base, 'marked'), unsafe = join(base, 'unsafe');
    mkdirSync(office);
    mkdirSync(marked);
    writeFileSync(join(marked, 'office-control.sqlite'), '');
    symlinkSync(office, join(base, 'alias'));
    mkdirSync(unsafe);
    writeFileSync(join(unsafe, 'state'), '');
    const good = join(base, 'good');
    const cases: [string, NodeJS.ProcessEnv, string[]?][] = [
        ['missing root', { OVERSEER_ROOT: undefined }],
        ['empty root', { OVERSEER_ROOT: '' }],
        ['relative root', { OVERSEER_ROOT: 'runner' }],
        ['marked root', { OVERSEER_ROOT: join(marked, 'runner') }],
        ['inside the inherited data root, unmarked', { OVERSEER_ROOT: join(office, 'runner'), OFFICE_DATA_ROOT: office }],
        ["inside the checkout's .local, the default data root", { OVERSEER_ROOT: join(repository, '.local/overseer-entry-test'), OFFICE_DATA_ROOT: undefined }],
        ['a link into the inherited data root', { OVERSEER_ROOT: join(base, 'alias/runner'), OFFICE_DATA_ROOT: office }],
        ['a private folder that is a file', { OVERSEER_ROOT: unsafe }],
        ['a non-loopback Office', { OVERSEER_ROOT: good, OVERSEER_OFFICE_URL: 'http://example.com:4318' }],
        ['no verb', { OVERSEER_ROOT: good }, []],
        ['another verb', { OVERSEER_ROOT: good }, ['status']],
        ['an extra argument', { OVERSEER_ROOT: good }, ['pass', 'now']],
    ];
    const before = snapshot(base);
    for (const [name, env, args] of cases) {
        const result = await pass(env, args);
        expect(result.code, name).toBe(2);
        expect(result.stdout, name).toBe('');
        expect(result.stderr.trim(), name).not.toBe('');
        expect(result.loaded.filter(file => !BOOTSTRAP.includes(file)), name).toEqual([]);
    }
    expect(snapshot(base)).toEqual(before);
    expect(existsSync(join(repository, '.local/overseer-entry-test'))).toBe(false);
});

test('with the Office down the pass is recorded, under the runner data root, and the inherited data root is untouched', async () => {
    const inherited = tempDir(), root = join(tempDir(), 'runner');
    writeFileSync(join(inherited, 'sentinel'), 'unchanged');
    const before = snapshot(inherited);
    const result = await pass({ OVERSEER_ROOT: root, OFFICE_DATA_ROOT: inherited, OVERSEER_OFFICE_URL: `http://127.0.0.1:${await closedPort()}` });
    expect(result.code).toBe(0);
    expect(result.record).toMatchObject({ outcome: 'service-down', cachedHealthAt: null, officeDataRoot: join(root, 'state/office-data') });
    expect(result.loaded).toContain('server/overseer/machine.ts');
    expect(existsSync(join(root, 'state/office-data'))).toBe(true);
    expect(snapshot(inherited)).toEqual(before);
});

test('against a healthy Office the pass observes with GETs only and creates no claim or admission there', async () => {
    const inherited = tempDir(), root = join(tempDir(), 'runner');
    const project: OfficeProject = { id: 'fixture', name: 'Fixture', provider: 'github', repo: '/nonexistent/fixture', repository: 'JFusco/the-office', target: 'main' };
    const store = new Store(join(inherited, 'office.sqlite'), project, join(inherited, 'fixture'));
    recordAdmission(store.db, 'claim', 'fixture:job-1', '2026-11-25T11:00:00.000Z');
    const claims = (db: DatabaseSync) => Number((db.prepare("SELECT COUNT(*) AS n FROM work_claims WHERE status IN ('running','stopping')").get() as { n: number }).n);
    const counts = { claims: claims(store.db), cursor: admissionCursor(store.db) };
    store.db.close();
    const before = snapshot(inherited);

    const requests: string[] = [];
    const server: Server = createServer((req, res) => {
        requests.push(`${req.method} ${req.url}`);
        let body: unknown = { error: 'not found' };
        if (req.url === '/api/health') body = { ok: true, loadedHash: 'a'.repeat(64), serviceInstanceId: 'service-1', pid: 42, busy: false, fence: { status: 'open' }, release: { status: 'unknown', reason: 'test' } };
        if (req.url === '/api/incidents?research=1') body = { incidents: [{ id: 'inc-00000000000000a1', state: 'observed', revision: 3, cause: { source: 'stopped-work', provider: 'github' }, research: { eligible: true, reason: 'x', at: '2026-11-24T00:00:00.000Z' }, subjects: [{ status: 'open' }] }] };
        res.writeHead(body && 'error' in (body as object) ? 404 : 200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(body));
    });
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    try {
        const result = await pass({ OVERSEER_ROOT: root, OFFICE_DATA_ROOT: inherited, OVERSEER_OFFICE_URL: `http://127.0.0.1:${(server.address() as AddressInfo).port}` });
        expect(result.code).toBe(0);
        expect(result.record).toMatchObject({ outcome: 'observing', selected: { incident: 'inc-00000000000000a1', revision: 3, kept: false } });
        expect(requests).toEqual(['GET /api/health', 'GET /api/incidents?research=1']);
        // Outside the dedicated runner directory the Store does not open: the pass observes and says it could not forward.
        expect(result.record.detail).toContain('Forwarding unavailable');
    } finally { await new Promise(done => server.close(done)); }

    expect(snapshot(inherited)).toEqual(before);
    const db = new DatabaseSync(join(inherited, 'office.sqlite'), { readOnly: true });
    try { expect({ claims: claims(db), cursor: admissionCursor(db) }).toEqual(counts); } finally { db.close(); }
    expect(Object.keys(snapshot(root)).sort()).toEqual(['/', '/control', '/journal', '/state', '/state/forwarding.json', '/state/office-data', '/state/runner.json']);
});

test('a pass refused by a live pass exits 3 and changes nothing', async () => {
    const root = join(tempDir(), 'runner'), paths = runnerPaths(root);
    acquirePassLock(paths, 'held-by-test', { pid: process.pid });
    const before = snapshot(root);
    const result = await pass({ OVERSEER_ROOT: root, OVERSEER_OFFICE_URL: `http://127.0.0.1:${await closedPort()}` });
    expect(result.code).toBe(3);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('held-by-test');
    expect(snapshot(root)).toEqual(before);
});
