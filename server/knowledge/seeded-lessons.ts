import type { KnowledgeState, Lesson } from '../../src/shared';

const SEEDED_AT = '2026-11-06T00:00:00.000Z';

/** Project lessons that predate Harper and moved out of shared prompt code (the-office#58). */
const SEEDS: Record<string, Lesson[]> = {
    'cms-field-vocabulary': [{
        id: 'seed:cms-field-vocabulary:gh-100-held-sources', scope: 'project', kind: 'pitfall',
        statement: 'GH-100: the original 25868923 candidate remains unaccepted. Preserve all eleven source dispositions, the three held profile proposals and their follow-up review/PR references; the eight observation proposals keep their source and acceptance gates. Never accept held profile or source-lock changes as part of a repair or saved-candidate assessment.',
        detail: 'Carried over from the GH-100 recovery guidance that was previously hardcoded in the scope-repair and saved-candidate assessment prompts.',
        stages: ['implement', 'review'], paths: [], status: 'active',
        evidence: [{ kind: 'ticket', ref: 'GH-100', url: 'https://github.com/JFusco/cms-field-vocabulary/issues/100', detail: 'Issue #100 saved-candidate recovery' }],
        sourceRetrospectiveId: 'seed:the-office#58', recurrences: [], createdAt: SEEDED_AT, updatedAt: SEEDED_AT,
    }],
};

/** Adds each seed once, keyed by id in any status, so a retired seed stays retired. */
export function seedProjectLessons(knowledge: KnowledgeState, projectId: string): void {
    for (const seed of SEEDS[projectId] || [])
        if (!knowledge.lessons.some(lesson => lesson.id === seed.id)) knowledge.lessons.push(structuredClone(seed));
}
