import { createHash, randomUUID } from 'node:crypto';
import { lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { ownedPath } from '../../store/readback-evidence';
import type { Store } from '../../store/store';
import { isSha, type Git } from './original-git';
import { indeterminate } from './release-marker-stop';

/** One tracked entry of a revision, as Git records it. */
export interface TreeEntry { mode: string; type: string; oid: string; path: string }

const blob = (bytes: Buffer) => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const MODES = new Set(['100644', '100755', '120000']);

/** Every tracked path of a revision, NUL-delimited so no name is quoted or guessed. */
export async function treeEntries(git: Git, revision: string): Promise<TreeEntry[]> {
    if (!isSha(revision)) throw indeterminate('an exact revision is required to export a snapshot');
    const out = await git(['ls-tree', '-r', '-z', '--full-tree', revision]);
    return out.split('\0').filter(Boolean).map(record => {
        const tab = record.indexOf('\t'), [mode, type, oid] = record.slice(0, tab).split(' ');
        const path = record.slice(tab + 1);
        if (tab < 0 || !mode || !type || !isSha(oid) || !path || path.startsWith('/') || path.split('/').some(part => !part || part === '..' || part === '.'))
            throw indeterminate(`incomplete snapshot: an ambiguous tree record at ${revision}`, revision);
        return { mode, type, oid, path };
    });
}

function walk(root: string, at = ''): { path: string; directory: boolean }[] {
    return readdirSync(resolve(root, at)).flatMap(name => {
        const path = at ? `${at}/${name}` : name, stat = lstatSync(resolve(root, path));
        return stat.isDirectory() ? [{ path, directory: true }, ...walk(root, path)] : [{ path, directory: false }];
    });
}

/**
 * The exported files must be exactly the revision's tracked content: every path present, dotfiles and `export-ignore`
 * files included, nothing extra, each file's bytes hashing to its blob, executable bits matching their modes and
 * symbolic links pointing at their recorded targets. An incomplete or transformed snapshot is never packed.
 */
export function verifySnapshot(dir: string, entries: TreeEntry[], revision: string): void {
    const files = new Map(entries.map(entry => [entry.path, entry]));
    const directories = new Set(entries.flatMap(entry => entry.path.split('/').slice(0, -1).map((_, index, parts) => parts.slice(0, index + 1).join('/'))));
    const present = walk(dir);
    for (const item of present)
        if (item.directory ? !directories.has(item.path) : !files.has(item.path))
            throw indeterminate(`incomplete snapshot: ${item.path} is not tracked at ${revision}`, revision);
    if (present.filter(item => !item.directory).length !== files.size)
        throw indeterminate(`incomplete snapshot: ${files.size - present.filter(item => !item.directory).length} tracked paths are missing at ${revision}`, revision);
    for (const entry of entries) {
        const path = resolve(dir, entry.path), stat = lstatSync(path);
        const link = entry.mode === '120000', bytes = link ? Buffer.from(readlinkSync(path, { encoding: 'buffer' })) : stat.isFile() ? readFileSync(path) : undefined;
        const executable = (stat.mode & 0o111) !== 0;
        if (!bytes || link !== stat.isSymbolicLink() || !link && executable !== (entry.mode === '100755') || blob(bytes) !== entry.oid)
            throw indeterminate(`transformed snapshot: ${entry.path} does not match its tracked content at ${revision}`, revision);
    }
}

/**
 * Write one revision's tracked tree into private scratch through its own Git index, never the worktree's: Git's
 * archive would drop `export-ignore` files npm still ships. Submodules cannot be packed from a snapshot and refuse.
 */
export async function exportSnapshot(git: Git, revision: string, dir: string, index: string): Promise<TreeEntry[]> {
    const entries = await treeEntries(git, revision);
    const unsupported = entries.find(entry => entry.type !== 'blob' || !MODES.has(entry.mode));
    if (unsupported) throw indeterminate(`incomplete snapshot: ${unsupported.path} at ${revision} is a ${unsupported.type} that cannot be packed`, revision);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const env = { GIT_INDEX_FILE: index };
    await git(['read-tree', revision], { env });
    await git(['-c', 'core.autocrlf=false', '-c', 'core.symlinks=true', '-c', 'core.eol=lf', 'checkout-index', '-a', '-f', `--prefix=${dir}/`], { env, timeout: 120_000 });
    verifySnapshot(dir, entries, revision);
    return entries;
}

/** Private scratch for one check under the job's own ticket work, removed on every exit. */
export async function withMarkerScratch<T>(store: Pick<Store, 'dataRoot'>, jobId: string, use: (scratch: string) => Promise<T>): Promise<T> {
    if (!/^[\w-]{1,100}$/.test(jobId)) throw indeterminate('an exact job identity is required for release-marker scratch');
    const root = resolve(store.dataRoot, 'ticket-work', jobId, 'release-marker');
    mkdirSync(root, { recursive: true, mode: 0o700 });
    ownedPath(store, root);
    const scratch = resolve(root, randomUUID());
    mkdirSync(scratch, { mode: 0o700 });
    try { return await use(scratch); }
    finally { rmSync(scratch, { recursive: true, force: true }); }
}
