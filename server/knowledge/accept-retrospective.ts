import { proposeImprovements, type ImprovementProposal } from './propose-improvements';
import { randomUUID } from 'node:crypto';
import type { Lesson, PendingRetrospective } from '../../src/shared';
import type { Store } from '../store/store';
import type { RetrospectivePacket } from './retrospective-facts';
import type { RetrospectiveResult } from './retrospective-result';
import { catalogBindings, proofBindings } from './sources/proof-scope';
import { checkedReceipt, type ScanReceipt } from './sources/admission';

export const RETROSPECTIVE_HISTORY = 100;
export const normalizeStatement = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();

type Accepted = { improvements?: ImprovementProposal[] } & Pick<RetrospectiveResult, 'summary'> & { lessons: (Omit<RetrospectiveResult['lessons'][number], 'repositoryInstruction' | 'tier'> & { repositoryInstruction?: boolean; tier?: 'hypothesis' | 'guidance' })[] };

/**
 * Lenient, idempotent acceptance in one transaction. Duplicates and unsupported proposals are skipped,
 * never fatal: the retrospective completes and its trigger is consumed even with zero new lessons.
 */
export function acceptRetrospective(store: Store, pending: Pick<PendingRetrospective, 'id' | 'jobId' | 'key' | 'trigger'> & Partial<Pick<PendingRetrospective, 'subject' | 'createdAt' | 'source' | 'eventIds'>>, packet: Pick<RetrospectivePacket, 'catalog'>, result: Accepted, attemptId: string, scan?: import('zod').infer<typeof ScanReceipt>): string[] {
    const bindings = catalogBindings(packet.catalog);
    if (bindings.length && (!scan || !checkedReceipt(JSON.stringify(result), scan).clean)) throw Error('Generated learning requires a clean bound scan receipt');
    const catalog = Object.fromEntries(Object.entries(packet.catalog).map(([id, proof]) => [id, proofBindings(proof).length ? { ...proof, detail: 'Scoped evidence; exact excerpt retained in the private review packet' } : { ...proof }]));
    return store.transaction(() => {
        const knowledge = store.state.knowledge!;
        if (knowledge.consumed.includes(pending.id)) return [];
        const now = store.clock.now().toISOString(), seen = new Set(knowledge.lessons.map(lesson => normalizeStatement(lesson.statement))), added: Lesson[] = [];
        const sourceOnly=pending.source?.kind==='source'||pending.subject==='source';
        const github = store.project.provider === 'github'&&!sourceOnly;
        for (const proposal of result.lessons) {
            if(sourceOnly&&proposal.evidenceIds.some(id=>!Object.hasOwn(catalog,id)))continue;
            const statement = proposal.statement.trim(), key = normalizeStatement(statement);
            const evidence = [...new Set(proposal.evidenceIds)].filter(id => Object.hasOwn(catalog, id)).map(id => catalog[id]);
            if (!statement || !evidence.length || sourceOnly&&!evidence.some(p=>p.kind==='source') || seen.has(key)) continue;
            seen.add(key);
            added.push({ id: randomUUID(), scope: 'project', tier: proposal.tier || 'guidance', revision: 1, kind: proposal.kind, when: proposal.when.trim(), statement, check: proposal.check.trim(), detail: proposal.detail.trim(), stages: proposal.stages.length ? [...new Set(proposal.stages)] : ['any'], paths: proposal.paths.map(path => path.trim()).filter(Boolean), status: 'active', evidence: evidence.map(item => proofBindings(item).length?{...item,detail:'Scoped evidence; exact excerpt retained in the private review packet'}:{ ...item }), sourceSubject: pending.source || { kind: pending.subject || 'job', id: pending.jobId }, sourceRetrospectiveId: pending.id,
                ...(github && proposal.repositoryInstruction ? { repositoryInstruction: { status: 'proposed' as const } } : {}), createdAt: now, updatedAt: now });
        }
        if(!sourceOnly)proposeImprovements(store, pending.source || { kind: pending.subject || 'job', id: pending.jobId }, result.improvements || [], catalog);
        knowledge.lessons.push(...added);
        knowledge.retrospectives.push({ sourceBindings: bindings.length ? bindings : undefined, source: pending.source, eventIds: pending.eventIds, id: pending.id, jobId: pending.jobId, key: pending.key, trigger: pending.trigger, subject: pending.subject || 'job', eventAt: pending.createdAt, attemptId, summary: result.summary.trim(), lessonIds: added.map(lesson => lesson.id), at: now });
        knowledge.retrospectives = knowledge.retrospectives.slice(-RETROSPECTIVE_HISTORY);
        knowledge.consumed.push(pending.id);
        knowledge.pending = knowledge.pending.filter(entry => entry.id !== pending.id);
        store.emit('retrospective-completed', `${pending.key}: Harper's ${pending.trigger} retrospective · ${added.length} new ${added.length === 1 ? 'lesson' : 'lessons'}.`, 'knowledge', pending.key);
        return added.map(lesson => lesson.id);
    });
}
