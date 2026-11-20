import { projectPolicy } from '../office/project-policy';
import { REOBSERVED } from './superseded';
import type { MaintenanceRun, OfficeSnapshot } from '../../src/shared';

const STOPPED = ['blocked', 'interrupted'];
/** A missed night is left alone until the next night's run is overdue: a day, and two hours for that run to start and stop. */
export const NEXT_RUN_DUE_MS = 26 * 60 * 60 * 1000;
const night = (run: MaintenanceRun) => run.requestedAt.slice(0, 10);

/**
 * True while a stopped daily run on a hands-off project is not yet a person's to act on, because the next
 * scheduled run takes it over without one (`unverified-prior-runs.ts`). Only a run whose automatic
 * read-backs are used up is considered, so a project with no automatic read-back keeps its item. Then:
 * - a later daily run stopped too: the follow-up is that later run's, which is shown, so there is one item;
 * - otherwise this is one missed night, when the night before ended in a completed run that re-observed
 *   its sources (or there was no earlier night), and the next night's run is not yet overdue.
 * A night that ended any other way, such as a run only read back, makes this the second in a row and it is
 * shown. Earlier attempts of the same night do not count as a night. Once the next run is overdue the item
 * appears whatever happened since. The run keeps its status and error; only the outbox action waits.
 */
export function leftToNextRun(state: Pick<OfficeSnapshot, 'maintenance' | 'project'>, run: MaintenanceRun, now = new Date()): boolean {
    if (!state.project || !projectPolicy(state.project).handsOff || run.weekly || !STOPPED.includes(run.status) || !run.readbackRetry?.exhausted) return false;
    const daily = (state.maintenance?.runs || []).filter(other => !other.weekly);
    if (daily.some(other => other.requestedAt > run.requestedAt && STOPPED.includes(other.status))) return true;
    if (now.getTime() - Date.parse(run.requestedAt) >= NEXT_RUN_DUE_MS) return false;
    const before = daily.filter(other => night(other) < night(run)).sort((a, b) => a.requestedAt.localeCompare(b.requestedAt)).at(-1);
    return !before || before.status === 'completed' && REOBSERVED.has(before.stage);
}
