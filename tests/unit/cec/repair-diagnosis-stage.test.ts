import { expect, test, vi } from 'vitest';
import { Engine } from '../../../server/scheduling/engine';
import { cecStore, decision, ticket } from './parking/fixtures';
import { cecReadbackPrompt } from '../../../server/cec/prompts/cec-reads';
import { CEC, DATA } from '../../../server/office/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cycle = (): any => ({ owner: 'developer', findingAttempts: { F1: 2 }, attempts: 6, pendingFindingIds: ['F1'], sourceStage: 'retest', sourceHead: 'a'.repeat(40), phase: 'diagnosis' });

test('the revised-approach assessment after the repair budget runs out asks for no Jira status move; a code review of a candidate still does', async () => {
    for (const [name, repairCycle, moves] of [['assessment', cycle(), 0], ['code review', undefined, 1]] as [string, any, number][]) {
        const { store } = cecStore(), t = { ...ticket('QA'), stage: 'code-review' as const, activity: 'waiting' as const, repairCycle };
        store.state.tickets = [t];
        const engine = new Engine(store);
        engine.agents.transition = vi.fn(async () => decision('', { outcome: 'blocked', resolution: null, blocker: 'The latest retest requires repair first.' }));
        engine.jira.verifyStatus = async (_ticket, _target, update) => update;
        engine.agents.stage = vi.fn(async () => decision('', { resolution: null, blocker: 'No changed approach is available.' }));
        await engine.run(t.key);
        const live = store.ticket(t.key);
        expect(engine.agents.transition, name).toHaveBeenCalledTimes(moves);
        // The assessment reaches Sam and is marked as attempted; the code review stops at the refused status move.
        expect(engine.agents.stage, name).toHaveBeenCalledTimes(moves ? 0 : 1);
        expect(live.repairCycle?.diagnosisAttempted, name).toBe(moves ? undefined : true);
        expect(live.status, name).toBe('QA');
        expect(live.blocker, name).toBe(moves ? 'The latest retest requires repair first.' : 'No changed approach is available.');
    }
});

test('the PM read-back is told the exhausted budget is why the assessment is dispatched, only until that assessment has run', () => {
    const { store } = cecStore(), t = { ...ticket('QA'), stage: 'code-review' as const, activity: 'blocked' as const, repairCycle: cycle() };
    store.state.tickets = [t];
    expect(cecReadbackPrompt(store, t.key)).toContain('REVISED-APPROACH ASSESSMENT: This ticket\'s repair budget is exhausted');
    expect(cecReadbackPrompt(store, t.key)).toContain('not blockers for it. Still return any other current hold.');
    t.repairCycle.diagnosisAttempted = true;
    expect(cecReadbackPrompt(store, t.key)).not.toContain('REVISED-APPROACH ASSESSMENT');
    t.repairCycle = { ...cycle(), phase: 'repair' };
    expect(cecReadbackPrompt(store, t.key)).not.toContain('REVISED-APPROACH ASSESSMENT');
    Object.assign(t, { stage: 'retest', repairCycle: cycle() });
    expect(cecReadbackPrompt(store, t.key)).not.toContain('REVISED-APPROACH ASSESSMENT');
});

