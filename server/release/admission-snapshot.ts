import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { admissionCursor } from '../store/admission-journal';

export interface AdmissionSnapshot { name: string; cursor: number | null; reason?: string }

/**
 * Each project database's admission cursor, read on a read-only connection: the database file is not
 * written, though SQLite may create its `-shm`/`-wal` sidecars beside a WAL database. A database that
 * is missing, cannot be opened or has no journal reports a null cursor with the reason, never zero.
 */
export function snapshotAdmissions(databases: { name: string; path: string }[]): AdmissionSnapshot[] {
    return databases.map(({ name, path }) => {
        if (!existsSync(path)) return { name, cursor: null, reason: `${path} does not exist` };
        let db: DatabaseSync | null = null;
        try {
            db = new DatabaseSync(path, { readOnly: true, timeout: 5000 });
            return { name, cursor: admissionCursor(db) };
        } catch (error) {
            return { name, cursor: null, reason: String(error).slice(0, 300) };
        } finally { db?.close(); }
    });
}

export type AdmissionComparison = { status: 'unchanged' } | { status: 'admitted-or-unknown'; projects: { name: string; reason: string }[] };

/**
 * Unchanged only when both snapshots cover the same projects and every cursor is readable and equal.
 * A moved cursor means work was admitted; an unreadable or missing one means nobody can say.
 */
export function compareAdmissions(before: AdmissionSnapshot[], after: AdmissionSnapshot[]): AdmissionComparison {
    // A snapshot may come back from an untyped journal receipt.
    const unidentified = (entry: AdmissionSnapshot) => typeof entry?.name !== 'string' || !entry.name.trim();
    if (before.some(unidentified) || after.some(unidentified)) {
        return { status: 'admitted-or-unknown', projects: [{ name: '*', reason: 'a snapshot entry has no readable project name' }] };
    }
    const unknown = (entry: AdmissionSnapshot) => !Number.isSafeInteger(entry.cursor) || (entry.cursor as number) < 0;
    const projects: { name: string; reason: string }[] = [], later = new Map(after.map(entry => [entry.name, entry]));
    if (!before.length) projects.push({ name: '*', reason: 'the earlier snapshot covers no project' });
    if (new Set(before.map(entry => entry.name)).size !== before.length || later.size !== after.length) projects.push({ name: '*', reason: 'a snapshot names a project twice' });
    for (const entry of before) {
        const now = later.get(entry.name);
        later.delete(entry.name);
        if (unknown(entry)) projects.push({ name: entry.name, reason: `the earlier cursor is unknown: ${entry.reason ?? 'no cursor recorded'}` });
        else if (!now) projects.push({ name: entry.name, reason: 'the later snapshot does not cover it' });
        else if (unknown(now)) projects.push({ name: entry.name, reason: `the later cursor is unknown: ${now.reason ?? 'no cursor recorded'}` });
        else if (now.cursor !== entry.cursor) projects.push({ name: entry.name, reason: `the cursor moved from ${entry.cursor} to ${now.cursor}` });
    }
    for (const name of later.keys()) projects.push({ name, reason: 'the earlier snapshot does not cover it' });
    return projects.length ? { status: 'admitted-or-unknown', projects } : { status: 'unchanged' };
}
