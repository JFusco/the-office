import { mkdirSync, renameSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Store } from '../../store/store';
import { IntakeLedger } from './ledger';
import type { LinkRecord } from './read-links';
import { configDigest, digest, privateFile, readConfig, type Config } from './config';
import type { Proposal, ReadTask, SourceUnit } from './contracts';
export interface IntakeSummary { id: string; week: string; status: 'partial' | 'settled'; reads: number; captures: number; duplicates: number; quarantines: number; outstanding: number; reasons: string[] }
const byWeek = <T>(rows: T[], week: (row: T) => string | undefined) => {
    const groups = new Map<string, T[]>();
    for (const row of rows) { const key = week(row); if (!key) continue; const group = groups.get(key); if (group) group.push(row); else groups.set(key, [row]); }
    return groups;
};
/** Private reports follow the intake ledger's weeks; a matching narrative rollup only receives the aggregate appendix. */
export function reconcileIntakeReports(store: Store): void {
    const config = readConfig(store); if (!config) return;
    const ledger = new IntakeLedger(store), token = `${ledger.revision()}:${configDigest(config)}`;
    // Full rescans run only after an effective ledger write; rollups that appear later still receive the cached aggregates.
    const cached = ledger.get<{ token: string; summaries: IntakeSummary[] }>('meta', 'report');
    const summaries = cached?.token === token ? cached.summaries : writeReports(store, ledger, config);
    if (cached?.token !== token) ledger.put('meta', 'report', { token, summaries });
    let changed = false;
    for (const summary of summaries)
        for (const rollup of store.state.knowledge?.rollups || [])
            if (rollup.weekEnding === summary.week && JSON.stringify(rollup.intake) !== JSON.stringify(summary)) { rollup.intake = summary; changed = true; }
    if (changed) store.save();
}
function writeReports(store: Store, ledger: IntakeLedger, config: Config): IntakeSummary[] {
    const tasks = ledger.all<ReadTask>('task'), proposals = ledger.all<Proposal>('proposal');
    const taskWeeks = byWeek(tasks, t => t.week), unitWeeks = byWeek(ledger.all<SourceUnit>('unit'), u => u.week), linkWeeks = byWeek(ledger.all<LinkRecord>('link'), l => l.week);
    const proposalTasks = byWeek(proposals, p => p.task), summaries: IntakeSummary[] = [];
    for (const week of new Set([...taskWeeks.keys(), ...unitWeeks.keys(), ...linkWeeks.keys()])) {
        const matching = taskWeeks.get(week) || [], units = unitWeeks.get(week) || [], links = linkWeeks.get(week) || [];
        const captures = matching.flatMap(t => proposalTasks.get(t.id) || []), settled = captures.filter(p => p.status === 'captured');
        const internal = units.flatMap(u => u.references.filter(r => r.kind === 'internal').map(r => ({ source: u.id, url: r.id })));
        const outstanding = units.filter(u => ['deferred', 'inaccessible', 'error'].includes(u.state)).length + links.filter(link => link.state !== 'read').length + matching.filter(t => t.status !== 'complete').length + captures.filter(p => p.status === 'pending' || p.status === 'unresolved').length;
        const summary: IntakeSummary = { id: `intake-${week}`, week, status: 'partial', reads: matching.filter(t => t.status === 'complete').length,
            captures: settled.length, duplicates: settled.filter(p => p.receipt?.duplicate).length, quarantines: settled.filter(p => p.receipt?.status === 'quarantined').length, outstanding,
            reasons: ['search-dependent', 'channel-resource-inventory-unavailable', ...(internal.length ? ['internal-references-unread'] : []), ...(matching.some(t => t.status === 'needs-attention') || links.some(l => l.state === 'needs-attention') ? ['needs-attention'] : [])] };
        const details = { ...summary, channels: config.channels, windows: matching.map(t => ({ id: t.id, kind: t.kind, channel: t.channel, oldest: t.oldest, latest: t.latest, status: t.status, failures: t.failures, error: t.error })), links: links.map(link => ({ url: link.url, state: link.state, reason: link.reason, failures: link.failures || 0 })), internalReferences: internal, outcomes: units.map(u => ({ id: u.id, state: u.state, reason: u.reason, requests: u.requests })), examples: settled.filter(p => p.receipt?.status !== 'quarantined').slice(0, 5).map(p => ({ inboxId: p.receipt?.id, requestId: p.id, body: p.body })), unresolved: captures.filter(p => p.status === 'unresolved').map(p => p.id) };
        const serialized = JSON.stringify(details, null, 2), path = privateFile(store, `reports/${summary.id}.json`);
        if (ledger.get<string>('report-hash', summary.id) !== digest(serialized)) {
            mkdirSync(dirname(path), { recursive: true, mode: 0o700 }); writeFileSync(path + '.tmp', serialized, { mode: 0o600 }); renameSync(path + '.tmp', path); ledger.put('report-hash', summary.id, digest(serialized));
        }
        summaries.push(summary);
    }
    return summaries;
}
export function readIntakeReport(store: Store, id: string): string {
    if (!/^intake-\d{4}-\d{2}-\d{2}$/.test(id)) throw Error('Invalid intake report identity');
    return readFileSync(privateFile(store, `reports/${id}.json`), 'utf8');
}
