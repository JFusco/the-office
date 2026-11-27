import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, linkSync, lstatSync, mkdirSync, readFileSync, readlinkSync, renameSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { policyDigest, policyPath, sandboxPolicy, serializePolicy, snapshotPath } from '../../../server/overseer/worker-sandbox-policy';
import { preparePolicy, runSandboxed, SandboxRefusal, sandboxedCommand, verifyPrepared, WRAPPER_TMP_MAX, wrapperTmpPath, type Executor, type PreparedPolicy, type SandboxedRun } from '../../../server/overseer/worker-sandbox-run';
import { sandboxPreparation, sandboxWorld, shortTempDir } from './sandbox-world';

afterEach(() => vi.unstubAllEnvs());

const prepare = (input: Parameters<typeof sandboxPreparation>[0], overrides?: Parameters<typeof sandboxPreparation>[1]) =>
    preparePolicy(sandboxPreparation(input, overrides));

function recorder(answer: (call: number) => Promise<string> = () => Promise.resolve('done')) {
    const calls: Parameters<Executor>[] = [];
    const executor: Executor = (...args) => { calls.push(args); return answer(calls.length); };
    return { calls, executor };
}
const request = (prepared: PreparedPolicy, executor: Executor, extra: Partial<SandboxedRun> = {}): SandboxedRun =>
    ({ executor, runtime: prepared.runtime, prepared, selection: 'startup', args: [], timeout: 60_000, inactivityTimeout: 10_000, ...extra });

test('the policy is written once per run, exactly as built, private to the runner', () => {
    const { run, input } = sandboxWorld(), prepared = prepare(input);
    const bytes = serializePolicy(sandboxPolicy(input));
    expect(prepared.file).toBe(policyPath(run));
    expect(readFileSync(prepared.file, 'utf8')).toBe(bytes);
    expect(prepared.digest).toBe(policyDigest(bytes));
    const stat = lstatSync(prepared.file);
    expect(stat.mode & 0o777).toBe(0o600);
    expect(stat.nlink).toBe(1);
    expect(() => verifyPrepared(prepared)).not.toThrow();
    // Run once per run: the wrapper's folder and the policy file are each refused the second time.
    expect(() => prepare(input)).toThrow(SandboxRefusal);
    expect(readFileSync(prepared.file, 'utf8')).toBe(bytes);
});

test('the wrapper gets its own short private folder, once per run, and a root too long for the runtime socket is refused', () => {
    const { paths, run, input } = sandboxWorld(), prepared = prepare(input);
    expect(prepared.wrapperTmp).toBe(join(paths.root, 'w', run.id.slice(0, 8)));
    expect(Buffer.byteLength(prepared.wrapperTmp)).toBeLessThanOrEqual(WRAPPER_TMP_MAX);
    expect(lstatSync(prepared.wrapperTmp).mode & 0o777).toBe(0o700);
    // A folder already there is another run's.
    const taken = sandboxWorld();
    mkdirSync(wrapperTmpPath(taken.paths, taken.run), { recursive: true, mode: 0o700 });
    expect(() => prepare(taken.input)).toThrow("each run has its own");
    // Runner paths whose wrapper folder is not the root's own.
    const moved = sandboxWorld();
    expect(() => prepare({ ...moved.input, paths: { ...moved.paths, wrapperTmp: join(moved.base, 'elsewhere') } })).toThrow('is not under the runner root');
    expect(existsSync(join(moved.base, 'elsewhere'))).toBe(false);
    // Opened up after preparation, it is refused at handoff.
    chmodSync(prepared.wrapperTmp, 0o755);
    expect(() => verifyPrepared(prepared)).toThrow('has mode 755, not 700');
});