test('CEC-154\'s shape end to end: a resume after refused dispatches reaches Sam with no reconciliation and no status move', async () => {
    const { store } = cecStore(), t = { ...ticket('QA'), stage: 'code-review' as const, activity: 'blocked' as const, pilot: true, repairCycle: cycle(),
        blocker: 'Error: Reconciliation incomplete: The request-size finding remains open and the six-attempt repair budget remains exhausted.' };
    t.findings = [{ id: 'F1', summary: 'Request too large', expected: '', actual: '', status: 'open', attempts: 2 }];
    store.state.tickets = [t];
    store.state.workLog = [{ id: 'w1', ticket: t.key, role: 'pm', stage: 'reconcile', status: 'blocked' } as any];
    const engine = new Engine(store);
    engine.agents.readback = vi.fn(async () => ({ key: t.key, assignee: CEC.account, subtask: false, boardMember: true, status: 'QA', statusId: '10300', updated: '', existingPrId: t.prId, existingOwner: '', blocker: '' }));
    engine.agents.reconcile = vi.fn(); engine.agents.transition = vi.fn();
    engine.agents.stage = vi.fn(async () => decision('', { outcome: 'failed', resolution: { kind: 'source-repair', findingIds: ['F1'], evidenceIds: ['diagnosis'] } as any, summary: 'Split the request.', blocker: '',
        evidence: [{ id: 'diagnosis', kind: 'review', summary: 'Diagnosis', path: '/synthetic/diagnosis.md', commit: 'a'.repeat(40), environment: 'unit', url: '', observedAt: '' }],
        approach: { plan: 'brief', review: 'focused', validation: 'browser', checks: ['Request stays under the limit'], reason: 'Send the document in parts' } as any,
        findings: [{ id: 'F1', summary: 'Request too large', expected: '', actual: '', status: 'open', attempts: 2 }] }));
    await engine.resume(t.key, false);
    const live = store.ticket(t.key);
    expect(engine.agents.reconcile).not.toHaveBeenCalled();
    expect(live).toMatchObject({ stage: 'code-review', activity: 'waiting', blocker: '' });
    await engine.run(t.key);
    expect(engine.agents.transition).not.toHaveBeenCalled();
    expect(engine.agents.stage).toHaveBeenCalledOnce();
    expect((engine.agents.stage as any).mock.calls[0].slice(1)).toEqual(['code-review', 'lead']);
    expect(store.ticket(t.key).repairCycle?.diagnosisAttempted).toBe(true);
});

const finding = () => ({ id: 'F1', summary: 'Request too large', expected: '', actual: '', status: 'open' as const, attempts: 2 });
/** Sam's assessment as CEC-154 returned it: a changed approach that names a lighter plan level than the ticket holds. */
function assessment(runId: string) {
    const root = resolve(DATA, 'runs', runId), path = resolve(root, 'diagnosis.md');
    mkdirSync(root, { recursive: true }); writeFileSync(path, 'diagnosis');
    return decision('', { resolution: { kind: 'source-repair', findingIds: ['F1'], evidenceIds: ['diagnosis'] } as any, summary: 'Trim the bundle.', blocker: 'The harness must assess this proposal.',
        evidence: [{ id: 'diagnosis', kind: 'review', summary: 'Diagnosis', path, commit: 'a'.repeat(40), environment: 'unit', url: '', observedAt: '' }],
        approach: { plan: 'brief', review: 'full', validation: 'browser', checks: ['Request stays under the limit'], reason: 'Trim the bundle' } as any, findings: [finding()] });
}
const held = { plan: 'reviewed', review: 'full', validation: 'browser', checks: ['Original checks'], reason: 'Original' } as any;

test('a revised approach that names a lighter plan level extends the repair window with the ticket\'s levels held', async () => {
    const { store } = cecStore(), t = { ...ticket('QA'), stage: 'code-review' as const, activity: 'waiting' as const, repairCycle: cycle(), approach: held, findings: [finding()] };
    store.state.tickets = [t];
    const engine = new Engine(store), stages: string[] = [];
    engine.agents.stage = vi.fn(async (_ticket: any, stage: string) => { stages.push(stage); if (stage !== 'code-review') throw new Error('Stop at the repair'); return assessment(t.runId); }) as any;
    await engine.run(t.key);
    const live = store.ticket(t.key);
    expect(stages).toEqual(['code-review']);
    expect(live).toMatchObject({ stage: 'repair', activity: 'waiting', blocker: '' });
    expect(live.stage).toBe('repair');
    expect(live.repairCycle).toMatchObject({ phase: 'repair', approachRevision: 1, findingAttempts: { F1: 3 } });
    expect(live.approach).toMatchObject({ plan: 'reviewed', review: 'full', validation: 'browser', checks: ['Request stays under the limit'], reason: 'Trim the bundle' });
    expect(live.results['code-review']?.summary).toBe('Trim the bundle.');
});

