import { expect, test } from 'vitest';
import { drainStages } from '../../../fixtures/scheduler';
import { Engine } from '../../../../server/scheduling/engine';
import { JiraOperations } from '../../../../server/cec/jira-operations';
import { reconcileAndResumeParked } from '../../../../server/cec/parking/resume-parked';
import { cecReadbackPrompt } from '../../../../server/cec/prompts/cec-reads';
import { cecPrompt } from '../../../../server/cec/prompts/cec';
import { CEC } from '../../../../server/office/config';
import { fakeJira } from './fake-jira';
import { cecStore, decision, ticket } from './fixtures';
import type { Stage, StageResult } from '../../../../src/shared';

const passedTransition = (): StageResult => ({ ...decision('human-hold'), outcome: 'passed', resolution: null, blocker: '', receipts: [{ id: 'status', action: 'jira-transition', target: 'fixture', verified: true, uncertain: false, detail: 'Synthetic read-back' }] });

for (const [stage, status] of [['implement', 'In Progress'], ['code-review', 'Code Review'], ['qa', 'QA']] as [Stage, string][]) {
    test(`${stage}: a decision parks in Blocked and moving it back to ${status} reruns ${stage} on the same candidate`, async () => {
        const { store, clock } = cecStore(), t = { ...ticket(status), stage, activity: 'waiting' as const }, jira = fakeJira({ 'CEC-900': { status } });
        store.state.tickets = [t];
        const engine = new Engine(store), stages: Stage[] = [];
        engine.jira = new JiraOperations(store, jira.execute);
        engine.agents.transition = async () => passedTransition();
        engine.agents.stage = async (_ticket, current) => {
            stages.push(current);
            return stages.length === 1 ? decision('human-hold') : { ...decision('human-hold'), resolution: null, blocker: 'Synthetic second pass stop' };
        };
        let readbackPrompt = '';
        engine.agents.readback = async (key: string) => {
            readbackPrompt = cecReadbackPrompt(store, key);
            return { key, assignee: CEC.account, subtask: false, boardMember: true, status, statusId: '', updated: '', existingPrId: t.prId, existingOwner: '', blocker: '' };
        };
        await drainStages(engine, t.key);
        const live = store.ticket(t.key);
        expect(live).toMatchObject({ stage, activity: 'blocked', commit: 'a'.repeat(40), parked: { stage, fromStatus: status, published: true } });
        expect(jira.state['CEC-900'].status).toBe('Blocked');
        expect(live.results[stage]?.resolution?.kind).toBe('human-hold');

        await expect(engine.resume(t.key)).rejects.toThrow(`move it back to ${status}`);
        expect(live.parked).toBeDefined();

        jira.state['CEC-900'].status = status;
        clock.advance(60000);
        await reconcileAndResumeParked(store, jira.execute, key => engine.requestDelivery(key, 'resume-ticket'));
        await engine.drainDelivery();
        expect(readbackPrompt).toContain(`Joe has since moved it back to ${status}`);
        expect(live.parked).toBeUndefined();
        expect(live).toMatchObject({ stage, activity: 'waiting', blocker: '', resolvedDecision: { status, reason: 'Which locale should own the fallback copy?' } });
        expect(cecPrompt(store, live, stage, 'developer', '/tmp/office-unit')).toContain(`was resolved when Joe moved the ticket back to ${status}`);

        await engine.run(t.key);
        expect(stages).toEqual([stage, stage]);
        expect(live.commit).toBe('a'.repeat(40));
        expect(jira.writes()).toBe(2);
    });
}