test('the wrapper temporary path limit counts UTF-8 bytes', () => {
    const base = shortTempDir();
    const padding = WRAPPER_TMP_MAX - Buffer.byteLength(join(base, 'x', 'runner', 'w', '12345678')) + 1;
    const limit = join(base, 'a'.repeat(padding));
    mkdirSync(limit);
    const atLimit = sandboxWorld({}, limit);
    expect(Buffer.byteLength(prepare(atLimit.input).wrapperTmp)).toBe(WRAPPER_TMP_MAX);

    const above = join(base, 'a'.repeat(padding - 1) + '€');
    mkdirSync(above);
    const tooLong = sandboxWorld({}, above), expected = wrapperTmpPath(tooLong.paths, tooLong.run);
    expect(expected.length).toBeLessThanOrEqual(WRAPPER_TMP_MAX);
    expect(Buffer.byteLength(expected)).toBe(WRAPPER_TMP_MAX + 2);
    expect(() => prepare(tooLong.input)).toThrow('is 82 bytes');
    expect(existsSync(tooLong.paths.wrapperTmp)).toBe(false);
    expect(existsSync(policyPath(tooLong.run))).toBe(false);
});

test('an unknown worker provider is refused before writing the policy or wrapper directory', () => {
    const { paths, run, input } = sandboxWorld();
    expect(() => prepare(input, { provider: 'unknown' as never })).toThrow('Unknown worker provider');
    expect(existsSync(paths.wrapperTmp)).toBe(false);
    expect(existsSync(policyPath(run))).toBe(false);
});

test('the policy is 0600 and the wrapper folder 0700 whatever the umask', () => {
    const { input } = sandboxWorld(), previous = process.umask(0o277);
    try { const prepared = prepare(input); expect(lstatSync(prepared.file).mode & 0o777).toBe(0o600); expect(lstatSync(prepared.wrapperTmp).mode & 0o777).toBe(0o700); }
    finally { process.umask(previous); }
});

test('a policy path already taken, by a file or a link, is refused and left as it was', () => {
    const taken = sandboxWorld();
    writeFileSync(policyPath(taken.run), 'already here');
    expect(() => prepare(taken.input)).toThrow(SandboxRefusal);
    expect(readFileSync(policyPath(taken.run), 'utf8')).toBe('already here');
    const linked = sandboxWorld(), target = join(linked.base, 'target.json');
    writeFileSync(target, 'target');
    symlinkSync(target, policyPath(linked.run));
    expect(() => prepare(linked.input)).toThrow(SandboxRefusal);
    expect(readlinkSync(policyPath(linked.run))).toBe(target);
    expect(readFileSync(target, 'utf8')).toBe('target');
    // A run folder that moved is refused before anything is written.
    const moved = sandboxWorld();
    renameSync(moved.run.home, `${moved.run.home}-moved`); symlinkSync(`${moved.run.home}-moved`, moved.run.home);
    expect(() => prepare(moved.input)).toThrow('must be a directory, not a link or a file');
    expect(existsSync(policyPath(moved.run))).toBe(false);
});

test('a prepared policy that changed, gained a link, opened up or moved is refused at handoff, and nothing starts', async () => {
    for (const tamper of [
        (file: string) => writeFileSync(file, '{}\n'),
        (file: string) => linkSync(file, `${file}.second`),
        (file: string) => chmodSync(file, 0o644),
        (file: string) => { const bytes = readFileSync(file); unlinkSync(file); writeFileSync(`${file}.real`, bytes, { mode: 0o600 }); symlinkSync(`${file}.real`, file); },
    ]) {
        const { input } = sandboxWorld(), prepared = prepare(input), { calls, executor } = recorder();
        tamper(prepared.file);
        await expect(runSandboxed(request(prepared, executor))).rejects.toThrow(SandboxRefusal);
        expect(calls).toEqual([]);
    }
    const { run, input } = sandboxWorld(), prepared = prepare(input), { calls, executor } = recorder();
    renameSync(run.tmp, `${run.tmp}-moved`); mkdirSync(run.tmp); chmodSync(run.tmp, 0o755);
    expect(() => verifyPrepared(prepared)).toThrow(SandboxRefusal);
    await expect(runSandboxed(request(prepared, executor))).rejects.toThrow('has mode 755');
    expect(calls).toEqual([]);
});

test('a policy replaced by something that is not a regular file is refused without reading it', () => {
    const { input } = sandboxWorld(), prepared = prepare(input);
    unlinkSync(prepared.file);
    execFileSync('/usr/bin/mkfifo', ['-m', '600', prepared.file]);
    expect(() => verifyPrepared(prepared)).toThrow('is not a regular file');
}, 5_000);

