import { afterEach, expect, test } from 'vitest';
import { selectLessons } from '../../../server/knowledge/lesson-selection';
const knowledgeContext = (store: Parameters<typeof selectLessons>[0], stage?: string) => selectLessons(store, { stage }).text;
import { retireLesson } from '../../../server/knowledge/lesson-commands';
import { seedProjectLessons } from '../../../server/knowledge/seeded-lessons';
import { migrateSnapshot } from '../../../server/store/migrations';
import { knowledgeStore } from './knowledge-fixture';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
function setup(projectId: string) { const fixture = knowledgeStore(projectId); cleanup.push(fixture.close); return fixture.store; }
const SEED = 'seed:cms-field-vocabulary:gh-100-held-sources';

test('cms-field-vocabulary gets one active GH-100 lesson with issue evidence, seeded once', () => {
    const store = setup('cms-field-vocabulary');
    migrateSnapshot(store.state, store.project);
    seedProjectLessons(store.state.knowledge!, store.project.id);
    const seeded = store.state.knowledge!.lessons.filter(lesson => lesson.id === SEED);
    expect(seeded).toHaveLength(1);
    expect(seeded[0]).toMatchObject({ status: 'active', scope: 'project', stages: ['implement', 'review'] });
    expect(seeded[0].evidence).toEqual([expect.objectContaining({ kind: 'ticket', ref: 'GH-100', url: 'https://github.com/JFusco/cms-field-vocabulary/issues/100' })]);
});

test('the guidance reaches cms-field-vocabulary scope-repair and candidate-adoption only', () => {
    const store = setup('cms-field-vocabulary');
    for (const stage of ['scope-repair', 'candidate-adoption']) {
        const section = knowledgeContext(store, stage);
        for (const text of ['original 25868923 candidate remains unaccepted', 'Preserve all eleven source dispositions, the three held profile proposals', 'eight observation proposals keep their source and acceptance gates']) expect(section).toContain(text);
    }
    expect(knowledgeContext(store, 'validate')).toBe('');
    for (const projectId of ['brain', 'cec']) {
        const other = setup(projectId);
        expect(other.state.knowledge!.lessons).toEqual([]);
        expect(knowledgeContext(other, 'scope-repair')).not.toContain('GH-100');
    }
});

test('a retired seed stays retired across later migrations', () => {
    const store = setup('cms-field-vocabulary');
    retireLesson(store, SEED);
    migrateSnapshot(store.state, store.project);
    expect(store.state.knowledge!.lessons.filter(lesson => lesson.id === SEED)).toMatchObject([{ status: 'retired' }]);
    expect(knowledgeContext(store, 'scope-repair')).toBe('');
});

const WITHDRAWN = 'seed:cms-field-vocabulary:contentstack-withdrawn-changelog-items';

test('the Contentstack withdrawn-item lesson reaches CMS maintenance stages only, with issue evidence', () => {
    const store = setup('cms-field-vocabulary');
    const seeded = store.state.knowledge!.lessons.filter(lesson => lesson.id === WITHDRAWN);
    expect(seeded).toMatchObject([{ status: 'active', scope: 'project', stages: ['maintenance'] }]);
    expect(seeded[0].evidence[0]).toMatchObject({ kind: 'ticket', ref: 'GH-137', url: 'https://github.com/JFusco/cms-field-vocabulary/issues/137' });
    expect(seeded[0].evidence[1]).toMatchObject({ kind: 'maintenance', ref: '8a7f8a8e-47f7-4830-b18a-96520b689791', url: '' });
    for (const stage of ['vendor-review', 'follow-up', 'proposal', 'proposal-plan', 'browser-verification']) {
        const section = knowledgeContext(store, stage);
        for (const text of ['record it as withdrawn upstream', 'still lists items dated on or before its scan date', 'merely aged out of the RSS window is not withdrawn', 'cms-field-vocabulary/issues/137']) expect(section).toContain(text);
    }
    for (const stage of ['implement', 'review', 'validate', 'scope-repair']) expect(knowledgeContext(store, stage)).not.toContain('withdrawn upstream');
    for (const projectId of ['brain', 'cec']) expect(knowledgeContext(setup(projectId), 'vendor-review')).not.toContain('Contentstack');
});
