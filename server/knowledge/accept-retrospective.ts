import { randomUUID } from 'node:crypto';
import type { Lesson, PendingRetrospective } from '../../src/shared';
import type { Store } from '../store/store';
import type { RetrospectivePacket } from './retrospective-facts';
import type { RetrospectiveResult } from './retrospective-result';

export const RETROSPECTIVE_HISTORY = 100;
export const normalizeStatement = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();

type Accepted = Pick<RetrospectiveResult, 'summary'> & { lessons: (Omit<RetrospectiveResult['lessons'][number], 'repositoryInstruction'> & { repositoryInstruction?: boolean })[]; recurrences?: RetrospectiveResult['recurrences'] };

/**
 * Lenient, idempotent acceptance in one transaction. Duplicates and unsupported proposals are skipped,
 * never fatal: the retrospective completes and its trigger is consumed even with zero new lessons.
 */
export function acceptRetrospective(store: Store, pending: Pick<PendingRetrospective, 'id' | 'jobId' | 'key' | 'trigger'> & Partial<Pick<PendingRetrospective, 'subject' | 'createdAt'>>, packet: Pick<RetrospectivePacket, 'catalog'>, result: Accepted, attemptId: string): string[] {
    return store.transaction(() => {
        const knowledge = store.state.knowledge!;
        if (knowledge.consumed.includes(pending.id)) return [];
        const now = store.clock.now().toISOString(), seen = new Set(knowledge.lessons.map(lesson => normalizeStatement(lesson.statement))), added: Lesson[] = [];
        const github = store.project.provider === 'github';
        for (const proposal of result.lessons) {
            const statement = proposal.statement.trim(), key = normalizeStatement(statement);
            const evidence = [...new Set(proposal.evidenceIds)].filter(id => Object.hasOwn(packet.catalog, id)).map(id => packet.catalog[id]);
            if (!statement || !evidence.length || seen.has(key)) continue;
            seen.add(key);
            added.push({ id: randomUUID(), scope: 'project', kind: proposal.kind, statement, detail: proposal.detail.trim(), stages: proposal.stages.length ? [...new Set(proposal.stages)] : ['any'], paths: proposal.paths.map(path => path.trim()).filter(Boolean), status: 'active', evidence: evidence.map(item => ({ ...item })), sourceRetrospectiveId: pending.id, recurrences: [],
                ...(github && proposal.repositoryInstruction ? { repositoryInstruction: { status: 'proposed' as const } } : {}), createdAt: now, updatedAt: now });
        }
        // A recurrence counts once per job or run, and never on the job the lesson was learned from.
        for (const recurrence of result.recurrences || []) {
            const lesson = knowledge.lessons.find(item => item.id === recurrence.lessonId && item.status === 'active');
            if (!lesson || lesson.sourceRetrospectiveId.split(':')[0] === pending.jobId || lesson.recurrences.some(item => item.subjectId === pending.jobId)) continue;
            lesson.recurrences.push({ retrospectiveId: pending.id, subjectId: pending.jobId, detail: recurrence.detail.trim().slice(0, 300), at: now });
            lesson.updatedAt = now;
        }
        knowledge.lessons.push(...added);
        knowledge.retrospectives.push({ id: pending.id, jobId: pending.jobId, key: pending.key, trigger: pending.trigger, subject: pending.subject || 'job', eventAt: pending.createdAt, attemptId, summary: result.summary.trim(), lessonIds: added.map(lesson => lesson.id), at: now });
        knowledge.retrospectives = knowledge.retrospectives.slice(-RETROSPECTIVE_HISTORY);
        knowledge.consumed.push(pending.id);
        knowledge.pending = knowledge.pending.filter(entry => entry.id !== pending.id);
        store.emit('retrospective-completed', `${pending.key}: Harper's ${pending.trigger} retrospective · ${added.length} new ${added.length === 1 ? 'lesson' : 'lessons'}.`, 'knowledge', pending.key);
        return added.map(lesson => lesson.id);
    });
}
