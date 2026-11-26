import type { DatabaseSync } from 'node:sqlite';
import { sanitize } from '../office/security';
import type { RunnerLimits, RunnerPaths } from './config';
import { appendFailureLine, failureLine, JournalRefused, readFailures, type FailureEvent, type JournalView } from './failure-journal';
import { forwardFailures, type ForwardSummary } from './forward-events';
import { ForwardingState } from './forwarding-state';
import { journalDigest, writeForwardingStatus } from './forwarding-status';
import { reportHalt, type HaltSummary } from './halt-report';
import { readHalt, writeRunnerStop } from './kill-switch';
import type { OfficeReader } from './office-client';
import type { OfficeWriter } from './office-writer';
import { passAllowance, passBudget, type PassBudget } from './pass-budget';
import { ensurePrivateDirectory } from './runner-root';
import { readRunnerState, writeRunnerState, type HealthSample, type Outage, type PassOutcome, type PassRecord, type RunnerState } from './runner-state';
import { incidentSummaries, selectIncident } from './select-incident';
import { afterHealthFailure, afterHealthSuccess } from './service-down';
import type { RunnerEffects } from './settle-report';
import { acquirePassLock, PassRefused } from './single-flight';

/** What the pass reports to the Office (phase 6d). A machine without it only observes. */
export interface PassReporting {
    /** The Office origin every report and receipt is kept for. */
    origin: string;
    /** Opens the runner's private Store. Called only once the pass lock is held, and closed before it is released. */
    openStore: () => Promise<{ effects: RunnerEffects; db: DatabaseSync; close: () => void }>;
    writer: (remaining: () => number) => OfficeWriter;
    /** The observation reader, bounded by the observation phase. */
    reader: (remaining: () => number) => OfficeReader;
    monotonic: () => number;
    /** Whether the launcher started this pass, and the PID of the helper it registered if so. */
    launched: boolean;
    parent: number;
}

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
    reporting?: PassReporting;
}

/** A pass that ran records what it found. A pass refused by another pass's lock changed nothing. */
export type PassResult = { status: 'recorded'; record: PassRecord } | { status: 'locked'; reason: string };

const bounded = (text: string) => sanitize(text).slice(0, 500);
const message = (error: unknown) => error instanceof Error ? error.message : String(error);

/** How the pass ended, and the runner state to save with it: none when the state on disk must be left as it is. */
type Outcome = { record: PassRecord; save: RunnerState | null };

/**
 * One pass. It calls no model and changes nothing outside the runner's own files except through
 * its reports to the Office:
 *
 * 1. take the pass lock (a locked pass writes and sends nothing);
 * 2. read runner state and the failure journal, and finish any journal write a previous pass left half done;
 * 3. forward the journal's failure events, also while STOP or a pause holds, and also when runner
 *    state cannot be read;
 * 4. stop here when runner state or the journal cannot be trusted, or while STOP or a pause holds;
 * 5. read health: a failure counts toward an outage, and the cached readings stay cached;
 * 6. stand down while a deployment holds the fence, or the fence is invalid;
 * 7. read the research list, check STOP and pause again, then keep or pick the one incident in flight;
 * 8. whatever the outcome, report the runner's control condition, publish what it forwarded, and
 *    save the pass record, all before the lock is released.
 */
