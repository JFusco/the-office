import { createHash } from 'node:crypto';
import { z } from 'zod';
import { writeDurable } from '../release/durable-file';
import { readBoundedNoFollowSync } from '../store/owned-artifact';
import type { RunnerPaths } from './config';

/**
 * What the last pass forwarded and reported, as `state/forwarding.json`: a bounded summary the
 * pass publishes atomically, so `pnpm office overseer status` can show it without opening the
 * runner's SQLite Store or asking the Office. The pass first marks it in progress, so a summary
 * a pass did not finish is never shown as current.
 */

const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
const count = z.number().int().min(0).refine(Number.isSafeInteger);
const Item = z.object({ id: z.string().max(100), reason: z.string().max(500) }).strict();
const Condition = z.object({ kind: z.enum(['running', 'paused', 'stopped']), control: z.enum(['STOP.json', 'pause.json']).nullable(), reason: z.string().max(500), since: z.iso.datetime().nullable() }).strict();
const Halt = z.object({ confirmed: Condition.nullable(), pending: Condition.nullable(), conflict: z.string().max(500).nullable(), detail: z.string().max(500).nullable() }).strict();

export const ForwardingSummary = z.discriminatedUnion('state', [
    z.object({ version: z.literal(1), state: z.literal('in-progress'), pass: uuid, at: z.iso.datetime(), origin: z.string().max(200) }).strict(),
    z.object({
        version: z.literal(1), state: z.literal('complete'), pass: uuid, at: z.iso.datetime(), origin: z.string().max(200),
        /** The journal the counts are for, by digest of its lines in order; null when it could not be read. */
        journal: z.object({ digest: z.string().regex(/^[0-9a-f]{64}$/), entries: count }).strict().nullable(),
        forwarded: count.nullable(), pending: count.nullable(),
        uncertain: z.array(Item).max(50), conflicts: z.array(Item).max(50),
        /** Null when the halt could not be reported this pass. */
        halt: Halt.nullable(),
        detail: z.string().max(500),
    }).strict(),
]);
export type ForwardingSummary = z.infer<typeof ForwardingSummary>;

/** The digest of the journal's lines exactly as written, in order. */
export const journalDigest = (lines: readonly string[]) => createHash('sha256').update(lines.join(''), 'utf8').digest('hex');

export function writeForwardingStatus(paths: RunnerPaths, summary: ForwardingSummary): void {
    writeDurable(paths.forwarding, `${JSON.stringify(ForwardingSummary.parse(summary), null, 2)}\n`);
}

/**
 * The summary as status shows it, checked against what it is for: this Office origin and the
 * journal as it reads now. Missing, unfinished, unreadable, another origin's, or written for a
 * journal that has changed since: the counts are unknown, with the reason.
 */
export function readForwardingStatus(paths: RunnerPaths, { origin, journal }: { origin: string | null; journal: { digest: string; entries: number } | null }) {
    const read = readBoundedNoFollowSync(paths.forwarding, 64 * 1024, { singleLink: true });
    if ('reason' in read) return { known: false as const, reason: read.reason === 'missing' ? 'no pass has reported forwarding yet' : `${paths.forwarding} cannot be read (${read.reason})` };
    let summary: ForwardingSummary;
    try { summary = ForwardingSummary.parse(JSON.parse(read.text)); }
    catch { return { known: false as const, reason: `${paths.forwarding} is not a valid summary` }; }
    if (summary.state === 'in-progress') return { known: false as const, reason: `pass ${summary.pass} started reporting at ${summary.at} and did not finish` };
    if (origin === null || summary.origin !== origin) return { known: false as const, reason: `the last summary was for ${summary.origin}, not this Office`, at: summary.at, halt: summary.halt };
    const current = !!journal && !!summary.journal && summary.journal.digest === journal.digest && summary.journal.entries === journal.entries;
    return current
        ? { known: true as const, at: summary.at, pass: summary.pass, forwarded: summary.forwarded, pending: summary.pending, uncertain: summary.uncertain, conflicts: summary.conflicts, halt: summary.halt, detail: summary.detail }
        : { known: false as const, reason: 'the journal has changed since the last pass counted it', at: summary.at, uncertain: summary.uncertain, conflicts: summary.conflicts, halt: summary.halt };
}
