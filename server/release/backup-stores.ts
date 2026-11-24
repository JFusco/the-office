import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { backup, DatabaseSync } from 'node:sqlite';
import { releasePaths } from './release-paths';

export interface StoreDatabase { name: string; path: string }

/**
 * True when nothing is at a store database's path: `lstat` failed with `ENOENT`. Any other lookup
 * error is thrown. A path that exists, a dangling symlink included, is left to the SQLite open.
 */
export function storeMissing(path: string): boolean {
    try { lstatSync(path); return false; }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true;
        throw error;
    }
}

export interface BackupEntry { name: string; source: string; file: string; bytes: number; sha256: string; userVersion: number; schemaDigest: string }
/** `databases` lists the copies. `absent` lists the databases that may be missing and were, present only when there is one. */
export interface BackupInventory { version: 1; operation: string; at: string; databases: BackupEntry[]; absent?: { name: string; source: string }[]; archives: { directory: string; files: { name: string; bytes: number }[] }[] }

const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const INVENTORY_FILE = 'inventory.json';

/** Version and shape of a database as its own schema states them, for a later compatibility decision. */
function schemaOf(db: DatabaseSync): { userVersion: number; schemaDigest: string } {
    const { user_version } = db.prepare('PRAGMA user_version').get() as { user_version: number };
    const rows = db.prepare("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite\\_%' ESCAPE '\\' ORDER BY type,name").all();
    return { userVersion: Number(user_version), schemaDigest: createHash('sha256').update(JSON.stringify(rows)).digest('hex') };
}

export interface BackupInput {
    dataRoot: string; operation: string; databases: StoreDatabase[];
    /** Directories of files the stores write beside their databases; their files are listed in the inventory, not copied. */
    archives?: string[];
    /** Names of the databases that may not exist yet: a project whose store no service has opened. Any other missing database fails the backup. */
    mayBeMissing?: string[];
    copy?: (source: DatabaseSync, destination: string) => Promise<unknown>;
    now?: () => Date;
}

/**
 * Copies every store database, with the service stopped, into `backups/<operation>/` and records what
 * it copied. For disaster recovery by a person: nothing in a deployment or rollback restores from it.
 * A database named in `mayBeMissing` that does not exist is listed as absent, not copied. The copy is
 * staged beside its target and renamed in, so a failure leaves no partial backup; staging
 * a crash left behind is cleared only when it contains no declared source. Sources are opened
 * read-only and the copies are never opened, so a backup holds exactly the databases and inventory.
 */
export async function backupStores(input: BackupInput): Promise<{ directory: string; inventory: BackupInventory }> {
    const { dataRoot, operation, databases, archives = [], mayBeMissing = [], copy = (source, destination) => backup(source, destination), now = () => new Date() } = input;
    if (!NAME.test(operation)) throw new Error('A backup is named for its deployment operation');
    if (!databases.length) throw new Error('A backup needs at least one database');
    if (databases.some(database => !NAME.test(database.name)) || new Set(databases.map(database => database.name)).size !== databases.length) throw new Error('Backup database names must be distinct lower-case slugs');
    const root = releasePaths(dataRoot).backups, directory = resolve(root, operation), staging = resolve(root, `.staging-${operation}`);
    if (existsSync(directory)) throw new Error(`Backup ${directory} already exists`);
    if (existsSync(staging)) {
        const realStaging = realpathSync.native(staging);
        const contains = (dir: string, file: string) => file === dir || file.startsWith(dir + sep);
        for (const { name, path } of databases) {
            if (!storeMissing(path) && (contains(staging, resolve(path)) || contains(realStaging, realpathSync.native(path))))
                throw new Error(`Database ${name} at ${path} overlaps backup staging ${staging}`);
        }
    }
    mkdirSync(root, { recursive: true });
    rmSync(staging, { recursive: true, force: true });
    mkdirSync(staging, { mode: 0o700 });
    try {
        const entries: BackupEntry[] = [], absent: { name: string; source: string }[] = [], optional = new Set(mayBeMissing);
        for (const { name, path } of databases) {
            if (storeMissing(path)) {
                if (!optional.has(name)) throw new Error(`Database ${name} is missing at ${path}`);
                absent.push({ name, source: path });
                continue;
            }
            const file = `${name}.sqlite`, target = resolve(staging, file), source = new DatabaseSync(path, { readOnly: true });
            let schema: ReturnType<typeof schemaOf>;
            try { schema = schemaOf(source); await copy(source, target); } finally { source.close(); }
            const sha256 = createHash('sha256').update(readFileSync(target)).digest('hex');
            entries.push({ name, source: path, file, bytes: statSync(target).size, sha256, ...schema });
        }
        const inventory: BackupInventory = {
            version: 1, operation, at: now().toISOString(), databases: entries, ...(absent.length ? { absent } : {}),
            archives: archives.filter(existsSync).map(archive => ({ directory: archive, files: readdirSync(archive, { withFileTypes: true }).filter(entry => entry.isFile()).map(entry => entry.name).sort().map(name => ({ name, bytes: statSync(resolve(archive, name)).size })) })),
        };
        writeFileSync(resolve(staging, INVENTORY_FILE), `${JSON.stringify(inventory, null, 2)}\n`, { mode: 0o600 });
        renameSync(staging, directory);
        return { directory, inventory };
    } catch (error) {
        rmSync(staging, { recursive: true, force: true });
        throw error;
    }
}
