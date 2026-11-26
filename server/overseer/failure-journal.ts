import { closeSync, constants, fstatSync, fsyncSync, lstatSync, openSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';
import { FailureEvent, failureLine, LINE_LIMIT } from '../incidents/runner-report';
import { readBoundedNoFollowSync } from '../store/owned-artifact';
import type { RunnerPaths } from './config';
import { ensurePrivateDirectory } from './runner-root';

/**
 * The runner's failure events awaiting forwarding to the Office (phase 6d): one JSON record per
 * line, appended and never rewritten. Forwarding uses each record's ID as the Office event ID, so
 * an ID is written once with one content. The event's shape is the wire contract the Office
 * validates too (`server/incidents/runner-report.ts`).
 */
export { FAILURE_ID, FailureEvent, failureLine } from '../incidents/runner-report';

/** The journal as read: every complete record with its exact text, or why it cannot be trusted. */
export type JournalView = { entries: { event: FailureEvent; line: string }[]; problem: null } | { entries: null; problem: string };

/**
 * Reads the whole journal, bounded by its record limit. A torn last line, a malformed record, a
 * repeated ID, more records than the limit, a line longer than an event can be, a file another
 * name also reaches, or an unreadable file is a problem: the bytes are left as they are, nothing
 * more is appended, nothing is forwarded, and the pass stops for a person. What it returns is what
 * may be forwarded to the Office.
 */
export function readFailures(paths: RunnerPaths, limit: number): JournalView {
    const read = readBoundedNoFollowSync(paths.failures, limit * LINE_LIMIT, { singleLink: true });
    if ('reason' in read) return read.reason === 'missing' ? { entries: [], problem: null }
        : { entries: null, problem: read.reason === 'not-owned' ? `${paths.failures} must be a regular file with a single link` : `${paths.failures} cannot be read (${read.reason})` };
    if (read.text && !read.text.endsWith('\n')) return { entries: null, problem: `${paths.failures} ends in a cut-short line` };
    const lines = read.text.split('\n').slice(0, -1);
    if (lines.length > limit) return { entries: null, problem: `${paths.failures} holds ${lines.length} records, more than its limit of ${limit}` };
    const entries: { event: FailureEvent; line: string }[] = [], ids = new Set<string>();
    for (const [index, text] of lines.entries()) {
        if (Buffer.byteLength(text) + 1 > LINE_LIMIT) return { entries: null, problem: `${paths.failures} line ${index + 1} is longer than ${LINE_LIMIT} bytes` };
        let event: FailureEvent;
        try { event = FailureEvent.parse(JSON.parse(text)); }
        catch { return { entries: null, problem: `${paths.failures} line ${index + 1} is not a failure event` }; }
        if (ids.has(event.id)) return { entries: null, problem: `${paths.failures} records ${event.id} twice` };
        ids.add(event.id);
        entries.push({ event, line: `${text}\n` });
    }
    return { entries, problem: null };
}

/** The journal cannot take this line: it is damaged, full, or holds the same ID with other content. Nothing was written. */
export class JournalRefused extends Error {}

const syncPath = (path: string) => {
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try { fsyncSync(fd); } finally { closeSync(fd); }
};

/**
 * Appends one exact line unless the journal already holds it. A recorded ID is compared in full
 * before capacity is checked, so a replay at capacity still succeeds. A new `service-down` needs
 * two free slots, one kept for its restoration; a `service-restored` needs one. The file is opened
 * without following a link, must be a regular file with a single link, and is synced (with its
 * folder when created), also when the line was already there.
 */
export function appendFailureLine(paths: RunnerPaths, line: string, limit: number): 'appended' | 'present' {
    const event = FailureEvent.parse(JSON.parse(line));
    if (failureLine(event) !== line) throw new JournalRefused('A journal line must be exactly the serialized event');
    ensurePrivateDirectory(paths.journal);
    const view = readFailures(paths, limit);
    if (view.problem !== null) throw new JournalRefused(view.problem);
    const recorded = view.entries.find(entry => entry.event.id === event.id);
    if (recorded) {
        if (recorded.line !== line) throw new JournalRefused(`${event.id} is already in ${paths.failures} with other content`);
        syncPath(paths.failures);
        return 'present';
    }
    const needed = event.kind === 'service-down' ? 2 : 1;
    if (view.entries.length + needed > limit) throw new JournalRefused(`${paths.failures} is full (${view.entries.length} of ${limit} events); forward or archive it by hand`);
    let created: boolean;
    try { lstatSync(paths.failures); created = false; }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        created = true;
    }
    const fd = openSync(paths.failures, constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | constants.O_NOFOLLOW, 0o600);
    try {
        const stat = fstatSync(fd);
        if (!stat.isFile() || stat.nlink !== 1) throw new JournalRefused(`${paths.failures} must be a regular file with a single link`);
        const bytes = Buffer.from(line);
        if (writeSync(fd, bytes) !== bytes.length) throw new Error(`A journal line was cut short writing ${paths.failures}`);
        fsyncSync(fd);
    } finally { closeSync(fd); }
    if (created) syncPath(dirname(paths.failures));
    return 'appended';
}
