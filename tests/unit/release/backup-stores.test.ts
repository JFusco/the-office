import { afterEach, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { backupStores, INVENTORY_FILE } from '../../../server/release/backup-stores';

vi.mock('../../../server/office/config', () => { throw new Error('backup must run without loading Office configuration'); });

const OP = 'deploy-20261120-a';
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function fixture() {
    const dataRoot = mkdtempSync(resolve(tmpdir(), 'office-backup-')); roots.push(dataRoot);
    const make = (file: string, rows: number) => {
        const path = resolve(dataRoot, file), db = new DatabaseSync(path);
        db.exec('PRAGMA journal_mode=WAL; PRAGMA user_version=7; CREATE TABLE notes(id INTEGER PRIMARY KEY, body TEXT)');
        for (let i = 0; i < rows; i++) db.prepare('INSERT INTO notes(body) VALUES(?)').run(`note ${i}`);
        db.close();
        return path;
    };
    return { dataRoot, databases: [{ name: 'cec', path: make('office.sqlite', 3) }, { name: 'office-control', path: make('office-control.sqlite', 1) }] };
}
const rowsOf = (path: string) => { const db = new DatabaseSync(path, { readOnly: true }); try { return db.prepare('SELECT body FROM notes ORDER BY id').all(); } finally { db.close(); } };

test('every database is copied, and the inventory digests, sizes and schema match the copies', async () => {
    const { dataRoot, databases } = fixture(), archive = resolve(dataRoot, 'archive');
    mkdirSync(archive); writeFileSync(resolve(archive, 'reports.jsonl'), '{}\n');
    const sources = databases.map(database => readFileSync(database.path));
    const { directory, inventory } = await backupStores({ dataRoot, operation: OP, databases, archives: [archive, resolve(dataRoot, 'no-archive')], now: () => new Date('2026-11-20T01:00:00.000Z') });
    expect(directory).toBe(resolve(dataRoot, 'backups', OP));
    // Checked before this test opens a copy: the backup itself leaves no SQLite sidecar files.
    expect(readdirSync(directory).sort()).toEqual(['cec.sqlite', INVENTORY_FILE, 'office-control.sqlite'].sort());
    expect(JSON.parse(readFileSync(resolve(directory, INVENTORY_FILE), 'utf8'))).toEqual(inventory);
    expect(inventory).toMatchObject({ version: 1, operation: OP, at: '2026-11-20T01:00:00.000Z', archives: [{ directory: archive, files: [{ name: 'reports.jsonl', bytes: 3 }] }] });
    for (const [i, entry] of inventory.databases.entries()) {
        const copy = resolve(directory, entry.file), bytes = readFileSync(copy);
        expect(entry).toMatchObject({ name: databases[i].name, source: databases[i].path, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, userVersion: 7 });
        expect(entry.schemaDigest).toMatch(/^[0-9a-f]{64}$/);
        expect(rowsOf(copy)).toEqual(rowsOf(databases[i].path));
        expect(readFileSync(databases[i].path).equals(sources[i])).toBe(true);
    }
    expect(readdirSync(resolve(dataRoot, 'backups'))).toEqual([OP]);
});

test('rows still only in the write-ahead log are in the copy', async () => {
    const { dataRoot, databases } = fixture(), writer = new DatabaseSync(databases[0].path);
    try {
        writer.exec('PRAGMA wal_autocheckpoint=0');
        writer.prepare('INSERT INTO notes(body) VALUES(?)').run('only in the log');
        const { directory } = await backupStores({ dataRoot, operation: OP, databases });
        expect(rowsOf(resolve(directory, 'cec.sqlite'))).toContainEqual({ body: 'only in the log' });
    } finally { writer.close(); }
});

test('staging left by a crashed attempt is cleared, and an archive lists files only', async () => {
    const { dataRoot, databases } = fixture(), archive = resolve(dataRoot, 'archive');
    mkdirSync(resolve(dataRoot, 'backups', `.staging-${OP}`), { recursive: true });
    writeFileSync(resolve(dataRoot, 'backups', `.staging-${OP}`, 'partial.sqlite'), 'partial');
    mkdirSync(resolve(archive, 'nested'), { recursive: true }); writeFileSync(resolve(archive, 'ci.jsonl'), '{}\n');
    const { directory, inventory } = await backupStores({ dataRoot, operation: OP, databases, archives: [archive] });
    expect(readdirSync(directory)).not.toContain('partial.sqlite');
    expect(inventory.archives).toEqual([{ directory: archive, files: [{ name: 'ci.jsonl', bytes: 3 }] }]);
    expect(readdirSync(resolve(dataRoot, 'backups'))).toEqual([OP]);
});

test.each([false, true])('a source inside staging is preserved on refusal (symlink alias: %s)', async alias => {
    const { dataRoot, databases } = fixture();
    const staging = resolve(dataRoot, 'backups', `.staging-${OP}`);
    const source = resolve(staging, 'source.sqlite');
    mkdirSync(staging, { recursive: true });
    renameSync(databases[0].path, source);
    let path = source;
    if (alias) {
        const link = resolve(dataRoot, 'staging-link');
        symlinkSync(staging, link, 'dir');
        path = resolve(link, 'source.sqlite');
    }
    const before = readFileSync(source);
    await expect(backupStores({ dataRoot, operation: OP, databases: [{ name: 'cec', path }] })).rejects.toThrow('overlaps backup staging');
    expect(readFileSync(path)).toEqual(before);
    expect(readdirSync(resolve(dataRoot, 'backups'))).toEqual([`.staging-${OP}`]);
});

test('schema digest includes user tables whose names start with sqlite but have no underscore', async () => {
    const { dataRoot, databases } = fixture();
    for (const [index, { path }] of databases.entries()) {
        const db = new DatabaseSync(path);
        try { db.exec(`CREATE TABLE sqlitecache(value ${index === 0 ? 'TEXT' : 'INTEGER'})`); }
        finally { db.close(); }
    }
    const { inventory } = await backupStores({ dataRoot, operation: OP, databases });
    expect(inventory.databases[0].schemaDigest).not.toBe(inventory.databases[1].schemaDigest);
});

test('an existing backup directory is refused and left untouched', async () => {
    const { dataRoot, databases } = fixture();
    await backupStores({ dataRoot, operation: OP, databases });
    const before = readdirSync(resolve(dataRoot, 'backups', OP));
    await expect(backupStores({ dataRoot, operation: OP, databases })).rejects.toThrow('already exists');
    expect(readdirSync(resolve(dataRoot, 'backups', OP))).toEqual(before);
});

test('a failed copy or a missing database leaves no backup and no staging directory', async () => {
    const { dataRoot, databases } = fixture();
    let copies = 0;
    await expect(backupStores({ dataRoot, operation: OP, databases, copy: async (_, destination) => { if (++copies === 2) throw new Error('disk full'); writeFileSync(destination, 'copied'); } })).rejects.toThrow('disk full');
    expect(copies).toBe(2);
    await expect(backupStores({ dataRoot, operation: OP, databases: [...databases, { name: 'brain', path: resolve(dataRoot, 'missing.sqlite') }] })).rejects.toThrow('Database brain is missing');
    expect(existsSync(resolve(dataRoot, 'backups', OP))).toBe(false);
    expect(readdirSync(resolve(dataRoot, 'backups'))).toEqual([]);
});

test('unsafe or repeated names and an empty list are refused before anything is created', async () => {
    const { dataRoot, databases } = fixture();
    await expect(backupStores({ dataRoot, operation: '../escape', databases })).rejects.toThrow('named for its deployment');
    await expect(backupStores({ dataRoot, operation: OP, databases: [] })).rejects.toThrow('at least one database');
    await expect(backupStores({ dataRoot, operation: OP, databases: [databases[0], databases[0]] })).rejects.toThrow('distinct lower-case slugs');
    await expect(backupStores({ dataRoot, operation: OP, databases: [{ name: 'a/b', path: databases[0].path }] })).rejects.toThrow('distinct lower-case slugs');
    expect(existsSync(resolve(dataRoot, 'backups'))).toBe(false);
});
