import { execFile, spawn } from 'node:child_process';
import { chmodSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, test } from 'vitest';
import { LAUNCHER, installerModule, layout, release, writePin } from './launch-world';
import { snapshot } from './runner-world';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let I: any;
beforeAll(async () => { I = await installerModule(); });
const execute = promisify(execFile);
const cli = resolve(__dirname, '../../../server/cli.ts');
const LABEL = 'com.jfusco.office-overseer', UID = 501;
const MISSING = { code: 113, stdout: '', stderr: `Could not find service "${LABEL}" in domain for user gui: ${UID}` };

interface Call { command: string; args: string[] }
type Answer = { code: number; stdout: string; stderr: string };

/** An injected command runner: plutil is the real one, launchctl answers as told and records every call. */
function launchctl(service: Answer = MISSING, options: { bootstrap?: () => Answer } = {}) {
    const calls: Call[] = [];
    const run = async (command: string, args: string[]): Promise<Answer> => {
        calls.push({ command, args });
        if (command === '/usr/bin/plutil') return execute(command, args, { encoding: 'utf8' }).then(({ stdout, stderr }) => ({ code: 0, stdout, stderr }), (error: { code?: number; stdout?: string; stderr?: string }) => ({ code: typeof error.code === 'number' ? error.code : 1, stdout: error.stdout ?? '', stderr: error.stderr ?? '' }));
        if (command === '/bin/launchctl' && args[0] === 'print') return service;
        if (command === '/bin/launchctl' && args[0] === 'bootstrap') return options.bootstrap?.() ?? { code: 0, stdout: '', stderr: '' };
        throw new Error(`unexpected command ${command} ${args.join(' ')}`);
    };
    return { run, calls, mutating: () => calls.filter(call => call.command === '/bin/launchctl' && call.args[0] !== 'print') };
}

/** A fixture checkout, Office data root, runner root and home, with a verified release pinned. */
function installWorld(behavior: Parameters<typeof release>[1] = 'record', files: Record<string, string> = {}) {
    const world = layout(), checkout = resolve(world.checkoutData, '..'), home = join(world.base, 'home');
    mkdirSync(home);
    const built = release(world.officeData, behavior, { files });
    const env = { OVERSEER_ROOT: world.root, OFFICE_DATA_ROOT: world.officeData, OVERSEER_PASS_DEADLINE_MS: '60000', PATH: process.env.PATH };
    const options = (extra: Record<string, unknown> = {}) => ({ env, home, uid: UID, platform: 'darwin', checkout, log: () => {}, ...extra });
    return { world, checkout, home, built, env, options };
}

const plutil = async (path: string) => JSON.parse((await execute('/usr/bin/plutil', ['-convert', 'json', '-o', '-', path], { encoding: 'utf8' })).stdout);
const mode = (path: string) => statSync(path).mode & 0o777;

