import { expect, test, vi } from 'vitest';
import { Engine } from '../../../server/scheduling/engine';
import { cecStore, decision, ticket } from './parking/fixtures';
import { cecReadbackPrompt } from '../../../server/cec/prompts/cec-reads';

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
