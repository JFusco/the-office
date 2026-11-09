import { test, expect, afterEach } from 'vitest';
import { recordLearningOpportunity, captureLearning } from '../../../server/knowledge/learning-events';
import { runRetrospective, type KnowledgeRunner } from '../../../server/knowledge/run-retrospective';
import { scheduledRetrospectives } from '../../../server/knowledge/scheduled-retrospectives';
import { admitReadyCards } from '../../../server/delivery/intake/admission';
import { coordination } from '../../../server/scheduling/coordination';
import { HOLDS } from '../../../server/office/config';
import { cleanupFakes, fakeGitHub } from '../delivery/support/fake-github';
import { knowledgeStore, opportunity } from './knowledge-fixture';
afterEach(cleanupFakes);
const idle = (async () => { throw Error('not called'); }) as KnowledgeRunner;
const eligibility = (store: Parameters<typeof scheduledRetrospectives>[0], id: string) => scheduledRetrospectives(store, idle).find(item => item.work.id === id)!.eligibility;
test('ordinary accepted stages wait 30 quiet minutes; a closeout boundary is due at once and stays due', () => {
    const { store, close, advance } = knowledgeStore();
    try {
        for (const stage of ['implement', 'review', 'validate']) { captureLearning(store, { kind: 'job', id: 'job-1' }, 'GH-12', stage, stage, { stage }, `${stage} accepted`); advance(5 * 60000); }
        advance(-5 * 60000);
        const batch = store.state.knowledge!.pending.filter(item => item.trigger === 'learning');
        expect(batch).toHaveLength(1); expect(batch[0].frozen).toBeFalsy(); expect(batch[0].eventIds).toHaveLength(3);
        expect(batch[0].nextAt).toBe(new Date(store.clock.now().getTime() + 30 * 60000).toISOString());
        advance(30 * 60000 - 1);
        expect(eligibility(store, batch[0].id)).toMatchObject({ state: 'waiting', nextCheckAt: batch[0].nextAt });
        advance(1);
        expect(eligibility(store, batch[0].id).state).toBe('runnable');
        captureLearning(store, { kind: 'job', id: 'job-2' }, 'GH-13', 'review', 'one', {}, 'Review accepted');
        const second = store.state.knowledge!.pending.find(item => item.source?.id === 'job-2')!;
        expect(eligibility(store, second.id).state).toBe('waiting');
        captureLearning(store, { kind: 'job', id: 'job-2' }, 'GH-13', 'closeout', 'two', {}, 'Closed out', 'work', true);
        expect(second.nextAt).toBe(''); expect(eligibility(store, second.id).state).toBe('runnable');
        captureLearning(store, { kind: 'job', id: 'job-2' }, 'GH-13', 'review', 'three', {}, 'Later accepted stage');
        expect(second.nextAt).toBe(''); expect(store.state.knowledge!.pending.filter(item => item.source?.id === 'job-2')).toHaveLength(1);
    } finally { close(); }
});
test('successive admission dispositions for one card coalesce into one pending batch', () => {
    const f = fakeGitHub();
    f.store.state.coordination ??= coordination();
    const state = f.store.state.coordination!; state.jobs ??= [];
    const context = { store: f.store, state, pickup: { enabled: true, status: 'Ready' }, dependencyStores: () => new Map([[f.store.project.id, f.store]]) };
    const card = [{ key: 'GH-5', summary: 'Restore', url: 'u', assignee: 'JFusco', status: 'open', statusId: '', updated: '', type: 'GitHub issue', subtask: false, pickupStatus: 'Ready' }];
    HOLDS['GH-5'] = 'Synthetic human hold';
    try { admitReadyCards(context, f.delivery, card, new Date()); } finally { delete HOLDS['GH-5']; }
    admitReadyCards(context, f.delivery, card, new Date());
    const rows = state.listener.reviews.filter(row => row.key === 'GH-5');
    expect(rows.map(row => row.status)).toEqual(['held', 'ready']);
    const batches = f.store.state.knowledge!.pending.filter(item => item.trigger === 'learning');
    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({ source: { kind: 'orchestration', id: 'GH-5' } });
    expect(batches[0].eventIds!.map(id => rows.some(row => id.includes(row.id)))).toEqual([true, true]);
});
test('typed identities coalesce, deduplicate, bound summaries and freeze before later events', () => {
    const { store, close } = knowledgeStore();
    try {
        for (let i = 0; i < 24; i++) recordLearningOpportunity(store, opportunity(`event:${i}`));
        recordLearningOpportunity(store, opportunity('event:23'));
        expect(store.state.knowledge!.pending).toHaveLength(1);
        const batch = store.state.knowledge!.pending[0];
        expect(batch).toMatchObject({ source: { kind: 'feature', id: 'feature:with:colons' }, omittedEvents: 4 });
        expect(batch.opportunities).toHaveLength(20); expect(batch.eventIds).toHaveLength(24);
        batch.frozen = true; recordLearningOpportunity(store, opportunity('event:new'));
        expect(store.state.knowledge!.pending).toHaveLength(2);
        const before = structuredClone(store.state.knowledge!.pending);
        expect(() => store.transaction(() => { recordLearningOpportunity(store, opportunity('rolled-back')); throw Error('reject'); })).toThrow('reject');
        expect(store.state.knowledge!.pending).toEqual(before);
    } finally { close(); }
});
test('disabled captures are consumed and Harper-origin work never recursively learns', () => {
    const { store, close } = knowledgeStore();
    try {
        store.state.knowledge!.enabled = false; recordLearningOpportunity(store, opportunity());
        store.state.knowledge!.enabled = true; recordLearningOpportunity(store, opportunity());
        captureLearning(store, { kind: 'job', id: 'own' }, '', 'review', 'one', {}, 'Own report', 'harper');
        expect(store.state.knowledge!.pending).toEqual([]);
    } finally { close(); }
});
test('five failed attempts exhaust once, preserve the frozen packet and never launch a sixth', async () => {
    const { store, close, advance } = knowledgeStore();
    try {
        recordLearningOpportunity(store, opportunity());
        const id = store.state.knowledge!.pending[0].id; let calls = 0;
        const run = (async () => { calls++; throw Error('unavailable'); }) as KnowledgeRunner;
        for (let i = 0; i < 6; i++) { await runRetrospective(store, run, id); advance(86400000); }
        expect(calls).toBe(5); expect(store.state.knowledge!.consumed).toContain(id);
        expect(store.state.knowledge!.retrospectives[0].summary).toContain('unavailable after five');
    } finally { close(); }
});
