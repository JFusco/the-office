import { test, expect } from 'vitest';
import { existsSync, mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { maintainLearning, expireLearningPackets, LEARNING_BASELINES } from '../../../server/knowledge/learning-maintenance';
import { captureLearning, learningDigest } from '../../../server/knowledge/learning-events';
import { deliveryMetrics } from '../../../server/knowledge/delivery-metrics';
import { runRetrospective, type RetrospectiveRunner } from '../../../server/knowledge/run-retrospective';
import { completedId } from '../../../server/knowledge/retrospective-triggers';
import type { TicketJob } from '../../../src/shared';
import { job, knowledgeStore, learningLesson } from './knowledge-fixture';
test('terminal contribution survives display pruning and coalesces into the same unstarted subject batch', () => {
    const { store, close } = knowledgeStore();
    try {
        const source = job({ id: 'job:with:colons', status: 'completed' }); store.state.coordination!.jobs!.push(source);
        captureLearning(store, { kind: 'job', id: source.id }, source.key, 'review', '1', {}, 'accepted');
        maintainLearning(store); maintainLearning(store);
        expect(store.state.knowledge!.baselines).toEqual(expect.arrayContaining(LEARNING_BASELINES));
        expect(store.state.knowledge!.pending).toHaveLength(1);
        expect(store.state.knowledge!.deliveryEvents).toHaveLength(1);
        store.state.knowledge!.retrospectives = [];
        expect(deliveryMetrics(store, new Date('2026-01-01'), new Date('2027-01-01')).completed).toBe(1);
    } finally { close(); }
});
test('a completed retrospective with the same ID never shadows the durable delivery counters', async () => {
    const { store, close } = knowledgeStore();
    try {
        const source = job({ status: 'completed', repairCycle: { attempts: 3 } as TicketJob['repairCycle'] }); store.state.coordination!.jobs!.push(source);
        maintainLearning(store);
        await runRetrospective(store, (async () => ({ summary: 'Reviewed', lessons: [], recurrences: [] })) as RetrospectiveRunner, completedId(source));
        expect(store.state.knowledge!.retrospectives.map(record => record.id)).toEqual([completedId(source)]);
        store.state.coordination!.jobs = [];
        expect(deliveryMetrics(store, new Date('2026-01-01'), new Date('2027-01-01'))).toMatchObject({ completed: 1, repairAttempts: 3 });
    } finally { close(); }
});
test('aged packets expire one by one from their own references, without summaries, while open work keeps what it cites', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!, root = resolve(store.dataRoot, 'retrospectives'), aged = new Date('2026-07-01T00:00:00Z');
        const packet = (id: string, subject: { kind: string; id: string }, refs: string[] = [], text?: string, at = aged) => {
            const name = learningDigest(id), file = resolve(root, name, 'facts.json');
            mkdirSync(resolve(root, name), { recursive: true });
            writeFileSync(file, text ?? JSON.stringify({ trigger: { id }, job: subject, catalog: Object.fromEntries(refs.map(ref => [ref, { kind: 'learning', ref, url: '', detail: ref }])) }));
            utimesSync(file, at, at);
            return name;
        };
        const at = '2026-06-01T00:00:00Z', cites = (ref: string) => [{ kind: 'learning' as const, ref, url: '', detail: ref }];
        k.followups = [{ id: 'job:lost', source: { kind: 'job', id: 'lost' }, fingerprint: '', key: 'GH-1', owner: 'Morgan', nextAction: 'Read back the source', evidence: [], disposition: 'unknown', createdAt: at, updatedAt: at, history: [{ at, disposition: 'unknown', fingerprint: '' }] }];
        k.improvements = [{ id: 'fix', problemKey: 'p', destination: 'brain', cause: 'Cause', change: 'Change', regression: 'Regression', acceptance: ['Accepted'], incidents: ['job:incident'], evidence: cites('job:cited:review:1:abc'), digest: '', origin: 'work', status: 'proposed', effectIds: [], detail: '', createdAt: at }];
        k.lessons = [learningLesson('L1', { sourceRetrospectiveId: 'lesson:source', evidence: cites('step:project:0') })];
        k.officeLessons = [learningLesson('O1', { scope: 'office', sourceRetrospectiveId: 'rollup:2026-06-05', evidence: cites('office:evidence') })];
        k.pending.push({ id: 'pending:work', jobId: 'other', key: 'GH-2', trigger: 'parked', createdAt: at, event: { stage: 'review', head: '', steps: 1, reason: '' }, attempts: 1, nextAt: '', lastError: '' });
        k.retrospectives = []; k.consumed.push('old:unrelated', 'old:lost');
        const unrelated = packet('old:unrelated', { kind: 'job', id: 'unrelated' }, ['job:unrelated']);
        const kept = [
            packet('old:lost', { kind: 'job', id: 'lost' }, ['job:lost']),
            packet('old:incident', { kind: 'job', id: 'incident' }),
            packet('old:cited', { kind: 'job', id: 'cited' }, ['job:cited:review:1:abc']),
            packet('old:project', { kind: 'job', id: 'project' }, ['step:project:0']),
            packet('old:office', { kind: 'job', id: 'office' }, ['office:evidence']),
            packet('pending:work', { kind: 'job', id: 'other' }),
            packet('lesson:source', { kind: 'job', id: 'source' }),
            packet('old:malformed', { kind: 'job', id: 'malformed' }, [], 'not json'),
            packet('old:oversized', { kind: 'job', id: 'big' }, [], JSON.stringify({ trigger: { id: 'old:oversized' }, job: { kind: 'job', id: 'big' }, catalog: {}, padding: 'x'.repeat(70000) })),
            packet('recent:unrelated', { kind: 'job', id: 'recent' }, [], undefined, new Date('2026-10-01T00:00:00Z')),
        ];
        const before = structuredClone({ consumed: k.consumed, learningConsumed: k.learningConsumed, followups: k.followups, retrospectives: k.retrospectives, deliveryEvents: k.deliveryEvents });
        expireLearningPackets(store); expireLearningPackets(store);
        expect(k.expiredPackets).toEqual([unrelated]);
        expect(existsSync(resolve(root, unrelated, 'facts.json'))).toBe(false);
        for (const name of kept) expect(existsSync(resolve(root, name, 'facts.json'))).toBe(true);
        expect({ consumed: k.consumed, learningConsumed: k.learningConsumed, followups: k.followups, retrospectives: k.retrospectives, deliveryEvents: k.deliveryEvents }).toEqual(before);
    } finally { close(); }
});
