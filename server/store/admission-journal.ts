import type { DatabaseSync } from 'node:sqlite';

/** New work a project admitted: a scheduler claim, an effect intent, a harness request or a delivery request. */
export type AdmissionKind = 'claim' | 'effect' | 'request' | 'delivery';
export interface Admission { seq: number; kind: AdmissionKind; ref: string; at: string }

/**
 * Appends one row to the project's `admissions` table (created in store-schema.ts). Call it inside the
 * transaction that makes the admitting write, so the row commits or rolls back with it. It is its own
 * small INSERT and never goes through the state save.
 */
export function recordAdmission(db: DatabaseSync, kind: AdmissionKind, ref: string, at: string): void {
    db.prepare('INSERT INTO admissions(kind,ref,at) VALUES(?,?,?)').run(kind, ref, at);
}

/** The highest sequence number so far, 0 when nothing was admitted. AUTOINCREMENT keeps it monotonic. */
export function admissionCursor(db: DatabaseSync): number {
    return Number((db.prepare('SELECT COALESCE(MAX(seq),0) AS seq FROM admissions').get() as { seq: number }).seq);
}

/** Everything admitted after a cursor, oldest first. */
export function admissionsSince(db: DatabaseSync, cursor: number): Admission[] {
    return db.prepare('SELECT seq,kind,ref,at FROM admissions WHERE seq>? ORDER BY seq').all(cursor) as unknown as Admission[];
}
