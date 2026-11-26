import { createHash } from 'node:crypto';
import { lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';
import type { RunDirectories } from './run-directories';
import { physicalPath, within, type ValidatedRunnerPaths } from './runner-root';

/**
 * The outer sandbox's settings for one reader run, in the shape the sandbox runtime (0.0.83) reads.
 * Content reads are denied everywhere and re-opened only for the run's frozen snapshot, its own
 * working folders and the reviewed executables and runtime inputs; writes are allowed only in the
 * run's own folders; there is no network. Every path is a literal, never a pattern.
 *
 * `checkPolicyInputs` looks at the filesystem; `sandboxPolicy` is pure path arithmetic on inputs
 * that check has passed.
 */

export interface LiteralPath { path: string; literal: true }
export interface SandboxSettings {
    filesystem: { denyRead: LiteralPath[]; allowRead: LiteralPath[]; allowWrite: LiteralPath[]; denyWrite: LiteralPath[] };
    network: { allowedDomains: string[]; deniedDomains: string[]; allowUnixSockets: string[]; allowMachLookup: string[]; allowLocalBinding: false };
    allowAppleEvents: false;
    enableWeakerNestedSandbox: false;
    enableWeakerNetworkIsolation: false;
    allowPty: false;
    javaAgentJarPath: string;
}

/** Where live Office state, checkouts and session stores are, as physical paths established before the pass. */
export interface ProtectedRoots { officeData: string; checkoutData: string; checkouts: readonly string[]; sessionStores: readonly string[] }

export interface PolicyInput {
    paths: ValidatedRunnerPaths;
    run: RunDirectories;
    protectedRoots: ProtectedRoots;
    /** The physical tree the runner and the sandbox runtime run from. */
    installation: string;
    /** Files the payload executes, each reviewed. */
    executables: readonly string[];
    /** Other files or folders the payload must read to run, each reviewed. */
    runtimeReads: readonly string[];
    /** Stage scratch folders strictly beneath the run folder. */
    scratch?: readonly string[];
    javaAgentJarPath: string;
    /** Empty in every 7b caller; a provider's endpoints are qualified with its profile. */
    allowedDomains?: readonly string[];
}

/** Homes, shared and temporary folders: never opened to a payload. */
export const PROTECTED_SYSTEM = ['/Users', '/Volumes', '/tmp', '/private/tmp', '/var/folders', '/private/var/folders'] as const;
/**
 * Launch control and Apple Events tools, denied for reading. On macOS that does not stop a payload executing
 * them: the host battery (2026-11-26) ran `/bin/launchctl` inside this policy and reached launchd. They are
 * listed so nothing opens them further; denying launchd control is a qualification gap, not a property of this
 * policy.
 */
export const PROTECTED_TOOLS = ['/bin/launchctl', '/usr/bin/osascript', '/usr/bin/open'] as const;
/**
 * On macOS the runtime runs the payload through `bash -c` inside the sandbox, so both shells are always
 * executables of the payload (host battery, 2026-11-26).
 */
export const RUNTIME_SHELLS = ['/bin/bash', '/bin/sh'] as const;
/** The system libraries every payload needs to start; without them Node fails on its OpenSSL configuration (host battery, 2026-11-26). */
export const SYSTEM_RUNTIME_READS = ['/usr/lib', '/System/Library'] as const;
/** The runtime's own shared temporary folder, writable by default inside its sandbox. */
export const SHARED_TEMP = ['/tmp/claude', '/private/tmp/claude'] as const;
const DENIED_DEVICES = ['/dev/tty', '/dev/dtracehelper', '/dev/autofs_nowait'] as const;

export const snapshotPath = (run: RunDirectories) => resolve(run.root, 'snapshot');
export const policyPath = (run: RunDirectories) => resolve(run.root, 'sandbox.json');
const workingFolders = (run: RunDirectories) => [run.home, run.tmp, run.provider, run.officeData];

const overlaps = (a: string, b: string) => within(a, b) || within(b, a);
const code = (error: unknown) => (error as NodeJS.ErrnoException)?.code;
const literal = (path: string): LiteralPath => ({ path, literal: true });
const unique = (paths: readonly string[]) => [...new Set(paths)];

function requireAbsolute(path: unknown, what: string): asserts path is string {
    if (typeof path !== 'string' || !isAbsolute(path) || resolve(path) !== path || path.length > 4096)
        throw new Error(`${what} must be a normalized absolute path, not ${JSON.stringify(String(path).slice(0, 200))}`);
}

/** A home folder, or something that contains one: `/`, `/Users`, `/Users/<name>`. */
function homeOrAbove(path: string): boolean {
    if (path === sep || path === '/Users') return true;
    const parts = path.split(sep).filter(Boolean);
    return parts.length === 2 && parts[0] === 'Users';
}

const protectedLocations = (roots: ProtectedRoots) => [roots.officeData, roots.checkoutData, ...roots.checkouts, ...roots.sessionStores];

export function sandboxPolicy(input: PolicyInput): SandboxSettings {
    const { paths, run } = input, scratch = input.scratch ?? [];
    requireAbsolute(input.installation, 'The installation');
    requireAbsolute(input.javaAgentJarPath, 'The Java agent');
    for (const [name, path] of Object.entries({ officeData: input.protectedRoots.officeData, checkoutData: input.protectedRoots.checkoutData })) requireAbsolute(path, `The protected ${name}`);
    for (const list of ['checkouts', 'sessionStores'] as const)
        if (!Array.isArray(input.protectedRoots[list]) || !input.protectedRoots[list].length) throw new Error(`The protected ${list} must be named; an empty list protects nothing`);
    [...input.protectedRoots.checkouts, ...input.protectedRoots.sessionStores].forEach(path => requireAbsolute(path, 'A protected checkout or session store'));
    for (const key of ['root', 'home', 'tmp', 'provider', 'officeData'] as const) requireAbsolute(run[key], `The run's ${key}`);
    const layout = { root: resolve(input.paths.runs, String(run.id)), home: resolve(run.root, 'home'), tmp: resolve(run.root, 'tmp'), provider: resolve(run.root, 'provider'), officeData: resolve(run.root, 'office-data') };
    for (const [key, path] of Object.entries(layout))
        if (run[key as keyof typeof layout] !== path || !within(run.root, input.paths.runs) || run.root === input.paths.runs)
            throw new Error(`The run's ${key} is not this runner's allocation (${path})`);
    if ((input.allowedDomains ?? []).length) throw new Error('A reader run has no network: its domain allowlist must be empty');
    const snapshot = snapshotPath(run), policy = policyPath(run);
    const protectedData = [...protectedLocations(input.protectedRoots), paths.control, paths.journal, paths.state, paths.code, paths.logs];
    const deniedAroundRun = [...protectedData, paths.wrapperTmp, input.installation];
    // The structural runs entry hides other allocations. An independently protected location still applies.
    const denied = [...protectedData, paths.runs, paths.wrapperTmp, input.installation];
    for (const root of deniedAroundRun)
        if (overlaps(snapshot, root)) throw new Error(`The snapshot overlaps the protected ${root}`);
    for (const folder of scratch) {
        requireAbsolute(folder, 'A scratch folder');
        if (!within(folder, run.root) || folder === run.root) throw new Error(`Scratch ${folder} must lie strictly beneath the run folder ${run.root}`);
    }
    const writable = unique([...workingFolders(run), ...scratch]);
    const readable = unique([...RUNTIME_SHELLS, ...input.executables, ...SYSTEM_RUNTIME_READS, ...input.runtimeReads]);
    for (const path of readable) {
        requireAbsolute(path, 'A readable path');
        if (homeOrAbove(path)) throw new Error(`${path} would open a home or more to the payload`);
        for (const tool of PROTECTED_TOOLS) if (overlaps(path, tool)) throw new Error(`${path} would open ${tool} to the payload`);
        for (const root of PROTECTED_SYSTEM)
            if (root !== '/Users' && overlaps(path, root)) throw new Error(`${path} overlaps the protected ${root}`);
        // `runs` is among them, so nothing in this run or any other is opened beyond its snapshot and working folders.
        for (const root of denied) if (overlaps(path, root)) throw new Error(`${path} overlaps the protected ${root}`);
    }
    for (const path of writable) {
        for (const other of [snapshot, policy, input.javaAgentJarPath, ...readable, ...deniedAroundRun])
            if (overlaps(path, other)) throw new Error(`The writable ${path} overlaps ${other}`);
    }
    return {
        filesystem: {
            denyRead: unique([sep, ...PROTECTED_SYSTEM, ...denied, ...PROTECTED_TOOLS]).map(literal),
            allowRead: unique([snapshot, ...writable, ...readable]).map(literal),
            allowWrite: writable.map(literal),
            denyWrite: unique([snapshot, policy, ...SHARED_TEMP, ...DENIED_DEVICES]).map(literal),
        },
        network: { allowedDomains: [], deniedDomains: [], allowUnixSockets: [], allowMachLookup: [], allowLocalBinding: false },
        allowAppleEvents: false, enableWeakerNestedSandbox: false, enableWeakerNetworkIsolation: false, allowPty: false,
        javaAgentJarPath: input.javaAgentJarPath,
    };
}

function checkKind(path: string, want: 'directory' | 'file' | 'any'): void {
    let stat;
    try { stat = lstatSync(path); }
    catch (error) { throw new Error(`${path} cannot be read (${code(error) ?? 'unknown error'}); refusing it`); }
    if (stat.isSymbolicLink()) throw new Error(`${path} is a link; refusing it`);
    if (want === 'directory' && !stat.isDirectory()) throw new Error(`${path} must be a directory`);
    if (want === 'file' && !stat.isFile()) throw new Error(`${path} must be a regular file`);
    const physical = realpathSync(path);
    if (physical !== path) throw new Error(`${path} resolves elsewhere (${physical}); refusing it`);
}

export function checkPolicyDirectories(run: RunDirectories, scratch: readonly string[]): void {
    checkKind(snapshotPath(run), 'directory');
    for (const folder of scratch) checkKind(folder, 'directory');
}

/** What the filesystem must show before the policy is built: each path is where it says it is, and of the right kind. */
export function checkPolicyInputs(input: PolicyInput): void {
    for (const path of protectedLocations(input.protectedRoots)) {
        requireAbsolute(path, 'A protected location');
        const physical = physicalPath(path);
        if (physical !== path) throw new Error(`The protected ${path} resolves elsewhere (${physical}); refusing it`);
    }
    checkPolicyDirectories(input.run, input.scratch ?? []);
    for (const path of [...RUNTIME_SHELLS, ...input.executables]) checkKind(path, 'file');
    for (const path of [...SYSTEM_RUNTIME_READS, ...input.runtimeReads]) checkKind(path, 'any');
    checkKind(input.installation, 'directory');
}

/** Keys sorted at every level, so the same settings are always the same bytes. */
export function serializePolicy(settings: SandboxSettings): string {
    const sorted = (value: unknown): unknown => Array.isArray(value) ? value.map(sorted)
        : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted((value as Record<string, unknown>)[key])])) : value;
    return `${JSON.stringify(sorted(settings))}\n`;
}
export const policyDigest = (bytes: string) => createHash('sha256').update(bytes).digest('hex');

