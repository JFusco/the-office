import type { DailyCTOReport } from '../../src/shared';
import type { ControlStore } from '../store/control-store';
import { reviewWeekday } from './daily-review-schedule';

/** A report's status as last read, at the revision it was read at. */
export type SeenReports = Map<string, { revision: number; status: DailyCTOReport['status'] }>;

const WAITING: DailyCTOReport['status'][] = ['queued', 'recovery-queued', 'assessed'];

/**
 * The daily report waiting for Avery: the oldest of the newest 100 that is queued on a review weekday, queued
 * for recovery, or assessed and not yet applied.
 *
 * A report's row changes only with its revision (`ControlStore.enqueue`, `ControlStore.update`), so `seen`
 * remembers each report's status by revision and a body, half a megabyte each, is read only when its revision
 * is new. With nothing waiting, no body is read.
 */
export function waitingReport(control: ControlStore, seen: SeenReports): DailyCTOReport | undefined {
    const rows = control.revisions(100).reverse();
    const listed = new Set(rows.map(row => row.id));
    for (const id of seen.keys()) if (!listed.has(id)) seen.delete(id);
    for (const row of rows) {
        let known = seen.get(row.id);
        if (known?.revision !== row.revision) {
            const report = control.get(row.id);
            if (!report) continue;
            known = { revision: report.revision, status: report.status };
            seen.set(row.id, known);
        }
        if (WAITING.includes(known.status) && (known.status !== 'queued' || reviewWeekday(row.date))) return control.get(row.id);
    }
    return undefined;
}
