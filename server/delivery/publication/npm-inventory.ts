import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import type { Execute } from './original-git';
import { indeterminate } from './release-marker-stop';

/** The npm versions whose `pack --dry-run --json` output the Office reads. */
export const SUPPORTED_NPM = new Set(['11.9.0']);
/** The production pack: no tarball, machine output, no lifecycle script, no network. */
export const PACK_FLAGS = ['--dry-run', '--json', '--ignore-scripts', '--offline'] as const;

/** The Office service's own npm: the CLI beside the Node running the service, never the candidate's. */
export interface NpmTool { node: string; cli: string; version: string }

/** What npm would publish from one snapshot. */
export interface Inventory { name: string; version: string; paths: Set<string>; manifest: Record<string, unknown> }

/** A complete environment for npm: its own cache, configs and home in scratch, and no workspace selection. */
function npmEnvironment(tool: Pick<NpmTool, 'node'>, scratch: string): Record<string, string> {
    const home = resolve(scratch, 'npm-home'), user = resolve(scratch, 'npm-userconfig'), global = resolve(scratch, 'npm-globalconfig');
    mkdirSync(home, { recursive: true, mode: 0o700 });
    for (const file of [user, global]) if (!existsSync(file)) writeFileSync(file, '', { mode: 0o600 });
    return { PATH: `${dirname(tool.node)}:/usr/bin:/bin`, HOME: home, npm_config_cache: resolve(scratch, 'npm-cache'), npm_config_userconfig: user,
        npm_config_globalconfig: global, npm_config_workspaces: 'false', npm_config_ignore_scripts: 'true', npm_config_offline: 'true',
        npm_config_update_notifier: 'false', npm_config_fund: 'false', npm_config_audit: 'false' };
}

/**
 * Resolve npm from the service toolchain, outside any candidate, and probe its version with the same executable that
 * will pack. A missing tool or an unsupported version is indeterminate, never a guess.
 */
export async function resolveNpm(execute: Execute, scratch: string, node = process.execPath): Promise<NpmTool> {
    let cli: string;
    try { cli = realpathSync(resolve(dirname(node), 'npm')); }
    catch { throw indeterminate(`tool unavailable: no npm beside the Office's Node ${node}`); }
    if (!lstatSync(cli).isFile()) throw indeterminate(`tool unavailable: npm at ${cli} is not a file`);
    let version: string;
    try { version = (await execute(node, [cli, '--version'], { cwd: scratch, replaceEnv: npmEnvironment({ node }, scratch), readOnly: true, timeout: 60_000 })).trim(); }
    catch (error) { throw indeterminate(`tool unavailable: npm --version failed: ${String(error).slice(0, 300)}`); }
    if (!SUPPORTED_NPM.has(version)) throw indeterminate(`unsupported npm ${version || '(no version)'}; the Office reads npm ${[...SUPPORTED_NPM].join(', ')}`);
    return { node, cli, version };
}

const relative = (path: unknown): path is string => typeof path === 'string' && !!path && !path.startsWith('/') && !path.includes('\\') && !path.includes('\0') &&
    path.split('/').every(part => !!part && part !== '.' && part !== '..');

/**
 * Root keys of a YAML mapping, read without a YAML engine. The root's indentation is the first content line's; a line
 * indented less, a tab in the indentation, or a root line that is not a plain `key:` is not guessed at.
 */
function topLevelKeys(text: string): string[] | null {
    const keys: string[] = [];
    let root: number | undefined;
    for (const line of text.split(/\r?\n/)) {
        const content = line.trimStart(), indent = line.length - content.length;
        if (!content || content.startsWith('#')) continue;
        if (line.slice(0, indent).includes('\t')) return null;
        root ??= indent;
        if (indent < root) return null;
        if (indent > root) continue;
        const key = /^([A-Za-z_][\w-]*)\s*:(?:\s|$)/.exec(content);
        if (!key) return null;
        keys.push(key[1]);
    }
    return keys;
}

/**
 * A metadata file of the snapshot, read as the committed content: `undefined` only when no such entry exists. A link
 * that does not resolve, one that leaves the snapshot, or an entry that is not a file is indeterminate; it is never read
 * as absent and never followed out of the exported revision.
 */
function snapshotFile(dir: string, name: string, revision: string): string | undefined {
    const path = resolve(dir, name);
    try { lstatSync(path); }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
        throw indeterminate(`incomplete coverage: ${name} at ${revision} cannot be read (${String(error).slice(0, 200)})`, revision);
    }
    let real: string;
    try { real = realpathSync(path); } catch { throw indeterminate(`incomplete coverage: ${name} at ${revision} is a link that does not resolve`, revision); }
    const root = realpathSync(dir);
    if (!real.startsWith(`${root}${sep}`)) throw indeterminate(`incomplete coverage: ${name} at ${revision} resolves outside the snapshot`, revision);
    if (!statSync(real).isFile()) throw indeterminate(`incomplete coverage: ${name} at ${revision} is not a file`, revision);
    return readFileSync(real, 'utf8');
}

