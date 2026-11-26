import { linkSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeAll, expect, test } from 'vitest';
import { runtimeRevision } from '../../../server/office/revision';
import { FAST, LAUNCHER, launchEnv, launcherSource, layout, release, writePin } from './launch-world';
import { snapshot, tempDir } from './runner-world';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let revision: any, configuration: any, root: any, entry: any, contract: any, group: any;
beforeAll(async () => {
    [revision, configuration, root, entry, contract, group] = await Promise.all((['release-verification', 'configuration', 'runner-root', 'launch', 'launcher-state', 'process-group'] as const).map(launcherSource));
});
const launch = (options: Record<string, unknown>) => entry.launch({ launcherFile: LAUNCHER, ...options });
const repository = resolve(__dirname, '../../..');
const readState = (root: string) => JSON.parse(readFileSync(join(root, 'state/launcher.json'), 'utf8'));
const quiet = { noSignalHandlers: true, log: () => {}, warn: () => {} };

test('the launcher’s revision is runtimeRevision’s, file for file, on this checkout', () => {
    const mine = revision.releaseRevision(repository), theirs = runtimeRevision(repository);
    expect(mine.manifest).toEqual(theirs.manifest);
    expect(mine.hash).toBe(theirs.hash);
});

test('the revision mirror agrees on collation, links, nested and alternate assets and missing root files', () => {
    const root = tempDir('overseer-revision-');
    const files: Record<string, string> = {
        'server/Zeta.ts': 'a', 'server/alpha.ts': 'b', 'server/a-b.ts': 'c', 'server/a_b.ts': 'd', 'server/A.ts': 'e', 'server/a.b.ts': 'f',
        'src/nested/deep/file.ts': 'g', 'dist/assets/app.js': 'h', 'dist/index.html': 'i', 'other-assets/x.css': 'j',
        'package.json': '{}', 'pnpm-lock.yaml': 'k', 'vite.config.ts': 'l',
    };
    for (const [path, text] of Object.entries(files)) { mkdirSync(join(root, path, '..'), { recursive: true }); writeFileSync(join(root, path), text); }
    symlinkSync(join(root, 'package.json'), join(root, 'server', 'linked.ts'));
    symlinkSync(join(root, 'src'), join(root, 'server', 'linked-folder'));
    for (const assets of [undefined, join(root, 'other-assets')]) {
        const mine = revision.releaseRevision(root, assets), theirs = assets ? runtimeRevision(root, assets) : runtimeRevision(root);
        expect(mine.manifest, String(assets)).toEqual(theirs.manifest);
        expect(mine.hash, String(assets)).toBe(theirs.hash);
    }
    expect(revision.releaseRevision(root).manifest.map((file: { path: string }) => file.path)).not.toContain('tsconfig.json');
});

test('the pass deadline must be a whole number of milliseconds from 30 000 to 900 000', () => {
    expect(configuration.passDeadline({ OVERSEER_PASS_DEADLINE_MS: '30000' })).toBe(30_000);
    expect(configuration.passDeadline({ OVERSEER_PASS_DEADLINE_MS: '900000' })).toBe(900_000);
    for (const value of [undefined, '', '29999', '900001', '1e5', '60000.5', '-60000', ' 60000', '0x1000', '99999999999999999'])
        expect(() => configuration.passDeadline({ OVERSEER_PASS_DEADLINE_MS: value }), String(value)).toThrow('OVERSEER_PASS_DEADLINE_MS');
});

