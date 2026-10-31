import { easternDay, easternInstant } from './clock';
import type { Store } from './store';
import type { TimeEntry } from '../src/shared';
export function timeLedger(store: Store) { return store.state.coordination!.time ??= { enabled: true, githubField: true, activatedAt: store.clock.now().toISOString(), entries: [], baselines: {} }; }
function midnight(date: string) { return easternInstant(date).getTime(); }
export function captureTime(store: Store) {
    const ledger = timeLedger(store);
    if (!ledger.enabled)
        return;
    const groups = new Map<string, {
        key: string;
        date: string;
        intervals: [
            number,
            number
        ][];
        ids: string[];
        seconds?: number;
    }>();
    for (const w of store.state.workLog || []) {
        if (!w.ticket || w.effortKind === 'administrative' || w.stage.startsWith('slack-') || ['transition', 'readback', 'maintenance-readback'].includes(w.stage))
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
                const id = `${w.ticket}:${date}`, g = groups.get(id) || { key: w.ticket, date, intervals: [], ids: [] };
                g.intervals.push([start, stop]);
                g.ids.push(w.id);
                groups.set(id, g);
                start = stop;
            }
        }
    }
    for (const [id, g] of groups) {
        const sorted = g.intervals.sort((a, b) => a[0] - b[0]);
        let total = 0, end = 0;
        for (const [a, b] of sorted) {
            total += Math.max(0, b - Math.max(a, end));
            end = Math.max(end, b);
        }
        const seconds = Math.floor(total / 1000);
        g.seconds = seconds;
        const old = ledger.entries.find(e => e.id === id);
        if (seconds < 1 || old && seconds === old.seconds && old.status !== 'excluded')
            continue;
        // Uncertain/posting effects must be reconciled before a newer total is sent.
        if (old && ['posting', 'uncertain'].includes(old.status))
            continue;
        const next: TimeEntry = { id, revision: (old?.revision || 0) + 1, worklogId: old?.worklogId, key: g.key, date: g.date, seconds, sourceIds: [...new Set(g.ids)], status: 'pending', detail: store.project.provider === 'github' ? 'Pending board hours sync.' : 'Pending prospective Jira worklog activation; not submitted.', url: old?.url || '' };
        if (old)
            Object.assign(old, next);
        else
            ledger.entries.push(next);
    }
    if (store.project.provider === 'azure' && ledger.jiraActivatedAt)
        for (const entry of ledger.entries) {
            if (!['pending', 'excluded'].includes(entry.status) || (groups.get(entry.id)?.seconds || 0) > 0)
                continue;
            const attempted = ledger.publications?.some(publication => publication.covered.some(covered => covered.id === entry.id) && publication.status !== 'prepared');
            if (attempted || entry.worklogId) {
                entry.status = 'uncertain';
                entry.detail = 'Previously published effort has no confirmed intervals after activation; preserve the original worklog and reconcile the measurement.';
            }
            else {
                entry.status = 'excluded';
                entry.detail = 'No confirmed effort after prospective Jira activation; no worklog submitted. Original worker measurements remain in session history.';
            }
        }
    store.save();
}
