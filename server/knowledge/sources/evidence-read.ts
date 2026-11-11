import type { KnowledgeContext } from '../context';
import { SourceLedger } from './ledger';
import type { EvidenceRecord } from './evidence-record';
import { sourceVisible } from './visibility';
export function evidenceRecords(context: KnowledgeContext, project: string): EvidenceRecord[] {
    return context.registry.all().filter(s => sourceVisible(context.registry, s.id, project)).flatMap(source => {
        const home = context.stores.get(source.homeProjectId); if (!home) return [];
        const ledger = new SourceLedger(home, source);
        return ledger.all<EvidenceRecord>('evidence').filter(record => record.sourceId === source.id && ledger.get<{ state: string }>('admission', `${record.unitId}:${record.version}`)?.state === 'admitted').map(record=>({...record,admittedAt:record.admittedAt||ledger.get<{at?:string}>('admission',`${record.unitId}:${record.version}`)?.at}));
    });
}
export function evidenceRead(context: KnowledgeContext, project: string, id: string): EvidenceRecord | undefined {
    if (!/^source:[a-f0-9]{64}$/.test(id)) return;
    for (const source of context.registry.all()) {
        if (!sourceVisible(context.registry, source.id, project)) continue;
        const home = context.stores.get(source.homeProjectId); if (!home) continue;
        const ledger = new SourceLedger(home, source), record = ledger.get<EvidenceRecord>('evidence', id);
        if (record?.sourceId === source.id && ledger.get<{ state: string }>('admission', `${record.unitId}:${record.version}`)?.state === 'admitted') return record;
    }
}
