import type { ExpectedWait } from '../../../src/contracts/incidents';
import type { RepairWait, WorkRef } from '../../../src/contracts/work';
import type { OfficeSnapshot } from '../../../src/shared';
import { holdReason, topLevelHold } from '../../office/project-holds';
import { touchesUnsettled } from '../../operations/stale-records';
import { expectedWait } from '../expected-block';
import { stoppedRecord } from '../sources/stopped-record';
import type { FreezeReads } from './freeze-reads';
import { repairWaitFor, waitKey } from './repair-wait';
import { writerProcessFailure } from './writer-process-failure';

/** Stops the Office already understands as someone's or something's to settle; a repair wait never holds these back. */
const OUTRANKS: ReadonlySet<ExpectedWait> = new Set(['hold', 'decision', 'merge-approval', 'prerequisite', 'pause', 'authentication', 'uncertain-effect', 'question']);

/**
 * The repair wait that holds a record back, or null. A record is frozen only while a wait is in
 * effect for its exact stop and nothing stronger explains it: not while the project is paused or
 * draining, not under a configured hold, not parked for a decision or a release, not waiting for
 * a merge approval or an answer, not stopped for missing authority or authentication, not while a
 * prerequisite gates it, and not while a write for it is unconfirmed: a saved stop or a typed run
 * failure that says so, a saved result that reports a write of unknown outcome, or a write still
 * unsettled in the Effects ledger. Those keep their own handling, whether they stood before the
 * wait or arose after it. The one stop and failure that do not say so are those of a dead
 * hands-off writer's own process (see writer-process-failure.ts): for it, only the Effects ledger
 * and a saved result can show an unconfirmed write.
 *
 * `reads` are the project's unsettled writes and the scheduler's reading of prerequisites, as
 * they are now. Without them, or when one of them cannot be read, it cannot be established that
 * nothing stronger applies, and nothing is frozen. A freeze holds recovery and requests back; it
 * changes no status, counter or budget. Never throws.
 */
export function repairFreeze(state: OfficeSnapshot, work: Pick<WorkRef, 'kind' | 'id'>, now: Date, reads: FreezeReads | null | undefined): RepairWait | null {
    if (!reads || state.paused || state.draining) return null;
    const slot = waitKey(work), marker = state.coordination?.repairWaits?.[slot];
    if (!marker) return null;
    try {
        // A snapshot that names its project decides whose marker this is; one that does not can only hold its own.
        const subject = { projectId: state.project?.id ?? marker.subject.slice(0, -(slot.length + 1)), kind: work.kind, id: work.id }, wait = repairWaitFor(state, subject, marker.stands.stage, now);
        if (!wait) return null;
        const record = stoppedRecord(state, subject, marker.stands.stage);
        if (record?.standing !== 'stopped' || record.uncertainWrite) return null;
        // A park that reached the board waits for a card to be moved, whatever its saved result calls the wait: it is never held.
        if (record.facts.parked?.published) return null;
        const held = [record.key, ...(record.keys ?? [])].some(key => !!key && !!(state.project ? holdReason(state.project, key) : topLevelHold(key)));
        // The saved stop and the typed failure of the run that worked it name their own cause, whoever wrote the explanation beside them.
        // A dead hands-off writer's own process failure is the one exception: its `uncertain-effect` label is set aside here, and the
        // Effects ledger below says whether it wrote. The record and its stop are kept as they are.
        const writerDied = work.kind === 'delivery' && writerProcessFailure(state, work.id, record), stopKind = record.stop?.kind ?? record.facts.stopKind;
        const understood = expectedWait({ ...record.facts, stopKind: writerDied && stopKind === 'uncertain-effect' ? undefined : stopKind, hold: held });
        if ((understood && OUTRANKS.has(understood)) || failureOutranks(writerDied ? undefined : record.failure)) return null;
        if (record.prerequisites?.length && reads.gated(subject, record.prerequisites)) return null;
        return touchesUnsettled(reads.unsettled(), record.effects) ? null : wait;
    } catch { return null; }
}

/** Whether a run's typed failure is a cause a repair wait never holds back: missing authority or authentication, or a write of unknown outcome. */
export function failureOutranks(category: string | undefined): boolean {
    const wait = expectedWait({ failure: category });
    return !!wait && OUTRANKS.has(wait);
}

/** What a held path says in place of acting, so a reader sees why nothing happened. */
export const heldFor = (wait: RepairWait) => `Awaiting harness repair ${wait.issue.repository}#${wait.issue.number}; held without spending an attempt.`;
