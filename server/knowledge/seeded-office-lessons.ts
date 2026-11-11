import type { Lesson } from '../../src/shared';
import type { OfficeKnowledgeStore } from './office-lessons';
import { CONSOLIDATED, CONSOLIDATED_AT } from './seeded-lessons';

const seed = (id: string, kind: Lesson['kind'], stages: Lesson['stages'], when: string, statement: string, check: string, detail: string, merged: string): Lesson => ({
    id: `seed:office:${id}`, scope: 'office', tier: 'guidance', revision: 1, kind, when, statement, check, detail, stages, paths: [], status: 'active',
    evidence: [{ kind: 'artifact', ref: CONSOLIDATED, url: '', detail: `Consolidates lessons ${merged}, approved by Joe on 2026-11-11` }],
    sourceRetrospectiveId: CONSOLIDATED, createdAt: CONSOLIDATED_AT, updatedAt: CONSOLIDATED_AT,
});

/** Office lessons seeded by hand: the same lesson was learned separately in several projects. */
const SEEDS: Lesson[] = [
    seed('recovery-acceptance-is-not-proof', 'pitfall', ['repair', 'validate'],
        'A recovery record is accepted, or a read-only probe times out.',
        'Report access as unknown until a fresh project-scoped read succeeds.',
        'The summary quotes the record\'s own status and proof fields.',
        'Acceptance alone does not show access was restored, and a timeout shows neither success nor an authentication failure.',
        '4ed13623, 4e8896a4, 9a887ac8 and 8f03a968'),
    seed('reuse-review-for-unchanged-head', 'process', ['review'],
        'Reviewing or merging a PR that was reviewed earlier.',
        'Reuse the saved review only if the head SHA and changed-file list are unchanged, and re-read mergeability, checks, threads and holds from the provider.',
        'Both values match the reviewed ones.',
        'Passing checks on an unchanged head have still hidden a conflict with the target branch; keep unresolved findings open.',
        '076d00a3, 27293a77, 4ab80e49, ab8c8a2f and 44e1f0d7'),
    seed('subprocess-fix-needs-launch-evidence', 'process', ['repair'],
        'About to propose a fix for a subprocess that outlived its run.',
        'Collect the original launch options, the executing revision and which component owned shutdown first.',
        'Each of the three is cited.',
        'Exit code 0 does not show the external action succeeded, and a process group that later disappeared does not show which component failed to stop it.',
        '751cff5e, eb675173 and 26f24c93'),
];

/** The current seed with this id, so a copy stored before a rewrite of its wording can take the new wording. */
export const officeSeed = (id: string) => SEEDS.find(seed => seed.id === id);

/** Adds each seed once, keyed by id in any status, so a retired seed stays retired. */
export function seedOfficeLessons(control: Pick<OfficeKnowledgeStore, 'knowledge' | 'updateKnowledge'>): void {
    if (SEEDS.every(item => control.knowledge().lessons.some(lesson => lesson.id === item.id))) return;
    control.updateKnowledge(knowledge => {
        for (const item of SEEDS) if (!knowledge.lessons.some(lesson => lesson.id === item.id)) knowledge.lessons.push(structuredClone(item));
    });
}
