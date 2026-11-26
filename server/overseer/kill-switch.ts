import { unlinkSync } from 'node:fs';
import { z } from 'zod';
import { sanitize } from '../office/security';
import { writeDurableIfAbsent } from '../release/durable-file';
import { readBoundedNoFollowSync } from '../store/owned-artifact';
import type { RunnerPaths } from './config';

const Stop = z.object({ version: z.literal(1), at: z.iso.datetime(), reason: z.string().max(2000), instruction: z.string().max(2000) }).strict();
const Pause = z.object({ version: z.literal(1), at: z.iso.datetime(), reason: z.string().max(2000) }).strict();
export type RunnerStop = z.infer<typeof Stop>;
export type RunnerPause = z.infer<typeof Pause>;

/** A control file as read: absent, a valid record, or something that cannot be trusted. */
export type ControlRead<T> = { absent: true } | { record: T } | { unreadable: string };

function readControl<T>(path: string, schema: z.ZodType<T>): ControlRead<T> {
    const read = readBoundedNoFollowSync(path, 16 * 1024);
    if ('reason' in read) return read.reason === 'missing' ? { absent: true } : { unreadable: read.reason };
    try { return { record: schema.parse(JSON.parse(read.text)) }; }
    catch { return { unreadable: 'not a valid record' }; }
}

export const readStop = (paths: RunnerPaths) => readControl(paths.stop, Stop);
export const readPause = (paths: RunnerPaths) => readControl(paths.pause, Pause);

/** What holds the runner back: STOP first, then pause. A control file that cannot be read counts as STOP. */
export type Halt = { kind: 'stopped' | 'paused'; reason: string };

/**
 * The runner's control condition for reporting to the Office, from one STOP-first reading: what
 * holds it, the control file that holds it, why, and since when. A STOP or pause file that cannot
 * be read means stopped, names that file and has no known time. The reason is redacted and cut to
 * 500 characters before anyone compares or sends it.
 */
export interface ControlCondition { kind: 'running' | 'paused' | 'stopped'; control: 'STOP.json' | 'pause.json' | null; reason: string; since: string | null }

export function readControlCondition(paths: RunnerPaths): ControlCondition {
    const reason = (text: string) => sanitize(text).slice(0, 500);
    const stop = readStop(paths);
    if ('record' in stop) return { kind: 'stopped', control: 'STOP.json', reason: reason(`STOP: ${stop.record.reason}`), since: stop.record.at };
    if ('unreadable' in stop) return { kind: 'stopped', control: 'STOP.json', reason: reason(`${paths.stop} cannot be read (${stop.unreadable})`), since: null };
    const pause = readPause(paths);
    if ('record' in pause) return { kind: 'paused', control: 'pause.json', reason: reason(`Paused: ${pause.record.reason}`), since: pause.record.at };
    if ('unreadable' in pause) return { kind: 'stopped', control: 'pause.json', reason: reason(`${paths.pause} cannot be read (${pause.unreadable})`), since: null };
    return { kind: 'running', control: null, reason: '', since: null };
}

export function readHalt(paths: RunnerPaths): Halt | null {
    const stop = readStop(paths);
    if ('record' in stop) return { kind: 'stopped', reason: `STOP: ${stop.record.reason}` };
    if ('unreadable' in stop) return { kind: 'stopped', reason: `${paths.stop} cannot be read (${stop.unreadable})` };
    const pause = readPause(paths);
    if ('record' in pause) return { kind: 'paused', reason: `Paused: ${pause.record.reason}` };
    if ('unreadable' in pause) return { kind: 'stopped', reason: `${paths.pause} cannot be read (${pause.unreadable})` };
    return null;
}

const bounded = (text: string) => sanitize(text).slice(0, 2000);

/** Publishes STOP unless one exists, so the first explanation stays. Only a person removes it. Returns whether this call wrote it. */
export function writeRunnerStop(paths: RunnerPaths, stop: { reason: string; instruction: string }, now: () => Date = () => new Date()): boolean {
    const record: RunnerStop = Stop.parse({ version: 1, at: now().toISOString(), reason: bounded(stop.reason), instruction: bounded(stop.instruction) });
    return writeDurableIfAbsent(paths.stop, `${JSON.stringify(record, null, 2)}\n`);
}

/** Pauses the runner. An existing pause, or a pause file that cannot be read, is kept as it is. */
export function pauseRunner(paths: RunnerPaths, reason: string, now: () => Date = () => new Date()): { written: boolean; pause: ControlRead<RunnerPause> } {
    const record: RunnerPause = Pause.parse({ version: 1, at: now().toISOString(), reason: bounded(reason) });
    const written = writeDurableIfAbsent(paths.pause, `${JSON.stringify(record, null, 2)}\n`);
    return { written, pause: readPause(paths) };
}

/** Removes the pause file and nothing else; STOP stays. Returns whether there was one. */
export function unpauseRunner(paths: RunnerPaths): boolean {
    try { unlinkSync(paths.pause); return true; }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
        throw error;
    }
}
