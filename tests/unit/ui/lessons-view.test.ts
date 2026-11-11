import { expect, test } from 'vitest';
import { lessonsView } from '../../../src/knowledge/lessons-view';
import type { KnowledgeState, Lesson } from '../../../src/shared';

const lesson = (id: string, status: Lesson['status'], createdAt: string, retiredAt?: string): Lesson => ({ id, scope: 'project', kind: 'tooling', statement: id, detail: '', stages: ['any'], paths: [], status, evidence: [], sourceRetrospectiveId: '', createdAt, updatedAt: createdAt, retiredAt });

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

test('groups AGENTS.md suggestions, office knowledge and the latest four roll-ups', () => {
    const rollup = (week: string) => ({ id: `rollup:${week}`, weekEnding: week, summary: week, officeProposalIds: [], at: week, metrics: {} as any });
    const knowledge: KnowledgeState = { enabled: true, consumed: [], pending: [], retrospectives: [],
        lessons: [{ ...lesson('s', 'active', '2026-11-02'), repositoryInstruction: { status: 'proposed' } }, { ...lesson('d', 'active', '2026-11-03'), repositoryInstruction: { status: 'declined' } }],
        rollups: ['2026-10-09', '2026-10-16', '2026-10-23', '2026-10-30', '2026-11-06'].map(rollup), rollupRetry: { id: 'rollup:x', attempts: 1, nextAt: '', lastError: 'overloaded' } };
    const office = { proposals: [{ id: 'p', projectId: 'brain', rollupId: 'r', kind: 'process' as const, statement: 'Run it', detail: '', stages: ['any' as const], status: 'proposed' as const, createdAt: '2026-11-06' }, { id: 'q', projectId: 'brain', rollupId: 'r', kind: 'process' as const, statement: 'Old', detail: '', stages: ['any' as const], status: 'declined' as const, createdAt: '2026-11-01' }], lessons: [{ ...lesson('o', 'active', '2026-11-05'), scope: 'office' as const }] };
    const view = lessonsView(knowledge, office);
    expect(view.agentsSuggestions.map(l => l.id)).toEqual(['s']);
    expect(view.officeProposals.map(p => p.id)).toEqual(['p']);
    expect(view.officeLessons.map(l => l.id)).toEqual(['o']);
    expect(view.rollups.map(r => r.weekEnding)).toEqual(['2026-11-06', '2026-10-30', '2026-10-23', '2026-10-16']);
    expect(view.rollupError).toBe('overloaded');
});
