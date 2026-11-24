import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { storeMissing } from './backup-stores';
import { APPENDED_TABLE, comparableOrder, comparableRow, startEvent } from './fenced-start-writes';

export interface StoreFingerprint {
    name: string; digest: string | null; reason?: string;
    /** A project store whose file did not exist, so it has no digest. Older receipts never carry it. */
    absent?: true;
    /** A project store: the last event the digest covers. Of later events, only those a start does not account for are part of it. */
    eventsThrough?: number;
}

export interface FingerprintScope {
    /** Names of the project stores, read without what a start under the fence writes (`fenced-start-writes.ts`). */
    projects?: string[];
    /** An earlier read: each project store's events are read as far as that read went; later ones only when a start does not account for them. */
    since?: StoreFingerprint[];
}

/** Planner statistics `PRAGMA optimize` rewrites when a store opens or closes. Advisory: no release reads them as data. */
const STATISTICS = /^sqlite_stat[1-4]$/;

function encode(value: unknown): unknown {
    if (value instanceof Uint8Array) return ['blob', Buffer.from(value).toString('hex')];
    if (typeof value === 'bigint') return ['integer', value.toString()];
    if (typeof value === 'number') return ['real', Object.is(value, -0) ? '-0' : String(value)];
    return value;
}

const coversEvents = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

/**
 * A digest of what each database holds: its schema and every row of every table, read on a read-only
 * connection. Planner statistics are left out of every store. A project store is also read without
 * what a start under the fence writes. Its events are read as far as the `since` read went; a later
 * event counts only when it is not one a start records. So a release that started and admitted
 * nothing compares as unchanged. Equal digests are the proof that
 * the release that ran before can still read the store. A reorganised but logically equal database
 * may differ; that errs towards "changed". Unreadable is null with the reason. A project store
 * whose file does not exist is null marked absent; any other missing store is unreadable.
 */
export function fingerprintStores(databases: { name: string; path: string }[], scope: FingerprintScope = {}): StoreFingerprint[] {
    const projects = new Set(scope.projects), earlier = new Map((scope.since ?? []).map(entry => [entry?.name, entry?.eventsThrough]));
    return databases.map(({ name, path }) => {
        let db: DatabaseSync | null = null;
        try {
            if (storeMissing(path)) return { name, digest: null, ...(projects.has(name) ? { absent: true as const } : {}), reason: `${path} does not exist` };
            db = new DatabaseSync(path, { readOnly: true, timeout: 5000 });
            db.exec('BEGIN');
            const hash = createHash('sha256'), version = db.prepare('PRAGMA user_version').get(), project = projects.has(name);
            const objects = (db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name').all() as { type: string; name: string }[]).filter(object => !STATISTICS.test(object.name));
            hash.update(JSON.stringify([version, objects]));
            const tables = objects.filter(object => object.type === 'table');
            let eventsThrough: number | undefined, lastEvent: bigint | undefined;
            if (project && tables.some(table => table.name === APPENDED_TABLE)) {
                const last = db.prepare(`SELECT COALESCE(MAX(rowid),0) AS last FROM "${APPENDED_TABLE}"`), bound = earlier.get(name);
                last.setReadBigInts(true);
                lastEvent = (last.get() as { last: bigint }).last;
                eventsThrough = coversEvents(bound) ? bound : Number(lastEvent);
            }
            for (const { name: table } of tables) {
                const quoted = `"${table.replaceAll('"', '""')}"`, appended = project && table === APPENDED_TABLE;
                const rows = db.prepare(appended ? `SELECT * FROM ${quoted} WHERE rowid<=? ORDER BY rowid` : `SELECT * FROM ${quoted}${project ? comparableOrder(table) : ''}`);
                rows.setReadBigInts(true);
                hash.update(`\n${table}\n`);
                const digestRow = (row: Record<string, unknown>) => hash.update(`${JSON.stringify(Object.values(row).map(encode))}\n`);
                for (const read of appended ? rows.iterate(eventsThrough!) : rows.iterate()) {
                    const row = project ? comparableRow(table, read as Record<string, unknown>, lastEvent) : read;
                    if (row) digestRow(row);
                }
                if (!appended) continue;
                const later = db.prepare(`SELECT * FROM ${quoted} WHERE rowid>? ORDER BY rowid`);
                later.setReadBigInts(true);
                for (const read of later.iterate(eventsThrough!)) if (!startEvent(read as Record<string, unknown>)) digestRow(read as Record<string, unknown>);
            }
            return { name, digest: hash.digest('hex'), ...(eventsThrough === undefined ? {} : { eventsThrough }) };
        } catch (error) {
            return { name, digest: null, reason: String(error).slice(0, 300) };
        } finally { db?.close(); }
    });
}

/** A well-formed absent entry: a named store, the marker literally `true` and the digest an explicit null. */
export const absentFingerprint = (entry: StoreFingerprint) => typeof entry?.name === 'string' && entry.absent === true && entry.digest === null;

/**
 * The stores that cannot be shown unchanged: a different digest, an unreadable one, one read only
 * once, a store created or gone since the earlier read, or a malformed absent marker. A store absent
 * in both reads is unchanged.
 */
export function changedStores(before: StoreFingerprint[], after: StoreFingerprint[]): { name: string; reason: string }[] {
    const valid = (entry: StoreFingerprint) => typeof entry?.name === 'string' && typeof entry.digest === 'string' && /^[0-9a-f]{64}$/.test(entry.digest);
    const malformed = (entry: StoreFingerprint) => entry?.absent !== undefined && !absentFingerprint(entry);
    const changed: { name: string; reason: string }[] = [], later = new Map(after.map(entry => [entry?.name, entry]));
    if (!before.length) changed.push({ name: '*', reason: 'the earlier fingerprint covers no store' });
    if (new Set(before.map(entry => entry?.name)).size !== before.length || later.size !== after.length) changed.push({ name: '*', reason: 'a fingerprint names a store twice' });
    for (const entry of before) {
        const now = later.get(entry?.name);
        later.delete(entry?.name);
        if (malformed(entry)) changed.push({ name: String(entry?.name), reason: 'the earlier fingerprint has a malformed absent marker' });
        else if (!absentFingerprint(entry) && !valid(entry)) changed.push({ name: String(entry?.name), reason: `the earlier fingerprint is unreadable: ${entry?.reason ?? 'no digest'}` });
        else if (!now) changed.push({ name: entry.name, reason: 'the later fingerprint is unreadable: not covered' });
        else if (malformed(now)) changed.push({ name: entry.name, reason: 'the later fingerprint has a malformed absent marker' });
        else if (absentFingerprint(entry) && absentFingerprint(now)) continue;
        else if (absentFingerprint(now)) changed.push({ name: entry.name, reason: 'its store no longer exists' });
        else if (!valid(now)) changed.push({ name: entry.name, reason: `the later fingerprint is unreadable: ${now.reason ?? 'not covered'}` });
        else if (absentFingerprint(entry)) changed.push({ name: entry.name, reason: 'created since the old service stopped' });
        else if (now.digest !== entry.digest) changed.push({ name: entry.name, reason: 'its contents changed' });
    }
    for (const name of later.keys()) changed.push({ name: String(name), reason: 'the earlier fingerprint does not cover it' });
    return changed;
}
