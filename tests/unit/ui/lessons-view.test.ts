import { expect, test } from 'vitest';
import { lessonsView } from '../../../src/knowledge/lessons-view';
import type { KnowledgeState, Lesson } from '../../../src/shared';

const lesson = (id: string, status: Lesson['status'], createdAt: string, retiredAt?: string): Lesson => ({ id, kind: 'tooling', statement: id, detail: '', stages: ['any'], paths: [], status, evidence: [], sourceRetrospectiveId: '', createdAt, updatedAt: createdAt, retiredAt });

test('groups lessons newest first, keeps ten recent retrospectives and orders retries by age', () => {
    const knowledge: KnowledgeState = { enabled: true, consumed: [], lessons: [lesson('a', 'active', '2026-11-01'), lesson('b', 'active', '2026-11-03'), lesson('c', 'retired', '2026-10-01', '2026-11-04')],
        retrospectives: Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, jobId: '', key: 'GH-1', trigger: 'completed' as const, attemptId: '', summary: '', lessonIds: [], at: `2026-11-${String(i + 1).padStart(2, '0')}` })),
        pending: [{ id: 'p2', jobId: '', key: 'GH-2', trigger: 'parked', createdAt: '2026-11-05', event: { stage: '', head: '', steps: 0, reason: '' }, attempts: 1, nextAt: '', lastError: 'x' }, { id: 'p1', jobId: '', key: 'GH-1', trigger: 'retired', createdAt: '2026-11-04', event: { stage: '', head: '', steps: 0, reason: '' }, attempts: 0, nextAt: '', lastError: '' }] };
    const view = lessonsView(knowledge);
    expect(view.active.map(l => l.id)).toEqual(['b', 'a']);
    expect(view.retired.map(l => l.id)).toEqual(['c']);
    expect(view.recent.map(r => r.id)).toEqual(['r11', 'r10', 'r9', 'r8', 'r7', 'r6', 'r5', 'r4', 'r3', 'r2']);
    expect(view.pending.map(p => p.id)).toEqual(['p1', 'p2']);
    expect(lessonsView(undefined)).toMatchObject({ enabled: false, active: [], retired: [], recent: [], pending: [] });
});
