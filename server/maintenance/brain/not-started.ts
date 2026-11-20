import type { MaintenanceRun } from '../../../src/shared';

/**
 * What Brain's nightly gate and checkout showed: the slot, its attempt count, the ids of its active
 * and completed runs, and the primary checkout's commit and uncommitted changes.
 */
export interface GateMark { slotDate: string; attempts: number; active: string; completed: string; head: string; changes: string }
export const gateMark = (status: { slotDate: string; attempts: number; active: { id: string } | null; completed: { id: string } | null }, checkout: { head: string; changes: string }): GateMark =>
    ({ slotDate: status.slotDate, attempts: status.attempts, active: status.active?.id || '', completed: status.completed?.id || '', head: checkout.head, changes: checkout.changes });

/** How long a run that never started waits before it is tried again, and how many times in one day's checkpoint. */
export const START_RETRY_MS = 5 * 60 * 1000;
export const MAX_START_RETRIES = 6;

/**
 * True when a blocked Brain run provably never started: its worker returned blocked with no receipt,
 * the nightly gate reads exactly as it did before dispatch for the same slot with nothing active
 * (a claim counts an attempt), and the primary checkout is at the same commit with the same
 * uncommitted changes. There is nothing to read back; the run is simply tried again.
 * A run with no saved mark, a receipt, or any change at the gate or checkout is not this case.
 */
export function neverStarted(run: Pick<MaintenanceRun, 'status' | 'steps' | 'gateBefore'>, now: GateMark): boolean {
    const before = run.gateBefore;
    return unstartedCandidate(run) && !now.active && now.slotDate === before!.slotDate && now.attempts === before!.attempts && now.completed === before!.completed && !!now.head && now.head === before!.head && now.changes === before!.changes;
}

/** The part of that test the run's own record decides, before the gate is read again. */
export function unstartedCandidate(run: Pick<MaintenanceRun, 'status' | 'steps' | 'gateBefore'>): boolean {
    const result = run.steps.at(-1)?.result, before = run.gateBefore;
    // A catalog refresh that stopped has its own repair follow-up and is not a run that never started.
    return run.status === 'blocked' && !!before && !before.active && !!result && run.steps.length === 1 && result.outcome === 'blocked' && result.blocker !== 'catalog-refresh-incomplete' && !result.receipts.length && !result.candidates.length;
}
