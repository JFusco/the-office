import { proposeImprovements, type ImprovementProposal } from './propose-improvements';
import { randomUUID } from 'node:crypto';
import type { Lesson, LessonEvidence, PendingRetrospective } from '../../src/shared';
import type { Store } from '../store/store';
import type { RetrospectivePacket } from './retrospective-facts';
import type { RetrospectiveResult } from './retrospective-result';
import { curateLesson } from './curate-lesson';
import { saveUnblockBrief } from './unblock-brief';
import { blockingTrigger } from './blocking-trigger';


export const RETROSPECTIVE_HISTORY = 100;
export const normalizeStatement = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();

type Accepted = { improvements?: ImprovementProposal[]; unblock?: RetrospectiveResult['unblock'] } & Pick<RetrospectiveResult, 'summary'> & { lessons: (Omit<RetrospectiveResult['lessons'][number], 'repositoryInstruction' | 'tier' | 'action' | 'targetId' | 'validUntil'> & { repositoryInstruction?: boolean; tier?: 'hypothesis' | 'guidance'; validUntil?: string; action?: RetrospectiveResult['lessons'][number]['action']; targetId?: string })[] };
/** A proposal to share, with the evidence the harness resolved for it; the Office proposal keeps those proofs. */
type Shared = Accepted['lessons'][number] & { evidence: LessonEvidence[] };

/**
 * Lenient, idempotent acceptance in one transaction. Duplicates and unsupported proposals are skipped,
 * never fatal: the retrospective completes and its trigger is consumed even with zero new lessons.
 */
export function acceptRetrospective(store: Store, pending: Pick<PendingRetrospective, 'id' | 'jobId' | 'key' | 'trigger'> & Partial<Pick<PendingRetrospective, 'subject' | 'createdAt' | 'source' | 'eventIds'>>, packet: Pick<RetrospectivePacket, 'catalog' | 'elsewhere'>, result: Accepted, attemptId: string, share?: (lessons: Shared[]) => void): string[] {
    const catalog = Object.fromEntries(Object.entries(packet.catalog).map(([id, proof]) => [id, { ...proof }]));
    const elsewhere = new Set((packet.elsewhere || []).map(lesson => lesson.id));
    return store.transaction(() => {
        const knowledge = store.state.knowledge!;
        if (knowledge.consumed.includes(pending.id)) return [];
        const now = store.clock.now().toISOString(), changed: string[] = [], shared: Shared[] = [];
        // An exact restatement of a project lesson (retired ones included) or an office lesson is never added again.
        const seen = new Set([...knowledge.lessons, ...(knowledge.officeLessons || [])].map(lesson => normalizeStatement(lesson.statement)));
        const github = store.project.provider === 'github';
        for (const proposal of result.lessons) {
            const statement = proposal.statement.trim(), key = normalizeStatement(statement);
            const evidence = [...new Set(proposal.evidenceIds)].filter(id => Object.hasOwn(catalog, id)).map(id => catalog[id]);
            const action = proposal.action || 'add';
            // Promotion: a confirmed hypothesis may be superseded at guidance with its wording unchanged.
            const promotes = action === 'supersede' && (proposal.tier || 'guidance') === 'guidance' && knowledge.lessons.some(lesson => lesson.id === proposal.targetId && lesson.status === 'active' && lesson.tier === 'hypothesis' && normalizeStatement(lesson.statement) === key);
            if (!statement || !evidence.length || action !== 'update' && seen.has(key) && !promotes) continue;
            const lesson: Lesson = { id: randomUUID(), scope: 'project', tier: proposal.tier || 'guidance', revision: 1, kind: proposal.kind, when: proposal.when.trim(), statement, check: proposal.check.trim(), detail: proposal.detail.trim(), stages: proposal.stages.length ? [...new Set(proposal.stages)] : ['any'], paths: proposal.paths.map(path => path.trim()).filter(Boolean), status: 'active', evidence: evidence.map(item => ({ ...item })), sourceSubject: pending.source || { kind: pending.subject || 'job', id: pending.jobId }, sourceRetrospectiveId: pending.id,
                ...(github && proposal.repositoryInstruction ? { repositoryInstruction: { status: 'proposed' as const } } : {}), ...(proposal.validUntil ? { validUntil: proposal.validUntil } : {}), createdAt: now, updatedAt: now };
            const outcome = curateLesson(knowledge, lesson, action, proposal.targetId || '', elsewhere, now);
            if (outcome === 'skipped') continue;
            seen.add(key);
            if (outcome === 'shared') shared.push({ ...proposal, evidence: lesson.evidence });
            else changed.push(outcome === 'updated' ? proposal.targetId! : lesson.id);
        }
        if (result.unblock && blockingTrigger(pending)) saveUnblockBrief(knowledge, { kind: pending.subject || 'job', id: pending.jobId }, { ...result.unblock, at: now, retrospectiveId: pending.id });
        proposeImprovements(store, pending.source || { kind: pending.subject || 'job', id: pending.jobId }, result.improvements || [], catalog);
        // Filed before completion: a failed filing rolls this acceptance back to retry, and Office proposals deduplicate.
        if (shared.length) share?.(shared);
        knowledge.retrospectives.push({ source: pending.source, eventIds: pending.eventIds, id: pending.id, jobId: pending.jobId, key: pending.key, trigger: pending.trigger, subject: pending.subject || 'job', eventAt: pending.createdAt, attemptId, summary: result.summary.trim(), lessonIds: changed, at: now });
        knowledge.retrospectives = knowledge.retrospectives.slice(-RETROSPECTIVE_HISTORY);
        knowledge.consumed.push(pending.id);
        knowledge.pending = knowledge.pending.filter(entry => entry.id !== pending.id);
        store.emit('retrospective-completed', `${pending.key}: Harper's ${pending.trigger} retrospective · ${changed.length} ${changed.length === 1 ? 'lesson' : 'lessons'} added or changed${shared.length ? `, ${shared.length} proposed office-wide` : ''}.`, 'knowledge', pending.key);
        return changed;
    });
}
