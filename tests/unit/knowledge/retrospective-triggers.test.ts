import { afterEach, expect, test } from 'vitest';
import { migrateSnapshot } from '../../../server/store/migrations';
import { terminalCandidates, completedId } from '../../../server/knowledge/retrospective-triggers';
import { recordCIBudget, recordParked } from '../../../server/knowledge/record-trigger';
import { configureKnowledge } from '../../../server/knowledge/lesson-commands';
import { enqueueRepairDiagnosis } from '../../../server/delivery/repairs/delivery-repairs';
import type { DeliveryRepairCycle } from '../../../src/shared';
import { job, knowledgeStore, result } from './knowledge-fixture';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
function setup(projectId = 'brain') { const fixture = knowledgeStore(projectId); cleanup.push(fixture.close); return fixture; }
const cycle = (overrides: Partial<DeliveryRepairCycle> = {}): DeliveryRepairCycle => ({ owner: 'developer', findingAttempts: { F1: 2 }, attempts: 6, pendingFindingIds: ['F1'], sourceStage: 'review', sourceHead: 'c'.repeat(40), phase: 'diagnosis', ...overrides });

test('first migration baselines existing history, including jobs without updatedAt, so a deploy queues nothing', () => {
    const { store } = setup();
    store.state.coordination!.jobs! = [
        job({ status: 'completed' }),
        job({ status: 'cancelled' }), // retire-backlogged never sets updatedAt
        job({ status: 'blocked', parked: { stage: 'review', reason: 'Needs Joe', at: '2026-11-01T00:00:00Z', published: true }, steps: [{ stage: 'review', result: result('review') }] }),
        job({ status: 'blocked', repairCycle: cycle({ diagnosisRequestId: 'request-1' }) }),
    ];
    delete store.state.knowledge;
    migrateSnapshot(store.state, store.project);
    expect(terminalCandidates(store.state.knowledge!, store.state.coordination!.jobs!)).toEqual([]);
    expect(store.state.knowledge!.consumed).toHaveLength(4);
    // Later hooks for the same already-visible events are no-ops.
    const [, , parked, budget] = store.state.coordination!.jobs!;
    recordParked(store, parked, 'Needs Joe');
    enqueueRepairDiagnosis(store, budget);
    expect(store.state.knowledge!.pending).toEqual([]);
});

test('a reload never reseeds, trimming display history never re-triggers, and new completions are picked up', () => {
    const { store } = setup();
    const done = job({ status: 'completed' });
    store.state.coordination!.jobs!.push(done);
    migrateSnapshot(store.state, store.project); // knowledge already exists: no baseline
    expect(terminalCandidates(store.state.knowledge!, store.state.coordination!.jobs!).map(c => c.id)).toEqual([completedId(done)]);
    store.state.knowledge!.consumed.push(completedId(done));
    store.state.knowledge!.retrospectives = [];
    expect(terminalCandidates(store.state.knowledge!, store.state.coordination!.jobs!)).toEqual([]);
});

test('turning retrospectives off and on keeps queued work and does not replay what finished meanwhile', () => {
    const { store } = setup();
    const parked = job({ status: 'blocked', steps: [{ stage: 'review', result: result('review') }] });
    store.state.coordination!.jobs!.push(parked);
    recordParked(store, parked, 'Decision needed');
    configureKnowledge(store, { enabled: false });
    const finished = job({ status: 'completed' });
    store.state.coordination!.jobs!.push(finished);
    recordCIBudget(store, job({ ciRepairs: [{ id: 'ci-1' } as never] })); // recorded while off: consumed, not queued
    configureKnowledge(store, { enabled: true });
    expect(store.state.knowledge!.pending.map(p => p.trigger)).toEqual(['parked']);
    expect(terminalCandidates(store.state.knowledge!, store.state.coordination!.jobs!)).toEqual([]);
});

test('a park survives a resume before Harper runs, and repeated hooks record once', () => {
    const { store } = setup();
    const parked = job({ status: 'blocked', stage: 'review', steps: [{ stage: 'review', result: result('review') }], parked: { stage: 'review', reason: 'Scope question', at: '', published: true } });
    store.state.coordination!.jobs!.push(parked);
    recordParked(store, parked, 'Scope question');
    recordParked(store, parked, 'Scope question');
    delete parked.parked; parked.status = 'queued'; // resume.ts
    expect(store.state.knowledge!.pending).toHaveLength(1);
    expect(store.state.knowledge!.pending[0]).toMatchObject({ trigger: 'parked', event: { stage: 'review', steps: 1, reason: 'Scope question' } });
});

test('original and revised source-repair windows on the same head are two retrospectives with one IT request', () => {
    const { store } = setup();
    const exhausted = job({ status: 'blocked', repairCycle: cycle() });
    store.state.coordination!.jobs!.push(exhausted);
    enqueueRepairDiagnosis(store, exhausted);
    enqueueRepairDiagnosis(store, exhausted);
    exhausted.repairCycle = { ...exhausted.repairCycle!, approachRevision: 1 }; // revisedRepair keeps diagnosisRequestId
    enqueueRepairDiagnosis(store, exhausted);
    expect(store.state.knowledge!.pending.map(p => p.trigger)).toEqual(['repair-budget', 'repair-budget']);
    expect(new Set(store.state.knowledge!.pending.map(p => p.id)).size).toBe(2);
    expect(store.state.messages.filter(m => m.to === 'it')).toHaveLength(1);
});

test('CI budget exhaustion records once per exhausted repair', () => {
    const { store } = setup();
    const ci = job({ ciRepairs: [{ id: 'ci-1' }, { id: 'ci-2' }, { id: 'ci-3' }] as never });
    recordCIBudget(store, ci);
    recordCIBudget(store, ci);
    expect(store.state.knowledge!.pending).toHaveLength(1);
    expect(store.state.knowledge!.pending[0].id).toBe(`${ci.id}:repair-budget:ci:ci-3`);
});

test('non-GitHub projects are out of scope for this slice', () => {
    const { store } = setup('cec');
    enqueueRepairDiagnosis(store, { id: 'run', key: 'CEC-1', head: '', steps: [], repairCycle: cycle() });
    expect(store.state.knowledge!.pending).toEqual([]);
});
