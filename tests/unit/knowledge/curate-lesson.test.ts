import { expect, test } from 'vitest';
import { acceptRetrospective } from '../../../server/knowledge/accept-retrospective';
import { selectLessons } from '../../../server/knowledge/lesson-selection';
import { decideOfficeProposal, proposeOfficeLessons } from '../../../server/knowledge/office-lessons';
import { ControlStore } from '../../../server/store/control-store';
import { knowledgeStore, learningLesson } from './knowledge-fixture';

const catalog = { now: { kind: 'learning' as const, ref: 'now', url: '', detail: 'Current run' } };
const proposal = (action: 'add' | 'update' | 'supersede' | 'share', targetId: string, statement: string) => ({ action, targetId, when: 'New situation', statement, check: 'New check', detail: 'Why', kind: 'process' as const, stages: ['review' as const], paths: [], evidenceIds: ['now'] });
function accept(store: ReturnType<typeof knowledgeStore>['store'], id: string, lessons: ReturnType<typeof proposal>[], share?: (lessons: unknown[]) => void) {
    return acceptRetrospective(store, { id, jobId: id, key: 'GH-1', trigger: 'completed' }, { catalog, elsewhere: [{ project: 'cec', id: 'cec-lesson', when: 'There', statement: 'Same thing elsewhere' }] }, { summary: 'Done', lessons }, 'claim', share);
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

test('an update does not repeat a proof it already holds', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!;
        k.lessons = [learningLesson('keep', { evidence: [{ kind: 'job', ref: 'job:1', url: '', detail: 'Job' }] })];
        const result = { summary: 'Done', lessons: [{ ...proposal('update', 'keep', 'Sharper wording'), evidenceIds: ['job:1'] }] };
        expect(acceptRetrospective(store, { id: 'r1', jobId: 'r1', key: 'GH-1', trigger: 'completed' }, { catalog: { 'job:1': { kind: 'job', ref: 'job:1', url: '', detail: 'Job, restated' } } }, result, 'claim')).toEqual(['keep']);
        const [lesson] = k.lessons;
        expect(lesson).toMatchObject({ statement: 'Sharper wording', revision: 2 });
        expect(lesson.evidence).toEqual([{ kind: 'job', ref: 'job:1', url: '', detail: 'Job' }]);
    } finally { close(); }
});

test('a share keeps its proof for Joe; a failed filing leaves the retrospective pending, and the retry files once', () => {
    const { store, close } = knowledgeStore(), office = new ControlStore(':memory:', store.clock);
    try {
        store.state.knowledge!.lessons = [];
        const pending = { id: 'r1', jobId: 'r1', key: 'GH-1', trigger: 'completed' as const, createdAt: '', event: { stage: 'closeout', head: '', steps: 1, reason: '' }, attempts: 1, nextAt: '', lastError: '' };
        store.state.knowledge!.pending.push(pending);
        const packet = { catalog: { now: { kind: 'learning' as const, ref: 'now', url: '', detail: 'Current run' } }, elsewhere: [{ project: 'cec', id: 'cec-lesson', when: 'There', statement: 'Same thing elsewhere' }] };
        const result = { summary: 'Done', lessons: [proposal('share', 'cec-lesson', 'Worded for every project')] };
        expect(() => acceptRetrospective(store, pending, packet, result, 'claim', () => { throw Error('Office store unavailable'); })).toThrow('Office store unavailable');
        const k = () => store.state.knowledge!;
        expect(k().pending.map(entry => entry.id)).toEqual(['r1']);
        expect(k().consumed).not.toContain('r1');
        expect(k().retrospectives).toEqual([]);
        const file = (lessons: Parameters<typeof proposeOfficeLessons>[3]) => proposeOfficeLessons(office, 'brain', 'r1', lessons);
        expect(acceptRetrospective(store, pending, packet, result, 'claim', file)).toEqual([]);
        expect(acceptRetrospective(store, pending, packet, result, 'claim', file)).toEqual([]);
        expect(k().lessons).toEqual([]);
        expect(k().retrospectives.map(record => record.id)).toEqual(['r1']);
        const proposals = office.knowledge().proposals;
        expect(proposals).toHaveLength(1);
        expect(proposals[0].evidence).toEqual([{ kind: 'learning', ref: 'now', url: '', detail: 'Current run' }]);
        expect(() => decideOfficeProposal(office, proposals[0].id, true, 'cec')).toThrow('belongs to another project');
        decideOfficeProposal(office, proposals[0].id, true, 'brain');
        expect(office.knowledge().lessons[0].evidence[0]).toEqual({ kind: 'learning', ref: 'now', url: '', detail: 'Current run' });
    } finally { office.close(); close(); }
});
