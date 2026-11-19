import { appendFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Appends records to a project's monthly history archive, one JSON line each, and confirms the write by
 * the file's size. History leaves live state only after this returns: a caller removes the records
 * afterwards, so a crash in between can leave a record in both places and never in neither. A record
 * archived twice that way is the same line twice, identified by the record's own id.
 */
export function archiveHistory(dataRoot: string, name: string, month: string, records: readonly unknown[]): string {
    if (!/^[a-z-]+$/.test(name) || !/^\d{4}-\d{2}$/.test(month)) throw new Error('History archive name or month is not valid');
    const directory = resolve(dataRoot, 'archive'), path = resolve(directory, `${name}-${month}.jsonl`);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const lines = records.map(record => `${JSON.stringify(record)}\n`).join(''), bytes = Buffer.byteLength(lines), before = existsSync(path) ? statSync(path).size : 0;
    appendFileSync(path, lines, { encoding: 'utf8', mode: 0o600, flush: true });
    if (statSync(path).size !== before + bytes) throw new Error('History archive write could not be confirmed');
    return path;
}

/** The calendar month of an ISO time, or of now when the record carries none: where its archive line goes. */
export function archiveMonth(at: string | undefined, now: Date): string {
    const time = Date.parse(at || '');
    return new Date(Number.isFinite(time) ? time : now.getTime()).toISOString().slice(0, 7);
}
