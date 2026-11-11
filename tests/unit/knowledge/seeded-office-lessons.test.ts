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
    expect(selectLessons(store, { stage: 'github-review' }).text).toContain('reuse the saved review only if the head SHA');
    expect(selectLessons(store, { stage: 'github-review' }).text).not.toContain('subprocess');
    expect(selectLessons(store, { stage: 'github-ci-recovery' }).text).toContain('report access as unknown');
    expect(selectLessons(store, { stage: 'slack-send' }).text).toBe('');
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