test('the Office URL must be a bare loopback HTTP origin, and is never echoed', () => {
    expect(configuration.officeOrigin({})).toBeUndefined();
    expect(configuration.officeOrigin({ OVERSEER_OFFICE_URL: 'http://localhost:5000/' })).toBe('http://localhost:5000');
    expect(configuration.officeOrigin({ OVERSEER_OFFICE_URL: 'http://127.0.0.1:4318' })).toBe('http://127.0.0.1:4318');
    expect(() => configuration.officeOrigin({ OVERSEER_OFFICE_URL: 'http://[::1]:4318' })).toThrow('OVERSEER_OFFICE_URL must be a bare http: origin on 127.0.0.1 or localhost');
    for (const url of ['http://[::1]:4318', 'https://127.0.0.1:4318', 'http://example.com', 'http://user:secret@127.0.0.1:4318', 'http://127.0.0.1:4318/api', 'http://127.0.0.1:4318/?x', 'http://127.0.0.1:4318/#x', 'nope']) {
        expect(() => configuration.officeOrigin({ OVERSEER_OFFICE_URL: url }), url).toThrow('OVERSEER_OFFICE_URL');
        try { configuration.officeOrigin({ OVERSEER_OFFICE_URL: url }); } catch (error) { expect((error as Error).message).not.toContain('secret'); }
    }
});

test('the runner root must stay clear of both Office data roots and of every Office marker', () => {
    const world = layout(), roots = { checkoutData: world.checkoutData, officeData: world.officeData };
    expect(root.checkRunnerRoot(world.root, roots)).toBe(world.root);
    expect(() => root.checkRunnerRoot('relative', roots)).toThrow('absolute');
    for (const bad of [world.officeData, join(world.officeData, 'runner'), join(world.checkoutData, 'runner'), world.base])
        expect(() => root.checkRunnerRoot(bad, roots), bad).toThrow('overlaps the Office data root');
    const marked = join(world.base, 'marked');
    mkdirSync(join(marked, 'deployments'), { recursive: true });
    expect(() => root.checkRunnerRoot(join(marked, 'runner'), roots)).toThrow('inside an Office data root');
    symlinkSync(marked, join(world.base, 'alias'));
    expect(() => root.checkRunnerRoot(join(world.base, 'alias', 'runner'), roots)).toThrow('inside an Office data root');
    // The installed copy is told both Office roots; one run from a checkout derives that checkout's.
    const installed = join(world.root, 'code', 'launcher', 'overseer-launch.mjs');
    expect(() => root.protectedRoots({}, installed)).toThrow('OVERSEER_CHECKOUT_DATA_ROOT');
    expect(() => root.protectedRoots({ OVERSEER_CHECKOUT_DATA_ROOT: world.checkoutData }, installed)).toThrow('OFFICE_DATA_ROOT');
    expect(root.protectedRoots({ OVERSEER_CHECKOUT_DATA_ROOT: world.checkoutData, OFFICE_DATA_ROOT: world.officeData }, installed)).toEqual(roots);
    expect(root.protectedRoots({}, join(repository, 'scripts', 'overseer-launch.mjs')).checkoutData).toBe(root.physicalPath(join(repository, '.local')));
});

