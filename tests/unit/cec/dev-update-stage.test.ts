import { expect, test } from 'vitest';
import { Engine } from '../../../server/scheduling/engine';
import { cecStore, decision, ticket } from './parking/fixtures';

test('a draft PR result the gate does not accept gets no Dev update; an accepted one gets exactly one', async () => {
    for (const [name, receipts, expected] of [['no verified draft PR receipt', [], 0], ['accepted', [{ id: 'draft', action: 'draft-pr', target: 'PR9', verified: true, uncertain: false, detail: 'Synthetic read-back' }], 1]] as [string, any[], number][]) {
        const { store } = cecStore(), t = { ...ticket('In Progress'), stage: 'draft-pr' as const, activity: 'waiting' as const };
        store.state.tickets = [t];
        const engine = new Engine(store), updates: string[] = [];
        engine.jira.devUpdate = async (_ticket, stage) => { updates.push(stage); return 'comment-1'; };
        engine.agents.transition = async () => { throw new Error('No transition is expected at draft-pr'); };
        engine.agents.stage = async () => decision('', { outcome: 'passed', resolution: null, blocker: '', summary: 'Draft pull request opened.', receipts });
        await engine.run(t.key);
        expect(updates, name).toHaveLength(expected);
        expect(store.ticket(t.key).activity === 'blocked', name).toBe(expected === 0);
    }
});