test('an assessment that returned but never reached the ticket is applied on the next run; Sam is not run again', async () => {
    const { store, clock } = cecStore(), t = { ...ticket('QA'), stage: 'code-review' as const, activity: 'waiting' as const, approach: held, findings: [finding()],
        repairCycle: { ...cycle(), diagnosisAttempted: true }, blocker: '' };
    t.results['code-review'] = decision('', { outcome: 'failed', summary: 'Earlier review', resolution: null });
    store.state.tickets = [t];
    const attemptId = store.begin(t, 'code-review');
    clock.advance(1000);
    const startedAt = clock.now().toISOString();
    clock.advance(1000);
    store.state.workLog = [{ id: 'run-1', ticket: t.key, stage: 'code-review', role: 'lead', status: 'blocked', executionStatus: 'completed', startedAt, endedAt: clock.now().toISOString() } as any];
    clock.advance(1000);
    store.finish(attemptId, assessment(t.runId));
    expect(cecReadbackPrompt(store, t.key)).toContain('RETURNED ASSESSMENT: Sam\'s single revised-approach assessment for this ticket has already run');
    const engine = new Engine(store), stages: string[] = [];
    engine.agents.transition = vi.fn();
    engine.agents.stage = vi.fn(async (_ticket: any, stage: string) => { stages.push(stage); throw new Error('Stop at the repair'); }) as any;
    await engine.run(t.key);
    const live = store.ticket(t.key);
    expect(stages).toEqual([]);
    expect(live).toMatchObject({ stage: 'repair', activity: 'waiting', blocker: '' });
    expect(engine.agents.transition).not.toHaveBeenCalled();
    expect(live.recoveredAttemptId).toBe(attemptId);
    expect(live.stage).toBe('repair');
    expect(live.repairCycle).toMatchObject({ phase: 'repair', approachRevision: 1, diagnosisAttempted: true });
    expect(live.approach).toMatchObject({ plan: 'reviewed', checks: ['Request stays under the limit'] });
    expect(cecReadbackPrompt(store, t.key)).not.toContain('RETURNED ASSESSMENT');
});

test('with no returned result to apply, an assessment already attempted is still never run again', async () => {
    const { store } = cecStore(), t = { ...ticket('QA'), stage: 'code-review' as const, activity: 'waiting' as const, repairCycle: { ...cycle(), diagnosisAttempted: true } };
    store.state.tickets = [t];
    const engine = new Engine(store);
    engine.agents.stage = vi.fn();
    await engine.run(t.key).catch(() => undefined);
    expect(engine.agents.stage).not.toHaveBeenCalled();
    expect(store.ticket(t.key).stage).toBe('code-review');
    expect(cecReadbackPrompt(store, t.key)).not.toContain('RETURNED ASSESSMENT');
});

test('a proposal that differs from the exhausted approach only by a lighter level does not extend the repair window', async () => {
    const exhausted = JSON.stringify({ plan: held.plan, review: held.review, validation: held.validation, checks: held.checks });
    const { store } = cecStore(), t = { ...ticket('QA'), stage: 'code-review' as const, activity: 'waiting' as const, repairCycle: { ...cycle(), exhaustedApproach: exhausted }, approach: held, findings: [finding()] };
    store.state.tickets = [t];
    const engine = new Engine(store);
    engine.agents.stage = vi.fn(async () => ({ ...assessment(t.runId), approach: { ...held, plan: 'brief' } })) as any;
    await engine.run(t.key);
    const live = store.ticket(t.key);
    expect(live).toMatchObject({ stage: 'code-review', activity: 'blocked', blocker: 'The harness must assess this proposal.' });
    expect(live.repairCycle).toMatchObject({ phase: 'diagnosis', attempts: 6 });
    expect(live.repairCycle?.approachRevision).toBeUndefined();
    expect(live.approach).toEqual(held);
});
