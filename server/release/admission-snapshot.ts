import { DatabaseSync } from 'node:sqlite';
import { admissionCursor } from '../store/admission-journal';
import { storeMissing } from './backup-stores';

/** `absent`: the project's store file did not exist, so it has no cursor. Older receipts never carry it. */
export interface AdmissionSnapshot { name: string; cursor: number | null; reason?: string; absent?: true }

/**
 * Each project database's admission cursor, read on a read-only connection: the database file is not
 * written, though SQLite may create its `-shm`/`-wal` sidecars beside a WAL database. A database whose
 * file does not exist reports a null cursor marked absent. One that cannot be looked up or opened, or
 * has no journal, reports a null cursor with the reason, never zero and never absent.
 */
export function snapshotAdmissions(databases: { name: string; path: string }[]): AdmissionSnapshot[] {
    return databases.map(({ name, path }) => {
        let db: DatabaseSync | null = null;
        try {
            if (storeMissing(path)) return { name, cursor: null, absent: true, reason: `${path} does not exist` };
            db = new DatabaseSync(path, { readOnly: true, timeout: 5000 });
            return { name, cursor: admissionCursor(db) };
        } catch (error) {
            return { name, cursor: null, reason: String(error).slice(0, 300) };
        } finally { db?.close(); }
    });
}

/** A well-formed absent entry: the marker is literally `true` and the cursor is an explicit null. */
export const absentAdmission = (entry: AdmissionSnapshot) => entry?.absent === true && entry.cursor === null;

export type AdmissionComparison = { status: 'unchanged' } | { status: 'admitted-or-unknown'; projects: { name: string; reason: string }[] };

/**
 * Unchanged only when both snapshots cover the same projects and every cursor is readable and equal,
 * or a project's store is absent in both. A moved cursor means work was admitted; a store created
 * since the earlier snapshot is a change; an unreadable or missing cursor, a store that disappeared
 * or a malformed absent marker means nobody can say.
 */
export function compareAdmissions(before: AdmissionSnapshot[], after: AdmissionSnapshot[]): AdmissionComparison {
    // A snapshot may come back from an untyped journal receipt.
    const unidentified = (entry: AdmissionSnapshot) => typeof entry?.name !== 'string' || !entry.name.trim();
    if (before.some(unidentified) || after.some(unidentified)) {
        return { status: 'admitted-or-unknown', projects: [{ name: '*', reason: 'a snapshot entry has no readable project name' }] };
    }
    const unknown = (entry: AdmissionSnapshot) => !Number.isSafeInteger(entry.cursor) || (entry.cursor as number) < 0;
    const malformed = (entry: AdmissionSnapshot) => entry.absent !== undefined && !absentAdmission(entry);
    const projects: { name: string; reason: string }[] = [], later = new Map(after.map(entry => [entry.name, entry]));
    if (!before.length) projects.push({ name: '*', reason: 'the earlier snapshot covers no project' });
    if (new Set(before.map(entry => entry.name)).size !== before.length || later.size !== after.length) projects.push({ name: '*', reason: 'a snapshot names a project twice' });
    for (const entry of before) {
        const now = later.get(entry.name);
        later.delete(entry.name);
        if (malformed(entry)) projects.push({ name: entry.name, reason: 'the earlier entry has a malformed absent marker' });
        else if (!absentAdmission(entry) && unknown(entry)) projects.push({ name: entry.name, reason: `the earlier cursor is unknown: ${entry.reason ?? 'no cursor recorded'}` });
        else if (!now) projects.push({ name: entry.name, reason: 'the later snapshot does not cover it' });
        else if (malformed(now)) projects.push({ name: entry.name, reason: 'the later entry has a malformed absent marker' });
        else if (absentAdmission(entry) && absentAdmission(now)) continue;
        else if (absentAdmission(now)) projects.push({ name: entry.name, reason: 'its store no longer exists' });
        else if (unknown(now)) projects.push({ name: entry.name, reason: `the later cursor is unknown: ${now.reason ?? 'no cursor recorded'}` });
        else if (absentAdmission(entry)) projects.push({ name: entry.name, reason: 'created since the old service stopped' });
        else if (now.cursor !== entry.cursor) projects.push({ name: entry.name, reason: `the cursor moved from ${entry.cursor} to ${now.cursor}` });
    }
    for (const name of later.keys()) projects.push({ name, reason: 'the earlier snapshot does not cover it' });
    return projects.length ? { status: 'admitted-or-unknown', projects } : { status: 'unchanged' };
}
