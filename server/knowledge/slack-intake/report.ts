import { reconcileIntakeStatus,isStoppingFor } from './operational-status';
import { verifiedCapture } from './progress';
import { intakeProgress,terminalDeferred } from './progress';
import { sourceSeedProgress,type SourceSeedRows } from '../sources/seed-progress';
import { sourceLaunchLimit } from '../sources/seed-budget';
import type { SeedBudget } from '../sources/seed-budget';
import type { SlackSeedProgress } from '../../../src/contracts/knowledge';
import { mkdirSync, renameSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Store } from '../../store/store';
import { IntakeLedger } from './ledger';
import type { LinkRecord } from './read-links';
import { digest, privateFile } from './config';
import { collectionPolicy, type CollectionPolicy } from '../sources/collection-policy';
import type { SourceRegistry } from '../sources/registry';
import { sourceVisible } from '../sources/visibility';
import type { Proposal, ReadTask, SourceUnit } from './contracts';
export interface IntakeSummary { id: string; week: string; status: 'partial' | 'settled'; reads: number; captures: number; duplicates: number; quarantines: number; outstanding: number; coverageGaps:number; reasons: string[] }
const byWeek = <T>(rows: T[], week: (row: T) => string | undefined) => {
    const groups = new Map<string, T[]>();
    for (const row of rows) { const key = week(row); if (!key) continue; const group = groups.get(key); if (group) group.push(row); else groups.set(key, [row]); }
    return groups;
};
/** Private reports follow the intake ledger's weeks; a matching narrative rollup only receives the aggregate appendix. */
export function reconcileIntakeReports(store: Store, registry: SourceRegistry): void {
    if(store.activeClaims().some(c=>c.work.kind==='knowledge-slack-intake'&&store.state.workLog?.some(w=>isStoppingFor(w,c))))reconcileIntakeStatus(store,[],store.clock.now(),registry);
    const summaries: IntakeSummary[] = [],seeds:SlackSeedProgress[]=[];
    const program=registry.meta<SeedBudget>('seed-budget');
    const ownsProgram=program?.members.some(m=>registry.get(m.sourceId)?.homeProjectId===store.project.id);
    const imported=ownsProgram&&program?.importedCompletion?registry.meta<{summary:SlackSeedProgress}>(`legacy-seed-completion:${program.importedCompletion}`)?.summary:undefined;
    for (const source of registry.home(store.project.id).filter(s => s.kind === 'slack')) {
        const config = collectionPolicy(source), ledger = new IntakeLedger(store, source), token = `registry-seed-v2:${ledger.revision()}:${source.sourceDigest}:${sourceLaunchLimit(registry,source.id)}`;
        let report=ledger.get<{token:string;summaries:IntakeSummary[];seed?:SlackSeedProgress}>('meta','report');
        if(report?.token!==token){
            const data:SourceSeedRows={tasks:ledger.all('task'),units:ledger.all('unit'),links:ledger.all('link'),proposals:ledger.all('proposal')};
            const terminal=terminalDeferred(ledger,data.units,data.tasks),sourceSeed=imported?undefined:sourceSeedProgress(registry,ledger,config,data,terminal);
            const progress=intakeProgress(data.tasks,data.units,data.links,data.proposals,terminal),rows=writeReports(store,ledger,config,sourceSeed,data,terminal);
            report={token:`registry-seed-v2:${ledger.revision()}:${source.sourceDigest}:${sourceLaunchLimit(registry,source.id)}`,summaries:rows,seed:sourceSeed};
            ledger.put('meta','report',{...report,sourceProgress:{revision:ledger.revision(),unresolvedSources:progress.unresolvedSources}});
        }
        if(report.seed&&program?.members.some(m=>m.sourceId===source.id))seeds.push(report.seed);
        summaries.push(...report.summaries);
    }
    let changed = false;
    const seed=imported?{...imported,dailyLimit:8}:seeds.length?{status:seeds.every(s=>s.status==='complete-with-gaps')?'complete-with-gaps':seeds.some(s=>s.status==='needs-attention')?'needs-attention':'seeding',channelsTotal:seeds.length,channelsEnumerated:seeds.reduce((n,s)=>n+s.channelsEnumerated,0),pendingReads:seeds.reduce((n,s)=>n+s.pendingReads,0),pendingCaptures:seeds.reduce((n,s)=>n+s.pendingCaptures,0),unresolvedSources:seeds.reduce((n,s)=>n+s.unresolvedSources,0),coverageGaps:seeds.reduce((n,s)=>n+s.coverageGaps,0),dailyLimit:Math.max(...seeds.map(s=>s.dailyLimit)),...(seeds.every(s=>s.completedAt)?{completedAt:seeds.map(s=>s.completedAt!).sort().at(-1)}:{})} as SlackSeedProgress:undefined;
    if(!imported&&program&&seed?.status==='complete-with-gaps') {
        const member=program.members.map(m=>registry.get(m.sourceId)).find(s=>s?.homeProjectId===store.project.id);
        if(member){const ledger=new IntakeLedger(store,member),key=digest(JSON.stringify(program.members.map(m=>[m.sourceId,m.sourceDigest,new IntakeLedger(store,registry.get(m.sourceId)!).get<{seedUpperTs:string}>('channel',registry.get(m.sourceId)!.authority!.channels[0].id)?.seedUpperTs])));
            if(!ledger.get('seed-announcement',key))ledger.transaction(()=>{if(ledger.get('seed-announcement',key))return;ledger.put('seed-announcement',key,{completedAt:seed.completedAt});store.emit('slack-seed-complete',`Historical Slack seeding completed with coverage gaps. ${seed.channelsTotal} channel histories and their queued follow-ups are settled; incremental intake continues.`,'knowledge');});
        }
    }
    if(seed&&store.state.knowledge&&JSON.stringify(seed)!==JSON.stringify(store.state.knowledge.slackSeed)){store.state.knowledge.slackSeed=seed;changed=true;}

    for (const rollup of store.state.knowledge?.rollups || []) {
        const rows = summaries.filter(s => s.week === rollup.weekEnding); if (!rows.length) continue;
        const summary: IntakeSummary = { id: `intake-${rollup.weekEnding}`, week: rollup.weekEnding, status: rows.some(r=>r.status==='partial')?'partial':'settled',
            coverageGaps:0,reads: 0, captures: 0, duplicates: 0, quarantines: 0, outstanding: 0, reasons: [...new Set(rows.flatMap(s => s.reasons))] };
        for (const row of rows) for (const field of ['reads', 'captures', 'duplicates', 'quarantines', 'outstanding','coverageGaps'] as const) summary[field] += row[field];
        if (JSON.stringify(rollup.intake) !== JSON.stringify(summary)) { rollup.intake = summary; changed = true; }
    }
    if (changed) store.save();
}
function writeReports(store:Store,ledger:IntakeLedger,config:CollectionPolicy,seed:SlackSeedProgress|undefined,data:SourceSeedRows,terminal:Set<string>):IntakeSummary[] {
    const {tasks,units:allUnits,links:allLinks,proposals}=data,taskWeeks=byWeek(tasks,t=>t.week),unitWeeks=byWeek(allUnits,u=>u.week),linkWeeks=byWeek(allLinks,l=>l.week);
    const proposalTasks=byWeek(proposals,p=>p.task),summaries:IntakeSummary[]=[];
    for (const week of new Set([...taskWeeks.keys(), ...unitWeeks.keys(), ...linkWeeks.keys()])) {
        const matching = taskWeeks.get(week) || [], units = unitWeeks.get(week) || [], links = linkWeeks.get(week) || [];
        const captures = matching.flatMap(t => proposalTasks.get(t.id) || []), settled = captures.filter(verifiedCapture);
        const internal = units.flatMap(u => u.references.filter(r => r.kind === 'internal').map(r => ({ source: u.id, url: r.id })));
        const progress=intakeProgress(matching,units,links,captures,terminal),outstanding=progress.outstanding;
        const summary: IntakeSummary = { id: `intake-${week}`, week, status:outstanding?'partial':'settled',coverageGaps:progress.gaps+4, reads: matching.filter(t => t.status === 'complete').length,
            captures: settled.length, duplicates: settled.filter(p => p.receipt?.duplicate).length, quarantines: settled.filter(p => p.receipt?.status === 'quarantined').length, outstanding,
            reasons: ['search-dependent', 'channel-resource-inventory-unavailable', ...(internal.length ? ['internal-references-unread'] : []), ...(matching.some(t => t.status === 'needs-attention') || links.some(l => l.state === 'needs-attention') ? ['needs-attention'] : [])] };
        const details = { ...summary,historicalSeed:seed, channels: config.channels, windows: matching.map(t => ({ id: t.id, kind: t.kind, channel: t.channel, oldest: t.oldest, latest: t.latest, status: t.status, failures: t.failures, error: t.error })), links: links.map(link => ({ url: link.url, state: link.state, reason: link.reason, failures: link.failures || 0 })), internalReferences: internal, outcomes: units.map(u => ({ id: u.id, state: u.state, reason: u.reason, requests: u.requests })), examples: settled.filter(p => p.receipt?.status !== 'quarantined').slice(0, 5).map(p => ({ inboxId: p.receipt?.id, requestId: p.id, body: p.body })), unresolved: captures.filter(p => p.status === 'unresolved').map(p => p.id) };
        const serialized = JSON.stringify(details, null, 2), path = privateFile(store, `sources/${config.sourceId}/reports/${summary.id}.json`);
        if (ledger.get<string>('report-hash', summary.id) !== digest(serialized)) {
            mkdirSync(dirname(path), { recursive: true, mode: 0o700 }); writeFileSync(path + '.tmp', serialized, { mode: 0o600 }); renameSync(path + '.tmp', path); ledger.put('report-hash', summary.id, digest(serialized));
        }
        summaries.push(summary);
    }
    return summaries;
}
export function readIntakeReport(store: Store, id: string, registry: SourceRegistry, sourceId: string): string {
    const source = registry.get(sourceId);
    if (!source || source.homeProjectId !== store.project.id || !sourceVisible(registry, sourceId, store.project.id)) throw Error('Source report unavailable');
    if (!/^intake-\d{4}-\d{2}-\d{2}$/.test(id)) throw Error('Invalid intake report identity');
    return readFileSync(privateFile(store, `sources/${sourceId}/reports/${id}.json`), 'utf8');
}