test('handoff rechecks snapshot and scratch directories and the exact policy location', async () => {
    const { input, run } = sandboxWorld(), scratch = join(run.root, 'scratch');
    mkdirSync(scratch);
    const prepared = prepare({ ...input, scratch: [scratch] }), { calls, executor } = recorder();
    const alternate = join(run.root, 'alternate.json');
    writeFileSync(alternate, prepared.bytes);
    chmodSync(alternate, 0o600);
    await expect(runSandboxed(request({ ...prepared, file: alternate }, executor))).rejects.toThrow('expected allocation location');
    for (const folder of [snapshotPath(run), scratch]) {
        const moved = `${folder}-moved`;
        renameSync(folder, moved);
        symlinkSync(moved, folder);
        await expect(runSandboxed(request(prepared, executor))).rejects.toThrow(`${folder} is a link`);
        unlinkSync(folder);
        renameSync(moved, folder);
    }
    expect(calls).toEqual([]);
});

test('handoff binds wrapper TMPDIR to the expected private parent and leaf', async () => {
    const { input, paths, run } = sandboxWorld(), prepared = prepare(input), { calls, executor } = recorder();
    const alternate = { ...prepared, wrapperTmp: run.tmp, replaceEnv: { ...prepared.replaceEnv, TMPDIR: run.tmp } };
    await expect(runSandboxed(request(alternate, executor))).rejects.toThrow('does not match the allocation');
    const wrongEnv = { ...prepared, replaceEnv: { ...prepared.replaceEnv, TMPDIR: run.tmp } };
    await expect(runSandboxed(request(wrongEnv, executor))).rejects.toThrow('does not match the allocation');
    chmodSync(paths.wrapperTmp, 0o755);
    await expect(runSandboxed(request(prepared, executor))).rejects.toThrow(`${paths.wrapperTmp} has mode 755`);
    expect(calls).toEqual([]);
});

test('one wrapped command reaches the executor, every argument unchanged after --, with the worker environment', async () => {
    for (const [name, value] of Object.entries({ JAVA_TOOL_OPTIONS: '-javaagent:/elsewhere.jar', HTTP_PROXY: 'http://synthetic.invalid:1', HTTPS_PROXY: 'http://synthetic.invalid:1', CLAUDE_CODE_TMPDIR: '/tmp/claude', GITHUB_TOKEN: 'synthetic-github' }))
        vi.stubEnv(name, value);
    const { run, input } = sandboxWorld(), prepared = prepare(input), { calls, executor } = recorder();
    const args = ['', 'two words', `it's "quoted"`, '$HOME and $(id)', 'line\nbreak', '--settings', '-c', '--'];
    const controller = new AbortController(), onLine = () => {}, onOutput = () => {}, onSpawn = () => {};
    expect(await runSandboxed(request(prepared, executor, { args, signal: controller.signal, readOnly: true, onLine, onOutput, onSpawn }))).toBe('done');
    expect(calls).toHaveLength(1);
    const [executable, argv, options] = calls[0];
    expect(executable).toBe(prepared.runtime.node);
    expect(argv).toEqual([prepared.runtime.cli, '--settings', prepared.file, '--', '/usr/bin/true', ...args]);
    expect(argv).toEqual(sandboxedCommand(prepared.runtime, prepared.file, '/usr/bin/true', args).argv);
    expect(JSON.parse(readFileSync(prepared.file, 'utf8')).javaAgentJarPath).toBe(prepared.runtime.javaAgentJar);
    expect(options).toEqual({
        cwd: run.home, timeout: 60_000, inactivityTimeout: 10_000, signal: controller.signal, readOnly: true, onLine, onOutput, onSpawn,
        replaceEnv: {
            PATH: '/usr/bin:/bin:/usr/sbin:/sbin', LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8', HOME: run.home,
            CLAUDE_CONFIG_DIR: run.provider, OFFICE_DATA_ROOT: run.officeData, OFFICE_NO_POLL: '1', CLAUDE_CODE_TMPDIR: run.tmp,
            // The wrapper's own short folder; the payload gets the run's tmp through CLAUDE_CODE_TMPDIR.
            TMPDIR: prepared.wrapperTmp,
        },
    });
    const codex = recorder(), codexPrepared = prepare(sandboxWorld().input, { provider: 'codex' });
    await runSandboxed(request(codexPrepared, codex.executor));
    expect(codex.calls[0][2]?.replaceEnv).toEqual({
        PATH: '/usr/bin:/bin:/usr/sbin:/sbin', LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8', HOME: codexPrepared.run.home,
        CODEX_HOME: codexPrepared.run.provider, OFFICE_DATA_ROOT: codexPrepared.run.officeData, OFFICE_NO_POLL: '1',
        TMPDIR: codexPrepared.wrapperTmp, CLAUDE_CODE_TMPDIR: codexPrepared.run.tmp,
    });
});

