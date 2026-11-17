import { expect, test, vi } from 'vitest';
import { Engine } from '../../../server/scheduling/engine';
import { cecStore, decision, ticket } from './parking/fixtures';
import { cecReadbackPrompt } from '../../../server/cec/prompts/cec-reads';
import { CEC } from '../../../server/office/config';

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
