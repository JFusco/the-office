import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runtimeRevision } from '../../../server/office/revision';
import { writeManifest } from '../../../server/release/release-manifest';
import { tempDir } from './runner-world';

/** Test support for the launcher: Office data roots holding manifest-valid releases, pins, and the launcher's modules. */

/** The committed bundle: the one file the installer copies, and what direct spawns run. */
export const LAUNCHER = resolve(__dirname, '../../../scripts/overseer-launch.mjs');
/** The maintained launcher modules the bundle is built from. */
export const LAUNCHER_SOURCES = resolve(__dirname, '../../../scripts/overseer-launcher');
export const INSTALLER = resolve(__dirname, '../../../scripts/install-overseer.mjs');
export const LAUNCHER_BUILD = resolve(__dirname, '../../../scripts/build-overseer-launcher.mjs');

export type LauncherSource = 'configuration' | 'dispatch-pass' | 'durable-files' | 'field-checks' | 'helper' | 'launch' | 'launcher-lock'
    | 'launcher-state' | 'limits' | 'pass-outcome' | 'process-group' | 'recover-attempt' | 'release-verification' | 'runner-root';
/** One maintained launcher module, loaded as Node loads it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const launcherSource = (name: LauncherSource): Promise<any> => import(pathToFileURL(resolve(LAUNCHER_SOURCES, `${name}.mjs`)).href);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const installerModule = (): Promise<any> => import(pathToFileURL(INSTALLER).href);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const launcherBuild = (): Promise<any> => import(pathToFileURL(LAUNCHER_BUILD).href);

/** A fresh layout: an Office data root, a checkout data root and a runner root, all physical and apart. */
export function layout() {
    const base = tempDir('overseer-launch-');
    const officeData = join(base, 'office-data'), checkoutData = join(base, 'checkout', '.local'), root = join(base, 'runner');
    for (const directory of [officeData, checkoutData, root]) mkdirSync(directory, { recursive: true });
    return { base, officeData, checkoutData, root };
}

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

/**
 * What a fixture pass does once it has started: print a valid record, hang with a grandchild,
 * exit with a code, or print a record while a TERM-resistant grandchild keeps its pipes.
 */
export type Behavior = 'record' | 'hang' | { exit: number } | 'record-with-stubborn-child' | 'no-markers-exit-1' | 'bootstrap-then-exit-1';

function entrySource(behavior: Behavior, captureParent: boolean): string {
    // The evidence names the live parent's invocation, so a test can tell which launcher file started the helper.
    const start = `import { execFileSync, spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
const mark = phase => { if (process.send) { process.send({ type: 'overseer-phase', phase }); process.channel?.unref(); } };
if (!globalThis.__overseerFixtureLoader) { console.error('the release-local loader did not run'); process.exit(2); }
const root = process.env.OVERSEER_ROOT;
const parent = ${captureParent ? "execFileSync('/bin/ps', ['-o', 'command=', '-p', String(process.ppid)], { encoding: 'utf8', env: { LC_ALL: 'C' } }).trim()" : 'null'};
writeFileSync(root + '/evidence.json', JSON.stringify({ cwd: process.cwd(), argv: process.argv.slice(1), env: process.env, pid: process.pid, parent, loader: globalThis.__overseerFixtureLoader === true }));
`;
    const record = `console.log(JSON.stringify({ pass: crypto.randomUUID(), startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), outcome: 'idle', detail: 'fixture pass', officeDataRoot: root + '/state/office-data' }));`;
    const descendant = `const { existsSync, renameSync, writeFileSync } = require('node:fs');
const root = process.argv[1];
process.on('SIGTERM', () => {});
setInterval(() => { if (existsSync(root + '/release-pipes')) process.exit(0); }, 50);
writeFileSync(root + '/grandchild.ready', String(process.pid));
renameSync(root + '/grandchild.ready', root + '/grandchild.pid');`;
    const stubborn = `spawn(process.execPath, ['-e', ${JSON.stringify(descendant)}, root], { stdio: ['ignore', 'inherit', 'inherit'] });`;
    const ready = `const readyBy = Date.now() + 5_000;
while (!existsSync(root + '/grandchild.pid') && Date.now() < readyBy) await new Promise(done => setTimeout(done, 50));
if (!existsSync(root + '/grandchild.pid')) throw new Error('the fixture descendant did not become ready');`;
    if (behavior === 'record') return `${start}mark('bootstrap'); mark('run');\n${record}\n`;
    if (behavior === 'hang') return `${start}mark('bootstrap'); mark('run');\n${stubborn}\nsetInterval(() => { if (existsSync(root + '/release-pipes')) process.exit(0); }, 50);\n`;
    if (behavior === 'record-with-stubborn-child') return `${start}mark('bootstrap'); mark('run');\n${stubborn}\n${ready}\n${record}\nprocess.exit(0);\n`;
    if (behavior === 'no-markers-exit-1') return `${start}console.error('The pass could not be recorded: disk full'); process.exit(1);\n`;
    if (behavior === 'bootstrap-then-exit-1') return `${start}mark('bootstrap'); console.error('Cannot find module'); process.exit(1);\n`;
    return `${start}mark('bootstrap'); mark('run');\nprocess.exit(${behavior.exit});\n`;
}