test('the same runtime resolution must supply the settings and the wrapper command', async () => {
    const prepared = prepare(sandboxWorld().input), other = sandboxPreparation(sandboxWorld().input).runtime;
    expect(other.status).toBe('available');
    const { calls, executor } = recorder();
    for (const runtime of [other, { ...prepared.runtime, javaAgentJar: prepared.file }]) {
        await expect(runSandboxed(request(prepared, executor, { runtime }))).rejects.toThrow('runtime differs from the prepared policy');
    }
    expect(calls).toEqual([]);
});

test('each selected probe dispatches its own program from the prepared inventory', async () => {
    const { input } = sandboxWorld({ executables: ['/usr/bin/true', '/usr/bin/false'] });
    const programs = { startup: '/usr/bin/true', 'snapshot-read': '/usr/bin/false' };
    const prepared = prepare(input, { programs });
    programs.startup = '/usr/bin/false';
    for (const [selection, program] of [['startup', '/usr/bin/true'], ['snapshot-read', '/usr/bin/false']]) {
        const { calls, executor } = recorder();
        expect(await runSandboxed(request(prepared, executor, { selection }))).toBe('done');
        expect(calls).toHaveLength(1);
        expect(calls[0][1].slice(4)).toEqual([program]);
    }
    const { calls, executor } = recorder();
    await expect(runSandboxed(request(prepared, executor, { selection: '/usr/bin/false' }))).rejects.toThrow('No program was prepared');
    expect(calls).toEqual([]);
});

test('a failure is the executor\'s own, returned once and never retried without the sandbox', async () => {
    const { input } = sandboxWorld(), prepared = prepare(input), failure = new Error('srt exited 1: sandbox-exec failed');
    const { calls, executor } = recorder(() => Promise.reject(failure));
    await expect(runSandboxed(request(prepared, executor))).rejects.toBe(failure);
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe(prepared.runtime.node);
    expect(calls[0][1][0]).toBe(prepared.runtime.cli);
});

test('nothing starts for an unavailable or unsupported sandbox, a cancelled run, missing timeouts or a program the policy does not name', async () => {
    const { base, run, input } = sandboxWorld({ executables: ['/usr/bin/true'] }), prepared = prepare(input);
    const alias = join(base, 'true-alias');
    symlinkSync('/usr/bin/true', alias);
    const aborted = new AbortController(); aborted.abort();
    const cases: [Partial<SandboxedRun>, string][] = [
        [{ runtime: { status: 'unavailable', reason: 'not installed' } }, 'unavailable: not installed'],
        [{ runtime: { status: 'unsupported', platform: 'linux' } }, 'not supported on linux'],
        [{ signal: aborted.signal }, 'cancelled before dispatch'],
        [{ timeout: 0 }, 'finite total and quiet timeouts'],
        [{ inactivityTimeout: 120_000 }, 'finite total and quiet timeouts'],
        [{ prepared: { ...prepared, programs: { startup: 'true' } } }, 'must be an absolute path'],
        [{ prepared: { ...prepared, programs: { startup: '/usr/bin/false' } } }, 'is not a program this run'],
        [{ prepared: { ...prepared, executables: [alias], programs: { startup: alias } } }, 'regular file at its own physical path'],
        [{ prepared: { ...prepared, executables: [join(run.tmp, 'tool')], programs: { startup: join(run.tmp, 'tool') } } }, 'lies where a run can write'],
    ];
    for (const [extra, message] of cases) {
        const { calls, executor } = recorder();
        await expect(runSandboxed(request(prepared, executor, extra)), message).rejects.toThrow(message);
        expect(calls, message).toEqual([]);
    }
});

