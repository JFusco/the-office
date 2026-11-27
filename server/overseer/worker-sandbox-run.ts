import { createHash } from 'node:crypto';
import { chmodSync, closeSync, constants, fchmodSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, writeSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { command } from '../workers/process';
import { timeoutsValid } from './budget-policy';
import { checkRunDirectories, type RunDirectories } from './run-directories';
import { ensurePrivateDirectory, within, type ValidatedRunnerPaths } from './runner-root';
import { workerEnvironment, type WorkerProvider } from './worker-environment';
import { checkPolicyDirectories, checkPolicyInputs, policyDigest, policyPath, sandboxPolicy, serializePolicy, type PolicyInput, type SandboxSettings } from './worker-sandbox-policy';
import type { SandboxRuntime } from './worker-sandbox-runtime';

/**
 * One command run inside the outer sandbox: the policy prepared once for its run, then the program
 * started through the sandbox runtime's CLI with the worker environment. The executor is always
 * supplied by the caller; this module ships none, so nothing here can dispatch on its own. A
 * refusal happens before anything starts, and nothing ever runs the program without the sandbox.
 */

/** The shape of `command` (server/workers/process.ts); only its type is used here. */
export type Executor = typeof command;

export class SandboxRefusal extends Error {
    readonly dispatched = false;
    constructor(message: string) { super(message); this.name = 'SandboxRefusal'; }
}

export interface PreparedPolicy {
    paths: ValidatedRunnerPaths;
    run: RunDirectories;
    file: string;
    bytes: string;
    digest: string;
    settings: SandboxSettings;
    runtime: Readonly<AvailableRuntime>;
    provider: WorkerProvider;
    replaceEnv: Readonly<Record<string, string>>;
    scratch: readonly string[];
    /** The programs this policy was built to run; nothing else may be started under it. */
    executables: readonly string[];
    /** The runner's program for each selectable probe or profile. */
    programs: Readonly<Record<string, string>>;
    /** The wrapper's own temporary folder: short enough for the socket the runtime binds in it, and never the payload's. */
    wrapperTmp: string;
}

/**
 * The runtime binds a Unix socket (`srt-mux-<pid>-<n>.sock`) in its own temporary folder, and a socket path
 * on macOS holds at most 103 bytes. With room for that name, the folder may be at most this long. The
 * run's `tmp` is far longer, so the wrapper gets a folder of its own (host battery, 2026-11-26).
 */
export const WRAPPER_TMP_MAX = 80;
export const wrapperTmpPath = (paths: ValidatedRunnerPaths, run: RunDirectories) => resolve(paths.root, 'w', run.id.slice(0, 8));

/** A real directory of the runner's, mode 0700, at its own physical path. */
function assertPrivateFolder(path: string): void {
    let stat;
    try { stat = lstatSync(path); }
    catch (error) { throw new SandboxRefusal(`${path} cannot be read (${code(error) ?? 'unknown error'})`); }
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new SandboxRefusal(`${path} must be a directory, not a link or a file`);
    if (stat.uid !== process.getuid?.()) throw new SandboxRefusal(`${path} is not the runner's`);
    if ((stat.mode & 0o777) !== 0o700) throw new SandboxRefusal(`${path} has mode ${(stat.mode & 0o777).toString(8)}, not 700`);
    if (realpathSync(path) !== path) throw new SandboxRefusal(`${path} resolves elsewhere`);
}

const code = (error: unknown) => (error as NodeJS.ErrnoException)?.code;
type AvailableRuntime = Extract<SandboxRuntime, { status: 'available' }>;

function requireRuntime(runtime: SandboxRuntime): AvailableRuntime {
    if (runtime.status === 'unsupported') throw new SandboxRefusal(`The worker sandbox is not supported on ${runtime.platform}`);
    if (runtime.status === 'unavailable') throw new SandboxRefusal(`The worker sandbox is unavailable: ${runtime.reason}`);
    return runtime;
}

/** The prepared file is a regular single-link file of the runner's, mode 0600, at its own physical path, with exactly the bytes prepared. */
function verifyPolicyFile(file: string, digest: string): void {
    let stat;
    try { stat = lstatSync(file); }
    catch (error) { throw new SandboxRefusal(`The policy ${file} cannot be read (${code(error) ?? 'unknown error'})`); }
    if (stat.isSymbolicLink() || !stat.isFile()) throw new SandboxRefusal(`The policy ${file} is not a regular file`);
    if (stat.nlink !== 1) throw new SandboxRefusal(`The policy ${file} has ${stat.nlink} links`);
    if (stat.uid !== process.getuid?.()) throw new SandboxRefusal(`The policy ${file} is not the runner's`);
    if ((stat.mode & 0o777) !== 0o600) throw new SandboxRefusal(`The policy ${file} has mode ${(stat.mode & 0o777).toString(8)}, not 600`);
    if (realpathSync(file) !== file) throw new SandboxRefusal(`The policy ${file} resolves elsewhere`);
    if (createHash('sha256').update(readFileSync(file)).digest('hex') !== digest) throw new SandboxRefusal(`The policy ${file} is not the policy that was prepared`);
}

/**
 * Checks the run and every input, then writes the run's one policy file, never over anything already
 * there and never through a link. A failure stops dispatch; the run's ID stays used.
 */
export function preparePolicy(input: Omit<PolicyInput, 'installation' | 'javaAgentJarPath'> & {
    runtime: SandboxRuntime;
    provider: WorkerProvider;
    programs: Readonly<Record<string, string>>;
}): PreparedPolicy {
    const { paths, run, provider } = input;
    const runtime = Object.freeze({ ...requireRuntime(input.runtime) });
    const policyInput = { ...input, installation: runtime.installation, javaAgentJarPath: runtime.javaAgentJar };
    const wrapperTmp = wrapperTmpPath(paths, run), wrapperParent = dirname(wrapperTmp);
    const wrapperBytes = Buffer.byteLength(wrapperTmp, 'utf8');
    if (wrapperBytes > WRAPPER_TMP_MAX) throw new SandboxRefusal(`The wrapper's temporary folder ${wrapperTmp} is ${wrapperBytes} bytes; the runtime's socket needs it at most ${WRAPPER_TMP_MAX}`);
    if (paths.wrapperTmp !== wrapperParent) throw new SandboxRefusal(`The wrapper's temporary folder ${paths.wrapperTmp} is not under the runner root`);
    // workerEnvironment also checks the allocation's directories before building the replacement map.
    const replaceEnv = Object.freeze({ ...workerEnvironment({ paths, provider, run }), TMPDIR: wrapperTmp, CLAUDE_CODE_TMPDIR: run.tmp });
    checkPolicyInputs(policyInput);
    const settings = sandboxPolicy(policyInput), bytes = serializePolicy(settings), digest = policyDigest(bytes), file = policyPath(run);
    const programs = Object.freeze({ ...input.programs });
    for (const [selection, program] of Object.entries(programs))
        if (!input.executables.includes(program)) throw new SandboxRefusal(`${program} is not a program this run's policy was prepared for (${selection})`);
    // Both folders are set to 0700 explicitly: the mode given to mkdir is narrowed by the umask.
    ensurePrivateDirectory(wrapperParent);
    chmodSync(wrapperParent, 0o700);
    assertPrivateFolder(wrapperParent);
    try { mkdirSync(wrapperTmp, { mode: 0o700 }); }
    catch (error) { throw new SandboxRefusal(`The wrapper's temporary folder ${wrapperTmp} cannot be created (${code(error) ?? 'unknown error'}); each run has its own`); }
    chmodSync(wrapperTmp, 0o700);
    assertPrivateFolder(wrapperTmp);
    let fd: number;
    try { fd = openSync(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600); }
    catch (error) { throw new SandboxRefusal(`The policy ${file} cannot be created (${code(error) ?? 'unknown error'}); it is written once per run`); }
    try { fchmodSync(fd, 0o600); writeSync(fd, bytes); }
    finally { closeSync(fd); }
    verifyPolicyFile(file, digest);
    return {
        paths, run, file, bytes, digest, settings, runtime, provider, replaceEnv, wrapperTmp, programs,
        scratch: Object.freeze([...(input.scratch ?? [])]), executables: Object.freeze([...input.executables]),
    };
}

/** Rechecked immediately before each handoff: the run's folders and the prepared file are as they were. */
export function verifyPrepared(prepared: PreparedPolicy): void {
    const { paths, run } = prepared;
    try {
        checkRunDirectories(paths, run);
        checkPolicyDirectories(run, prepared.scratch);
    }
    catch (error) { throw new SandboxRefusal(error instanceof Error ? error.message : String(error)); }
    if (prepared.file !== policyPath(run)) throw new SandboxRefusal('The policy file is outside its expected allocation location');
    verifyPolicyFile(prepared.file, prepared.digest);
    const wrapperTmp = wrapperTmpPath(paths, run), wrapperParent = dirname(wrapperTmp);
    if (paths.runs !== resolve(paths.root, 'runs') || paths.wrapperTmp !== wrapperParent || prepared.wrapperTmp !== wrapperTmp ||
        prepared.replaceEnv.TMPDIR !== wrapperTmp || prepared.replaceEnv.CLAUDE_CODE_TMPDIR !== run.tmp)
        throw new SandboxRefusal('The wrapper temporary folder does not match the allocation');
    assertPrivateFolder(wrapperParent);
    assertPrivateFolder(wrapperTmp);
}

/** `node <cli> --settings <policy> -- <program> <args…>`: every argument after `--` reaches the program unchanged. */
export function sandboxedCommand(runtime: AvailableRuntime, policyFile: string, program: string, args: readonly string[]) {
    return { executable: runtime.node, argv: [runtime.cli, '--settings', policyFile, '--', program, ...args] };
}

export interface SandboxedRun {
    executor: Executor;
    runtime: SandboxRuntime;
    prepared: PreparedPolicy;
    selection: string;
    args: readonly string[];
    timeout: number;
    inactivityTimeout: number;
    signal?: AbortSignal;
    readOnly?: boolean;
    onLine?: (line: string) => void;
    onOutput?: (stream: 'stdout' | 'stderr', chunk: string) => void;
    onSpawn?: (pid: number) => void;
    /** The prompt, on the payload's stdin. */
    input?: string;
    /**
     * The Claude reader's sign-in (`provider-auth/claude-handoff.ts`), added as `CLAUDE_CODE_OAUTH_TOKEN`
     * to this one executor call's environment only: never to the prepared policy, its environment or a
     * receipt. Refused for any other selection.
     */
    claudeOAuthToken?: string;
}

/** The variable the Claude reader's token travels in; a prepared environment never carries it. */
export const CLAUDE_TOKEN_VARIABLE = 'CLAUDE_CODE_OAUTH_TOKEN';
/** One nonempty line of printable ASCII without spaces. */
const TOKEN = /^[\x21-\x7e]+$/;

/** Refuses before anything starts, or hands exactly one wrapped command to the executor and returns what it returns. */
export async function runSandboxed(request: SandboxedRun): Promise<string> {
    const { prepared, selection } = request, { run } = prepared;
    if (!isDeepStrictEqual(requireRuntime(request.runtime), prepared.runtime))
        throw new SandboxRefusal('The worker sandbox runtime differs from the prepared policy');
    if (request.signal?.aborted) throw new SandboxRefusal('The run was cancelled before dispatch');
    if (!timeoutsValid(request.timeout, request.inactivityTimeout)) throw new SandboxRefusal('A sandboxed run needs finite total and quiet timeouts');
    if (!Object.hasOwn(prepared.programs, selection)) throw new SandboxRefusal(`No program was prepared for ${selection}`);
    const program = prepared.programs[selection];
    if (typeof program !== 'string' || !isAbsolute(program) || resolve(program) !== program) throw new SandboxRefusal(`The program must be an absolute path, not ${JSON.stringify(String(program).slice(0, 200))}`);
    if (!prepared.executables.includes(program)) throw new SandboxRefusal(`${program} is not a program this run's policy was prepared for`);
    if (within(program, run.root) || within(program, prepared.paths.runs)) throw new SandboxRefusal(`${program} lies where a run can write`);
    let stat;
    try { stat = lstatSync(program); } catch (error) { throw new SandboxRefusal(`${program} cannot be read (${code(error) ?? 'unknown error'})`); }
    if (stat.isSymbolicLink() || !stat.isFile() || realpathSync(program) !== program) throw new SandboxRefusal(`${program} must be a regular file at its own physical path`);
    verifyPrepared(prepared);
    if (Object.hasOwn(prepared.replaceEnv, CLAUDE_TOKEN_VARIABLE)) throw new SandboxRefusal(`The prepared environment must not carry ${CLAUDE_TOKEN_VARIABLE}`);
    const replaceEnv: Record<string, string> = { ...prepared.replaceEnv };
    if (request.claudeOAuthToken !== undefined) {
        if (selection !== 'claude-reader') throw new SandboxRefusal(`Only the Claude reader is given a sign-in token, not ${selection}`);
        if (typeof request.claudeOAuthToken !== 'string' || !TOKEN.test(request.claudeOAuthToken)) throw new SandboxRefusal('The Claude sign-in token is not one line of printable ASCII');
        replaceEnv[CLAUDE_TOKEN_VARIABLE] = request.claudeOAuthToken;
    }
    const { executable, argv } = sandboxedCommand(prepared.runtime, prepared.file, program, request.args);
    return request.executor(executable, argv, {
        cwd: run.home, replaceEnv, timeout: request.timeout, inactivityTimeout: request.inactivityTimeout,
        signal: request.signal, readOnly: request.readOnly, onLine: request.onLine, onOutput: request.onOutput, onSpawn: request.onSpawn,
        ...(request.input === undefined ? {} : { input: request.input }),
    });
}
