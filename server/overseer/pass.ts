import { sanitize } from '../office/security';
import type { RunnerLimits, RunnerPaths } from './config';
import { appendFailureLine, failureLine, JournalRefused, readFailures, type FailureEvent } from './failure-journal';
import { readHalt, writeRunnerStop } from './kill-switch';
import type { OfficeReader } from './office-client';
import { ensurePrivateDirectory } from './runner-root';
import { readRunnerState, writeRunnerState, type HealthSample, type Outage, type PassOutcome, type PassRecord, type RunnerState } from './runner-state';
import { incidentSummaries, selectIncident } from './select-incident';
import { afterHealthFailure, afterHealthSuccess } from './service-down';
import { acquirePassLock, PassRefused } from './single-flight';

/** What one pass acts on. The real one reads the local Office (machine.ts); tests supply their own. */
export interface PassMachine {
    paths: RunnerPaths;
    reader: OfficeReader;
    now: () => Date;
    /** This pass's ID, a UUID. It also names an outage the pass opens. */
    pass: string;
    pid: number;
    alive: (pid: number) => boolean;
    limits: RunnerLimits;
}

/** A pass that ran records what it found. A pass refused by another pass's lock changed nothing. */
export type PassResult = { status: 'recorded'; record: PassRecord } | { status: 'locked'; reason: string };

const bounded = (text: string) => sanitize(text).slice(0, 500);
const message = (error: unknown) => error instanceof Error ? error.message : String(error);

/**
 * One observe-only pass. It sends the Office nothing but the reader's `GET`s, calls no model and
 * changes nothing outside the runner's own files:
 *
 * 1. take the pass lock;
 * 2. read runner state (an unreadable file stops the runner and is left as it is);
 * 3. check the failure journal and finish any journal write a previous pass left half done;
 * 4. stop here while STOP or a pause holds;
 * 5. read health: a failure counts toward an outage, and the cached readings stay cached;
 * 6. stand down while a deployment holds the fence, or the fence is invalid;
 * 7. read the research list, check STOP and pause again, then keep or pick the one incident in flight.
 */
export async function runPass(machine: PassMachine): Promise<PassResult> {
    const { paths, reader, now, pass, limits } = machine;
    let lock;
    try { lock = acquirePassLock(paths, pass, { pid: machine.pid, alive: machine.alive, now }); }
    catch (error) {
        if (error instanceof PassRefused) return { status: 'locked', reason: error.message };
        throw error;
    }
    try {
        const startedAt = now().toISOString();
        for (const directory of [paths.journal, paths.state, paths.officeData]) ensurePrivateDirectory(directory);
        const record = (outcome: PassOutcome, detail: string, extra: Partial<PassRecord> = {}): PassRecord =>
            ({ pass, startedAt, endedAt: now().toISOString(), outcome, detail: bounded(detail), ...extra });

        const read = readRunnerState(paths);
        if ('unreadable' in read) {
            const reason = `The runner state ${paths.runnerState} cannot be read (${read.unreadable})`;
            writeRunnerStop(paths, { reason, instruction: `Keep ${paths.runnerState} as evidence. Repair or move it aside by hand, then remove ${paths.stop}.` }, now);
            // Saving anything here would replace the file STOP names.
            return { status: 'recorded', record: record('stopped', reason) };
        }
        let state: RunnerState = read.state;
        const finish = (done: PassRecord): PassResult => {
            state = { ...state, lastPass: done };
            writeRunnerState(paths, state);
            return { status: 'recorded', record: done };
        };
        const stopFor = (reason: string) => {
            writeRunnerStop(paths, { reason, instruction: `Keep ${paths.failures} and ${paths.runnerState} as evidence; any journal write still owed is the intent in runner state. Settle the journal by hand, then remove ${paths.stop}.` }, now);
            return finish(record('stopped', reason));
        };
        // A journal event is saved as an intent first, so a pass that dies mid-write leaves the exact line for the next one.
        const settle = (): string | null => {
            const intent = state.intent!;
            try { appendFailureLine(paths, intent.line, limits.journalLimit); }
            catch (error) {
                if (error instanceof JournalRefused) return error.message;
                throw error;
            }
            state = { ...state, outage: intent.next, intent: null };
            writeRunnerState(paths, state);
            return null;
        };
        const transition = (next: Outage | null, event: FailureEvent | null): string | null => {
            if (!event) { state = { ...state, outage: next }; return null; }
            state = { ...state, intent: { id: event.id, line: failureLine(event), next } };
            writeRunnerState(paths, state);
            return settle();
        };

        const journal = readFailures(paths, limits.journalLimit);
        if (journal.problem !== null) return stopFor(journal.problem);
        if (state.intent) {
            const refused = settle();
            if (refused) return stopFor(refused);
        }
        const halt = readHalt(paths);
        if (halt) return finish(record(halt.kind, halt.reason));

        let health;
        try { health = await reader.health(); }
        catch (error) {
            const reason = message(error), { observation } = state;
            const failed = afterHealthFailure(state.outage, { pass, now: now(), reason, cached: observation.health }, limits);
            const refused = transition(failed.next, failed.event);
            if (refused) return stopFor(refused);
            return finish(record('service-down', `The Office could not be read: ${reason}`, { cachedHealthAt: observation.health?.at ?? null, cachedIncidentsAt: observation.incidents?.at ?? null }));
        }
        const sample: HealthSample = { at: now().toISOString(), ...health };
        const answered = afterHealthSuccess(state.outage, { now: now(), health: sample });
        const refused = transition(null, answered.event);
        if (refused) return stopFor(refused);
        state = { ...state, observation: { ...state.observation, health: sample } };
        const note = answered.note ? { note: answered.note } : {};
        if (health.fence !== 'open') return finish(record('fenced', `The deployment fence is ${health.fence}; nothing is selected while it is`, note));

        let rows;
        try { rows = await reader.researchIncidents(); }
        catch (error) { return finish(record('read-failed', `The research list could not be read: ${message(error)}`, note)); }
        // A STOP or pause that arrived while the Office was read holds before anything is selected or released.
        const halted = readHalt(paths);
        if (halted) return finish(record(halted.kind, halted.reason, note));
        const decidedAt = now(), selection = selectIncident(rows, state.inFlight, decidedAt);
        state = {
            ...state, inFlight: selection.inFlight,
            observation: { ...state.observation, incidents: { at: decidedAt.toISOString(), total: rows.length, summaries: incidentSummaries(rows, selection.inFlight?.incident ?? null) } },
        };
        const { selected, released } = selection;
        const detail = selected
            ? `${selected.kept ? 'Kept' : 'Selected'} ${selected.incident} (${selected.state}, revision ${selected.revision}) of ${rows.length} research incidents`
            : `No eligible incident among ${rows.length} research incidents`;
        return finish(record(selected ? 'observing' : 'idle', detail, { ...(selected && { selected }), ...(released && { released }), ...note }));
    } finally { lock.release(); }
}
