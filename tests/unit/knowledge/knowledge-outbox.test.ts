import { afterEach, expect, test } from 'vitest';
import { knowledgeOutbox } from '../../../server/knowledge/knowledge-outbox';
import { projectOutbox } from '../../../server/conversations/outbox';
import { Store } from '../../../server/store/store';
import type { OfficeSnapshot } from '../../../src/shared';

const stores: Store[] = [];
afterEach(() => { for (const store of stores.splice(0)) store.close(); });
const lesson = (id: string, createdAt: string, instruction = 'proposed') => ({ id, statement: `Lesson ${id}`, status: 'active', createdAt, updatedAt: createdAt, repositoryInstruction: { status: instruction } });
const proposal = (id: string, createdAt: string) => ({ id, statement: `Office ${id}`, status: 'proposed', createdAt });
const state = (lessons: unknown[], officeProposals: unknown[] = []) => ({ knowledge: { lessons, officeProposals } }) as unknown as OfficeSnapshot;
const monday = new Date('2026-11-16T14:00:00Z'), friday = new Date('2026-11-13T14:00:00Z');

test('proposals from earlier weeks arrive as one digest; this week\'s wait', () => {
    const s = state([lesson('a', '2026-11-11T10:00:00Z'), lesson('b', '2026-11-13T10:00:00Z')], [proposal('c', '2026-11-12T10:00:00Z')]);
    expect(knowledgeOutbox(s, friday)).toEqual([]);
    expect(knowledgeOutbox(s, monday)).toEqual([{ id: 'lesson-digest', title: 'Harper has 3 proposals to review', detail: "- Lesson a\n- Lesson b\n- Office c\nDecide each one below or in Harper's Lessons panel." }]);
});

test('the digest lists only what is still undecided and disappears when nothing is', () => {
    const s = state([lesson('a', '2026-11-04T10:00:00Z'), lesson('b', '2026-11-04T10:00:00Z', 'declined'), lesson('new', '2026-11-17T10:00:00Z')]);
    expect(knowledgeOutbox(s, new Date('2026-11-17T14:00:00Z'))).toMatchObject([{ title: 'Harper has 1 proposal to review', detail: expect.stringContaining('- Lesson a\n') }]);
    expect(knowledgeOutbox(state([lesson('b', '2026-11-04T10:00:00Z', 'filed')]), monday)).toEqual([]);
    expect(knowledgeOutbox({} as OfficeSnapshot, monday)).toEqual([]);
});

test('the outbox replaces saved per-proposal questions with the digest, updates it and clears it', () => {
    const store = new Store(':memory:');
    stores.push(store);
    const a = lesson('a', '2026-11-11T10:00:00Z'), b = lesson('b', '2026-11-11T10:00:00Z');
    store.state.knowledge = { lessons: [a, b], officeProposals: [] } as never;
    store.state.outbox = [{ id: 'lesson-issue:a', title: 'Harper suggests a durable team improvement', detail: 'Lesson a', role: 'knowledge', ticket: '', url: '', status: 'open', createdAt: '', updatedAt: '' }];
    const open = (at: Date) => (store.state.outbox = projectOutbox(store.state, at)).filter(action => action.status === 'open').map(action => `${action.id}|${action.title}`);

    expect(open(friday)).toEqual([]); // the old question is resolved; this week's proposals wait
    expect(store.state.outbox.find(action => action.id === 'lesson-issue:a')?.status).toBe('resolved');
    expect(open(monday)).toEqual(['lesson-digest|Harper has 2 proposals to review']);
    a.repositoryInstruction.status = 'declined';
    expect(open(monday)).toEqual(['lesson-digest|Harper has 1 proposal to review']);
    b.repositoryInstruction.status = 'filed';
    expect(open(monday)).toEqual([]);
    expect(store.state.outbox.find(action => action.id === 'lesson-digest')?.status).toBe('resolved');
});
