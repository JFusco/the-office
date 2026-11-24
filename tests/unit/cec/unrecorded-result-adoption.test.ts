import { expect, test } from 'vitest';
import { Engine } from '../../../server/scheduling/engine';
import { JiraOperations } from '../../../server/cec/jira-operations';
import { fakeJira } from './parking/fake-jira';
import { cecStore, decision, ticket } from './parking/fixtures';
import { resumeStep } from '../../../server/cec/resume-step';
import { savedState } from '../store/saved-state-fixture';

test('adopting a retest result the ticket never received reuses its attempt, runs nothing again and keeps one Jira comment receipt', async () => {
    const { store, clock } = cecStore(), jira = fakeJira({ 'CEC-900': { status: 'QA' } });
    const t = { ...ticket('QA'), stage: 'retest' as const, activity: 'waiting' as const };
    t.results.retest = decision('', { outcome: 'failed', summary: 'Earlier retest', commit: 'b'.repeat(40), resolution: null });
    store.state.tickets = [t];
    const engine = new Engine(store);
    engine.jira = new JiraOperations(store, jira.execute);
    let transitions = 0, workers = 0;
    engine.agents.transition = async () => { transitions++; throw new Error('No PM transition on adoption'); };
    engine.agents.stage = async () => { workers++; throw new Error('No worker on adoption'); };

    // The first run: the worker returned, the harness posted and read back the QA comment and saved the attempt, but not the ticket.
    const attemptId = store.begin(t, 'retest');
    const returned = decision('', { summary: 'Needs a Target DXP and a second BA', blocker: 'Needs a Target DXP and a second BA', resolution: null });
    clock.advance(1000);
    const startedAt = clock.now().toISOString();
    await engine.jira.qaComment(t, 'retest', attemptId, returned);
    clock.advance(1000);
    store.state.workLog = [{ id: 'run-1', ticket: t.key, stage: 'retest', role: 'qa', status: 'blocked', executionStatus: 'completed', startedAt, endedAt: clock.now().toISOString() } as any];
    clock.advance(1000);
    store.finish(attemptId, returned);
    const comments = (receipts: any[]) => receipts.filter(receipt => receipt.action === 'jira-comment');
    expect(comments(returned.receipts)).toHaveLength(1);

    await engine.run(t.key);

    const live = store.ticket(t.key);
    expect(live.recoveredAttemptId).toBe(attemptId);
    expect(store.db.prepare("SELECT id FROM attempts WHERE ticket=? AND stage='retest'").all(t.key)).toEqual([{ id: attemptId }]);
    expect([transitions, workers]).toEqual([0, 0]);
    expect(jira.calls.filter(args => args[2] === 'comment' && args[3] === 'create')).toHaveLength(1);
    expect(store.db.prepare("SELECT id, status FROM effects WHERE id LIKE 'qa-comment:%'").all()).toEqual([{ id: `qa-comment:${attemptId}`, status: 'verified' }]);
    expect(live.results.retest).toMatchObject({ outcome: 'blocked', summary: 'Needs a Target DXP and a second BA' });
    const saved = JSON.parse((store.db.prepare('SELECT body FROM attempts WHERE id=?').get(attemptId) as any).body);
    for (const receipts of [live.results.retest!.receipts, saved.receipts]) {
        expect(comments(receipts)).toHaveLength(1);
        expect(comments(receipts)[0]).toMatchObject({ id: jira.state['CEC-900'].comments[0].id, verified: true, uncertain: false });
    }
});

test('a returned result whose application throws is marked through the runner\'s failure path, so the stage runs again', async () => {
    const { store, clock } = cecStore();
    // A review that lowers the review level while findings are open cannot be recorded (recordApproach throws).
    const t = { ...ticket('QA'), stage: 'code-review' as const, activity: 'waiting' as const, approach: { plan: 'none', review: 'focused', validation: 'browser', checks: ['x'], reason: 'r' } as any,
        findings: [{ id: 'F1', summary: 's', expected: 'e', actual: 'a', status: 'open', attempts: 0 } as any] };
    store.state.tickets = [t];
    const attemptId = store.begin(t, 'code-review');
    clock.advance(1000); const startedAt = clock.now().toISOString(); clock.advance(1000);
    store.state.workLog = [{ id: 'run-1', ticket: t.key, stage: 'code-review', role: 'lead', status: 'completed', executionStatus: 'completed', startedAt, endedAt: clock.now().toISOString() } as any];
    clock.advance(1000);
    store.finish(attemptId, decision('', { outcome: 'passed', summary: 'Reviewed', blocker: '', resolution: null, paidRuns: 0, approach: { plan: 'none', review: 'none', validation: 'browser', checks: ['x'], reason: 'less' } as any }));
    store.save();
    const engine = new Engine(store);
    let workers = 0;
    engine.agents.transition = async () => { throw new Error('No PM transition on adoption'); };
    engine.agents.stage = async () => { workers++; throw new Error('No worker on adoption'); };
    await engine.run(t.key);
    const saved = savedState(store).tickets[0];
    expect(saved).toMatchObject({ activity: 'blocked', recoveredAttemptId: attemptId });
    expect(resumeStep(store, store.ticket(t.key))).toBe('run-stage');
    expect(workers).toBe(0);
});
