import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CONTROLLER_RUNTIME, START_CHECK_TIMEOUT_MS, controllerStartFailure } from '../../../server/release/controller-start-check';
import { releaseDirectory } from '../../../server/release/release-paths';
import { AUTO_ADOPT_REJECTED, autoAdoptConfig, autoAdoptRuntime, buildFakeRelease, fakeRunner, realStartCheck } from './deploy-world';

/** The incident's controller supported two bots; the release that replaced it added Dependabot. */
const OLD = 'c'.repeat(40), NEW = 'd'.repeat(40), CHECKOUT = resolve(__dirname, '../../../');
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function dataRoot(config: string) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-start-check-')); roots.push(root);
    writeFileSync(resolve(root, 'office-config.json'), config);
    return root;
}
/** Runs the check for real from `directory`; `outputs` holds what each loaded release printed. */
async function check(root: string, controller: string, directory = releaseDirectory(root, controller)) {
    const outputs: string[] = [], { execute } = fakeRunner(async call => { const out = await realStartCheck(directory, root)(call); outputs.push(out); return out; });
    return { failure: await controllerStartFailure({ dataRoot: root, controller, directory, execute }), outputs };
}

test('a config the newer release accepts and the pinned release rejects is reported with that release and its error', async () => {
    const root = dataRoot(autoAdoptConfig(['dependabot']));
    buildFakeRelease(root, OLD, OLD, autoAdoptRuntime(['pin-courier', 'wiki-sync'], 120));
    buildFakeRelease(root, NEW, NEW, autoAdoptRuntime(['pin-courier', 'wiki-sync', 'dependabot']));
    // The newer release read the config and accepted it.
    expect(await check(root, NEW)).toEqual({ failure: null, outputs: ['["dependabot"]\n'] });
    // The older release's error is thrown under more than 2,000 characters of stack, and still reaches the report.
    const old = await check(root, OLD);
    expect(old.outputs).toEqual([]);
    expect(old.failure).toContain(`Controller release ${OLD} `);
    expect(old.failure).toContain(`Error: ${AUTO_ADOPT_REJECTED}`);
    expect(old.failure).toContain(resolve(root, 'office-config.json'));
    expect(old.failure).not.toMatch(/\bpin\b/);
}, 60_000);

test('a config both releases accept passes both, unchanged', async () => {
    const config = autoAdoptConfig(['pin-courier']), root = dataRoot(config);
    buildFakeRelease(root, OLD, OLD, autoAdoptRuntime(['pin-courier', 'wiki-sync']));
    buildFakeRelease(root, NEW, NEW, autoAdoptRuntime(['pin-courier', 'wiki-sync', 'dependabot']));
    expect(await check(root, OLD)).toEqual({ failure: null, outputs: ['["pin-courier"]\n'] });
    expect(await check(root, NEW)).toEqual({ failure: null, outputs: ['["pin-courier"]\n'] });
    expect(readFileSync(resolve(root, 'office-config.json'), 'utf8')).toBe(config);
}, 60_000);

test('this checkout’s own controller runtime loads, exits by itself and validates the config as it loads', async () => {
    const accepted = dataRoot(autoAdoptConfig(['pin-courier']));
    expect((await check(accepted, 'e'.repeat(40), CHECKOUT)).failure).toBeNull();
    expect(readdirSync(accepted)).toEqual(['office-config.json']);
    const rejected = dataRoot(autoAdoptConfig(['pin-courier', 'pin-courier']));
    expect((await check(rejected, 'e'.repeat(40), CHECKOUT)).failure).toContain(`Error: ${AUTO_ADOPT_REJECTED}`);
}, 60_000);

test('the check loads the runtime with the launch’s node, tree and data root, read-only and bounded', async () => {
    const root = dataRoot('{}\n'), directory = releaseDirectory(root, OLD), { calls, execute } = fakeRunner(() => '');
    expect(await controllerStartFailure({ dataRoot: root, controller: OLD, directory, execute, node: '/usr/local/bin/node' })).toBeNull();
    expect(calls).toEqual([{
        program: '/usr/local/bin/node', args: ['--import', 'tsx', '--input-type=module', '--eval', expect.stringContaining('await import(process.argv[1])'), pathToFileURL(resolve(directory, CONTROLLER_RUNTIME)).href],
        cwd: directory, env: { OFFICE_DATA_ROOT: root }, timeout: START_CHECK_TIMEOUT_MS, readOnly: true,
    }]);
});

test.each([
    ['cannot start', 'spawn /usr/local/bin/node ENOENT'],
    ['hangs until its deadline', 'node read timed out; saved observations retained; safe to retry the read'],
])('a check that %s is reported with the runner’s own diagnostic', async (_, message) => {
    const root = dataRoot('{}\n'), { execute } = fakeRunner(() => { throw new Error(message); });
    const failure = await controllerStartFailure({ dataRoot: root, controller: OLD, directory: releaseDirectory(root, OLD), execute });
    expect(failure).toContain(`Controller release ${OLD} `);
    expect(failure).toContain(message);
});

test('a release without the runtime module cannot pass', async () => {
    const root = dataRoot('{}\n');
    buildFakeRelease(root, NEW, NEW, autoAdoptRuntime([]));
    rmSync(resolve(releaseDirectory(root, NEW), CONTROLLER_RUNTIME));
    const { failure } = await check(root, NEW);
    expect(failure).toContain(`Controller release ${NEW} `);
    expect(failure).toContain(`Cannot find module '${resolve(releaseDirectory(root, NEW), CONTROLLER_RUNTIME)}'`);
}, 60_000);