describe('installer preflight, before any plist or launchctl', () => {
    test('a non-macOS platform or an unknown user is refused', async () => {
        const { options } = installWorld();
        await expect(I.installOverseer(options({ platform: 'linux' }))).rejects.toThrow('macOS LaunchAgent');
        await expect(I.installOverseer(options({ uid: Number.NaN }))).rejects.toThrow('user ID');
    });

    test('an absent, malformed or misplaced pin, an unsafe root, a bad deadline or a remote Office URL is refused with nothing written or run', async () => {
        const cases: [string, (w: ReturnType<typeof installWorld>) => Record<string, unknown>, string][] = [
            ['no pin', () => ({}), 'no runner pin'],
            ['malformed pin', w => { mkdirSync(join(w.world.root, 'code'), { recursive: true }); writeFileSync(join(w.world.root, 'code/pin.json'), '{'); return {}; }, 'not JSON'],
            ['pin of another shape', w => { writePin(w.world.root, w.built, { extra: 1 }); return {}; }, 'not a valid version 1 pin'],
            ['pin outside the Office releases', w => { const elsewhere = join(w.world.base, 'elsewhere', w.built.commit); mkdirSync(elsewhere, { recursive: true }); writePin(w.world.root, w.built, { directory: elsewhere }); return {}; }, 'pinned directory is not'],
            ['pinned release missing', w => { writePin(w.world.root, w.built, { commit: 'f'.repeat(40), directory: join(w.world.officeData, 'releases', 'f'.repeat(40)) }); return {}; }, 'is missing'],
            ['root inside the Office data', w => { writePin(w.world.root, w.built); return { env: { ...w.env, OVERSEER_ROOT: join(w.world.officeData, 'runner') } }; }, 'overlaps the Office data root'],
            ['root inside the checkout data', w => { writePin(w.world.root, w.built); return { env: { ...w.env, OVERSEER_ROOT: join(w.world.checkoutData, 'runner') } }; }, 'overlaps the Office data root'],
            ['deadline below the bound', w => { writePin(w.world.root, w.built); return { env: { ...w.env, OVERSEER_PASS_DEADLINE_MS: '5000' } }; }, 'OVERSEER_PASS_DEADLINE_MS'],
            ['remote Office URL', w => { writePin(w.world.root, w.built); return { env: { ...w.env, OVERSEER_OFFICE_URL: 'http://example.com:4318' } }; }, 'OVERSEER_OFFICE_URL'],
        ];
        for (const [name, make, error] of cases) {
            const w = installWorld(), extra = make(w), fake = launchctl(), before = snapshot(w.world.base);
            await expect(I.installOverseer(w.options({ run: fake.run, ...extra })), name).rejects.toThrow(error);
            expect(fake.calls, name).toEqual([]);
            expect(snapshot(w.world.base), name).toEqual(before);
        }
    });

    test('the deadline defaults to 240000 ms only when it is unset', () => {
        expect(I.DEFAULT_DEADLINE_MS).toBe(240_000);
    });
});

