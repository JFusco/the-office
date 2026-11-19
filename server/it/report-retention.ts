import { archiveByMonth, archiveMonth } from '../store/history-archive';
import type { ITReport } from '../../src/shared';

/** Reports kept in live state. The readers use the latest one, three or four; the rest is history. */
export const RETAINED_REPORTS = 50;

/**
 * Moves Ellis's older reports out of live state into the project's monthly archive, oldest first. Every
 * save writes the whole state, and these reports were a quarter of it with nothing reading past the
 * latest few. A report is removed only after its archive write is confirmed, a month at a time; if a
 * write fails the reports not yet archived stay, and the next report tries again. Returns how many were
 * archived.
 */
export function archiveOldReports(dataRoot: string, reports: ITReport[], now: Date, retained = RETAINED_REPORTS): number {
    const count = reports.length - retained;
    if (count <= 0) return 0;
    // Oldest first, so each confirmed month is the front of the list.
    return archiveByMonth(dataRoot, 'it-reports', reports.slice(0, count), report => archiveMonth(report.at, now), batch => {
        const done = new Set(batch);
        for (let index = reports.length - 1; index >= 0; index--) if (done.has(reports[index])) reports.splice(index, 1);
    });
}
