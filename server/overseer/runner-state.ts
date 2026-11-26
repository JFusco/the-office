import { z } from 'zod';
import { writeDurable } from '../release/durable-file';
import { readBoundedNoFollowSync } from '../store/owned-artifact';
import type { RunnerPaths } from './config';

const at = z.iso.datetime();

/** The Office not answering, from the first failed pass. `episode` is that pass's ID. */
const Outage = z.object({
    episode: z.uuid(), since: at, lastFailureAt: at, failures: z.number().int().min(1),
    reason: z.string().max(500), journaled: z.boolean(),
}).strict();
export type Outage = z.infer<typeof Outage>;

/** One health reading of the Office, dated when it was read. */
const HealthSample = z.object({
    at, serviceInstanceId: z.string().max(200), loadedHash: z.string().max(200), pid: z.number().int().positive(), busy: z.boolean(),
    fence: z.enum(['open', 'held', 'invalid']),
    release: z.object({ status: z.string().max(100), commit: z.string().max(100).optional() }).strict().nullable(),
}).strict();
export type HealthSample = z.infer<typeof HealthSample>;

export const IncidentSummary = z.object({
    id: z.string().max(100), state: z.string().max(100), revision: z.number().int().min(0), source: z.string().max(100),
    researchAt: at.nullable(), openSubjects: z.number().int().min(0),
}).strict();
export type IncidentSummary = z.infer<typeof IncidentSummary>;
export const SUMMARY_LIMIT = 50;

/** The last complete research list read, dated when it was read; `total` counts every row, `summaries` at most 50. */
const IncidentSample = z.object({ at, total: z.number().int().min(0), summaries: z.array(IncidentSummary).max(SUMMARY_LIMIT) }).strict();

const InFlight = z.object({ incident: z.string().max(100), selectedAt: at, revision: z.number().int().min(0), state: z.string().max(100) }).strict();
export type InFlight = z.infer<typeof InFlight>;

/** A journal event this runner decided to write: its exact line, and the outage as it stands once the line is on disk. */
const Intent = z.object({ id: z.string().max(100), line: z.string().max(8192), next: Outage.nullable() }).strict();
export type JournalIntent = z.infer<typeof Intent>;

export const PASS_OUTCOMES = ['stopped', 'paused', 'service-down', 'fenced', 'read-failed', 'idle', 'observing'] as const;
export type PassOutcome = typeof PASS_OUTCOMES[number];

export const PassRecord = z.object({
    pass: z.uuid(), startedAt: at, endedAt: at, outcome: z.enum(PASS_OUTCOMES), detail: z.string().max(500),
    selected: z.object({ incident: z.string().max(100), revision: z.number().int().min(0), state: z.string().max(100), kept: z.boolean() }).strict().optional(),
    released: z.object({ incident: z.string().max(100), reason: z.string().max(200) }).strict().optional(),
    /** On a pass that could not read the Office: when the cached readings were taken. They are not current. */
    cachedHealthAt: at.nullable().optional(),
    cachedIncidentsAt: at.nullable().optional(),
    note: z.string().max(500).optional(),
}).strict();
export type PassRecord = z.infer<typeof PassRecord>;

const RunnerState = z.object({
    version: z.literal(1),
    inFlight: InFlight.nullable(),
    outage: Outage.nullable(),
    intent: Intent.nullable(),
    observation: z.object({ health: HealthSample.nullable(), incidents: IncidentSample.nullable() }).strict(),
    lastPass: PassRecord.nullable(),
}).strict();
export type RunnerState = z.infer<typeof RunnerState>;

export const EMPTY_STATE: RunnerState = { version: 1, inFlight: null, outage: null, intent: null, observation: { health: null, incidents: null }, lastPass: null };

const STATE_LIMIT = 1024 * 1024;

/** The runner's state. A root that has none starts empty; a file that cannot be read or does not validate is reported, never repaired. */
export function readRunnerState(paths: RunnerPaths): { state: RunnerState } | { unreadable: string } {
    const read = readBoundedNoFollowSync(paths.runnerState, STATE_LIMIT);
    if ('reason' in read) return read.reason === 'missing' ? { state: structuredClone(EMPTY_STATE) } : { unreadable: read.reason };
    try { return { state: RunnerState.parse(JSON.parse(read.text)) }; }
    catch { return { unreadable: 'not valid runner state' }; }
}

/** Saves the whole state, synced and renamed into place. Throws when it cannot be saved. */
export function writeRunnerState(paths: RunnerPaths, state: RunnerState): void {
    const text = `${JSON.stringify(RunnerState.parse(state), null, 2)}\n`;
    if (Buffer.byteLength(text) > STATE_LIMIT) throw new Error('Runner state would exceed 1 MiB');
    writeDurable(paths.runnerState, text);
}
