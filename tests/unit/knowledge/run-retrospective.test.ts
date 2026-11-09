import { afterEach, expect, test } from 'vitest';
import { runRetrospective, retryDelay, RETROSPECTIVE_TIMEOUT, type RetrospectiveRunner } from '../../../server/knowledge/run-retrospective';
import { scheduledRetrospectives } from '../../../server/knowledge/scheduled-retrospectives';
import { acceptRetrospective } from '../../../server/knowledge/accept-retrospective';
import { retrospectiveFacts, PACKET_LIMIT } from '../../../server/knowledge/retrospective-facts';
import { jobSubject } from '../../../server/knowledge/retrospective-subject';
import { completedId } from '../../../server/knowledge/retrospective-triggers';
import type { RetrospectiveResult } from '../../../server/knowledge/retrospective-result';
import { job, knowledgeStore, result } from './knowledge-fixture';
import { captureLearning } from '../../../server/knowledge/learning-events';
import { maintainLearning } from '../../../server/knowledge/learning-maintenance';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
function setup() {
    const fixture = knowledgeStore(); cleanup.push(fixture.close);
    const done = job({ status: 'completed', stage: 'closeout', pr: 7, steps: [
        { stage: 'review', result: result('review', { outcome: 'failed', findings: [{ id: 'F1', summary: 'Catalog drifted', expected: 'in sync', actual: 'stale', status: 'open', attempts: 1 }] }) },
        { stage: 'validate', result: result('validate', { findings: [{ id: 'F1', summary: 'Catalog verified', expected: 'in sync', actual: 'in sync', status: 'verified', attempts: 1 }] }) },
    ] });
    fixture.store.state.coordination!.jobs!.push(done);
    return { ...fixture, done, id: completedId(done) };
}
const lesson = (statement: string, evidenceIds: string[]): RetrospectiveResult['lessons'][number] => ({ tier: 'guidance', statement, detail: 'Why it matters', kind: 'pitfall', stages: ['implement'], paths: ['scripts/wiki'], evidenceIds, repositoryInstruction: false });

test('a failed run waits with capped backoff instead of blocking, then a later success consumes the trigger', async () => {
    const { store, advance, done } = setup();
    captureLearning(store, { kind: 'job', id: done.id }, done.key, 'review', '0', done.steps[0].result, 'Accepted negative review', 'work', true);
    maintainLearning(store);
    const id = store.state.knowledge!.pending[0].id;
    const packetRef = store.state.knowledge!.pending[0].opportunities![0].evidence[0].ref;
    let provisional = '';
    const failing = (async () => { provisional = store.state.knowledge!.pending[0].nextAt; throw new Error('provider overloaded'); }) as RetrospectiveRunner;
    await runRetrospective(store, failing, id);
    const pending = store.state.knowledge!.pending[0];
    // The deadline was persisted before awaiting, so a crash mid-run cannot relaunch immediately.
    expect(Date.parse(provisional) - store.clock.now().getTime()).toBe(RETROSPECTIVE_TIMEOUT + retryDelay(1));
    expect(pending).toMatchObject({ attempts: 1, lastError: 'provider overloaded' });
    expect(Date.parse(pending.nextAt) - store.clock.now().getTime()).toBe(retryDelay(1));
    const [item] = scheduledRetrospectives(store, failing);
    expect(item.eligibility).toMatchObject({ state: 'waiting', nextCheckAt: pending.nextAt });
    expect(item.claimEligible!()).toBe(false);
    expect(store.state.messages.some(m => m.to === 'it')).toBe(false); // no human or IT escalation

    advance(retryDelay(1));
    expect(scheduledRetrospectives(store, failing)[0].eligibility.state).toBe('runnable');
    await runRetrospective(store, (async () => ({ summary: 'Catalog drift caused one repair.', lessons: [lesson('Regenerate the catalog before review', [packetRef, 'invented:ref'])], recurrences: [] })) as RetrospectiveRunner, id);
    const knowledge = store.state.knowledge!;
    expect(knowledge.pending).toEqual([]);
    expect(knowledge.consumed).toContain(id);
    expect(knowledge.retrospectives).toHaveLength(1);
    expect(knowledge.lessons[0]).toMatchObject({ status: 'active', evidence: [{ ref: packetRef, kind: 'learning' }] });
    expect(scheduledRetrospectives(store, failing)).toEqual([]);
});

