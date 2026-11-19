import { appendFileSync, existsSync, mkdirSync, statSync, truncateSync } from 'node:fs';
import { resolve } from 'node:path';
import { sanitizeObject } from '../office/security';

/**
 * Appends records to a project's monthly history archive, one JSON line each, and confirms the write by
 * the file's size. History leaves live state only after this returns: a caller removes the records
 * afterwards, so a crash in between can leave a record in both places and never in neither. A record
 * archived twice that way is the same line twice, identified by the record's own id.
 *
 * Records are written as the store itself would save them, with the same redaction. A write that fails
 * part way is cut back to where the file ended before it, so the next record never lands on a torn line.
 */
export function archiveHistory(dataRoot: string, name: string, month: string, records: readonly unknown[], append: typeof appendFileSync = appendFileSync): string {
    if (!/^[a-z-]+$/.test(name) || !/^\d{4}-\d{2}$/.test(month)) throw new Error('History archive name or month is not valid');
    const directory = resolve(dataRoot, 'archive'), path = resolve(directory, `${name}-${month}.jsonl`);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const lines = records.map(record => `${JSON.stringify(sanitizeObject(record))}\n`).join(''), bytes = Buffer.byteLength(lines), before = existsSync(path) ? statSync(path).size : 0;
    try {
        append(path, lines, { encoding: 'utf8', mode: 0o600, flush: true });
        if (statSync(path).size !== before + bytes) throw new Error('History archive write could not be confirmed');
    }
    catch (error) {
        try { if (existsSync(path) && statSync(path).size > before) truncateSync(path, before); } catch { /* The original failure is the one to report. */ }
        throw error;
    }
    return path;
}

/** The calendar month of an ISO time, or of now when the record carries none: where its archive line goes. */
export function archiveMonth(at: string | undefined, now: Date): string {
    const time = Date.parse(at || '');
    return new Date(Number.isFinite(time) ? time : now.getTime()).toISOString().slice(0, 7);
}

/**
 * Archives the records month by month and tells the caller after each month that its records are safe
 * to remove. A month whose write fails stops the run there: the months already confirmed are done and are
 * not written again, and the rest stay in state for the next attempt. Returns how many were archived.
 */
export function archiveByMonth<T>(dataRoot: string, name: string, records: readonly T[], month: (record: T) => string, archived: (batch: T[]) => void): number {
    const months = new Map<string, T[]>();
    for (const record of records) months.set(month(record), [...months.get(month(record)) || [], record]);
    let count = 0;
    for (const [key, batch] of months) {
        try { archiveHistory(dataRoot, name, key, batch); }
        catch { return count; }
        archived(batch);
        count += batch.length;
    }
    return count;
}
