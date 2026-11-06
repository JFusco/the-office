import { randomUUID } from 'node:crypto';
import type { Lesson, OfficeKnowledge } from '../../src/shared';
import type { Store } from '../store/store';
import { normalizeStatement } from './accept-retrospective';
import type { RollupResult } from './retrospective-result';

/** The control store surface this module needs; tests pass an in-memory stand-in. */
export interface OfficeKnowledgeStore {
    knowledge(): OfficeKnowledge;
    updateKnowledge<T>(mutate: (knowledge: OfficeKnowledge) => T): T;
    clock: { now(): Date };
}
const DECLINED_RETENTION = 90 * 86400000;

/** Harper proposes; Joe decides. Duplicates of any open proposal or office lesson are skipped. */
export function proposeOfficeLessons(control: OfficeKnowledgeStore, projectId: string, rollupId: string, proposals: RollupResult['officeProposals']): string[] {
    return control.updateKnowledge(knowledge => {
        const now = control.clock.now(), seen = new Set([...knowledge.lessons.filter(lesson => lesson.status !== 'retired'), ...knowledge.proposals.filter(proposal => proposal.status !== 'declined')].map(item => normalizeStatement(item.statement)));
        knowledge.proposals = knowledge.proposals.filter(proposal => proposal.status !== 'declined' || now.getTime() - Date.parse(proposal.decidedAt || proposal.createdAt) < DECLINED_RETENTION);
        const ids: string[] = [];
        for (const proposal of proposals) {
            const key = normalizeStatement(proposal.statement);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            const id = randomUUID();
            knowledge.proposals.push({ id, projectId, rollupId, kind: proposal.kind, statement: proposal.statement.trim(), detail: proposal.detail.trim(), stages: proposal.stages.length ? [...new Set(proposal.stages)] : ['any'], status: 'proposed', createdAt: now.toISOString() });
            ids.push(id);
        }
        return ids;
    });
}

/** Accepting turns the proposal into an active office lesson that every project's prompts include. */
export function decideOfficeProposal(control: OfficeKnowledgeStore, proposalId: unknown, accept: boolean): void {
    if (typeof proposalId !== 'string' || !proposalId) throw new Error('Proposal ID is required');
    control.updateKnowledge(knowledge => {
        const proposal = knowledge.proposals.find(item => item.id === proposalId);
        if (!proposal) throw new Error('Office proposal not found');
        if (proposal.status !== 'proposed') return;
        const now = control.clock.now().toISOString();
        proposal.status = accept ? 'accepted' : 'declined';
        proposal.decidedAt = now;
        if (accept) knowledge.lessons.push({ id: proposal.id, scope: 'office', kind: proposal.kind, statement: proposal.statement, detail: proposal.detail, stages: proposal.stages, paths: [], status: 'active',
            evidence: [{ kind: 'rollup', ref: `${proposal.projectId}:${proposal.rollupId}`, url: '', detail: `Proposed by Harper from ${proposal.projectId}, ${proposal.rollupId.replace('rollup:', 'week ending ')}` }],
            sourceRetrospectiveId: proposal.rollupId, recurrences: [], createdAt: now, updatedAt: now });
    });
}

export function retireOfficeLesson(control: OfficeKnowledgeStore, lessonId: unknown): void {
    if (typeof lessonId !== 'string' || !lessonId) throw new Error('Lesson ID is required');
    control.updateKnowledge(knowledge => {
        const lesson = knowledge.lessons.find(item => item.id === lessonId);
        if (!lesson) throw new Error('Office lesson not found');
        if (lesson.status === 'retired') return;
        const now = control.clock.now().toISOString();
        Object.assign(lesson, { status: 'retired', retiredAt: now, retiredBy: 'human', updatedAt: now } satisfies Partial<Lesson>);
    });
}

/** Each project keeps a read-only copy, so prompt injection and its outbox stay store-local. */
export function mirrorOfficeKnowledge(control: Pick<OfficeKnowledgeStore, 'knowledge'>, stores: Iterable<Store>): void {
    const knowledge = control.knowledge(), active = knowledge.lessons.filter(lesson => lesson.status === 'active');
    for (const store of stores) {
        const local = store.state.knowledge;
        if (!local) continue;
        const proposals = knowledge.proposals.filter(proposal => proposal.projectId === store.project.id && proposal.status === 'proposed');
        if (JSON.stringify(local.officeLessons || []) === JSON.stringify(active) && JSON.stringify(local.officeProposals || []) === JSON.stringify(proposals)) continue;
        local.officeLessons = structuredClone(active);
        local.officeProposals = structuredClone(proposals);
        store.save();
    }
}
