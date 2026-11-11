import { expect, test } from 'vitest';
import { acceptRetrospective } from '../../../server/knowledge/accept-retrospective';
import { selectLessons } from '../../../server/knowledge/lesson-selection';
import { knowledgeStore, learningLesson } from './knowledge-fixture';

const catalog = { now: { kind: 'learning' as const, ref: 'now', url: '', detail: 'Current run' } };
const proposal = (action: 'add' | 'update' | 'supersede' | 'share', targetId: string, statement: string) => ({ action, targetId, when: 'New situation', statement, check: 'New check', detail: 'Why', kind: 'process' as const, stages: ['review' as const], paths: [], evidenceIds: ['now'] });
function accept(store: ReturnType<typeof knowledgeStore>['store'], id: string, lessons: ReturnType<typeof proposal>[], share?: (lessons: unknown[]) => void) {
    return acceptRetrospective(store, { id, jobId: id, key: 'GH-1', trigger: 'completed' }, { catalog, elsewhere: [{ project: 'cec', id: 'cec-lesson', when: 'There', statement: 'Same thing elsewhere' }] }, { summary: 'Done', lessons }, 'claim', undefined, share);
}

test('update edits the lesson in place and supersede never leaves two versions active', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!;
        k.lessons = [learningLesson('keep', { statement: 'Old wording', evidence: [{ kind: 'pr', ref: 'pr:1', url: '', detail: 'PR' }] }), learningLesson('wrong', { statement: 'Outdated rule' })];
        expect(accept(store, 'r1', [proposal('update', 'keep', 'Sharper wording')])).toEqual(['keep']);
        expect(k.lessons[0]).toMatchObject({ id: 'keep', statement: 'Sharper wording', when: 'New situation', check: 'New check', revision: 2, status: 'active' });
        expect(k.lessons[0].evidence.map(proof => proof.ref)).toEqual(['pr:1', 'now']);

        const [replacement] = accept(store, 'r2', [proposal('supersede', 'wrong', 'Corrected rule')]);
        expect(k.lessons.find(lesson => lesson.id === 'wrong')).toMatchObject({ status: 'retired', retiredBy: 'harper', supersededBy: replacement });
        expect(k.lessons.find(lesson => lesson.id === replacement)).toMatchObject({ status: 'active', supersedes: 'wrong', statement: 'Corrected rule' });
        const prompt = selectLessons(store, { stage: 'github-review' }).text;
        expect(prompt).toContain('Corrected rule'); expect(prompt).not.toContain('Outdated rule');
    } finally { close(); }
});

test('a lesson learned again from another project is proposed office-wide instead of copied; bad targets and restatements change nothing', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!, shared: unknown[] = [];
        k.lessons = [learningLesson('active'), learningLesson('gone', { status: 'retired' })];
        k.officeLessons = [learningLesson('office', { scope: 'office', statement: 'Office rule' })];
        const before = JSON.stringify(k.lessons);
        expect(accept(store, 'r1', [
            proposal('share', 'cec-lesson', 'Worded for every project'),
            proposal('share', 'not-elsewhere', 'Unknown target'),
            proposal('update', 'gone', 'Edit a retired lesson'),
            proposal('supersede', 'office', 'Replace an office lesson'),
            proposal('add', '', 'Office rule'),
        ], lessons => shared.push(...lessons))).toEqual([]);
        expect(JSON.stringify(k.lessons)).toBe(before);
        expect(shared).toEqual([expect.objectContaining({ statement: 'Worded for every project', targetId: 'cec-lesson' })]);
        expect(k.retrospectives.at(-1)).toMatchObject({ id: 'r1', lessonIds: [] });
    } finally { close(); }
});