/** A release under `<officeData>/releases/<commit>` with a release.json the Office itself would write, and a `tsx` of its own unless told otherwise. */
export function release(officeData: string, behavior: Behavior = 'record', options: { loader?: boolean; files?: Record<string, string>; captureParent?: boolean } = {}) {
    const commit = randomBytes(20).toString('hex'), directory = join(officeData, 'releases', commit);
    const files: Record<string, string> = {
        'package.json': JSON.stringify({ name: 'fixture-release', type: 'module' }),
        'pnpm-lock.yaml': `lockfileVersion: '9.0'\n# ${commit}\n`,
        'server/overseer.ts': entrySource(behavior, options.captureParent ?? true),
        'src/shared.ts': 'export const shared = 1;\n',
        ...options.files,
    };
    if (options.loader ?? true) {
        files['node_modules/tsx/package.json'] = JSON.stringify({ name: 'tsx', type: 'module', exports: { '.': './loader.mjs' } });
        files['node_modules/tsx/loader.mjs'] = 'globalThis.__overseerFixtureLoader = true;\n';
    }
    for (const [path, text] of Object.entries(files)) {
        mkdirSync(join(directory, path, '..'), { recursive: true });
        writeFileSync(join(directory, path), text);
    }
    const hash = runtimeRevision(directory).hash;
    writeManifest(directory, { version: 1, commit, hash, node: 'v24.14.0', pnpm: '10.34.9', lockfile: sha256(files['pnpm-lock.yaml']), builtAt: '2026-11-26T08:00:00.000Z' });
    return { commit, directory, hash, lockfile: sha256(files['pnpm-lock.yaml']) };
}

export function writePin(root: string, built: ReturnType<typeof release>, extra: Record<string, unknown> = {}) {
    mkdirSync(join(root, 'code'), { recursive: true, mode: 0o700 });
    const pin = { version: 1, commit: built.commit, directory: built.directory, manifestHash: built.hash, lockfile: built.lockfile, pinnedAt: '2026-11-26T08:00:00.000Z', ...extra };
    writeFileSync(join(root, 'code', 'pin.json'), JSON.stringify(pin));
    return pin;
}

export const launchEnv = (world: ReturnType<typeof layout>, extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => ({
    OVERSEER_ROOT: world.root, OVERSEER_PASS_DEADLINE_MS: '20000', OVERSEER_CHECKOUT_DATA_ROOT: world.checkoutData, OFFICE_DATA_ROOT: world.officeData,
    PATH: process.env.PATH, HOME: world.base, ...extra,
});

/** Fast bounds for tests: short waits, and deadlines from one second. */
export const FAST = { termGraceMs: 2_000, absenceWaitMs: 8_000, pollMs: 50, minDeadlineMs: 1_000 };
