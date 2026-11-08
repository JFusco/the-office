import { afterEach, expect, test } from 'vitest';
import { ControlStore } from '../../../server/store/control-store';
import { promoteNoteLesson } from '../../../server/knowledge/promote-note-lesson';
import { mirrorOfficeKnowledge, retireOfficeLesson } from '../../../server/knowledge/office-lessons';
import { knowledgeContext } from '../../../server/knowledge/knowledge-context';
import { knowledgeStore } from './knowledge-fixture';
const clean: (() => void)[] = []; afterEach(() => clean.splice(0).forEach(fn => fn()));
function fixture() {
    const f = knowledgeStore(); clean.push(f.close); const office = new ControlStore(':memory:', f.store.clock); clean.push(() => office.close());
    const id = crypto.randomUUID(), requestId = crypto.randomUUID();
    f.store.state.messages.push({ id: requestId, requestId, from: 'human', to: 'pm', ticket: 'GH-350', body: 'Investigate and retain lesson', status: 'answered', createdAt: '', sessionId: '', recheck: false, error: '', recipients: [], receipts: [], actionId: '' });
    f.store.state.projectNotes.push({ id, requestId, ticket: 'GH-350', summary: 'Harper reviewed lesson', detail: 'Keep uncertainty until verified.', createdAt: '2026-11-08T14:00:00Z' });
    const input = { noteId: id, statement: 'Never replay an uncertain send; require independent read-back.', detail: 'Provider completion and cleanup are separate from external delivery.', kind: 'process', stages: ['any'] };
    return { ...f, office, input };
}
test('explicit note promotion is idempotent, retains provenance and reaches operational prompts in every project', () => {
    const f = fixture(), others = ['cms-field-vocabulary', 'cec'].map(id => { const s = knowledgeStore(id); clean.push(s.close); return s.store; });
    const id = promoteNoteLesson(f.office, f.store, f.input);
    expect(promoteNoteLesson(f.office, f.store, f.input)).toBe(id);
    expect(f.office.knowledge().lessons).toHaveLength(1); expect(f.office.knowledge().proposals).toEqual([]);
    expect(f.office.knowledge().lessons[0]).toMatchObject({ id, scope: 'office', status: 'active', sourceRetrospectiveId: id, evidence: [{ kind: 'artifact', ref: `project-note:brain:${f.input.noteId}` }] });
    mirrorOfficeKnowledge(f.office, [f.store, ...others]);
    for (const store of [f.store, ...others]) for (const stage of ['conversation', 'it-investigation', 'slack-send', 'slack-verify', 'readback']) expect(knowledgeContext(store, stage)).toContain(f.input.statement);
    expect(() => promoteNoteLesson(f.office, f.store, { ...f.input, detail: 'Changed approved text' })).toThrow('different approved content');
    retireOfficeLesson(f.office, id); expect(promoteNoteLesson(f.office, f.store, f.input)).toBe(id);
    mirrorOfficeKnowledge(f.office, [f.store, ...others]); expect(knowledgeContext(f.store, 'slack-send')).toBe('');
});
test('missing, uncompleted or nonhuman source and invalid input cannot activate a lesson', () => {
    const f = fixture();
    expect(() => promoteNoteLesson(f.office, f.store, { ...f.input, noteId: crypto.randomUUID() })).toThrow('completed human');
    f.store.state.messages[0].status = 'queued'; expect(() => promoteNoteLesson(f.office, f.store, f.input)).toThrow('completed human');
    f.store.state.messages[0].status = 'answered'; f.store.state.messages[0].from = 'pm'; expect(() => promoteNoteLesson(f.office, f.store, f.input)).toThrow('completed human');
    expect(() => promoteNoteLesson(f.office, f.store, { ...f.input, stages: ['invented'] })).toThrow(); expect(f.office.knowledge().lessons).toEqual([]);
});
