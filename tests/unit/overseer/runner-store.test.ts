import { execFile } from 'node:child_process';
import { linkSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { expect, test } from 'vitest';
import { runnerPaths } from '../../../server/overseer/config';
import { snapshot, tempDir } from './runner-world';

const run = promisify(execFile);
const repository = resolve(__dirname, '../../..'), child = resolve(__dirname, 'store-child.mts'), recorder = resolve(__dirname, 'record-loads.mjs');

/** Opens the Store in a fresh production-mode process (Vitest's flags cleared, so local bindings are read), recording which repository modules load. */
async function open(root: string, options: { trusted?: string; dataRoot?: string; args?: string[] } = {}) {
    const loads = join(tempDir(), 'loads.txt');
    writeFileSync(loads, '');
    const { VITEST: _, VITEST_POOL_ID: __, VITEST_WORKER_ID: ___, ...inherited } = process.env;
    const env = { ...inherited, NODE_ENV: 'production', OFFICE_DATA_ROOT: options.dataRoot ?? runnerPaths(root).officeData, OVERSEER_LOAD_LOG: loads };
    const { stdout } = await run(process.execPath, ['--import', 'tsx', '--import', recorder, child, root, options.trusted ?? root, ...(options.args ?? [])], { env, encoding: 'utf8', timeout: 60_000 });
    const loaded = readFileSync(loads, 'utf8').split('\n').filter(url => url.startsWith(`file://${repository}/server/`)).map(url => url.slice(`file://${repository}/`.length));
    return { ...JSON.parse(stdout.trim().split('\n').at(-1)!), loaded };
}
const loadedOffice = (loaded: string[]) => loaded.filter(file => file === 'server/office/config.ts' || file === 'server/store/store.ts');

test('the Store opens in the dedicated runner root only, under state/, for a project the Office does not deliver, and an Effect is not resent after reopening', async () => {
    const root = join(tempDir(), 'runner'), result = await open(root);
    expect(result).toMatchObject({ ok: true, answer: { n: 1 }, replay: { n: 1 }, dispatched: 1, registered: false });
    expect(result.loaded).toEqual(expect.arrayContaining(['server/office/config.ts', 'server/store/store.ts']));
    const files = Object.keys(snapshot(root));
    expect(files.filter(file => !file.startsWith('/state/runner-data'))).toEqual(['/', '/state', '/state/runner.sqlite']);
});

test('a root other than the dedicated one is refused, such as an ordinary checkout', async () => {
    const checkout = join(tempDir(), 'some-project'), trusted = join(tempDir(), 'runner');
    mkdirSync(join(checkout, 'src'), { recursive: true });
    const before = snapshot(checkout), result = await open(checkout, { trusted });
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('opens only in the dedicated runner directory') });
    expect(loadedOffice(result.loaded)).toEqual([]);
    expect(snapshot(checkout)).toEqual(before);
    const link = join(tempDir(), 'link'), target = join(tempDir(), 'runner');
    mkdirSync(target);
    symlinkSync(target, link);
    expect(await open(link, { trusted: link })).toMatchObject({ ok: false, error: expect.stringContaining('reached through a link') });
});

test('the Store derives its destinations from the trusted root even when the selected paths conflict', async () => {
    const root = join(tempDir(), 'runner'), decoy = tempDir();
    const { officeData } = runnerPaths(decoy);
    mkdirSync(officeData, { recursive: true });
    writeFileSync(join(officeData, 'office-config.json'), '{');
    const before = snapshot(decoy);
    const result = await open(root, { args: ['decoy-paths', decoy] });
    expect(result).toMatchObject({ ok: true, replay: { n: 1 }, dispatched: 1 });
    expect(snapshot(root)).toHaveProperty('/state/runner.sqlite');
    expect(snapshot(root)).toHaveProperty('/state/runner-data');
    expect(snapshot(decoy)).toEqual(before);
});

test('a wrong OFFICE_DATA_ROOT or a linked office-config.json is refused before Office configuration loads, and the decoy is untouched', async () => {
    const root = join(tempDir(), 'runner'), decoy = tempDir();
    writeFileSync(join(decoy, 'office-config.json'), '{"projects":[]}');
    const before = snapshot(decoy), wrong = await open(root, { dataRoot: decoy, args: ['override-env'] });
    expect(wrong).toMatchObject({ ok: false, error: expect.stringContaining('OFFICE_DATA_ROOT must be') });
    expect(loadedOffice(wrong.loaded)).toEqual([]);
    expect(snapshot(decoy)).toEqual(before);
    const paths = runnerPaths(root);
    mkdirSync(paths.officeData, { recursive: true });
    symlinkSync(join(decoy, 'office-config.json'), join(paths.officeData, 'office-config.json'));
    const linked = await open(root);
    expect(linked).toMatchObject({ ok: false, error: expect.stringContaining('single link') });
    expect(loadedOffice(linked.loaded)).toEqual([]);
});

test('Office configuration already loaded for another root refuses the Store before it loads', async () => {
    const root = join(tempDir(), 'runner'), decoy = tempDir();
    const result = await open(root, { dataRoot: decoy, args: ['load-config-first'] });
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining(`Office configuration was loaded for ${decoy}`) });
    expect(result.loaded).not.toContain('server/store/store.ts');
});

test('a linked or hard-linked database or sidecar is refused before anything opens it, and its target is unchanged', async () => {
    for (const name of ['runner.sqlite', 'runner.sqlite-wal']) {
        for (const kind of ['symlink', 'hardlink'] as const) {
            const root = join(tempDir(), 'runner'), paths = runnerPaths(root), target = join(tempDir(), 'target.sqlite');
            mkdirSync(paths.state, { recursive: true });
            writeFileSync(target, 'not a store');
            if (name.endsWith('-wal')) writeFileSync(paths.runnerDb, '');
            if (kind === 'symlink') symlinkSync(target, join(paths.state, name)); else linkSync(target, join(paths.state, name));
            const result = await open(root);
            expect(result, `${name} ${kind}`).toMatchObject({ ok: false, error: expect.stringContaining('single link') });
            expect(result.loaded, `${name} ${kind}`).not.toContain('server/store/store.ts');
            expect(readFileSync(target, 'utf8'), `${name} ${kind}`).toBe('not a store');
        }
    }
    const root = join(tempDir(), 'runner'), paths = runnerPaths(root);
    mkdirSync(paths.state, { recursive: true });
    writeFileSync(paths.runnerData, '');
    expect(await open(root)).toMatchObject({ ok: false, error: expect.stringContaining('must be a directory') });
}, 120_000);

test('a state folder reached through a link is refused before Office configuration loads, and its target is untouched', async () => {
    const root = join(tempDir(), 'runner'), elsewhere = tempDir();
    mkdirSync(root);
    symlinkSync(elsewhere, runnerPaths(root).state);
    const before = snapshot(elsewhere), result = await open(root);
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('must be a directory') });
    expect(loadedOffice(result.loaded)).toEqual([]);
    expect(snapshot(elsewhere)).toEqual(before);
});
