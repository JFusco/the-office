import type { MaintenanceRun, OfficeSnapshot } from '../../src/shared';

const SETTLED = ['cancelled', 'completed'];
type Skipped = NonNullable<MaintenanceRun['skippedCandidates']>[number];

/** Why delivery, not maintenance, owns this issue: a configured hold or an unsettled delivery job. Empty when maintenance may proceed. */
export function candidateOwner(state: Pick<OfficeSnapshot, 'coordination'>, holds: Record<string, string>, issue: number): string {
    if (!issue) return '';
    const key = `GH-${issue}`;
    if (holds[key]) return `${key} is held: ${holds[key]}`;
    const job = state.coordination?.jobs?.find(j => j.key === key && !SETTLED.includes(j.status));
    return job ? `${key} is owned by delivery job ${job.id} (${job.status} at ${job.stage})` : '';
}

/**
 * Decides once per run whether to skip a candidate at one checkpoint, so a resumed run replays the same step sequence.
 * A decision is keyed by the candidate's position and checkpoint. Ownership is checked only when no later step is saved
 * (fresh); a recorded skip always holds for that same position and checkpoint.
 */
export function skipOwnedCandidate(run: Pick<MaintenanceRun, 'skippedCandidates'>, slot: Pick<Skipped, 'index' | 'checkpoint'>, issue: number, fresh: boolean, owner: () => string, at = new Date().toISOString()): { reason: string; added: boolean } {
    const recorded = run.skippedCandidates?.find(s => s.index === slot.index && s.checkpoint === slot.checkpoint);
    if (recorded) return { reason: recorded.reason, added: false };
    if (!fresh || !issue) return { reason: '', added: false };
    const reason = owner();
    if (reason) (run.skippedCandidates ??= []).push({ ...slot, issue, reason, at });
    return { reason, added: !!reason };
}

export function skippedCandidateLedger(ledger: string, issue: number, reason: string, date: string): string {
    const kept = ledger.trimEnd();
    return `${kept}${kept ? '\n' : ''}SKIPPED CANDIDATE #${issue} (maintenance ${date}): ${reason}`;
}
