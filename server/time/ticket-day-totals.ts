import { easternDay, easternInstant } from '../office/clock';
import type { Store } from '../store/store';
import type { TimeLedgerState, WorkTime } from '../../src/shared';

export interface TicketDay { key: string; date: string; intervals: [number, number][]; ids: string[]; seconds: number }
function midnight(date: string) { return easternInstant(date).getTime(); }

/**
 * Confirmed work time per ticket and Eastern day for the selected work: segments clipped to
 * activation and disabled periods, split at midnight, and overlapping intervals merged.
 */
export function ticketDayTotals(store: Store, ledger: TimeLedgerState, include: (work: WorkTime) => boolean): Map<string, TicketDay> {
    const groups = new Map<string, {
        key: string;
        date: string;
        intervals: [
            number,
            number
        ][];
        ids: string[];
        seconds: number;
    }>();
    for (const w of store.state.workLog || []) {
        if (!include(w))
            continue;
        let segments: [
            number,
            number
        ][] = (w.segments || []).map(segment => [Date.parse(segment.startedAt), Date.parse(segment.endedAt)]);
        if (!w.segments && !['running', 'stopping'].includes(w.status) && !w.durationUncertain)
            segments = [[Date.parse(w.startedAt), Date.parse(w.startedAt) + w.elapsedMs]];
        segments = segments.map(([a, b]): [
            number,
            number
        ] => [Math.max(a, Date.parse(ledger.activatedAt), ledger.jiraActivatedAt && store.project.provider === 'azure' ? Date.parse(ledger.jiraActivatedAt) : 0), b]).filter(([a, b]) => Number.isFinite(a) && b > a);
        let start = 0, end = 0;
        for (const period of ledger.disabledPeriods || []) {
            const a = Date.parse(period.start), b = Date.parse(period.end);
            segments = segments.flatMap(([x, y]): [
                number,
                number
            ][] => b <= x || a >= y ? [[x, y]] : [...(a > x ? [[x, Math.min(y, a)] as [
                        number,
                        number
                    ]] : []), ...(b < y ? [[Math.max(x, b), y] as [
                        number,
                        number
                    ]] : [])]);
        }
        for (const segment of segments) {
            start = segment[0];
            end = segment[1];
            while (start < end) {
                const date = easternDay(start), nextDate = new Date(`${date}T12:00:00Z`);
                nextDate.setUTCDate(nextDate.getUTCDate() + 1);
                const stop = Math.min(end, midnight(nextDate.toISOString().slice(0, 10)));
                const id = `${w.ticket}:${date}`, g = groups.get(id) || { key: w.ticket, date, intervals: [], ids: [], seconds: 0 };
                g.intervals.push([start, stop]);
                g.ids.push(w.id);
                groups.set(id, g);
                start = stop;
            }
        }
    }
    for (const g of groups.values()) {
        let total = 0, end = 0;
        for (const [a, b] of g.intervals.sort((x, y) => x[0] - y[0])) {
            total += Math.max(0, b - Math.max(a, end));
            end = Math.max(end, b);
        }
        g.seconds = Math.floor(total / 1000);
    }
    return groups;
}