export async function runPass(machine: PassMachine): Promise<PassResult> {
    const { paths, now, pass, limits, reporting } = machine;
    let lock;
    try { lock = acquirePassLock(paths, pass, { pid: machine.pid, alive: machine.alive, now }); }
    catch (error) {
        if (error instanceof PassRefused) return { status: 'locked', reason: error.message };
        throw error;
    }
    let store: Awaited<ReturnType<PassReporting['openStore']>> | null = null;
    try {
        const startedAt = now().toISOString();
        for (const directory of [paths.journal, paths.state, paths.officeData]) ensurePrivateDirectory(directory);
        const record = (outcome: PassOutcome, detail: string, extra: Partial<PassRecord> = {}): PassRecord =>
            ({ pass, startedAt, endedAt: now().toISOString(), outcome, detail: bounded(detail), ...extra });

        // Reporting: a budget from the launcher's registered deadline, and the Store, opened under the lock.
        let budget: PassBudget | null = null, unavailable: string | null = null;
        if (reporting) {
            const allowance = passAllowance(paths, { launched: reporting.launched, parent: reporting.parent, now: now(), manualMs: limits.manualPassMs });
            if ('unknown' in allowance) unavailable = `Reporting deferred: ${allowance.unknown}`;
            else {
                budget = passBudget(allowance.ms, { monotonic: reporting.monotonic, finalizeMs: limits.finalizeMs, forwardMaxMs: limits.forwardMaxMs });
                try { store = await reporting.openStore(); }
                catch (error) { unavailable = `Forwarding unavailable: ${message(error)}`; }
            }
        }
        const reports = store && budget && reporting ? { state: new ForwardingState(store.db), effects: store.effects, writer: reporting.writer(() => budget!.remaining()), origin: reporting.origin } : null;
        const reader = reporting && budget ? reporting.reader(() => budget!.remaining()) : machine.reader;
        // The summary status reads: a pass that does not finish leaves it marked unfinished, never stale-but-current.
        let statusProblem: string | null = null;
        const publish = (summary: Parameters<typeof writeForwardingStatus>[1]) => {
            try { writeForwardingStatus(paths, summary); }
            catch (error) { statusProblem ??= `The forwarding summary could not be saved: ${message(error)}`; }
        };
        if (reporting) publish({ version: 1, state: 'in-progress', pass, at: now().toISOString(), origin: reporting.origin });

        let forwarded: ForwardSummary | null = null, journalView: JournalView | null = null;
        const decide = async (): Promise<Outcome> => {
            const read = readRunnerState(paths);
            let state: RunnerState | null = 'unreadable' in read ? null : read.state;
            const finish = (done: PassRecord): Outcome => ({ record: done, save: { ...state!, lastPass: done } });
            const stopFor = (reason: string) => {
                writeRunnerStop(paths, { reason, instruction: `Keep ${paths.failures} and ${paths.runnerState} as evidence; any journal write still owed is the intent in runner state. Settle the journal by hand, then remove ${paths.stop}.` }, now);
                return finish(record('stopped', reason));
            };
            // A journal event is saved as an intent first, so a pass that dies mid-write leaves the exact line for the next one.
            const settle = (): string | null => {
                const intent = state!.intent!;
                try { appendFailureLine(paths, intent.line, limits.journalLimit); }
                catch (error) {
                    if (error instanceof JournalRefused) return error.message;
                    throw error;
                }
                state = { ...state!, outage: intent.next, intent: null };
                writeRunnerState(paths, state);
                return null;
            };
            const transition = (next: Outage | null, event: FailureEvent | null): string | null => {
                if (!event) { state = { ...state!, outage: next }; return null; }
                state = { ...state!, intent: { id: event.id, line: failureLine(event), next } };
                writeRunnerState(paths, state);
                return settle();
            };

            const journal = readFailures(paths, limits.journalLimit);
            const owed = state?.intent ?? null, refused = state && journal.problem === null && owed ? settle() : null;
            journalView = journal.problem === null ? readFailures(paths, limits.journalLimit) : journal;
            // Forwarding runs before STOP and pause are read, so it goes on while they hold. A disputed owed ID is withheld.
            if (reports && budget && journalView.problem === null) {
                const entries = journalView.entries.filter(entry => !(refused && owed && entry.event.id === owed.id));
                forwarded = await forwardFailures({ entries, origin: reports.origin, state: reports.state, effects: reports.effects, writer: reports.writer, limit: limits.forwardLimit, remaining: budget.remaining });
            }
            budget?.enter('observe');

            if ('unreadable' in read) {
                const reason = `The runner state ${paths.runnerState} cannot be read (${read.unreadable})`;
                writeRunnerStop(paths, { reason, instruction: `Keep ${paths.runnerState} as evidence. Repair or move it aside by hand, then remove ${paths.stop}.` }, now);
                // Saving anything here would replace the file STOP names.
                return { record: record('stopped', reason), save: null };
            }
            if (journal.problem !== null) return stopFor(journal.problem);
            if (refused) return stopFor(refused);
            const halt = readHalt(paths);
            if (halt) return finish(record(halt.kind, halt.reason));

            let health;
            try { health = await reader.health(); }
            catch (error) {
                const reason = message(error), { observation } = state!;
                const failed = afterHealthFailure(state!.outage, { pass, now: now(), reason, cached: observation.health }, limits);
                const stopped = transition(failed.next, failed.event);
                if (stopped) return stopFor(stopped);
                return finish(record('service-down', `The Office could not be read: ${reason}`, { cachedHealthAt: observation.health?.at ?? null, cachedIncidentsAt: observation.incidents?.at ?? null }));
            }
            const sample: HealthSample = { at: now().toISOString(), ...health };
            const answered = afterHealthSuccess(state!.outage, { now: now(), health: sample });
            const stopped = transition(null, answered.event);
            if (stopped) return stopFor(stopped);
            state = { ...state!, observation: { ...state!.observation, health: sample } };
            const note = answered.note ? { note: answered.note } : {};
            if (health.fence !== 'open') return finish(record('fenced', `The deployment fence is ${health.fence}; nothing is selected while it is`, note));

            let rows;
            try { rows = await reader.researchIncidents(); }
            catch (error) { return finish(record('read-failed', `The research list could not be read: ${message(error)}`, note)); }
            // A STOP or pause that arrived while the Office was read holds before anything is selected or released.
            const halted = readHalt(paths);
            if (halted) return finish(record(halted.kind, halted.reason, note));
            const decidedAt = now(), selection = selectIncident(rows, state!.inFlight, decidedAt);
            state = {
                ...state!, inFlight: selection.inFlight,
                observation: { ...state!.observation, incidents: { at: decidedAt.toISOString(), total: rows.length, summaries: incidentSummaries(rows, selection.inFlight?.incident ?? null) } },
            };
            const { selected, released } = selection;
            const detail = selected
                ? `${selected.kept ? 'Kept' : 'Selected'} ${selected.incident} (${selected.state}, revision ${selected.revision}) of ${rows.length} research incidents`
                : `No eligible incident among ${rows.length} research incidents`;
            return finish(record(selected ? 'observing' : 'idle', detail, { ...(selected && { selected }), ...(released && { released }), ...note }));
        };

        const outcome = await decide();
        // The control condition is read after anything this pass wrote to STOP.
        budget?.enter('report');
        let halt: HaltSummary | null = null;
        if (reports) {
            try { halt = await reportHalt({ paths, origin: reports.origin, state: reports.state, effects: reports.effects, writer: reports.writer, pass, now }); }
            catch (error) { halt = { confirmed: null, pending: null, conflict: null, detail: bounded(`The halt could not be reported: ${message(error)}`) }; }
        }
        const view = journalView as JournalView | null, fwd = forwarded as ForwardSummary | null;
        let note = reporting ? reportingNote(fwd, halt, unavailable, view) : '';
        if (reporting) {
            const lines = view?.problem === null ? view.entries.map(entry => entry.line) : null;
            // Counts only for a journal that was read and forwarded from; otherwise unknown.
            publish({
                version: 1, state: 'complete', pass, at: now().toISOString(), origin: reporting.origin,
                journal: lines ? { digest: journalDigest(lines), entries: lines.length } : null,
                forwarded: lines && fwd ? fwd.forwarded : null, pending: lines && fwd ? fwd.pending : null,
                uncertain: (fwd?.uncertain ?? []).slice(0, 50), conflicts: (fwd?.conflicts ?? []).slice(0, 50), halt, detail: bounded(note),
            });
            if (statusProblem) note = note ? `${note}; ${statusProblem}` : statusProblem;
        }
        const done = note ? { ...outcome.record, detail: bounded(`${outcome.record.detail}. ${note}`) } : outcome.record;
        if (outcome.save) writeRunnerState(paths, { ...outcome.save, lastPass: done });
        return { status: 'recorded', record: done };
    } finally {
        try { store?.close(); } finally { lock.release(); }
    }
}

/** One line on what the pass reported, appended to its record's detail. */
function reportingNote(forwarded: ForwardSummary | null, halt: HaltSummary | null, unavailable: string | null, journal: JournalView | null): string {
    if (unavailable) return unavailable;
    const parts: string[] = [];
    if (journal?.problem) parts.push('Nothing forwarded: the journal cannot be trusted');
    else if (forwarded) {
        parts.push(`Forwarded ${forwarded.forwarded} of ${forwarded.forwarded + forwarded.pending}`);
        if (forwarded.uncertain.length) parts.push(`${forwarded.uncertain.length} awaiting read-back`);
        if (forwarded.conflicts.length) parts.push(`${forwarded.conflicts.length} in conflict`);
        if (forwarded.stopped) parts.push(`stopped: ${forwarded.stopped}`);
    }
    if (halt?.detail) parts.push(halt.detail);
    else if (halt?.confirmed) parts.push(`halt reported ${halt.confirmed.kind}`);
    return parts.join('; ');
}
