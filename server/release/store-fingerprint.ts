import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export interface StoreFingerprint { name: string; digest: string | null; reason?: string }

function encode(value: unknown): unknown {
    if (value instanceof Uint8Array) return ['blob', Buffer.from(value).toString('hex')];
    if (typeof value === 'bigint') return ['integer', value.toString()];
    if (typeof value === 'number') return ['real', Object.is(value, -0) ? '-0' : String(value)];
    return value;
}

/**
 * A digest of everything each database holds: its schema and every row of every table, read on a
 * read-only connection. Two equal digests mean nothing in the store changed between the reads, which
 * is the only proof that the release that ran before can still read it. A reorganised but logically
 * equal database may differ; that errs towards "changed". Unreadable is null with the reason.
 */
export function fingerprintStores(databases: { name: string; path: string }[]): StoreFingerprint[] {
    return databases.map(({ name, path }) => {
        if (!existsSync(path)) return { name, digest: null, reason: `${path} does not exist` };
        let db: DatabaseSync | null = null;
        try {
            db = new DatabaseSync(path, { readOnly: true, timeout: 5000 });
            db.exec('BEGIN');
            const hash = createHash('sha256'), version = db.prepare('PRAGMA user_version').get();
            const objects = db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name').all() as { type: string; name: string }[];
            hash.update(JSON.stringify([version, objects]));
            for (const { name: table } of objects.filter(object => object.type === 'table')) {
                const rows = db.prepare(`SELECT * FROM "${table.replaceAll('"', '""')}"`);
                rows.setReadBigInts(true);
                hash.update(`\n${table}\n`);
                for (const row of rows.iterate()) hash.update(`${JSON.stringify(Object.values(row).map(encode))}\n`);
            }
            return { name, digest: hash.digest('hex') };
        } catch (error) {
            return { name, digest: null, reason: String(error).slice(0, 300) };
        } finally { db?.close(); }
    });
}

/** The stores that cannot be shown unchanged: a different digest, an unreadable one, or one read only once. */
export function changedStores(before: StoreFingerprint[], after: StoreFingerprint[]): { name: string; reason: string }[] {
    const valid = (entry: StoreFingerprint) => typeof entry?.name === 'string' && typeof entry.digest === 'string' && /^[0-9a-f]{64}$/.test(entry.digest);
    const changed: { name: string; reason: string }[] = [], later = new Map(after.map(entry => [entry?.name, entry]));
    if (!before.length) changed.push({ name: '*', reason: 'the earlier fingerprint covers no store' });
    if (new Set(before.map(entry => entry?.name)).size !== before.length || later.size !== after.length) changed.push({ name: '*', reason: 'a fingerprint names a store twice' });
    for (const entry of before) {
        const now = later.get(entry?.name);
        later.delete(entry?.name);
        if (!valid(entry)) changed.push({ name: String(entry?.name), reason: `the earlier fingerprint is unreadable: ${entry?.reason ?? 'no digest'}` });
        else if (!now || !valid(now)) changed.push({ name: entry.name, reason: `the later fingerprint is unreadable: ${now?.reason ?? 'not covered'}` });
        else if (now.digest !== entry.digest) changed.push({ name: entry.name, reason: 'its contents changed' });
    }
    for (const name of later.keys()) changed.push({ name: String(name), reason: 'the earlier fingerprint does not cover it' });
    return changed;
}
