import type { Lesson } from '../../src/shared';
import type { OfficeKnowledgeStore } from './office-lessons';
import { CONSOLIDATED, CONSOLIDATED_AT } from './seeded-lessons';

const seed = (id: string, kind: Lesson['kind'], stages: Lesson['stages'], statement: string, detail: string, merged: string): Lesson => ({
    id: `seed:office:${id}`, scope: 'office', tier: 'guidance', revision: 1, kind, statement, detail, stages, paths: [], status: 'active',
    evidence: [{ kind: 'artifact', ref: CONSOLIDATED, url: '', detail: `Consolidates lessons ${merged}, approved by Joe on 2026-11-11` }],
    sourceRetrospectiveId: CONSOLIDATED, recurrences: [], createdAt: CONSOLIDATED_AT, updatedAt: CONSOLIDATED_AT,
});

/** Office lessons seeded by hand: the same lesson was learned separately in several projects. */
const SEEDS: Lesson[] = [
    seed('recovery-acceptance-is-not-proof', 'pitfall', ['repair', 'validate'],
        'When a recovery record is accepted or a read-only probe times out, report access as unknown until a fresh project-scoped read succeeds.',
        'Check: the summary quotes the record\'s own status and proof fields. Acceptance alone does not show access was restored, and a timeout shows neither success nor an authentication failure.',
        '4ed13623, 4e8896a4, 9a887ac8 and 8f03a968'),
    seed('reuse-review-for-unchanged-head', 'process', ['review'],
        'When reviewing or merging a PR that was reviewed earlier, reuse the saved review only if the head SHA and changed-file list are unchanged, and re-read mergeability, checks, threads and holds from the provider.',
        'Check: both values match the reviewed ones. Passing checks on an unchanged head have still hidden a conflict with the target branch; keep unresolved findings open.',
        '076d00a3, 27293a77, 4ab80e49, ab8c8a2f and 44e1f0d7'),
    seed('subprocess-fix-needs-launch-evidence', 'process', ['repair'],
        'Before proposing a fix for a subprocess that outlived its run, collect the original launch options, the executing revision and which component owned shutdown.',
        'Check: each is cited. Exit code 0 does not show the external action succeeded, and a process group that later disappeared does not show which component failed to stop it.',
        '751cff5e, eb675173 and 26f24c93'),
];

/** Adds each seed once, keyed by id in any status, so a retired seed stays retired. */
export function seedOfficeLessons(control: Pick<OfficeKnowledgeStore, 'knowledge' | 'updateKnowledge'>): void {
    if (SEEDS.every(item => control.knowledge().lessons.some(lesson => lesson.id === item.id))) return;
    control.updateKnowledge(knowledge => {
        for (const item of SEEDS) if (!knowledge.lessons.some(lesson => lesson.id === item.id)) knowledge.lessons.push(structuredClone(item));
    });
}
