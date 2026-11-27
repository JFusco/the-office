import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { physicalPath, within } from './runner-root';

/**
 * Where the outer sandbox runtime is, if it is installed with this runner: located and checked as
 * files, never executed. It establishes location only. Which bytes are installed is recorded by the
 * qualification that later runs them (docs/overseer.md, Worker sandbox).
 *
 * The repository pins this version exactly in `package.json` and `pnpm-lock.yaml`, with the lockfile
 * integrity below. That is the release the 2026-11-26 host battery ran, and a unit test keeps the
 * three in step. Lookup reads files only.
 */

export const SANDBOX_RUNTIME = {
    name: '@anthropic-ai/sandbox-runtime', version: '0.0.83', bin: 'srt', cli: 'dist/cli.js', javaAgent: 'vendor/java-proxy-agent/srt-proxy-agent.jar',
    integrity: 'sha512-yEusORnVJrNseF/9fvjVYyk6tr79/aFbIB3T/X8p2puLZdaaiGNeYN50v0CE+1DT70v7XuzKOAnTivh1f5cksA==',
} as const;

export type SandboxRuntime =
    | { status: 'available'; node: string; installation: string; packageRoot: string; cli: string; javaAgentJar: string; version: string }
    | { status: 'unavailable'; reason: string }
    | { status: 'unsupported'; platform: string };

export interface RuntimeFacts {
    platform?: NodeJS.Platform;
    /** The tree this runner runs from: the checkout or a pinned release, each with its own `node_modules`. */
    installation?: string;
    /** Folders searched for the package, nearest first; by default Node's own lookup from this module. */
    lookup?: readonly string[];
    node?: string;
    /** Paths a run or a candidate may write; nothing the runtime is made of may be at, in or around one. */
    writable?: readonly string[];
}

/** The tree this module belongs to. */
const INSTALLATION = fileURLToPath(new URL('../../', import.meta.url));
const code = (error: unknown) => (error as NodeJS.ErrnoException)?.code;

function regularFile(path: string, what: string): string | null {
    let stat;
    try { stat = lstatSync(path); }
    catch (error) { return code(error) === 'ENOENT' ? `${what} ${path} is missing` : `${what} ${path} cannot be read (${code(error) ?? 'unknown error'})`; }
    return stat.isFile() ? null : `${what} ${path} is not a regular file`;
}

const overlaps = (a: string, b: string) => within(a, b) || within(b, a);

/** The package's folder: the nearest lookup folder that has it, without loading anything. */
function packageFolder(lookup: readonly string[]): string | null {
    for (const folder of lookup) {
        const candidate = join(folder, SANDBOX_RUNTIME.name);
        try { lstatSync(join(candidate, 'package.json')); return candidate; }
        catch (error) { if (code(error) !== 'ENOENT' && code(error) !== 'ENOTDIR') return candidate; }
    }
    return null;
}

export function trustedSandbox(facts: RuntimeFacts = {}): SandboxRuntime {
    const platform = facts.platform ?? process.platform;
    if (platform !== 'darwin') return { status: 'unsupported', platform };
    const unavailable = (reason: string): SandboxRuntime => ({ status: 'unavailable', reason });
    let installation: string, modules: string;
    try { installation = realpathSync(facts.installation ?? INSTALLATION); modules = realpathSync(join(installation, 'node_modules')); }
    catch (error) { return unavailable(`The runner installation cannot be resolved (${code(error) ?? 'unknown error'})`); }
    if (modules === installation || !within(modules, installation))
        return unavailable(`The modules directory ${modules} resolves outside the installation ${installation}`);
    const lookup = facts.lookup ?? createRequire(import.meta.url).resolve.paths(SANDBOX_RUNTIME.name) ?? [];
    const folder = packageFolder(lookup);
    if (!folder) return unavailable(`${SANDBOX_RUNTIME.name} is not installed with this runner`);
    let packageRoot: string;
    try { packageRoot = realpathSync(folder); }
    catch (error) { return unavailable(`${folder} cannot be resolved (${code(error) ?? 'unknown error'})`); }
    // pnpm links the package from `node_modules/.pnpm`; wherever it leads must stay inside this installation's own modules.
    if (!within(packageRoot, modules) || packageRoot === modules) return unavailable(`${SANDBOX_RUNTIME.name} resolves to ${packageRoot}, outside ${modules}`);
    const manifestPath = join(packageRoot, 'package.json'), manifestFault = regularFile(manifestPath, 'The manifest');
    if (manifestFault) return unavailable(manifestFault);
    let parsed: unknown;
    try { parsed = JSON.parse(readFileSync(manifestPath, 'utf8')); }
    catch { return unavailable(`${manifestPath} is not valid JSON`); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        return unavailable(`${manifestPath} is not a manifest object`);
    const manifest = parsed as Record<string, unknown>;
    if (typeof manifest.name !== 'string' || typeof manifest.version !== 'string')
        return unavailable(`${manifestPath} must have a string name and version`);
    if (manifest.name !== SANDBOX_RUNTIME.name || manifest.version !== SANDBOX_RUNTIME.version)
        return unavailable(`Found ${manifest.name.slice(0, 80)}@${manifest.version.slice(0, 40)}, not ${SANDBOX_RUNTIME.name}@${SANDBOX_RUNTIME.version}`);
    const bin = manifest.bin && typeof manifest.bin === 'object' ? (manifest.bin as Record<string, unknown>)[SANDBOX_RUNTIME.bin] : undefined;
    if (bin !== SANDBOX_RUNTIME.cli) return unavailable(`The manifest's ${SANDBOX_RUNTIME.bin} is ${JSON.stringify(bin)?.slice(0, 80)}, not ${SANDBOX_RUNTIME.cli}`);
    const assets: Record<'cli' | 'javaAgentJar' | 'node', string> = { cli: join(packageRoot, SANDBOX_RUNTIME.cli), javaAgentJar: join(packageRoot, SANDBOX_RUNTIME.javaAgent), node: facts.node ?? process.execPath };
    for (const [name, path] of Object.entries(assets) as [keyof typeof assets, string][]) {
        if (!isAbsolute(path)) return unavailable(`The ${name} path ${path} is not absolute`);
        const fault = regularFile(path, `The ${name}`);
        if (fault) return unavailable(fault);
        let physical: string;
        try { physical = realpathSync(path); }
        catch (error) { return unavailable(`The ${name} ${path} cannot be resolved (${code(error) ?? 'unknown error'})`); }
        if (name !== 'node' && (physical !== path || !within(physical, packageRoot))) return unavailable(`The ${name} ${path} leaves the package (${physical})`);
        assets[name] = physical;
    }
    if (!facts.writable?.length) return unavailable('No writable-path inventory was supplied');
    for (const writable of facts.writable) {
        if (!isAbsolute(writable) || resolve(writable) !== writable)
            return unavailable('Each writable path must be a normalized absolute path');
        let target: string;
        try { target = physicalPath(writable); }
        catch (error) { return unavailable(error instanceof Error ? error.message : 'A writable path cannot be resolved'); }
        for (const [name, path] of Object.entries({ installation, packageRoot, ...assets }))
            if (overlaps(path, target)) return unavailable(`The ${name} ${path} overlaps the writable path ${target}`);
    }
    return { status: 'available', node: assets.node, installation, packageRoot, cli: assets.cli, javaAgentJar: assets.javaAgentJar, version: SANDBOX_RUNTIME.version };
}
