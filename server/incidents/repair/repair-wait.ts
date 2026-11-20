import { subjectKey } from '../../../src/contracts/incidents';
import type { RepairWait, WorkRef } from '../../../src/contracts/work';
import type { OfficeSnapshot } from '../../../src/shared';
import { stoppedRecord } from '../sources/stopped-record';

/** How long a wait stands without recorded progress on its repair. */
export const REPAIR_WAIT_MS = 48 * 60 * 60 * 1000;

type Work = Pick<WorkRef, 'projectId' | 'kind' | 'id'>;
export const waitKey = (work: Pick<WorkRef, 'kind' | 'id'>) => `${work.kind}/${work.id}`;

/**
 * How a record's stop stands now, in the terms a marker records, or null when the record is not
 * stopped, is not at the stage asked about, or the work has no record of its own. Read the way
 * incident observation reads it, so "the same stop" means one thing in the ledger and in the
 * project.
 */
export function standingStop(state: OfficeSnapshot, work: Work, stage: string): RepairWait['stands'] | null {
    const record = stoppedRecord(state, work as WorkRef, stage);
    if (record?.standing !== 'stopped' || record.stage !== undefined && record.stage !== stage) return null;
    return { stage, episode: record.episode, stop: record.stop ? { kind: record.stop.kind, at: record.stop.at } : null, head: record.head };
}

/** A stop as a marker records it, or as the ledger holds it for a subject. */
type Stands = { stage: string; episode: string; head: string; stop: { kind: string; at: string } | null };
export const sameStop = (a: Stands, b: Stands) =>
    a.stage === b.stage && a.episode === b.episode && a.head === b.head && (a.stop?.kind ?? '') === (b.stop?.kind ?? '') && (a.stop?.at ?? '') === (b.stop?.at ?? '');

/** Whether a wait ran out: recorded as expired, or 48 hours past the last recorded progress of its repair. */
export const waitOver = (wait: RepairWait, now: Date) => !!wait.expiredAt || now.getTime() - Date.parse(wait.progressAt) >= REPAIR_WAIT_MS;

/**
 * The repair wait in effect for a piece of work, or null. In effect means: a marker exists for
 * it, it has not run out, and the record still stands stopped exactly as the marker recorded
 * (stage, episode, saved stop, head). A later stop of the same record is not covered, and ends
 * the wait without anything being written. Pure over the project's own state; it grants nothing.
 */
export function repairWaitFor(state: OfficeSnapshot, work: Work, stage: string, now: Date): RepairWait | null {
    const wait = state.coordination?.repairWaits?.[waitKey(work)];
    // The marker names its project: the same kind and ID in another project is other work.
    if (!wait || wait.subject !== subjectKey(work) || waitOver(wait, now)) return null;
    const stands = standingStop(state, work, stage);
    return stands && sameStop(stands, wait.stands) ? wait : null;
}
