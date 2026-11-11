import { afterEach, expect, test } from 'vitest';
import { ControlStore } from '../../../server/store/control-store';
import { mirrorOfficeKnowledge, retireOfficeLesson } from '../../../server/knowledge/office-lessons';
import { seedOfficeLessons } from '../../../server/knowledge/seeded-office-lessons';
import { seedProjectLessons } from '../../../server/knowledge/seeded-lessons';
import { selectLessons } from '../../../server/knowledge/lesson-selection';
import { knowledgeStore } from './knowledge-fixture';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
function setup(projectId = 'brain') {
    const fixture = knowledgeStore(projectId); cleanup.push(fixture.close);
    const office = new ControlStore(':memory:', fixture.store.clock); cleanup.push(() => office.close());
    return { store: fixture.store, office };
}

test('three consolidated office lessons are seeded once and reach only their stages', () => {
    const { store, office } = setup();
    seedOfficeLessons(office); seedOfficeLessons(office);
    const lessons = office.knowledge().lessons;
    expect(lessons.map(lesson => lesson.id)).toEqual(['seed:office:recovery-acceptance-is-not-proof', 'seed:office:reuse-review-for-unchanged-head', 'seed:office:subprocess-fix-needs-launch-evidence']);
    expect(lessons.every(lesson => lesson.scope === 'office' && lesson.status === 'active' && !lesson.stages.includes('any') && lesson.evidence.length === 1)).toBe(true);
    mirrorOfficeKnowledge(office, [store]);
    expect(selectLessons(store, { stage: 'github-review' }).text).toContain('When: Reviewing or merging a PR that was reviewed earlier. Do: Reuse the saved review only if the head SHA');
    expect(selectLessons(store, { stage: 'github-review' }).text).not.toContain('subprocess');
    expect(selectLessons(store, { stage: 'github-ci-recovery' }).text).toContain('Do: Report access as unknown until a fresh project-scoped read succeeds. Check:');
    expect(selectLessons(store, { stage: 'slack-send' }).text).toBe('');
});

test('an office seed stored before the when/check shape takes its current wording and loses recurrence history in every mirror', () => {
    const { store, office } = setup();
    office.updateKnowledge(knowledge => { knowledge.lessons.push({ id: 'seed:office:reuse-review-for-unchanged-head', scope: 'office', tier: 'guidance', revision: 1, kind: 'process', stages: ['review'], paths: [], status: 'active', evidence: [], sourceRetrospectiveId: 'seed', createdAt: '', updatedAt: '',
        statement: 'When reviewing or merging a PR that was reviewed earlier, reuse the saved review only if the head SHA is unchanged.', detail: 'Check: both values match the reviewed ones.', recurrences: [{ detail: 'Recurred' }] } as never); });
    const [lesson] = office.knowledge().lessons;
    expect(lesson).toMatchObject({ when: 'Reviewing or merging a PR that was reviewed earlier.', check: 'Both values match the reviewed ones.',
        statement: 'Reuse the saved review only if the head SHA and changed-file list are unchanged, and re-read mergeability, checks, threads and holds from the provider.' });
    expect(lesson).not.toHaveProperty('recurrences');
    mirrorOfficeKnowledge(office, [store]);
    expect(store.state.knowledge!.officeLessons).toHaveLength(1);
    expect(store.state.knowledge!.officeLessons![0]).not.toHaveProperty('recurrences');
});

test('a retired office seed stays retired', () => {
    const { office } = setup();
    seedOfficeLessons(office);
    retireOfficeLesson(office, 'seed:office:reuse-review-for-unchanged-head');
    seedOfficeLessons(office);
    expect(office.knowledge().lessons.filter(lesson => lesson.id === 'seed:office:reuse-review-for-unchanged-head').map(lesson => lesson.status)).toEqual(['retired']);
});

test('each project receives its own consolidated lesson and no other project does', () => {
    const brain = setup('brain').store, cms = setup('cms-field-vocabulary').store, cec = setup('cec').store;
    for (const store of [brain, cms, cec]) seedProjectLessons(store.state.knowledge!, store.project.id);
    const ids = (store: typeof brain) => store.state.knowledge!.lessons.map(lesson => lesson.id).filter(id => id.startsWith('seed:'));
    expect(ids(brain)).toEqual(['seed:brain:dual-lockfile-verification']);
    expect(ids(cms)).toContain('seed:cms-field-vocabulary:wiki-only-package-checks');
    expect(ids(cec)).toEqual([]);
    expect(selectLessons(brain, { stage: 'github-review', paths: ['pnpm-lock.yaml'] }).text).toContain('both the root and web/brain lockfiles');
});
