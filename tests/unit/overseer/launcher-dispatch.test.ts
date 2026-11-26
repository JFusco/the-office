import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { alive, until } from './launch-processes';
import { dispatchWith, fakeHelper } from './launch-fake-helper';
import { LAUNCHER_SOURCES } from './launch-world';
import { tempDir } from './runner-world';

// One dispatch with a scripted stand-in helper: what is authorized, when the deadline counts, and
// that cleanup and the launcher's own exit survive a failed save.

const groupGone = (pid: number) => { try { process.kill(-pid, 0); return false; } catch (error) { return (error as NodeJS.ErrnoException).code === 'ESRCH'; } };

describe.skipIf(process.platform !== 'darwin')('dispatch with a stand-in helper', () => {
    test('a stop asked for while the helper starts withholds authorization: nothing runs, and the attempt is interrupted', async () => {
        const helper = fakeHelper({ readyAfter: 100 });
        const { run, state } = await dispatchWith(helper, { deadlineMs: 20_000, isShuttingDown: () => true, system: { ps: helper.ps } });
        expect(await run).toBe(0);
        expect(helper.saw('started')).toBe(true);
        expect(helper.saw('authorized')).toBe(false);
        expect(state()).toMatchObject({ current: null, counts: { interrupted: 1 }, last: { kind: 'interrupted' } });
        expect(await until(() => !alive(helper.pidOf('started')!))).toBe(true);
    }, 30_000);

    test('a deadline that passes while the helper is registered withholds authorization and is one hang, cleaned up', async () => {
        const helper = fakeHelper({ readyAfter: 600 });
        const { run, state, failures } = await dispatchWith(helper, { deadlineMs: 300 });
        expect(await run).toBe(0);
        expect(helper.saw('authorized')).toBe(false);
        expect(state()).toMatchObject({ current: null, counts: { hang: 1 }, last: { kind: 'hang', detail: 'passed its 300 ms deadline' } });
        expect(failures.map(failure => failure.kind)).toEqual(['hang']);
        expect(groupGone(helper.pidOf('started')!)).toBe(true);
    }, 30_000);

    test('a pass that exits before its deadline is not a hang, though its report arrives after it while output drains', async () => {
        // The deadline counts startup, so it leaves room for a slow start; the report still lands after it, inside the drain wait.
        const helper = fakeHelper({ exitedAt: 200, reportAt: 3_500 });
        const { run, state } = await dispatchWith(helper, { deadlineMs: 3_000, limits: { drainMs: 5_000 } });
        expect(await run).toBe(0);
        expect(helper.saw('authorized')).toBe(true);
        expect(state()).toMatchObject({ current: null, counts: { success: 1, hang: 0 }, last: { kind: 'success', outcome: 'idle' } });
    }, 30_000);

    test.each([
        ['during drain', 0, 'success', 0],
        ['after the full report', 1, 'exit', 3],
    ] as const)('a stop %s preserves exit %i as %s', async (when, exitCode, kind, consecutiveFailures) => {
        const helper = fakeHelper({ exitedAt: when === 'during drain' ? 200 : undefined, reportAt: 600, exitCode });
        let onGroupProbe = () => {};
        const system = {
            ps: helper.ps,
            kill: (pid: number, signal: NodeJS.Signals | 0) => {
                if (pid < 0 && signal === 0) onGroupProbe();
                return process.kill(pid, signal);
            },
        };
        const { run, state, shutdown } = await dispatchWith(helper, { deadlineMs: 20_000, consecutiveFailures: 2, system });
        if (when === 'during drain') {
            expect(await until(() => helper.saw('exited'))).toBe(true);
            shutdown();
        } else {
            onGroupProbe = shutdown;
        }
        expect(await run).toBe(0);
        expect(state()).toMatchObject({ current: null, consecutiveFailures, counts: { [kind]: 1, interrupted: 0 }, last: { kind, exit: { code: exitCode } } });
    }, 30_000);

    test('a hang stays one hang with its own detail when the pass reports while it is being stopped', async () => {
        const helper = fakeHelper({ reportOnTerm: true });
        const { run, state, failures } = await dispatchWith(helper, { deadlineMs: 3_000 });
        expect(await run).toBe(0);
        expect(helper.saw('authorized')).toBe(true);
        expect(helper.saw('terminated')).toBe(true);
        const settled = state();
        expect(settled).toMatchObject({ current: null, counts: { hang: 1, success: 0 }, last: { kind: 'hang', detail: 'passed its 3000 ms deadline', exit: { code: 0, signal: null } } });
        expect(settled.recent).toHaveLength(1);
        expect(failures).toEqual([expect.objectContaining({ kind: 'hang' })]);
    }, 30_000);

    test('a first save that fails starts no helper', async () => {
        const helper = fakeHelper();
        const { run } = await dispatchWith(helper, { deadlineMs: 20_000, save: () => { throw new Error('disk full'); } });
        await expect(run).rejects.toThrow('disk full');
        expect(helper.saw('started')).toBe(false);
    });

    test('a hang whose count cannot be saved is still stopped, its error reported, and the launcher exits', async () => {
        const helper = fakeHelper(), root = join(tempDir(), 'runner'), runner = join(tempDir(), 'runner.mjs');
        writeFileSync(runner, `import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const [sources, root, file, home] = process.argv.slice(2);
const load = name => import(pathToFileURL(join(sources, name + '.mjs')).href);
const [{ dispatch }, contract, { launcherPaths }, { ensurePrivateDirectory }, { defaultSystem }, { LIMITS }] = await Promise.all(['dispatch-pass', 'launcher-state', 'runner-root', 'durable-files', 'process-group', 'limits'].map(load));
const paths = launcherPaths(root);
ensurePrivateDirectory(paths.state);
const save = next => { if (next.current?.counted === 'hang') throw new Error('disk full'); contract.saveState(paths, next); };
try {
    await dispatch({ state: contract.emptyState(), save, system: defaultSystem(), limits: { ...LIMITS, termGraceMs: 1000, absenceWaitMs: 1000, pollMs: 50 }, paths,
        pinned: { pin: { commit: 'a'.repeat(40) }, directory: home, entry: '/release/server/overseer.ts' }, deadlineMs: 3_000, origin: undefined,
        env: { PATH: process.env.PATH, HOME: home }, launcherFile: file, failed: () => {}, isShuttingDown: () => false, setShutdown: () => {} });
    console.log(JSON.stringify({ resolved: true }));
} catch (error) { console.log(JSON.stringify({ rejected: error.message })); }
`);
        // The runner never calls process.exit: it ends only if dispatch left nothing open.
        const child = spawn(process.execPath, [runner, LAUNCHER_SOURCES, root, helper.file, helper.home], { stdio: ['ignore', 'pipe', 'inherit'] });
        let output = '';
        child.stdout.on('data', chunk => { output += chunk; });
        const exited = await Promise.race([new Promise(done => child.once('exit', () => done(true))), new Promise(done => setTimeout(() => done(false), 20_000))]);
        if (!exited) child.kill('SIGKILL');
        expect(exited).toBe(true);
        expect(JSON.parse(output.trim())).toEqual({ rejected: 'disk full' });
        expect(helper.saw('authorized')).toBe(true);
        expect(helper.saw('terminated')).toBe(true);
        expect(groupGone(helper.pidOf('started')!)).toBe(true);
    }, 30_000);
});