test('every pin and release check refuses on its own, counts one pin failure and starts nothing', async () => {
    const cases: [string, (world: ReturnType<typeof layout>, built: ReturnType<typeof release>) => void][] = [
        ['no pin', () => {}],
        ['malformed pin', world => { mkdirSync(join(world.root, 'code'), { recursive: true }); writeFileSync(join(world.root, 'code/pin.json'), '{'); }],
        ['pin of another shape', (world, built) => writePin(world.root, built, { extra: true })],
        ['linked pin', (world, built) => { const target = join(tempDir(), 'pin.json'); writePin(world.root, built); renameSync(join(world.root, 'code/pin.json'), target); symlinkSync(target, join(world.root, 'code/pin.json')); }],
        ['pin naming another commit', (world, built) => writePin(world.root, built, { commit: 'f'.repeat(40) })],
        ['pin outside the Office releases', (world, built) => { const elsewhere = join(world.base, 'elsewhere', built.commit); mkdirSync(elsewhere, { recursive: true }); writePin(world.root, built, { directory: elsewhere }); }],
        ['pin hash differs', (world, built) => writePin(world.root, built, { manifestHash: 'e'.repeat(64) })],
        ['changed source', (world, built) => { writePin(world.root, built); writeFileSync(join(built.directory, 'src/shared.ts'), 'export const shared = 2;\n'); }],
        ['changed lockfile', (world, built) => { writePin(world.root, built); writeFileSync(join(built.directory, 'pnpm-lock.yaml'), 'changed'); }],
        ['manifest of another shape', (world, built) => {
            writePin(world.root, built);
            const manifest = JSON.parse(readFileSync(join(built.directory, 'release.json'), 'utf8'));
            writeFileSync(join(built.directory, 'release.json'), JSON.stringify({ ...manifest, node: '' }));
        }],
        ['missing entry', (world, built) => { writePin(world.root, built); rmSync(join(built.directory, 'server/overseer.ts')); }],
        ['linked entry', (world, built) => { writePin(world.root, built); const target = join(tempDir(), 'entry.ts'); renameSync(join(built.directory, 'server/overseer.ts'), target); symlinkSync(target, join(built.directory, 'server/overseer.ts')); }],
        // Still in the inventory, with the same bytes and hash: only the entry check refuses a second name.
        ['entry with a second name', (world, built) => { writePin(world.root, built); linkSync(join(built.directory, 'server/overseer.ts'), join(tempDir(), 'second-name.ts')); }],
        ['missing release', (world, built) => { writePin(world.root, built); rmSync(built.directory, { recursive: true }); }],
    ];
    for (const [name, make] of cases) {
        const world = layout(), built = release(world.officeData, 'record');
        make(world, built);
        expect(await launch({ env: launchEnv(world), limits: FAST, ...quiet }), name).toBe(0);
        const state = readState(world.root);
        expect(state.counts.pin, name).toBe(1);
        expect(state.current, name).toBeNull();
        expect(state.consecutiveFailures, name).toBe(1);
        expect(snapshot(world.root), name).not.toHaveProperty('/evidence.json');
    }
}, 120_000);

test('a release without a tsx of its own does not start, even with one in a folder above it', async () => {
    const world = layout(), built = release(world.officeData, 'record', { loader: false });
    mkdirSync(join(world.officeData, 'node_modules', 'tsx'), { recursive: true });
    writeFileSync(join(world.officeData, 'node_modules', 'tsx', 'package.json'), JSON.stringify({ name: 'tsx', exports: { '.': './x.mjs' } }));
    writePin(world.root, built);
    expect(await launch({ env: launchEnv(world), limits: FAST, ...quiet })).toBe(0);
    expect(readState(world.root)).toMatchObject({ counts: { startup: 1 }, current: null, last: { kind: 'startup', detail: expect.stringContaining('no tsx of its own') } });
    expect(snapshot(world.root)).not.toHaveProperty('/evidence.json');
    // A node_modules/tsx that is a link out of the release's own node_modules is not its own either.
    mkdirSync(join(built.directory, 'node_modules'));
    symlinkSync(join(world.officeData, 'node_modules', 'tsx'), join(built.directory, 'node_modules', 'tsx'));
    expect(await launch({ env: launchEnv(world), limits: FAST, ...quiet })).toBe(0);
    expect(readState(world.root)).toMatchObject({ counts: { startup: 2 }, current: null, last: { kind: 'startup', detail: expect.stringContaining('outside the release') } });
    expect(snapshot(world.root)).not.toHaveProperty('/evidence.json');
    // Nor is a node_modules/tsx that is no package folder: Node would pass over it to the one above.
    rmSync(join(built.directory, 'node_modules', 'tsx'));
    writeFileSync(join(built.directory, 'node_modules', 'tsx'), 'not a package');
    expect(await launch({ env: launchEnv(world), limits: FAST, ...quiet })).toBe(0);
    expect(readState(world.root)).toMatchObject({ counts: { startup: 3 }, current: null, last: { kind: 'startup', detail: expect.stringContaining('not a package folder') } });
    expect(snapshot(world.root)).not.toHaveProperty('/evidence.json');
});

