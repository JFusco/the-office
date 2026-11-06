import { randomUUID } from 'node:crypto';
import type { Lesson, PendingRetrospective } from '../../src/shared';
import type { Store } from '../store/store';
import type { RetrospectivePacket } from './retrospective-facts';
import type { RetrospectiveResult } from './retrospective-result';

export const RETROSPECTIVE_HISTORY = 100;
export const normalizeStatement = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Lenient, idempotent acceptance in one transaction. Duplicates and unsupported proposals are skipped,
 * never fatal: the retrospective completes and its trigger is consumed even with zero new lessons.
 */
export function acceptRetrospective(store: Store, pending: Pick<PendingRetrospective, 'id' | 'jobId' | 'key' | 'trigger'>, packet: Pick<RetrospectivePacket, 'catalog'>, result: RetrospectiveResult, attemptId: string): string[] {
    return store.transaction(() => {
        const knowledge = store.state.knowledge!;
        if (knowledge.consumed.includes(pending.id)) return [];
        const now = store.clock.now().toISOString(), seen = new Set(knowledge.lessons.map(lesson => normalizeStatement(lesson.statement))), added: Lesson[] = [];
        for (const proposal of result.lessons) {
            const statement = proposal.statement.trim(), key = normalizeStatement(statement);
            const evidence = [...new Set(proposal.evidenceIds)].filter(id => Object.hasOwn(packet.catalog, id)).map(id => packet.catalog[id]);
            if (!statement || !evidence.length || seen.has(key)) continue;
            seen.add(key);
            added.push({ id: randomUUID(), kind: proposal.kind, statement, detail: proposal.detail.trim(), stages: proposal.stages.length ? [...new Set(proposal.stages)] : ['any'], paths: proposal.paths.map(path => path.trim()).filter(Boolean), status: 'active', evidence: evidence.map(item => ({ ...item })), sourceRetrospectiveId: pending.id, createdAt: now, updatedAt: now });
        }
        knowledge.lessons.push(...added);
        knowledge.retrospectives.push({ id: pending.id, jobId: pending.jobId, key: pending.key, trigger: pending.trigger, attemptId, summary: result.summary.trim(), lessonIds: added.map(lesson => lesson.id), at: now });
        knowledge.retrospectives = knowledge.retrospectives.slice(-RETROSPECTIVE_HISTORY);
        knowledge.consumed.push(pending.id);
        knowledge.pending = knowledge.pending.filter(entry => entry.id !== pending.id);
        store.emit('retrospective-completed', `${pending.key}: Harper's ${pending.trigger} retrospective · ${added.length} new ${added.length === 1 ? 'lesson' : 'lessons'}.`, 'knowledge', pending.key);
        return added.map(lesson => lesson.id);
    });
}
