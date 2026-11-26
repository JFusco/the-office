import { closeSync, constants, fstatSync, fsyncSync, lstatSync, openSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import { readBoundedNoFollowSync } from '../store/owned-artifact';
import type { RunnerPaths } from './config';
import { ensurePrivateDirectory } from './runner-root';

/**
 * The runner's failure events awaiting forwarding to the Office (phase 6d): one JSON record per
 * line, appended and never rewritten. Forwarding uses each record's ID as the Office event ID, so
 * an ID is written once with one content.
 */

/** A subset of the Office's event IDs (`server/incidents/record-event.ts` EVENT_ID). */
export const FAILURE_ID = /^overseer:(service-down|service-restored):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const Evidence = z.record(z.string().max(50), z.union([z.string().max(200), z.number(), z.boolean(), z.null()]))
    .refine(evidence => Object.keys(evidence).length <= 12, 'Evidence holds at most 12 fields');
export const FailureEvent = z.object({
    version: z.literal(1),
    id: z.string().regex(FAILURE_ID),
    kind: z.enum(['service-down', 'service-restored']),
    at: z.iso.datetime(),
    episode: z.uuid(),
    detail: z.string().max(500),
    evidence: Evidence,
}).strict().refine(event => event.id === `overseer:${event.kind}:${event.episode}`, 'An event ID names its kind and episode');
export type FailureEvent = z.infer<typeof FailureEvent>;

const LINE_LIMIT = 4096;

/** The exact line an event is written as, newline included. */
export function failureLine(event: FailureEvent): string {
    const line = `${JSON.stringify(FailureEvent.parse(event))}\n`;
    if (Buffer.byteLength(line) > LINE_LIMIT) throw new Error(`A failure event is at most ${LINE_LIMIT} bytes`);
    return line;
}

/** The journal as read: every complete record with its exact text, or why it cannot be trusted. */
export type JournalView = { entries: { event: FailureEvent; line: string }[]; problem: null } | { entries: null; problem: string };

/**
 * Reads the whole journal, bounded by its record limit. A torn last line, a malformed record, a
 * repeated ID or an unreadable file is a problem: the bytes are left as they are, nothing more is
 * appended, and the pass stops for a person.
 */
export function readFailures(paths: RunnerPaths, limit: number): JournalView {
    const read = readBoundedNoFollowSync(paths.failures, limit * LINE_LIMIT);
    if ('reason' in read) return read.reason === 'missing' ? { entries: [], problem: null } : { entries: null, problem: `${paths.failures} cannot be read (${read.reason})` };
    if (read.text && !read.text.endsWith('\n')) return { entries: null, problem: `${paths.failures} ends in a cut-short line` };
    const entries: { event: FailureEvent; line: string }[] = [], ids = new Set<string>();
    for (const [index, text] of read.text.split('\n').slice(0, -1).entries()) {
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