describe.skipIf(process.platform !== 'darwin')('installation as a LaunchAgent', () => {
    test('a recognized absence installs: the committed bundle byte for byte at 0400, the plist at 0600 with every field, logs, then bootstrap', async () => {
        const w = installWorld();
        writePin(w.world.root, w.built);
        const copy = join(w.world.root, 'code/launcher/overseer-launch.mjs'), plistPath = join(w.home, `Library/LaunchAgents/${LABEL}.plist`);
        let atBootstrap: Record<string, unknown> | null = null;
        const fake = launchctl(MISSING, { bootstrap: () => {
            atBootstrap = {
                same: readFileSync(copy).equals(readFileSync(LAUNCHER)), copyMode: mode(copy), plistMode: mode(plistPath),
                logs: [mode(join(w.world.root, 'logs/launcher.out.log')), mode(join(w.world.root, 'logs/launcher.err.log'))],
            };
            return { code: 0, stdout: '', stderr: '' };
        } });
        const env = { ...w.env, OVERSEER_OFFICE_URL: 'http://localhost:4318/' };
        expect(await I.installOverseer(w.options({ run: fake.run, env }))).toMatchObject({ status: 'installed', plistPath });
        expect(atBootstrap).toEqual({ same: true, copyMode: 0o400, plistMode: 0o600, logs: [0o600, 0o600] });
        expect(fake.mutating().map(call => call.args)).toEqual([['bootstrap', `gui/${UID}`, plistPath]]);
        expect(await plutil(plistPath)).toEqual({
            Label: LABEL, ProgramArguments: [process.execPath, copy], WorkingDirectory: w.world.root,
            EnvironmentVariables: {
                OVERSEER_ROOT: w.world.root, OVERSEER_PASS_DEADLINE_MS: '60000', PATH: process.env.PATH,
                OVERSEER_CHECKOUT_DATA_ROOT: w.world.checkoutData, OFFICE_DATA_ROOT: w.world.officeData, OVERSEER_OFFICE_URL: 'http://localhost:4318',
            },
            StartInterval: 120, RunAtLoad: true, ProcessType: 'Background', ExitTimeOut: 30,
            StandardOutPath: join(w.world.root, 'logs/launcher.out.log'), StandardErrorPath: join(w.world.root, 'logs/launcher.err.log'),
        });
    });

    test('values are escaped in the plist rather than read as markup', async () => {
        const w = installWorld();
        writePin(w.world.root, w.built);
        const fake = launchctl();
        const env = { ...w.env, PATH: '/usr/bin:/bin:/odd/<dir>&"quoted"' };
        await I.installOverseer(w.options({ run: fake.run, env }));
        expect((await plutil(join(w.home, `Library/LaunchAgents/${LABEL}.plist`))).EnvironmentVariables.PATH).toBe(env.PATH);
    });

    test('--print renders the checked plist and the intended actions and writes nothing', async () => {
        const w = installWorld();
        writePin(w.world.root, w.built);
        const fake = launchctl(), lines: string[] = [], before = snapshot(w.world.base);
        const result = await I.installOverseer(w.options({ run: fake.run, print: true, log: (line: string) => lines.push(line) }));
        expect(result).toMatchObject({ status: 'printed', plist: expect.stringContaining(`<string>${LABEL}</string>`) });
        expect(lines.join('\n')).toContain('would launchctl bootstrap');
        expect(fake.mutating()).toEqual([]);
        expect(snapshot(w.world.base)).toEqual(before);
    });

    test('a loaded job with matching files is reported installed, one with other or missing files must be booted out, and an unclear answer stops; none writes', async () => {
        const w = installWorld();
        writePin(w.world.root, w.built);
        await I.installOverseer(w.options({ run: launchctl().run }));
        const copy = join(w.world.root, 'code/launcher/overseer-launch.mjs');
        const loaded = { code: 0, stdout: `gui/${UID}/${LABEL} = { state = not running }`, stderr: '' };
        let before = snapshot(w.world.base), fake = launchctl(loaded);
        expect(await I.installOverseer(w.options({ run: fake.run }))).toMatchObject({ status: 'already-installed' });
        expect(fake.mutating()).toEqual([]);
        expect(snapshot(w.world.base)).toEqual(before);
        chmodSync(copy, 0o600);
        writeFileSync(copy, '// an older launcher\n');
        chmodSync(copy, 0o400);
        before = snapshot(w.world.base);
        fake = launchctl(loaded);
        await expect(I.installOverseer(w.options({ run: fake.run }))).rejects.toThrow('launchctl bootout');
        expect(fake.mutating()).toEqual([]);
        expect(snapshot(w.world.base)).toEqual(before);
        fake = launchctl(loaded);
        await expect(I.installOverseer(w.options({ run: fake.run, env: { ...w.env, OVERSEER_PASS_DEADLINE_MS: '90000' } }))).rejects.toThrow('launchctl bootout');
        expect(snapshot(w.world.base)).toEqual(before);
        fake = launchctl({ code: 5, stdout: '', stderr: 'Input/output error' });
        await expect(I.installOverseer(w.options({ run: fake.run }))).rejects.toThrow('could not tell whether');
        expect(fake.mutating()).toEqual([]);
        expect(snapshot(w.world.base)).toEqual(before);
    });

    test('a plist under the label that is another installation’s, misleading or unreadable is refused and left alone', async () => {
        const w = installWorld();
        writePin(w.world.root, w.built);
        const plistDir = join(w.home, 'Library/LaunchAgents'), plistPath = join(plistDir, `${LABEL}.plist`);
        mkdirSync(plistDir, { recursive: true });
        const other = I.renderPlist({ execPath: process.execPath, paths: { launcherCopy: '/elsewhere/code/launcher/overseer-launch.mjs', root: '/elsewhere', stdoutLog: '/x', stderrLog: '/y' }, environment: { OVERSEER_ROOT: '/elsewhere' } });
        const misleading = `<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0"><dict><key>Label</key><string>other</string><!-- <key>Label</key><string>${LABEL}</string> ${w.world.root} --></dict></plist>\n`;
        for (const [name, text, error] of [['another installation', other, 'another installation'], ['misleading text', misleading, 'another installation'], ['unreadable', 'not a plist', 'cannot be read']]) {
            writeFileSync(plistPath, text);
            const fake = launchctl(), before = snapshot(w.world.base);
            await expect(I.installOverseer(w.options({ run: fake.run })), name).rejects.toThrow(error);
            expect(fake.mutating(), name).toEqual([]);
            expect(snapshot(w.world.base), name).toEqual(before);
        }
    });

    test('a failed bootstrap names where the files are; installing again repeats every check', async () => {
        const w = installWorld();
        writePin(w.world.root, w.built);
        const fake = launchctl(MISSING, { bootstrap: () => ({ code: 5, stdout: '', stderr: 'Bootstrap failed: 5: Input/output error' }) });
        await expect(I.installOverseer(w.options({ run: fake.run }))).rejects.toThrow(join(w.world.root, 'code/launcher/overseer-launch.mjs'));
        const again = launchctl({ code: 0, stdout: '', stderr: '' });
        expect(await I.installOverseer(w.options({ run: again.run }))).toMatchObject({ status: 'already-installed' });
        expect(again.calls.map(call => call.command)).toEqual(['/usr/bin/plutil', '/bin/launchctl']);
    });

    test('pin to plist: the pin the CLI writes installs, and the plist’s own command runs one pass from the installed launcher', async () => {
        const w = installWorld('record', { 'scripts/overseer-launch.mjs': '// the release’s own copy: never what is installed or run\nprocess.exit(99);\n' });
        const { VITEST: _, VITEST_POOL_ID: __, VITEST_WORKER_ID: ___, ...inherited } = process.env;
        const cliEnv = { ...inherited, NODE_ENV: 'production', OFFICE_DATA_ROOT: w.world.officeData, OVERSEER_ROOT: w.world.root };
        await execute(process.execPath, ['--import', 'tsx', cli, 'overseer', 'pin', w.built.commit], { env: cliEnv, encoding: 'utf8', timeout: 60_000 });
        const copy = join(w.world.root, 'code/launcher/overseer-launch.mjs');
        let copied = false;
        const fake = launchctl(MISSING, { bootstrap: () => { copied = readFileSync(copy).equals(readFileSync(LAUNCHER)) && mode(copy) === 0o400; return { code: 0, stdout: '', stderr: '' }; } });
        expect(await I.installOverseer(w.options({ run: fake.run }))).toMatchObject({ status: 'installed' });
        expect(copied).toBe(true);
        const plist = await plutil(join(w.home, `Library/LaunchAgents/${LABEL}.plist`));
        const [node, ...args] = plist.ProgramArguments as string[];
        const launched = spawn(node, args, { cwd: plist.WorkingDirectory, env: { ...plist.EnvironmentVariables, HOME: w.home }, stdio: 'ignore' });
        expect(await new Promise(done => launched.once('exit', done))).toBe(0);
        const evidence = JSON.parse(readFileSync(join(w.world.root, 'evidence.json'), 'utf8'));
        const { stdout } = await execute(process.execPath, ['--import', 'tsx', cli, 'overseer', 'status'], { env: cliEnv, encoding: 'utf8', timeout: 60_000 });
        const status = JSON.parse(stdout), state = status.launcher.state;
        expect(status.pin.pin).toMatchObject({ commit: w.built.commit, directory: w.built.directory, manifestHash: w.built.hash });
        expect(state).toMatchObject({ current: null, consecutiveFailures: 0, last: { kind: 'success', outcome: 'idle', exit: { code: 0, signal: null } } });
        expect(state.counts).toEqual({ success: 1, locked: 0, interrupted: 0, config: 0, pin: 0, startup: 0, exit: 0, hang: 0, lost: 0, orphan: 0 });
        // The helper is the installed launcher, for exactly the attempt that was settled.
        expect(evidence.parent).toBe(`${process.execPath} ${copy} --group ${state.last.id}`);
        expect(evidence).toMatchObject({ loader: true, cwd: w.built.directory, argv: [join(w.built.directory, 'server/overseer.ts'), 'pass'] });
        expect(Object.keys(evidence.env).filter(key => key !== '__CF_USER_TEXT_ENCODING').sort()).toEqual(['HOME', 'NODE_ENV', 'OVERSEER_ROOT', 'PATH']);
        expect(evidence.env).toMatchObject({ HOME: w.home, NODE_ENV: 'production', OVERSEER_ROOT: w.world.root });
    }, 120_000);
});
