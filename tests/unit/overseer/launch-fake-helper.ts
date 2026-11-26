import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launcherSource } from './launch-world';
import { tempDir } from './runner-world';

/**
 * Test support: a stand-in for the launcher's helper, started by dispatch exactly as the real one
 * is (`node <file> --group <uuid>`), whose timing a test scripts. The launcher gives a helper only
 * PATH, HOME and LC_ALL, so the script is read from `<HOME>/behavior.json` and what the helper saw
 * is written beside it.
 */
export interface FakeBehavior {
    /** Milliseconds before it says it is ready. */
    readyAfter?: number;
    /** After authorization: when it reports the pass exited, and when it sends the full exit report and leaves. */
    exitedAt?: number;
    reportAt?: number;
    exitCode?: number;
    reportError?: string;
    /** On TERM after authorization: send a successful exit report first, as a pass ending under the stop would. */
    reportOnTerm?: boolean;
}

const SOURCE = `import { readFileSync, renameSync, writeFileSync } from 'node:fs';
const home = process.env.HOME, behavior = JSON.parse(readFileSync(home + '/behavior.json', 'utf8'));
const note = name => writeFileSync(home + '/' + name, String(process.pid));
const send = payload => { if (process.connected) try { process.send(payload); } catch { /* gone */ } };
let authorized = false, env = null;
const report = () => ({ type: 'exit', code: behavior.reportError ? null : behavior.exitCode ?? 0, signal: null, error: behavior.reportError, stderr: '',
    stdout: JSON.stringify({ pass: '7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4', startedAt: '2026-11-26T09:00:00.000Z', endedAt: '2026-11-26T09:00:01.000Z', outcome: 'idle', detail: 'fake pass', officeDataRoot: env.OVERSEER_ROOT + '/state/office-data' }) + '\\n' });
writeFileSync(home + '/attempt', process.argv[3]);
writeFileSync(home + '/starting', String(process.pid));
renameSync(home + '/starting', home + '/started');
process.on('disconnect', () => { if (!authorized) process.exit(0); });
process.on('SIGTERM', () => {
    note('terminated');
    if (behavior.reportOnTerm && authorized) { send(report()); setTimeout(() => process.exit(0), 50); }
    else process.exit(143);
});
process.on('message', received => {
    if (authorized || received?.type !== 'authorize') return;
    authorized = true; env = received.env; note('authorized');
    setInterval(() => {}, 1000);
    for (const phase of ['bootstrap', 'run']) send({ type: 'phase', phase });
    if (behavior.exitedAt !== undefined) setTimeout(() => process.send({ type: 'exited' }, error => { if (!error) note('exited'); }), behavior.exitedAt);
    if (behavior.reportAt !== undefined) setTimeout(() => { send(report()); setTimeout(() => process.exit(0), 50); }, behavior.reportAt);
});
setTimeout(() => send({ type: 'ready' }), behavior.readyAfter ?? 0);
`;

/** A stand-in helper and the home it reads its script from. */
export function fakeHelper(behavior: FakeBehavior = {}) {
    const home = tempDir('overseer-fake-helper-'), file = join(home, 'overseer-launch.mjs');
    writeFileSync(file, SOURCE);
    writeFileSync(join(home, 'behavior.json'), JSON.stringify(behavior));
    const pidOf = (name: string) => existsSync(join(home, name)) ? Number(readFileSync(join(home, name), 'utf8')) : null;
    // The stand-in's identity is known from its private test directory. These rows let dispatch
    // exercise registration and stop decisions without depending on the host's ps format.
    const ps = async (args: string[]) => {
        const target = Number(args.at(-1)), pid = pidOf('started');
        const start = 'Thu Nov 26 03:00:00 2026';
        // Only registration uses a synthetic row. Group cleanup must wait for a real probe.
        if (!args.includes('-p')) return { ok: true, code: 1, stdout: '' };
        if (target === process.pid) return { ok: true, code: 0, stdout: `${target} ${target} ${start} node test launcher\n` };
        if (pid === target) {
            try {
                process.kill(pid, 0);
                const attempt = readFileSync(join(home, 'attempt'), 'utf8');
                return { ok: true, code: 0, stdout: `${pid} ${pid} ${start} ${process.execPath} ${file} --group ${attempt}\n` };
            } catch { /* no live stand-in */ }
        }
        return { ok: true, code: 1, stdout: '' };
    };
    return { file, home, saw: (name: 'started' | 'authorized' | 'terminated' | 'exited') => existsSync(join(home, name)), pidOf, ps };
}

/** One dispatch() from the maintained source against a fresh runner root, with a stand-in helper. */
export async function dispatchWith(helper: ReturnType<typeof fakeHelper>, options: { deadlineMs: number; save?: (paths: any, next: any, saveState: (paths: any, next: any) => void) => void; isShuttingDown?: () => boolean; limits?: Record<string, number>; consecutiveFailures?: number; system?: Record<string, unknown> }) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const [dispatchPass, contract, roots, files, group, limits] = await Promise.all((['dispatch-pass', 'launcher-state', 'runner-root', 'durable-files', 'process-group', 'limits'] as const).map(launcherSource));
    const root = join(tempDir(), 'runner'), paths = roots.launcherPaths(root), failures: Record<string, unknown>[] = [];
    files.ensurePrivateDirectory(paths.state);
    const state = { ...contract.emptyState(), consecutiveFailures: options.consecutiveFailures ?? 0 };
    const save = (next: unknown) => (options.save ?? ((p, n, write) => write(p, n)))(paths, next, contract.saveState);
    let shutdown = () => {};
    const run = dispatchPass.dispatch({
        state, save, system: { ...group.defaultSystem(), ...options.system }, limits: { ...limits.LIMITS, termGraceMs: 1_000, absenceWaitMs: 1_000, pollMs: 50, ...options.limits }, paths,
        pinned: { pin: { commit: 'a'.repeat(40) }, directory: helper.home, entry: '/release/server/overseer.ts' }, deadlineMs: options.deadlineMs, origin: undefined,
        env: { PATH: process.env.PATH, HOME: helper.home }, launcherFile: helper.file, failed: (summary: Record<string, unknown>) => failures.push(summary),
        isShuttingDown: options.isShuttingDown ?? (() => false), setShutdown: (callback: () => void) => { shutdown = callback; },
    });
    return { run, root, paths, failures, shutdown: () => shutdown(), state: () => contract.readState(paths) };
}
