import { projectPolicy } from '../office/project-policy';
import type { MaintenanceRun, OfficeSnapshot } from '../../src/shared';

const STOPPED = ['blocked', 'interrupted'];
/** A run that left its sources observed: it finished, or its effects were read back. */
const SETTLED = ['completed', 'reconciled'];

/**
 * True when a stopped daily run on a hands-off project is not a person's to act on, because the next
 * scheduled run takes it over without one (`unverified-prior-runs.ts`):
 * - a later run has already taken it over (it is listed in that run's `supersedes`), so any follow-up is
 *   that run's; or
 * - it is the latest run and the run before it settled, or there is none: one missed night.
 * A second stopped run in a row is not this, and reaches a person as one item. Weekly runs and projects
 * that are not hands-off are never this. The run keeps its status and error; only the outbox action waits.
 */
export function leftToNextRun(state: Pick<OfficeSnapshot, 'maintenance' | 'project'>, run: MaintenanceRun): boolean {
    if (!state.project || !projectPolicy(state.project).handsOff || run.weekly || !STOPPED.includes(run.status)) return false;
    const runs = [...(state.maintenance?.runs || [])].sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
    if (runs.some(other => other.supersedes?.includes(run.id))) return true;
    const at = runs.findIndex(other => other.id === run.id);
    if (at < 0 || at !== runs.length - 1) return false;
    const before = runs.slice(0, at).filter(other => !other.weekly).at(-1);
    return !before || SETTLED.includes(before.status);
}
