import { expect, test } from 'vitest';
import { dropPendingLessons } from '../../../server/knowledge/drop-pending-lessons';
import { knowledgeStore } from './knowledge-fixture';

const batch = (id: string, kind: string, subject: string, extra: object = {}): any => ({ id, jobId: subject, key: '', source: { kind, id: subject }, subject: kind, trigger: 'learning', createdAt: '2026-11-23T09:00:00Z', attempts: 0, nextAt: '', lastError: '', eventIds: [], opportunities: [], ...extra });

test('the batch queued for the subject is removed; every other batch stays in its order', () => {
    const f = knowledgeStore();
    try {
        const pending = f.store.state.knowledge!.pending;
        pending.push(batch('a', 'investigation', 'one'), batch('b', 'investigation', 'two'), batch('c', 'job', 'one'), batch('d', 'investigation', 'one', { trigger: 'completed' }));
        const others = pending.filter(item => item.id !== 'a').map(item => item.id);
        expect(dropPendingLessons(f.store, { kind: 'investigation', id: 'one' })).toBe(1);
        expect(f.store.state.knowledge!.pending.map(item => item.id)).toEqual(others);
        // Nothing left to remove the second time, and the list is not replaced.
        const same = f.store.state.knowledge!.pending;
        expect(dropPendingLessons(f.store, { kind: 'investigation', id: 'one' })).toBe(0);
        expect(f.store.state.knowledge!.pending).toBe(same);
    } finally { f.close(); }
});

test('a batch whose retrospective is under way is left to finish', () => {
    const f = knowledgeStore();
    try {
        f.store.state.knowledge!.pending.push(batch('running', 'investigation', 'one', { frozen: true }));
        expect(dropPendingLessons(f.store, { kind: 'investigation', id: 'one' })).toBe(0);
        expect(f.store.state.knowledge!.pending.some(item => item.id === 'running')).toBe(true);
    } finally { f.close(); }
});

test('a store with no knowledge state has nothing to drop', () => {
    const f = knowledgeStore();
    try { delete f.store.state.knowledge; expect(dropPendingLessons(f.store, { kind: 'investigation', id: 'one' })).toBe(0); } finally { f.close(); }
});
