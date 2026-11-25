import { noCalls, type CallCounts } from './call-outcome';
import type { GitHubSource } from './call-scope';

const HOUR = 60 * 60_000;
type Entry = { at: number; source: GitHubSource; family: string; counts: CallCounts };
type Row<T> = T & CallCounts;

function add(total: CallCounts, counts: CallCounts) { for (const key of Object.keys(total) as (keyof CallCounts)[]) total[key] += counts[key]; }
const busiest = <T extends { invocations: number }>(rows: T[], name: (row: T) => string) => rows.sort((a, b) => b.invocations - a.invocations || name(a).localeCompare(name(b)));

/**
 * One Office instance's GitHub calls over a rolling hour, by fixed source and endpoint-family labels. Memory only:
 * a restart starts a new ledger, and the report says how much of the hour it covers.
 */
export class CallLedger {
    private entries: Entry[] = [];
    readonly startedAt: number;
    constructor(private now = () => Date.now(), private windowMs = HOUR) { this.startedAt = now(); }
    record(source: GitHubSource, family: string, counts: CallCounts) {
        const at = this.now();
        this.expire(at);
        this.entries.push({ at, source, family, counts });
    }
    private expire(at: number) {
        const kept = this.entries.findIndex(entry => entry.at > at - this.windowMs);
        this.entries.splice(0, kept === -1 ? this.entries.length : kept);
    }
    report() {
        const to = this.now();
        this.expire(to);
        const from = Math.max(this.startedAt, to - this.windowMs), totals = noCalls(), sources = new Map<GitHubSource, { counts: CallCounts; families: Map<string, CallCounts> }>();
        for (const { source, family, counts } of this.entries) {
            const row = sources.get(source) ?? { counts: noCalls(), families: new Map() };
            sources.set(source, row);
            const familyRow = row.families.get(family) ?? noCalls();
            row.families.set(family, familyRow);
            add(totals, counts); add(row.counts, counts); add(familyRow, counts);
        }
        const bySource: Row<{ source: GitHubSource; families: Row<{ family: string }>[] }>[] = [...sources].map(([source, row]) => ({ source, ...row.counts, families: busiest([...row.families].map(([family, counts]) => ({ family, ...counts })), row => row.family) }));
        return {
            collectingSince: new Date(this.startedAt).toISOString(),
            window: { from: new Date(from).toISOString(), to: new Date(to).toISOString(), coveredMinutes: Math.floor((to - from) / 60_000), complete: this.startedAt <= to - this.windowMs },
            totals, sources: busiest(bySource, row => row.source),
        };
    }
}
