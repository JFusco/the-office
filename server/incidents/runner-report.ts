import { createHash } from 'node:crypto';
import { z } from 'zod';
import { canonical } from './canonical-json';

/**
 * What the Overseer runner reports to the Office, as both ends validate it: a journaled failure
 * event, the receipt the Office keeps for it, and the runner's control condition. The runner
 * imports this module without loading Office configuration, so it imports only zod, node and
 * `canonical-json`.
 */

/** The runner's synthetic project: the subject of its incident and the owner of its private Store. */
export const RUNNER_PROJECT = 'office-overseer';

/** A subset of the Office's event IDs (`server/incidents/record-event.ts` EVENT_ID), reserved for the runner's failure reports. */
export const FAILURE_ID = /^overseer:(service-down|service-restored):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const Evidence = z.record(z.string().max(50), z.union([z.string().max(200), z.number(), z.boolean(), z.null()]))
    .refine(evidence => Object.keys(evidence).length <= 12, 'Evidence holds at most 12 fields');
/** One line of the runner's failure journal, and the body of a forwarded failure. */
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

/** The most bytes one journal line takes, its newline included. A forwarded failure must fit it too. */
export const LINE_LIMIT = 4096;

/** The exact line an event is written as, newline included. */
export function failureLine(event: FailureEvent): string {
    const line = `${JSON.stringify(FailureEvent.parse(event))}\n`;
    if (Buffer.byteLength(line) > LINE_LIMIT) throw new Error(`A failure event is at most ${LINE_LIMIT} bytes`);
    return line;
}

/** SHA-256 of the canonical form of the validated event, before anything is redacted: what tells a repeat from a different event. */
export const failureDigest = (input: unknown) => createHash('sha256').update(canonical(FailureEvent.parse(input)), 'utf8').digest('hex');

const Digest = z.string().regex(/^[0-9a-f]{64}$/);
/** What the Office kept for a recorded failure: the event, its incident, what it was and the revision it produced. Never changes once written. */
export const FailureReceipt = z.object({
    eventId: z.string().regex(FAILURE_ID), incidentId: z.string().regex(/^inc-[0-9a-f]{16}$/), digest: Digest, revision: z.number().int().min(1),
}).strict();
export type FailureReceipt = z.infer<typeof FailureReceipt>;

/**
 * The runner's control condition as one pass read it. `control` names the file that holds it:
 * `STOP.json` for a stop, `pause.json` for a pause or an unreadable pause file, none while
 * running. `since` is the control's own time, unknown when the file cannot be read. `sequence`
 * orders reports whatever the clocks say.
 */
export const HaltReport = z.object({
    version: z.literal(1),
    sequence: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
    kind: z.enum(['running', 'paused', 'stopped']),
    control: z.enum(['STOP.json', 'pause.json']).nullable(),
    reason: z.string().max(500),
    since: z.iso.datetime().nullable(),
    pass: z.uuid(),
    reportedAt: z.iso.datetime(),
}).strict().refine(report => report.kind === 'running'
    ? report.control === null && report.since === null
    : report.kind === 'paused' ? report.control === 'pause.json' && report.since !== null : report.control !== null,
'A running report names no control; a pause names pause.json and its time; a stop names the control that holds it');
export type HaltReport = z.infer<typeof HaltReport>;

/** The condition a report states, without its sequence, pass or time: what tells a change from a repeat. */
export const haltCondition = (report: Pick<HaltReport, 'kind' | 'control' | 'reason' | 'since'>) => canonical({ kind: report.kind, control: report.control, reason: report.reason, since: report.since });

/** Every answer of the runner routes names its resource and result, so a runner can tell it from an Office that has no such route. */
export const FailureAnswer = z.discriminatedUnion('result', [
    z.object({ version: z.literal(1), resource: z.literal('runner-failure'), result: z.enum(['recorded', 'replayed', 'present']), receipt: FailureReceipt }).strict(),
    z.object({ version: z.literal(1), resource: z.literal('runner-failure'), result: z.literal('absent'), eventId: z.string().regex(FAILURE_ID) }).strict(),
    z.object({ version: z.literal(1), resource: z.literal('runner-failure'), result: z.literal('occupied'), eventId: z.string().regex(FAILURE_ID), error: z.string().max(500) }).strict(),
]);
export type FailureAnswer = z.infer<typeof FailureAnswer>;
export const HaltAnswer = z.discriminatedUnion('result', [
    z.object({ version: z.literal(1), resource: z.literal('runner-halt'), result: z.enum(['recorded', 'replayed', 'present']), report: HaltReport }).strict(),
    z.object({ version: z.literal(1), resource: z.literal('runner-halt'), result: z.literal('absent') }).strict(),
    z.object({ version: z.literal(1), resource: z.literal('runner-halt'), result: z.enum(['stale', 'conflict']), current: HaltReport }).strict(),
]);
export type HaltAnswer = z.infer<typeof HaltAnswer>;
