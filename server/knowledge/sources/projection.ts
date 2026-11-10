import type { EvidenceRecord } from './evidence-record';
import type { Store } from '../../store/store';
import type { KnowledgeSourceSummary } from '../../../src/contracts/knowledge-sources';
import type { SourceRegistry } from './registry';
import { IntakeLedger } from '../slack-intake/ledger';
import type { ReadTask, SourceUnit } from '../slack-intake/contracts';

export function sourceList(registry: SourceRegistry, stores: Map<string, Store>, projectId: string, after = ''): { sources: KnowledgeSourceSummary[]; next: string | null } {
    const sources = registry.all().filter(s => (s.homeProjectId === projectId || registry.authorized(s.id, projectId)) && s.id > after);
    const page = sources.slice(0, 50);
    return { sources: page.map(s => {
        const home = stores.get(s.homeProjectId), ledger = home ? new IntakeLedger(home, s) : undefined;
        const artifacts=ledger?.all<{outcome:string;warnings?:string[]}>('artifact')||[];
        const evidence=ledger?.all<EvidenceRecord>('evidence')||[];
        const tasks = ledger?.all<ReadTask>('task') || [], units = ledger?.all<SourceUnit>('unit') || [];
        const blockedUnits=ledger?.columns<{state:string}>('admission',['state']).filter(row=>row.state==='blocked').length||0;
        const blockedClassifications=ledger?.columns<{state:string}>('classification-admission',['state']).filter(row=>row.state==='blocked').length||0;
        const scanGaps=[...(blockedUnits?[`${blockedUnits} source versions withheld by secret scanning`]:[]),...(blockedClassifications?[`${blockedClassifications} generated classifications withheld by secret scanning`]:[])];
        const links=s.kind==='link'?ledger?.columns<{state:string;reason:string|null;nextAt:string|null}>('link',['state','reason','nextAt'])||[]:[];
        return { id: s.id, kind: s.kind, title: s.title, homeProjectId: s.homeProjectId, destination: s.destination, state: s.state, cadence: s.cadence, revision: s.revision,
            createdAt: s.createdAt, updatedAt: s.updatedAt, subscriptions: registry.subscriptions(s.id), workspace: s.authority?.workspace, channelId: s.authority?.channels[0].id, channelName: s.authority?.channels[0].name, url: s.url,
            pending: tasks.filter(t => t.status === 'pending' || t.status === 'running').length+links.filter(l=>l.state==='pending').length, needsAttention: tasks.filter(t => t.status === 'needs-attention').length+links.filter(l=>l.state==='needs-attention').length,
            admitted: evidence.filter(u => ledger?.get<{state:string}>('admission',`${u.unitId}:${u.version}`)?.state === 'admitted').length,
            lastObservedAt: [...units,...evidence].map(u => u.observedAt).sort().at(-1) || '',
            gaps: [...scanGaps,...(s.kind === 'slack' ? ['Pin and bookmark inventories unavailable', 'Search-dependent reply and canvas discovery', 'Binary attachments unread unless the connector supplies text'] : s.kind==='link'?['Same-host public pages only; one hop and five pages per collection','Original page bytes unavailable; versions hash admitted claims',...links.filter(l=>['deferred','needs-attention'].includes(l.state)).map(l=>l.reason||'Public page unavailable')]:artifacts.flatMap(a=>[...(a.outcome==='admitted'?[]:[`Upload outcome: ${a.outcome}`]),...(a.warnings||[])]))],
        };
    }), next: sources.length > page.length ? page.at(-1)!.id : null };
}