test('a selection naming a program the policy does not reopen is refused before anything is written', () => {
    const { paths, run, input } = sandboxWorld();
    expect(() => prepare(input, { programs: { startup: '/usr/bin/false' } })).toThrow("is not a program this run's policy was prepared for (startup)");
    expect(existsSync(paths.wrapperTmp)).toBe(false);
    expect(existsSync(policyPath(run))).toBe(false);
});

test('a wrapper folder replaced by a link is refused at handoff as a link', () => {
    const { input } = sandboxWorld(), prepared = prepare(input);
    renameSync(prepared.wrapperTmp, `${prepared.wrapperTmp}-moved`);
    symlinkSync(`${prepared.wrapperTmp}-moved`, prepared.wrapperTmp);
    expect(() => verifyPrepared(prepared)).toThrow('must be a directory, not a link or a file');
});

test('the Claude reader alone gets its token, in that one call: stdin carries the prompt, and nothing prepared holds the token', async () => {
    const TOKEN = 'sk-synthetic-claude-0123', programs = { 'claude-reader': '/usr/bin/true', startup: '/usr/bin/true' };
    const { input } = sandboxWorld(), prepared = prepare(input, { programs });
    const { calls, executor } = recorder();
    const controller = new AbortController();
    await runSandboxed(request(prepared, executor, { selection: 'claude-reader', args: ['-p'], input: 'the prompt', claudeOAuthToken: TOKEN, signal: controller.signal, timeout: 1_200_000, inactivityTimeout: 300_000 }));
    const [, argv, options] = calls[0];
    expect(argv.slice(-2)).toEqual(['/usr/bin/true', '-p']);
    expect(options).toMatchObject({ input: 'the prompt', signal: controller.signal, timeout: 1_200_000, inactivityTimeout: 300_000, cwd: prepared.run.home });
    expect(options!.replaceEnv).toEqual({ ...prepared.replaceEnv, CLAUDE_CODE_OAUTH_TOKEN: TOKEN });
    for (const held of [JSON.stringify(prepared.replaceEnv), prepared.bytes, readFileSync(prepared.file, 'utf8'), JSON.stringify(argv)]) expect(held).not.toContain(TOKEN);
    // Without the new fields the call is exactly the probe call it was.
    await runSandboxed(request(prepared, executor));
    expect(calls[1][2]).not.toHaveProperty('input');
    expect(calls[1][2]!.replaceEnv).toEqual({ ...prepared.replaceEnv });
});

test('a token is refused for any other selection, in any other shape, and over a prepared environment that already carries one', async () => {
    const programs = { 'claude-reader': '/usr/bin/true', startup: '/usr/bin/true' };
    const { input } = sandboxWorld(), prepared = prepare(input, { programs });
    const { calls, executor } = recorder();
    await expect(runSandboxed(request(prepared, executor, { selection: 'startup', claudeOAuthToken: 'sk-x' }))).rejects.toThrow('Only the Claude reader');
    for (const bad of ['', 'has space', 'two\nlines', 'tab\there', 'é']) {
        await expect(runSandboxed(request(prepared, executor, { selection: 'claude-reader', claudeOAuthToken: bad })), JSON.stringify(bad)).rejects.toThrow('not one line of printable ASCII');
    }
    const carried = { ...prepared, replaceEnv: Object.freeze({ ...prepared.replaceEnv, CLAUDE_CODE_OAUTH_TOKEN: 'sk-x' }) };
    await expect(runSandboxed(request(carried, executor, { selection: 'claude-reader' }))).rejects.toThrow('must not carry CLAUDE_CODE_OAUTH_TOKEN');
    expect(calls).toHaveLength(0);
});
