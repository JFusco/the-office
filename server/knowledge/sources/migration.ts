import type { SeedBudget } from './seed-budget';
import type { Store } from '../../store/store';
import { processGroupAlive } from '../../workers/process';
import { IntakeLedger } from '../slack-intake/ledger';
import { configDigest, digest, readConfig, type Config } from '../slack-intake/config';
import { SourceRegistry } from './registry';
import { sourceDigest, type KnowledgeSource } from './source-record';
import type { ReadTask, SourceUnit } from '../slack-intake/contracts';

interface Cutover { state: 'preparing' | 'ready'; config?: Config; sources: Record<string, string> }
/** Restartable copy: legacy records and Effects remain intact, with their original IDs and hashes. */
export function migrateIntake(registry: SourceRegistry, brain: Store): void {
    let marker = registry.meta<Cutover>('cutover');
    if (marker?.state === 'ready') return;
    if (brain.state.workLog?.some(w => w.stage?.startsWith('knowledge-slack-') &&
        (['running', 'stopping'].includes(w.status) || w.processId && processGroupAlive(w.processId)))) throw Error('Stop the legacy intake worker before cutover');
    if (brain.activeClaims().some(c => c.work.kind === 'knowledge-slack-intake')) throw Error('Legacy intake claim still active');
    if (!marker) {
        marker = { state: 'preparing', config: readConfig(brain), sources: {} };
        registry.setMeta('cutover', marker);
    }
    const legacy = new IntakeLedger(brain), config = marker.config;
    legacy.put('cutover', 'owner', { state: 'preparing', version: 1 });
    if (config) {
        for (const channel of config.channels) {
            // create and marker cannot share a cross-database transaction; identity is the restart key.
            let source = registry.all().find(s => s.kind === 'slack' && s.authority?.workspace === config.workspace && s.authority.channels[0].id === channel.id);
            source ??= registry.create({ kind: 'slack', title: `#${channel.name}`, homeProjectId: 'brain', destination: 'technical-brain', cadence: 'weekly', domains: config.domains,
                authority: { workspace: config.workspace, appId: config.appId, channels: [channel], tools: config.tools, publicHosts: config.publicHosts } }, config.enabled ? 'active' : 'paused');
            if (source.homeProjectId !== 'brain' || source.destination !== 'technical-brain') throw Error('Legacy source ownership is ambiguous');
            if (source.sourceDigest !== sourceDigest({ ...source, domains: config.domains, authority: { workspace: config.workspace, appId: config.appId, channels: [channel], tools: config.tools, publicHosts: config.publicHosts } })) throw Error('Legacy source authority is ambiguous');
            marker.sources[channel.id] = source.id; registry.setMeta('cutover', marker);
        }
        copyRecords(legacy, registry, marker, config);
        if(!registry.meta('seed-budget')) {
            const channels=config.channels.map(c=>legacy.get<{seedUpperTs:string}>('channel',c.id));
            const key=channels.every(Boolean)?configDigestForSeed(config,channels.map(c=>c!.seedUpperTs)):undefined;
            const receipt=key?legacy.get<{summary:{completedAt?:string;status:string}}>('seed-completion',key):undefined;
            const completedAt=receipt?.summary.status==='complete-with-gaps'?receipt.summary.completedAt:undefined;
            registry.setMeta('seed-budget',{version:1,limit:config.seedLaunchesPerDay??8,members:Object.values(marker.sources).map(sourceId=>({sourceId,sourceDigest:registry.get(sourceId)!.sourceDigest,...(completedAt?{completedAt}:{})})),...(completedAt?{importedCompletion:key}:{})} satisfies SeedBudget);
        }
    }
    legacy.put('cutover', 'owner', { state: 'ready', version: 1 });
    registry.setMeta('cutover', { ...marker, state: 'ready' });
}
function copyRecords(legacy: IntakeLedger, registry: SourceRegistry, marker: Cutover, config: Config): void {
    const rows = legacy.store.db.prepare("SELECT kind,id,body FROM slack_intake WHERE instr(kind, ':')=0").all() as { kind: string; id: string; body: string }[];
    const tasks = new Map(legacy.all<ReadTask>('task').map(t => [t.id, t]));
    const units = new Map(legacy.all<SourceUnit>('unit').map(u => [`${u.id}:${u.version}`, u]));
    const originalHash = configDigest(config);
    for (const row of rows) {
        const body = JSON.parse(row.body);
        if(row.kind==='seed-completion'){registry.setMeta(`legacy-seed-completion:${row.id}`,body);continue;}
        if (row.kind === 'launches') {
            for (let i = 0; i < Number(body); i++) registry.db.prepare("INSERT OR IGNORE INTO knowledge_launches VALUES(?,?,?,'launched')").run(`legacy:${row.id}:${i}`, row.id, 'legacy');
            continue;
        }
        if (row.kind === 'backoff') { registry.db.prepare('INSERT INTO knowledge_backoff VALUES(?,?) ON CONFLICT(id) DO UPDATE SET until_at=max(until_at,excluded.until_at)').run(JSON.stringify([config.workspace, config.appId, row.id]), body); continue; }
        if (['meta', 'report-hash', 'rotation', 'cutover', 'retry-history'].includes(row.kind)) continue;
        const channel = row.kind === 'channel' || row.kind === 'identity' ? row.id
            : body.channel || tasks.get(body.task)?.channel || units.get(body.source)?.channel;
        const sourceId = marker.sources[channel];
        if (!sourceId) throw Error(`Legacy ${row.kind} record needs source reconciliation`);
        const source: KnowledgeSource = registry.get(sourceId)!;
        if (body.configHash && body.configHash !== originalHash) throw Error(`Legacy ${row.kind} authority needs reconciliation`);
        const target = new IntakeLedger(legacy.store, source);
        const migrated = { ...body, sourceId, sourceDigest: source.sourceDigest };
        // URL records retain provenance in the key, including each parent source version.
        const key = row.kind === 'link' ? JSON.stringify([body.source, body.url]) : row.id;
        target.put(row.kind, key, migrated);
    }
}

function configDigestForSeed(config:Config,uppers:string[]):string { return digest(JSON.stringify([configDigest(config),config.channels.map((c,i)=>[c.id,uppers[i]])])); }
