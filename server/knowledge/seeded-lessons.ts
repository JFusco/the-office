import type { KnowledgeState, Lesson } from '../../src/shared';

const SEEDED_AT = '2026-11-06T00:00:00.000Z';

/** Project lessons seeded by hand: guidance that predates Harper (the-office#58) or covers history Harper baselined without a retrospective. */
const SEEDS: Record<string, Lesson[]> = {
    'cms-field-vocabulary': [{
        id: 'seed:cms-field-vocabulary:gh-100-held-sources', scope: 'project', tier: 'guidance', revision: 1, kind: 'pitfall',
        statement: 'GH-100: the original 25868923 candidate remains unaccepted. Preserve all eleven source dispositions, the three held profile proposals and their follow-up review/PR references; the eight observation proposals keep their source and acceptance gates. Never accept held profile or source-lock changes as part of a repair or saved-candidate assessment.',
        detail: 'Carried over from the GH-100 recovery guidance that was previously hardcoded in the scope-repair and saved-candidate assessment prompts.',
        stages: ['implement', 'review'], paths: [], status: 'active',
        evidence: [{ kind: 'ticket', ref: 'GH-100', url: 'https://github.com/JFusco/cms-field-vocabulary/issues/100', detail: 'Issue #100 saved-candidate recovery' }],
        sourceRetrospectiveId: 'seed:the-office#58', recurrences: [], createdAt: SEEDED_AT, updatedAt: SEEDED_AT,
    }, {
        id: 'seed:cms-field-vocabulary:contentstack-withdrawn-changelog-items', scope: 'project', tier: 'guidance', revision: 1, kind: 'process',
        statement: 'Contentstack changelog (contentstack.product-changelog-index): scan artifacts keep only RSS item links, not their text (cms-field-vocabulary#137). In vendor review, read item text from the registered RSS https://www.contentstack.com/api/docs/changelog/rss.xml with curl. Treat a scanned identity as withdrawn upstream only when the current RSS still lists items dated on or before its scan date and the identity is absent from both that RSS and https://www.contentstack.com/docs/changelog; then record it as withdrawn upstream with no retained official text and no profile impact claimed, and do not keep it as an open observation or block on retrieving it. An identity that merely aged out of the RSS window is not withdrawn: read it from the changelog page.',
        detail: 'Morgan held the withdrawn November 4 identity "Manage entries directly from the Visual Builder form panel" as an unresolvable observation on November 5 and 6; on 2026-11-06 it was absent from both the RSS and the changelog page, and the Nov 4 scan had saved only its link.',
        stages: ['maintenance'], paths: [], status: 'active',
        evidence: [
            { kind: 'ticket', ref: 'GH-137', url: 'https://github.com/JFusco/cms-field-vocabulary/issues/137', detail: 'Issue #137 retain changelog item text' },
            { kind: 'maintenance', ref: '8a7f8a8e-47f7-4830-b18a-96520b689791', url: '', detail: 'Weekly vendor review of 2026-11-06 that held the withdrawn identity open; Nov 4 scan: https://github.com/JFusco/cms-field-vocabulary/actions/runs/41906470558' },
        ],
        sourceRetrospectiveId: 'seed:cms-field-vocabulary#137', recurrences: [], createdAt: SEEDED_AT, updatedAt: SEEDED_AT,
    }],
};

/** Adds each seed once, keyed by id in any status, so a retired seed stays retired. */
export function seedProjectLessons(knowledge: KnowledgeState, projectId: string): void {
    for (const seed of SEEDS[projectId] || [])
        if (!knowledge.lessons.some(lesson => lesson.id === seed.id)) knowledge.lessons.push(structuredClone(seed));
}