test('backoff doubles from five minutes to a six-hour cap and never exhausts', () => {
    expect([1, 2, 3].map(retryDelay)).toEqual([300000, 600000, 1200000]);
    expect(retryDelay(50)).toBe(6 * 3600000);
});

test('acceptance is lenient: duplicates, retired repeats and unsupported proposals are skipped, zero lessons still completes', () => {
    const { store, done, id } = setup();
    const packet = retrospectiveFacts(store, jobSubject(store, done), { id, trigger: 'completed', event: { stage: 'closeout', head: '', steps: 2, reason: '' } });
    const step = `step:${done.id}:1`;
    store.state.knowledge!.lessons.push({ id: 'old', scope: 'project', recurrences: [], kind: 'pitfall', statement: 'Run the wiki build', detail: '', stages: ['any'], paths: [], status: 'retired', evidence: [], sourceRetrospectiveId: 'x', createdAt: '', updatedAt: '' });
    acceptRetrospective(store, { id, jobId: done.id, key: done.key, trigger: 'completed' }, packet, { summary: 'Done.', lessons: [
        lesson('  run the WIKI   build ', [step]),          // repeats a retired lesson: stays retired
        lesson('Commit generated artifacts', [step]),
        lesson('commit generated artifacts', [step]),      // duplicate within the same result
        lesson('Unsupported claim', ['nope']),             // no usable evidence
        lesson('Prototype key claim', ['toString', '__proto__', 'constructor']), // inherited keys are not evidence
    ] }, 'claim-1');
    const knowledge = store.state.knowledge!;
    expect(knowledge.lessons.map(l => [l.statement, l.status])).toEqual([['Run the wiki build', 'retired'], ['Commit generated artifacts', 'active']]);
    acceptRetrospective(store, { id, jobId: done.id, key: done.key, trigger: 'completed' }, packet, { summary: 'Again.', lessons: [lesson('Another', [step])] }, 'claim-2');
    expect(knowledge.lessons).toHaveLength(2); // an accepted trigger is never applied twice
    expect(knowledge.retrospectives).toHaveLength(1);
});

test('evidence references are job-qualified per step, so a finding id repeated across steps stays distinct', () => {
    const { store, done, id } = setup();
    const packet = retrospectiveFacts(store, jobSubject(store, done), { id, trigger: 'completed', event: { stage: 'closeout', head: '', steps: 2, reason: '' } });
    expect(Object.keys(packet.catalog).filter(ref => ref.startsWith('finding:'))).toEqual([`finding:${done.id}:0:F1`, `finding:${done.id}:1:F1`]);
});

test('the fact packet stays bounded and keeps the triggering step', () => {
    const { store, id } = setup();
    const big = job({ status: 'completed', steps: Array.from({ length: 40 }, (_, i) => ({ stage: 'review', result: result('review', { summary: 'x'.repeat(5000), findings: Array.from({ length: 30 }, (_, f) => ({ id: `F${f}`, summary: 'y'.repeat(2000), expected: '', actual: '', status: 'open' as const, attempts: i })) }) })) });
    const packet = retrospectiveFacts(store, jobSubject(store, big), { id, trigger: 'parked', event: { stage: 'review', head: '', steps: 3, reason: '' } });
    expect(JSON.stringify(packet).length).toBeLessThanOrEqual(PACKET_LIMIT);
    expect(packet.steps.some(step => (step as { index: number }).index === 2)).toBe(true);
    expect(packet.omitted.steps).toBeGreaterThan(0);
});

test('a retrospective for a job that is no longer retained completes without a model call', async () => {
    const { store, id } = setup();
    store.state.knowledge!.pending.push({ id: 'gone-job:parked:1', jobId: 'gone-job', key: 'GH-9', trigger: 'parked', createdAt: '', event: { stage: '', head: '', steps: 1, reason: '' }, attempts: 0, nextAt: '', lastError: '' });
    let calls = 0;
    await runRetrospective(store, (async () => { calls++; return { summary: '', lessons: [], recurrences: [] }; }) as RetrospectiveRunner, 'gone-job:parked:1');
    expect(calls).toBe(0);
    expect(store.state.knowledge!.consumed).toContain('gone-job:parked:1');
    expect(id).toBeTruthy();
});