/**
 * A snapshot is one package with no other members: no npm `workspaces`, no pnpm `packages`, and no bundled
 * dependency npm would ship from `node_modules`. CMS's `pnpm-workspace.yaml` only holds settings and is accepted.
 */
export function assertSingleRoot(dir: string, manifest: Record<string, unknown>, revision: string): void {
    const workspaces = manifest.workspaces;
    if (workspaces !== undefined && !(Array.isArray(workspaces) && !workspaces.length))
        throw indeterminate(`uncovered workspace members: package.json at ${revision} declares workspaces`, revision);
    for (const key of ['bundleDependencies', 'bundledDependencies'])
        if (manifest[key] !== undefined && manifest[key] !== false && !(Array.isArray(manifest[key]) && !(manifest[key] as unknown[]).length))
            throw indeterminate(`uncovered bundled dependencies: package.json at ${revision} declares ${key}`, revision);
    const pnpm = snapshotFile(dir, 'pnpm-workspace.yaml', revision);
    if (pnpm !== undefined) {
        const keys = topLevelKeys(pnpm);
        if (!keys) throw indeterminate(`uncovered workspace members: pnpm-workspace.yaml at ${revision} cannot be read as settings`, revision);
        if (keys.includes('packages')) throw indeterminate(`uncovered workspace members: pnpm-workspace.yaml at ${revision} lists packages`, revision);
    }
}

/** The committed manifest of a snapshot, which every pack result must name. */
export function snapshotManifest(dir: string, revision: string): Record<string, unknown> {
    const text = snapshotFile(dir, 'package.json', revision);
    try {
        if (text === undefined) throw new Error('no package.json in the snapshot');
        const manifest = JSON.parse(text);
        if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) || typeof manifest.name !== 'string' || typeof manifest.version !== 'string') throw new Error('no name and version');
        return manifest;
    } catch (error) { throw indeterminate(`incomplete coverage: package.json at ${revision} is not a package manifest (${String(error).slice(0, 200)})`, revision); }
}

/** Validate npm's JSON: one package, the committed name and version, and a complete list of relative file paths. */
export function parsePack(out: string, manifest: Record<string, unknown>, dir: string, revision: string): Inventory {
    let parsed: unknown;
    try { parsed = JSON.parse(out); } catch { throw indeterminate(`malformed npm pack result at ${revision}`, revision); }
    if (!Array.isArray(parsed) || parsed.length !== 1 || !parsed[0] || typeof parsed[0] !== 'object')
        throw indeterminate(`malformed npm pack result at ${revision}: ${Array.isArray(parsed) ? parsed.length : 'no'} packages`, revision);
    const pack = parsed[0] as { name?: unknown; version?: unknown; files?: unknown; entryCount?: unknown; bundled?: unknown };
    if (pack.name !== manifest.name || pack.version !== manifest.version)
        throw indeterminate(`malformed npm pack result at ${revision}: it names ${String(pack.name)}@${String(pack.version)}, not the committed package`, revision);
    if (!Array.isArray(pack.bundled)) throw indeterminate(`malformed npm pack result at ${revision}: no bundled list`, revision);
    if (pack.bundled.length) throw indeterminate(`uncovered bundled dependencies at ${revision}: ${pack.bundled.slice(0, 5).join(', ')}`, revision);
    if (!Array.isArray(pack.files) || pack.entryCount !== pack.files.length || !pack.files.length)
        throw indeterminate(`incomplete npm inventory at ${revision}: ${Array.isArray(pack.files) ? pack.files.length : 'no'} files for entry count ${String(pack.entryCount)}`, revision);
    const paths = new Set<string>();
    for (const file of pack.files as { path?: unknown }[]) {
        if (!file || !relative(file.path) || paths.has(file.path)) throw indeterminate(`malformed npm inventory at ${revision}: an unusable file path`, revision);
        if (!existsSync(resolve(dir, file.path))) throw indeterminate(`incomplete npm inventory at ${revision}: ${file.path} is not in the snapshot`, revision);
        paths.add(file.path);
    }
    return { name: pack.name as string, version: pack.version as string, paths, manifest };
}

/** Pack one verified snapshot with lifecycle scripts disabled and nothing installed. */
export async function packInventory(execute: Execute, tool: NpmTool, dir: string, scratch: string, revision: string): Promise<Inventory> {
    const manifest = snapshotManifest(dir, revision);
    assertSingleRoot(dir, manifest, revision);
    let out: string;
    try { out = await execute(tool.node, [tool.cli, 'pack', ...PACK_FLAGS], { cwd: dir, replaceEnv: npmEnvironment(tool, scratch), readOnly: true, timeout: 120_000 }); }
    catch (error) { throw indeterminate(`tool failure: npm pack at ${revision} failed: ${String(error).slice(0, 300)}`, revision); }
    return parsePack(out, manifest, dir, revision);
}
