import { archiveHistory, archiveMonth } from '../store/history-archive';
import type { ITReport } from '../../src/shared';

/** Reports kept in live state. The readers use the latest one, three or four; the rest is history. */
export const RETAINED_REPORTS = 50;

/**
 * Moves Ellis's older reports out of live state into the project's monthly archive, oldest first. Every
 * save writes the whole state, and these reports were a quarter of it with nothing reading past the
 * latest few. A report is removed only after its archive write is confirmed; if the write fails nothing
 * changes and the next report tries again. Returns how many were archived.
 */
export function archiveOldReports(dataRoot: string, reports: ITReport[], now: Date, retained = RETAINED_REPORTS): number {
    const count = reports.length - retained;
    if (count <= 0) return 0;
    const older = reports.slice(0, count), months = new Map<string, ITReport[]>();
    for (const report of older) {
        const month = archiveMonth(report.at, now);
        months.set(month, [...months.get(month) || [], report]);
    }
    try { for (const [month, batch] of months) archiveHistory(dataRoot, 'it-reports', month, batch); }
    catch { return 0; }
    reports.splice(0, count);
    return count;
}