/** Placeholder for the run folder in allocation-independent rules. */
export const RUN_PLACEHOLDER = '<run>';

/** Only the builder's allocation-owned grants and write denials move between runs. */
export function relativeRules(settings: SandboxSettings, run: RunDirectories, scratch: readonly string[] = []): string {
    const snapshot = snapshotPath(run), policy = policyPath(run);
    const writable = new Set([...workingFolders(run), ...scratch]);
    const relative = (entry: LiteralPath) => literal(`${RUN_PLACEHOLDER}${entry.path.slice(run.root.length)}`);
    const { filesystem } = settings;
    return serializePolicy({ ...settings, filesystem: {
        ...filesystem,
        allowRead: filesystem.allowRead.map(entry => entry.path === snapshot || writable.has(entry.path) ? relative(entry) : entry),
        allowWrite: filesystem.allowWrite.map(entry => writable.has(entry.path) ? relative(entry) : entry),
        denyWrite: filesystem.denyWrite.map(entry => entry.path === snapshot || entry.path === policy ? relative(entry) : entry),
    } });
}

export function expandRules(rules: string, run: RunDirectories): string {
    const settings: SandboxSettings = JSON.parse(rules);
    const { filesystem } = settings;
    const writable = new Set(filesystem.allowWrite.map(entry => entry.path));
    const snapshot = `${RUN_PLACEHOLDER}${snapshotPath(run).slice(run.root.length)}`;
    const policy = `${RUN_PLACEHOLDER}${policyPath(run).slice(run.root.length)}`;
    const expand = (entry: LiteralPath): LiteralPath => {
        if (!entry.path.startsWith(`${RUN_PLACEHOLDER}${sep}`)) return entry;
        const path = run.root + entry.path.slice(RUN_PLACEHOLDER.length);
        requireAbsolute(path, 'An allocation-relative rule');
        return { ...entry, path };
    };
    return serializePolicy({ ...settings, filesystem: {
        ...filesystem,
        allowRead: filesystem.allowRead.map(entry => entry.path === snapshot || writable.has(entry.path) ? expand(entry) : entry),
        allowWrite: filesystem.allowWrite.map(expand),
        denyWrite: filesystem.denyWrite.map(entry => entry.path === snapshot || entry.path === policy ? expand(entry) : entry),
    } });
}
