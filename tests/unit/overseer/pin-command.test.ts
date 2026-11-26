import { execFile } from 'node:child_process';
import { mkdirSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { expect, test } from 'vitest';
import { DATA } from '../../../server/office/config';
import { runtimeRevision } from '../../../server/office/revision';
import { readManifest, writeManifest } from '../../../server/release/release-manifest';
import { overseerCommand } from '../../../server/overseer/commands';
import { runnerPaths } from '../../../server/overseer/config';
import { pinCommand } from '../../../server/overseer/pin-command';
import { readRunnerPin, RunnerPin } from '../../../server/overseer/runner-pin';
import { launcherSource, release } from './launch-world';
import { snapshot, tempDir } from './runner-world';

const run = promisify(execFile);
const cli = resolve(__dirname, '../../../server/cli.ts');
const now = () => new Date('2026-11-26T09:00:00.000Z');

async function pin(args: string[], root: string) {
    const lines: string[] = [];
    const code = await pinCommand(args, { env: { OVERSEER_ROOT: root, OFFICE_DATA_ROOT: process.env.OFFICE_DATA_ROOT }, now, log: line => lines.push(line) });
    return { code, output: lines.join('\n') };
}
/** Rewrites a release's manifest after its files changed, so it is manifest-valid again. */
const remanifest = (directory: string) => writeManifest(directory, { ...readManifest(directory)!, hash: runtimeRevision(directory).hash });

test('a verified release is pinned with its manifest hash and lockfile, and status reads the pin back', async () => {
    const root = join(tempDir(), 'runner'), built = release(DATA, 'record');
    const { code, output } = await pin([built.commit], root);
    expect(code).toBe(0);
    expect(JSON.parse(output).pinned).toMatchObject({ commit: built.commit, manifestHash: built.hash, lockfile: built.lockfile, pinnedAt: '2026-11-26T09:00:00.000Z' });
    expect(readRunnerPin(runnerPaths(root))).toEqual({ pin: { version: 1, commit: built.commit, directory: resolve(realpathSync(DATA), 'releases', built.commit), manifestHash: built.hash, lockfile: built.lockfile, pinnedAt: '2026-11-26T09:00:00.000Z' } });
});

test('a malformed command is refused with the usage and touches nothing', async () => {
    const base = tempDir(), root = join(base, 'runner'), before = snapshot(base);
    for (const args of [[], ['abc'], ['A'.repeat(40)], ['a'.repeat(40), 'extra'], ['a'.repeat(39)]])
        expect(await pin(args, root), args.join(' ')).toMatchObject({ code: 2, output: expect.stringContaining('pnpm office overseer pin COMMIT') });
    expect(snapshot(base)).toEqual(before);
});

test('an unbuilt, unmanifested or changed release, or one whose entry is missing or linked, is refused; nothing is created and a prior pin stays', async () => {
    const base = tempDir(), root = join(base, 'runner');
    const cases: [string, () => string][] = [
        ['not built', () => 'b'.repeat(40)],
        ['no manifest', () => { const built = release(DATA); rmSync(join(built.directory, 'release.json')); return built.commit; }],
        ['changed after its manifest', () => { const built = release(DATA); writeFileSync(join(built.directory, 'src/shared.ts'), 'changed'); return built.commit; }],
        ['entry missing', () => { const built = release(DATA); rmSync(join(built.directory, 'server/overseer.ts')); remanifest(built.directory); return built.commit; }],
        ['entry linked', () => {
            const built = release(DATA), target = join(tempDir(), 'overseer.ts');
            renameSync(join(built.directory, 'server/overseer.ts'), target);
            symlinkSync(target, join(built.directory, 'server/overseer.ts'));
            remanifest(built.directory);
            return built.commit;
        }],
        ['server folder linked', () => {
            const built = release(DATA), elsewhere = join(tempDir(), 'server');
            renameSync(join(built.directory, 'server'), elsewhere);
            symlinkSync(elsewhere, join(built.directory, 'server'));
            remanifest(built.directory);
            return built.commit;
        }],
        ['release folder linked', () => {
            const built = release(DATA), elsewhere = join(tempDir(), 'release');
            renameSync(built.directory, elsewhere);
            symlinkSync(elsewhere, built.directory);
            return built.commit;
        }],
    ];
    const before = snapshot(base);
    for (const [name, make] of cases) {
        const result = await pin([make()], root);
        expect(result.code, name).toBe(1);
        expect(result.output, name).toContain('nothing was pinned');
        expect(snapshot(base), name).toEqual(before);
    }
    const good = release(DATA);
    expect((await pin([good.commit], root)).code).toBe(0);
    const pinned = readFileSync(runnerPaths(root).pin, 'utf8');
    expect((await pin(['c'.repeat(40)], root)).code).toBe(1);
    expect(readFileSync(runnerPaths(root).pin, 'utf8')).toBe(pinned);
});

test('a pin that cannot be trusted is reported, not repaired', () => {
    const root = join(tempDir(), 'runner'), paths = runnerPaths(root);
    expect(readRunnerPin(paths)).toEqual({ absent: true });
    mkdirSync(paths.code, { recursive: true });
    writeFileSync(paths.pin, JSON.stringify({ version: 1, commit: 'a'.repeat(40) }));
    expect(readRunnerPin(paths)).toEqual({ unreadable: 'not a valid version 1 pin' });
    rmSync(paths.pin);
    const target = join(tempDir(), 'pin.json');
    writeFileSync(target, '{}');
    symlinkSync(target, paths.pin);
    expect(readRunnerPin(paths)).toMatchObject({ unreadable: expect.stringContaining('single link') });
});

test('pnpm office overseer pin reaches the pin command, the one Overseer verb that loads Office configuration', async () => {
    const office = tempDir('overseer-pin-office-'), root = join(tempDir(), 'runner'), built = release(office);
    const { VITEST: _, VITEST_POOL_ID: __, VITEST_WORKER_ID: ___, ...inherited } = process.env;
    const { stdout } = await run(process.execPath, ['--import', 'tsx', cli, 'overseer', 'pin', built.commit], { env: { ...inherited, NODE_ENV: 'production', OFFICE_DATA_ROOT: office, OVERSEER_ROOT: root }, encoding: 'utf8', timeout: 60_000 });
    expect(JSON.parse(stdout).pinned).toMatchObject({ commit: built.commit, directory: join(office, 'releases', built.commit) });
}, 60_000);

test('the pin the command writes is the pin the launcher accepts, and both refuse the same malformed pins', async () => {
    const { validPin } = await launcherSource('release-verification');
    const root = join(tempDir(), 'runner'), built = release(DATA, 'record');
    expect((await pin([built.commit], root)).code).toBe(0);
    const written = JSON.parse(readFileSync(runnerPaths(root).pin, 'utf8'));
    expect(validPin(written)).toBe(true);
    expect(RunnerPin.safeParse(written).success).toBe(true);
    const { pinnedAt: _, ...withoutTime } = written;
    for (const [name, malformed] of Object.entries({
        'an extra key': { ...written, extra: 1 }, 'a missing key': withoutTime, 'version 2': { ...written, version: 2 },
        'an upper-case commit': { ...written, commit: written.commit.toUpperCase() }, 'a relative directory': { ...written, directory: 'releases/x' },
        'a short manifest hash': { ...written, manifestHash: 'a'.repeat(63) }, 'a lockfile digest of another length': { ...written, lockfile: 'a'.repeat(40) },
        'a time that is not ISO': { ...written, pinnedAt: 'yesterday' },
    })) {
        expect(validPin(malformed), name).toBe(false);
        expect(RunnerPin.safeParse(malformed).success, name).toBe(false);
    }
});

test('status on a root that has never been pinned shows the pin absent, then the pin once set, and writes nothing either time', async () => {
    const base = tempDir(), root = join(base, 'runner'), built = release(DATA, 'record');
    const status = async () => {
        const lines: string[] = [], before = snapshot(base);
        expect(await overseerCommand(['status'], { env: { OVERSEER_ROOT: root }, log: line => lines.push(line) })).toBe(0);
        expect(snapshot(base)).toEqual(before);
        return JSON.parse(lines.join('\n'));
    };
    expect(await status()).toMatchObject({ pin: { absent: true }, launcher: { absent: true }, launcherLock: { absent: true, guardLeft: false } });
    expect((await pin([built.commit], root)).code).toBe(0);
    expect((await status()).pin).toEqual(readRunnerPin(runnerPaths(root)));
    expect((await status()).pin.pin.commit).toBe(built.commit);
});
