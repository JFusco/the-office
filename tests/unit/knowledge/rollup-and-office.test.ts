import { afterEach, expect, test } from 'vitest';
import { deliveryMetrics } from '../../../server/knowledge/delivery-metrics';
import { lastFriday, rollupDue, runRollup, scheduledRollup } from '../../../server/knowledge/weekly-rollup';
import { selectLessons } from '../../../server/knowledge/lesson-selection';
const knowledgeContext = (store: Parameters<typeof selectLessons>[0], stage?: string) => selectLessons(store, { stage }).text;
import { knowledgeOutbox } from '../../../server/knowledge/knowledge-outbox';
import { decideOfficeProposal, mirrorOfficeKnowledge, proposeOfficeLessons, retireOfficeLesson } from '../../../server/knowledge/office-lessons';
import { ControlStore } from '../../../server/store/control-store';
import type { KnowledgeRunner } from '../../../server/knowledge/run-retrospective';
import type { Lesson } from '../../../src/shared';
import { job, knowledgeStore, result } from './knowledge-fixture';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
// Friday 2026-11-06, 6:30 PM Eastern.
function setup(start = '2026-11-06T23:30:00Z', projectId = 'brain') { const fixture = knowledgeStore(projectId, start); cleanup.push(fixture.close); return fixture; }
function control(store: ReturnType<typeof setup>['store']) { const value = new ControlStore(':memory:', store.clock); cleanup.push(() => value.close()); return value; }
const lesson = (id: string, overrides: Partial<Lesson> = {}): Lesson => ({ id, scope: 'project', tier: 'guidance', revision: 1, kind: 'pitfall', when: 'Fixture situation', check: 'Fixture check', statement: `Lesson ${id}`, detail: '', stages: ['any'], paths: [], status: 'active', evidence: [], sourceRetrospectiveId: 'source-job:completed', createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', ...overrides });

test('narrative retries and saved reports use the same frozen learning snapshot', async () => {
    const { store, advance } = setup();
    const k = store.state.knowledge!; k.learningStartedAt = '2026-10-01T00:00:00Z';
    k.exposures = [{ id: 'one', stage: 'review', at: '2026-11-06T20:00:00Z', dispatchedAt: '2026-11-06T20:00:00Z', digest: 'one', eligible: [], selected: [], omitted: [] }];
    const facts: { learning: unknown }[] = [];
    const runner = (async (prompt: string) => {
        facts.push(JSON.parse(prompt.split('FACTS: ')[1]));
        if (facts.length === 1) throw new Error('Temporary narrative failure');
        return { summary: 'Frozen report', officeProposals: [] };
    }) as KnowledgeRunner;
    await runRollup(store, runner, 'rollup:2026-11-06');
    k.exposures.push({ ...k.exposures[0], id: 'two' }); advance(300000);
    await runRollup(store, runner, 'rollup:2026-11-06');
    expect(facts).toHaveLength(2); expect(facts[1].learning).toEqual(facts[0].learning);
    expect(k.rollups![0].learning).toEqual(facts[0].learning);
    expect(k.rollups![0].learning).toMatchObject({ assignments: 1, coverage: { status: 'complete' } });
    const saved = JSON.stringify(k.rollups![0]);
    k.learningStartedAt = '2026-11-07T00:00:00Z';
    await runRollup(store, runner, 'rollup:2026-11-06');
    expect(JSON.stringify(k.rollups![0])).toBe(saved); expect(facts).toHaveLength(2);
});

test('the roll-up is due after Avery\'s Friday review or 6 PM, once per week, and quiet weeks need no model call', async () => {
    const { store } = setup('2026-11-06T20:00:00Z'); // Friday 3 PM Eastern
    expect(lastFriday(new Date('2026-11-09T15:00:00Z'))).toBe('2026-11-06');
    expect(rollupDue(store, store.clock.now())).toBeUndefined();
    expect(rollupDue(store, store.clock.now(), () => 'completed')).toBeUndefined();
    expect(rollupDue(store, new Date('2026-11-06T22:00:00Z'), () => 'completed')).toBe('rollup:2026-11-06');
    expect(rollupDue(store, new Date('2026-11-06T23:00:00Z'))).toBe('rollup:2026-11-06');
    let calls = 0;
    await runRollup(store, (async () => { calls++; return {}; }) as KnowledgeRunner, 'rollup:2026-11-06');
    expect(calls).toBe(0);
    expect(store.state.knowledge!.rollups![0].summary).toBe('No delivery activity this week.');
    expect(rollupDue(store, new Date('2026-11-07T15:00:00Z'))).toBeUndefined();
});

test('a failed roll-up retries later instead of blocking', async () => {
    const { store, advance } = setup();
    store.state.knowledge!.retrospectives.push({ id: 'j:completed', jobId: 'j', key: 'GH-1', trigger: 'completed', attemptId: '', summary: '', lessonIds: [], at: '2026-11-05T12:00:00Z', eventAt: '2026-11-05T12:00:00Z' });
    const failing = (async () => { throw new Error('overloaded'); }) as KnowledgeRunner;
    await runRollup(store, failing, 'rollup:2026-11-06');
    expect(store.state.knowledge!.rollups).toEqual([]);
    expect(store.state.knowledge!.rollupRetry).toMatchObject({ id: 'rollup:2026-11-06', attempts: 1, lastError: 'overloaded' });
    expect(scheduledRollup(store, failing, store.clock.now())[0].eligibility.state).toBe('waiting');
    advance(10 * 60000);
    expect(scheduledRollup(store, failing, store.clock.now())[0].eligibility.state).toBe('runnable');
});

test('delivery metrics count the week from Harper\'s trigger log and the jobs it names', () => {
    const { store } = setup();
    const done = job({ status: 'completed', repairCycle: { owner: 'developer', findingAttempts: {}, attempts: 3, pendingFindingIds: [], sourceStage: 'review', sourceHead: '', phase: 'verify' }, ciRepairs: [{ id: 'c1' }] as never, steps: [{ stage: 'review', result: result('review', { outcome: 'reroute' }) }], timing: [{ stage: 'review', enqueuedAt: '', readyAt: '', claimedAt: '2026-11-04T10:00:00Z', queueMs: 600000 }] });
    const parked = job({ status: 'queued', timing: [{ stage: 'review', enqueuedAt: '', readyAt: '', claimedAt: '2026-11-04T16:00:00Z', queueMs: 0 }] });
    store.state.coordination!.jobs!.push(done, parked);
    const k = store.state.knowledge!;
    k.retrospectives.push({ id: `${done.id}:completed`, jobId: done.id, key: 'GH-1', trigger: 'completed', attemptId: '', summary: '', lessonIds: [], at: '2026-11-04T11:00:00Z', eventAt: '2026-11-04T11:00:00Z' },
        { id: `${parked.id}:parked:1`, jobId: parked.id, key: 'GH-2', trigger: 'parked', attemptId: '', summary: '', lessonIds: [], at: '2026-11-04T13:00:00Z', eventAt: '2026-11-04T12:00:00Z' },
        { id: 'old:completed', jobId: 'old', key: 'GH-3', trigger: 'completed', attemptId: '', summary: '', lessonIds: [], at: '2026-10-01T00:00:00Z' });
    const metrics = deliveryMetrics(store, new Date('2026-10-31T04:00:00Z'), new Date('2026-11-07T05:00:00Z'));
    expect(metrics).toMatchObject({ completed: 1, parked: 1, repairAttempts: 3, reroutes: 1, ciRepairs: 1, medianBlockHours: 4, stillParked: 0, retrospectives: 2, medianQueueMinutes: 5 });
});

test('office proposals wait for Joe, then reach every project\'s prompts through the mirror', () => {
    const { store } = setup();
    const other = knowledgeStore('cms-field-vocabulary'); cleanup.push(other.close);
    const office = control(store);
    const proposal = { when: 'Fixture situation', check: 'Fixture check', statement: 'Run the wiki build before every review', detail: 'Two projects drifted.', kind: 'process' as const, stages: ['review' as const] };
    const ids = proposeOfficeLessons(office, 'brain', 'rollup:2026-11-06', [proposal, { ...proposal, when: 'Fixture situation', check: 'Fixture check', statement: '  run the WIKI build before every review ' }]);
    expect(ids).toHaveLength(1);
    expect(proposeOfficeLessons(office, 'cms-field-vocabulary', 'rollup:2026-11-06', [proposal])).toEqual([]); // already proposed
    mirrorOfficeKnowledge(office, [store, other.store]);
    expect(knowledgeOutbox(store.state).map(item => item.id)).toEqual([`office-lesson:${ids[0]}`]);
    expect(knowledgeOutbox(other.store.state)).toEqual([]);
    expect(knowledgeContext(store, 'github-review')).not.toContain('wiki build');
    decideOfficeProposal(office, ids[0], true);
    mirrorOfficeKnowledge(office, [store, other.store]);
    expect(knowledgeContext(other.store, 'github-lead-pr')).toContain('[office · process · review] When: Fixture situation Do: Run the wiki build before every review Check: Fixture check');
    expect(knowledgeOutbox(store.state)).toEqual([]);
    retireOfficeLesson(office, ids[0]);
    mirrorOfficeKnowledge(office, [store, other.store]);
    expect(knowledgeContext(other.store, 'github-lead-pr')).not.toContain('wiki build');
});

test('a retried roll-up preserves the original coverage and does not infer application', async () => {
    const { store, advance } = setup();
    store.state.knowledge!.lessons.push(lesson('L1'));
    store.state.knowledge!.retrospectives.push({ id: 'j:completed', jobId: 'j', key: 'GH-1', trigger: 'completed', attemptId: '', summary: '', lessonIds: [], at: '2026-11-05T12:00:00Z', eventAt: '2026-11-05T12:00:00Z' });
    await runRollup(store, (async () => { throw new Error('overloaded'); }) as KnowledgeRunner, 'rollup:2026-11-06');
    advance(60 * 60000);
    let prompt = '';
    await runRollup(store, (async (text: string) => { prompt = text; return { summary: 'ok', officeProposals: [] }; }) as KnowledgeRunner, 'rollup:2026-11-06');
    expect(store.state.knowledge!.rollups![0].summary).toBe('ok');
});