test('a bad deadline or Office URL is counted as configuration and starts nothing; an unsafe root writes nothing', async () => {
    for (const extra of [{ OVERSEER_PASS_DEADLINE_MS: '5' }, { OVERSEER_PASS_DEADLINE_MS: undefined }, { OVERSEER_OFFICE_URL: 'http://example.com:1' }]) {
        const world = layout(), built = release(world.officeData, 'record');
        writePin(world.root, built);
        const env = launchEnv(world, extra);
        for (const [key, value] of Object.entries(extra)) if (value === undefined) delete env[key];
        expect(await launch({ env, limits: { ...FAST, minDeadlineMs: 30_000 }, ...quiet }), JSON.stringify(extra)).toBe(0);
        expect(readState(world.root), JSON.stringify(extra)).toMatchObject({ counts: { config: 1 }, current: null });
        expect(readState(world.root).last.detail).not.toContain('example.com');
    }
    const world = layout(), before = snapshot(world.base);
    expect(await launch({ env: launchEnv(world, { OVERSEER_ROOT: join(world.officeData, 'runner') }), limits: FAST, ...quiet })).toBe(2);
    expect(snapshot(world.base)).toEqual(before);
});

test('launcher state that cannot be read starts nothing and stays exactly as it was', async () => {
    for (const text of ['{', JSON.stringify({ version: 1 }), JSON.stringify({ version: 1, current: null, consecutiveFailures: 0, counts: {}, last: null, recent: [] })]) {
        const world = layout(), built = release(world.officeData, 'record');
        writePin(world.root, built);
        mkdirSync(join(world.root, 'state'), { recursive: true, mode: 0o700 });
        writeFileSync(join(world.root, 'state/launcher.json'), text);
        expect(await launch({ env: launchEnv(world), limits: FAST, ...quiet })).toBe(1);
        expect(readFileSync(join(world.root, 'state/launcher.json'), 'utf8')).toBe(text);
        expect(snapshot(world.root)).not.toHaveProperty('/evidence.json');
    }
});

test('persisted process identities outside 2..2147483647, or a PID that is not its group, are refused and never signalled', () => {
    const base = contract.emptyState(), current = { id: '00000000-0000-4000-8000-000000000001', commit: 'a'.repeat(40), entry: '/x/server/overseer.ts', startedAt: '2026-11-26T08:00:00.000Z', deadline: '2026-11-26T08:04:00.000Z', phase: 'registered', start: 'Thu Nov 26 03:00:00 2026', counted: null, observation: null };
    expect(contract.validState({ ...base, current: { ...current, pid: 1234, pgid: 1234 } })).toBe(true);
    for (const [pid, pgid] of [[0, 0], [1, 1], [-5, -5], [12.5, 12.5], [2_147_483_648, 2_147_483_648], [1234, 1235]])
        expect(contract.validState({ ...base, current: { ...current, pid, pgid } }), `${pid}/${pgid}`).toBe(false);
    const calls: unknown[] = [];
    const system = { kill: (...args: unknown[]) => { calls.push(args); } };
    for (const [pid, pgid] of [[0, 0], [1, 1], [-5, -5], [1234, 1235]]) expect(() => group.probeGroup(system, pid, pgid), `${pid}/${pgid}`).toThrow('Refusing to probe');
    expect(calls).toEqual([]);
});

test('settlement counts each kind, resets consecutive failures only on success, keeps them for locked and interrupted, and keeps the newest 20', () => {
    let state = contract.emptyState();
    const record = (kind: string, n: number) => ({ id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, kind, startedAt: '2026-11-26T08:00:00.000Z', durationMs: 1, exit: null, outcome: null, detail: null });
    state = contract.settle(state, record('hang', 1));
    state = contract.settle(state, record('exit', 2));
    expect(state.consecutiveFailures).toBe(2);
    state = contract.settle(state, record('locked', 3));
    state = contract.settle(state, record('interrupted', 4));
    expect(state.consecutiveFailures).toBe(2);
    state = contract.settle(state, record('success', 5));
    expect(state.consecutiveFailures).toBe(0);
    for (let n = 6; n <= 26; n++) state = contract.settle(state, record('pin', n));
    expect(state.recent).toHaveLength(20);
    expect(state.recent[0].id.endsWith('000000000007')).toBe(true);
    expect(state.counts).toMatchObject({ hang: 1, exit: 1, locked: 1, interrupted: 1, success: 1, pin: 21 });
    expect(contract.validState(state)).toBe(true);
});
