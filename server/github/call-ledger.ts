import { noCalls, type CallCounts } from './call-outcome';
import type { GitHubSource } from './call-scope';

const HOUR = 60 * 60_000;
type Entry = { at: number; project: string; source: GitHubSource; family: string; counts: CallCounts; principal: string };
type Sources = Map<GitHubSource, { counts: CallCounts; families: Map<string, CallCounts> }>;

function add(total: CallCounts, counts: CallCounts) { for (const key of Object.keys(total) as (keyof CallCounts)[]) total[key] += counts[key]; }
const busiest = <T extends { invocations: number }>(rows: T[], name: (row: T) => string) => rows.sort((a, b) => b.invocations - a.invocations || name(a).localeCompare(name(b)));

function addSource(sources: Sources, { source, family, counts }: Entry) {
    const row = sources.get(source) ?? { counts: noCalls(), families: new Map<string, CallCounts>() };
    sources.set(source, row);
    const familyCounts = row.families.get(family) ?? noCalls();
    row.families.set(family, familyCounts);
    add(row.counts, counts);
    add(familyCounts, counts);
}

function sourceRows(sources: Sources) {
    return busiest([...sources].map(([source, { counts, families }]) => ({
        source, ...counts,
        families: busiest([...families].map(([family, counts]) => ({ family, ...counts })), row => row.family),
    })), row => row.source);
}

/**
 * One Office instance's GitHub calls over a rolling hour, by fixed source and endpoint-family labels. Memory only:
 * a restart starts a new ledger, and the report says how much of the hour it covers.
 */
export class CallLedger {
    private entries: Entry[] = [];
    readonly startedAt: number;
    constructor(private now = () => Date.now(), private windowMs = HOUR) { this.startedAt = now(); }
    /** `principal` is who made the call: `operator`, or `app:<installation id>` across every repository of that installation. */
    record(source: GitHubSource, family: string, counts: CallCounts, project = 'office', principal = 'operator') {
        const at = this.now();
        this.expire(at);
        this.entries.push({ at, project, source, family, counts, principal });
    }
    private expire(at: number) {
        const kept = this.entries.findIndex(entry => entry.at > at - this.windowMs);
        this.entries.splice(0, kept === -1 ? this.entries.length : kept);
    }
    report() {
        const to = this.now();
        this.expire(to);
        const from = Math.max(this.startedAt, to - this.windowMs), totals = noCalls(), sources: Sources = new Map();
        const projects = new Map<string, { counts: CallCounts; sources: Sources }>();
        const principals = new Map<string, { counts: CallCounts; projects: Map<string, CallCounts> }>();
        for (const entry of this.entries) {
            const principal = principals.get(entry.principal) ?? { counts: noCalls(), projects: new Map<string, CallCounts>() };
            principals.set(entry.principal, principal);
            add(principal.counts, entry.counts);
            const byProject = principal.projects.get(entry.project) ?? noCalls();
            principal.projects.set(entry.project, byProject);
            add(byProject, entry.counts);
            const project = projects.get(entry.project) ?? { counts: noCalls(), sources: new Map() };
            projects.set(entry.project, project);
            add(totals, entry.counts);
            add(project.counts, entry.counts);
            addSource(sources, entry);
            addSource(project.sources, entry);
        }
        return {
            collectingSince: new Date(this.startedAt).toISOString(),
            window: { from: new Date(from).toISOString(), to: new Date(to).toISOString(), coveredMinutes: Math.floor((to - from) / 60_000), complete: this.startedAt <= to - this.windowMs },
            totals, sources: sourceRows(sources),
            projects: busiest([...projects].map(([project, row]) => ({ project, ...row.counts, sources: sourceRows(row.sources) })), row => row.project),
            // Added detail: the same calls by the principal that made them. The totals above are unchanged.
            principals: busiest([...principals].map(([principal, row]) => ({ principal, ...row.counts,
                projects: busiest([...row.projects].map(([project, counts]) => ({ project, ...counts })), item => item.project) })), row => row.principal),
        };
    }
}
