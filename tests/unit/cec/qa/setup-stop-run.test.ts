import { expect, test, vi } from 'vitest';
import { Engine } from '../../../../server/scheduling/engine';
import { JiraOperations } from '../../../../server/cec/jira-operations';
import { isSetupStop } from '../../../../server/cec/qa/setup-stop-cap';
import { fakeJira } from '../parking/fake-jira';
import { cecStore, decision, ticket } from '../parking/fixtures';

const setupStop = (extra: object = {}) => decision('', { resolution: null, paidRuns: 0, summary: 'Nothing was tested.', blocker: 'The test browser is not running.',
    qa: { setup: { status: 'blocked', summary: 'The test browser is not running.', owner: 'Riley', nextAction: 'Start the browser', url: '', actor: '', resources: [] }, cases: [{ id: 'c1', status: 'not-tested' }, { id: 'c2', status: 'blocked' }] } as any, ...extra });
const moved = () => ({ ...decision(''), outcome: 'passed' as const, resolution: null, blocker: '', receipts: [{ id: 'status', action: 'jira-transition', target: 'CEC-900', verified: true, uncertain: false, detail: 'Synthetic read-back' }] });

function engineFor(result: ReturnType<typeof setupStop>, prior?: ReturnType<typeof setupStop>) {
    const { store } = cecStore(), jira = fakeJira({ 'CEC-900': { status: 'QA' } });
    const t = { ...ticket('QA'), stage: 'retest' as const, activity: 'waiting' as const };
    if (prior) t.results.retest = prior;
    store.state.tickets = [t];
    const engine = new Engine(store);
    engine.jira = new JiraOperations(store, jira.execute);
    engine.agents.transition = vi.fn(async () => moved());
    engine.jira.verifyStatus = async (_ticket, _target, update) => update;
    engine.agents.stage = vi.fn(async () => result);
    return { store, jira, engine, t };
}
const comments = (jira: ReturnType<typeof fakeJira>) => jira.calls.filter(args => args[2] === 'comment' && args[3] === 'create').length;

test('a setup stop is what it says: blocked in setup with no paid run', () => {
    expect(isSetupStop(setupStop())).toBe(true);
    expect(isSetupStop(setupStop({ paidRuns: 1 }))).toBe(false);
    expect(isSetupStop(setupStop({ paidRuns: null }))).toBe(false);
    expect(isSetupStop(setupStop({ outcome: 'failed' }))).toBe(false);
    expect(isSetupStop(decision('', { paidRuns: 0 }))).toBe(false);
    // A run that exercised a case tested something, whatever its setup says.
    const exercised = setupStop(); (exercised.qa as any).cases[0].status = 'failed';
    expect(isSetupStop(exercised)).toBe(false);
    expect(isSetupStop(undefined)).toBe(false);
});

test('a QA run that stopped in setup posts no QA comment; a run that tested something still does', async () => {
    const stopped = engineFor(setupStop());
    await stopped.engine.run('CEC-900');
    expect(comments(stopped.jira)).toBe(0);
    expect(stopped.store.ticket('CEC-900')).toMatchObject({ stage: 'retest', activity: 'blocked', blocker: 'The test browser is not running.' });
    expect(stopped.store.db.prepare("SELECT count(*) AS n FROM effects WHERE id LIKE 'qa-comment:%'").get()).toEqual({ n: 0 });

    const tested = engineFor(decision('', { resolution: null, paidRuns: 2, summary: 'Two cases failed.', blocker: 'Two cases failed.' }) as any);
    await tested.engine.run('CEC-900');
    expect(comments(tested.jira)).toBe(1);
});

test('a setup stop that parks for a person, or that sends the ticket to repair, still posts its QA comment', async () => {
    const decisionStop = engineFor(setupStop({ resolution: { kind: 'human-hold', findingIds: [], evidenceIds: [] } }));
    await decisionStop.engine.run('CEC-900');
    expect(decisionStop.store.db.prepare("SELECT status FROM effects WHERE id LIKE 'qa-comment:%'").all()).toEqual([{ status: 'verified' }]);
    expect(decisionStop.jira.state['CEC-900'].status).toBe('Blocked');
    expect(decisionStop.store.ticket('CEC-900').parked).toMatchObject({ stage: 'retest', published: true });

    const finding = { id: 'F1', summary: 'The candidate does not start', expected: '', actual: '', status: 'open' as const, attempts: 0 };
    const repairStop = engineFor(setupStop({ findings: [finding], resolution: { kind: 'source-repair', findingIds: ['F1'], evidenceIds: ['e1'] },
        evidence: [{ id: 'e1', kind: 'checks', summary: 'Startup log', path: '/synthetic/startup.log', commit: 'a'.repeat(40), environment: 'unit', url: '', observedAt: '' }] }));
    await repairStop.engine.run('CEC-900');
    expect(comments(repairStop.jira)).toBe(1);
    expect(repairStop.store.ticket('CEC-900').stage).toBe('repair');
});

test('a QA stage run again after a setup stop spends no PM run on a status Jira already shows; otherwise the PM moves it', async () => {
    const again = engineFor(setupStop(), setupStop());
    again.engine.jira.statusHeld = vi.fn(async () => moved());
    await again.engine.run('CEC-900');
    expect(again.engine.jira.statusHeld).toHaveBeenCalledOnce();
    expect(again.engine.agents.transition).not.toHaveBeenCalled();
    expect(again.engine.agents.stage).toHaveBeenCalledOnce();
    expect(again.store.ticket('CEC-900').progressUpdates?.at(-1)).toMatchObject({ stage: 'retest', target: 'QA', result: { outcome: 'passed' } });
    expect(again.store.ticket('CEC-900').status).toBe('QA');

    const movedElsewhere = engineFor(setupStop(), setupStop());
    movedElsewhere.engine.jira.statusHeld = vi.fn(async () => undefined);
    await movedElsewhere.engine.run('CEC-900');
    expect(movedElsewhere.engine.agents.transition).toHaveBeenCalledOnce();

    const first = engineFor(setupStop());
    first.engine.jira.statusHeld = vi.fn(async () => moved());
    await first.engine.run('CEC-900');
    expect(first.engine.jira.statusHeld).not.toHaveBeenCalled();
    expect(first.engine.agents.transition).toHaveBeenCalledOnce();
});
