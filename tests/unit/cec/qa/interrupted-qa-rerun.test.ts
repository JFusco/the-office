import { expect, test, vi } from 'vitest';
import { Engine } from '../../../../server/scheduling/engine';
import { rerunsInterruptedQA } from '../../../../server/cec/qa/interrupted-qa-rerun';
import { cecReadbackPrompt } from '../../../../server/cec/prompts/cec-reads';
import { interruptedRunNote, withoutInterruptedResult } from '../../../../server/cec/qa/interrupted-run-note';
import { CEC } from '../../../../server/office/config';
import { cecStore, decision, ticket } from '../parking/fixtures';

const LIMIT = 'codex exited 1: You’ve hit your usage limit. Visit the usage page to purchase more credits or try again at 7:19 PM.';
/** CEC-154's shape: a retest cut off by a provider usage limit; the runner recorded its own interrupted result. */
function interrupted(detail = LIMIT) {
    const { store } = cecStore(), t = ticket('QA');
    Object.assign(t, { stage: 'retest', activity: 'blocked', blocker: `Interrupted stage; external effects require reconciliation. Error: ${detail}`, stop: { kind: 'uncertain-effect', at: '2026-11-17T16:49:58Z' } });
    t.results.retest = decision('', { summary: t.blocker, blocker: t.blocker, resolution: null, paidRuns: null, receipts: [{ id: 'attempt-2', action: 'retest', target: t.key, verified: false, uncertain: true, detail: 'Worker did not return a verified final result' }] });
    store.state.tickets = [t];
    const work: any = { id: 'run-2', ticket: t.key, role: 'qa', stage: 'retest', status: 'failed', failure: { category: 'uncertain-effect', dispatched: true, detail } };
    store.state.workLog = [{ id: 'run-1', ticket: t.key, role: 'qa', stage: 'retest', status: 'failed', executionStatus: 'completed' } as any, work];
    return { store, t, work };
}
const effect = (store: any, t: any, status: string) => store.putEffect({ id: `qa-comment:${status}`, work: { projectId: store.project.id, kind: 'delivery', id: t.key }, attemptId: 'attempt-2', operation: 'jira-qa-comment', target: t.key, authorization: t.runId,
    payload: {}, expectedState: {}, status, createdAt: '', dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null });

test('a QA or retest run cut off by a provider usage limit, with nothing of the harness unsettled, is run again', () => {
    const { store, t } = interrupted();
    expect(rerunsInterruptedQA(store, t)).toBe(true);
    t.stage = 'qa'; store.state.workLog!.at(-1)!.stage = 'qa';
    expect(rerunsInterruptedQA(store, t)).toBe(true);
    for (const detail of ['codex exited 1: Rate limit reached for requests', 'claude exited 1: You exceeded your current quota', 'Usage limit reached']) {
        const x = interrupted(detail);
        expect(rerunsInterruptedQA(x.store, x.t), detail).toBe(true);
    }
});

test('anything else keeps today\'s reconciliation: another cause, another stage, a finished run, or an unsettled harness write', () => {
    const cases: [string, (x: ReturnType<typeof interrupted>) => void][] = [
        ['a crash', x => { x.work.failure.detail = 'codex exited 1: Connection lost'; }],
        ['a crash whose output tail mentions a limit', x => { x.work.failure.detail = `codex exited 1: ${'log line. '.repeat(40)}Jira answered 429: rate limit exceeded for this token`; }],
        ['a later worker on the ticket failed with an unknown write', x => { x.store.state.workLog!.push({ id: 'run-3', ticket: x.t.key, role: 'pm', stage: 'transition', status: 'failed', failure: { category: 'uncertain-effect', dispatched: true, detail: LIMIT } } as any); }],
        ['a harness write recorded but not yet sent', x => { effect(x.store, x.t, 'prepared'); }],
        ['a time limit', x => { x.work.failure.detail = 'Worker timed out after 90 minutes'; }],
        ['no failure recorded', x => { delete x.work.failure; }],
        ['the run returned', x => { x.work.executionStatus = 'completed'; }],
        ['its saved result was accepted', x => { x.work.completionAccepted = true; }],
        ['a later run of the stage', x => { x.store.state.workLog!.push({ id: 'run-3', ticket: x.t.key, role: 'qa', stage: 'retest', status: 'blocked', executionStatus: 'completed' } as any); }],
        ['staging QA', x => { x.t.stage = 'staging-qa'; x.work.stage = 'staging-qa'; }],
        ['a developer stage', x => { x.t.stage = 'repair'; x.work.stage = 'repair'; }],
        ['the limit hit another ticket', x => { x.work.ticket = 'CEC-901'; }],
        ['an uncertain harness write', x => { effect(x.store, x.t, 'uncertain'); }],
        ['a harness write still being sent', x => { effect(x.store, x.t, 'dispatching'); }],
    ];
    for (const [name, arrange] of cases) { const x = interrupted(); arrange(x); expect(rerunsInterruptedQA(x.store, x.t), name).toBe(false); }
    const settled = interrupted(); effect(settled.store, settled.t, 'verified'); effect(settled.store, settled.t, 'rejected');
    settled.store.state.workLog!.push({ id: 'talk', ticket: settled.t.key, role: 'qa', stage: 'conversation', status: 'completed', executionStatus: 'completed' } as any,
        { id: 'read', ticket: settled.t.key, role: 'pm', stage: 'readback', status: 'failed', failure: { category: 'transient-read', dispatched: true, detail: 'twg read timed out' } } as any);
    expect(rerunsInterruptedQA(settled.store, settled.t)).toBe(true);
});

test('the PM read-back is told the interruption is not a blocker only when the stage will be run again', () => {
    const { store, t, work } = interrupted();
    expect(cecReadbackPrompt(store, t.key)).toContain('INTERRUPTED RUN: The previous retest run was cut off by a provider usage limit');
    expect(cecReadbackPrompt(store, t.key)).toContain('the harness decides whether the stage runs again');
    work.failure.detail = 'codex exited 1: Connection lost';
    expect(cecReadbackPrompt(store, t.key)).not.toContain('INTERRUPTED RUN');
});

test('the worker that runs the stage again is told the interruption is history and does not see its placeholder result', () => {
    const { store, t, work } = interrupted();
    // The rerun's own entry is already running when its prompt is built.
    store.state.workLog!.push({ id: 'run-3', ticket: t.key, role: 'qa', stage: 'retest', status: 'running' } as any);
    expect(interruptedRunNote(store, t, 'retest')).toContain('RERUN AFTER A PROVIDER LIMIT: an earlier retest run');
    expect(withoutInterruptedResult(store, t, 'retest').results.retest).toBeUndefined();
    expect(t.results.retest).toBeDefined();
    expect(interruptedRunNote(store, t, 'repair')).toBe('');
    // A real result of the stage is never hidden, and a crash gets no such note.
    t.results.retest = decision('', { resolution: null });
    expect(interruptedRunNote(store, t, 'retest')).toBe('');
    expect(withoutInterruptedResult(store, t, 'retest').results.retest).toBeDefined();
    const crash = interrupted('codex exited 1: Connection lost');
    expect(interruptedRunNote(crash.store, crash.t, 'retest')).toBe('');
    work.status = 'failed';
});

test('resume sends the interrupted retest back to its stage without a completion reconciliation, and keeps a crash guarded', async () => {
    const live = (t: any) => ({ key: t.key, assignee: CEC.account, subtask: false, boardMember: true, status: 'QA', statusId: '10300', updated: '', existingPrId: t.prId, existingOwner: '', blocker: '' });
    const limit = interrupted(), engine = new Engine(limit.store);
    limit.t.pilot = true;
    engine.agents.readback = vi.fn(async () => live(limit.t)); engine.agents.reconcile = vi.fn(); engine.agents.stage = vi.fn();
    await engine.resume(limit.t.key, false);
    expect(engine.agents.reconcile).not.toHaveBeenCalled();
    expect(limit.t).toMatchObject({ stage: 'retest', activity: 'waiting', blocker: '', commit: 'a'.repeat(40) });
    // The scheduler then runs the stage again under a new attempt; the interrupted one stays in history.
    engine.jira.qaComment = async () => undefined;
    engine.jira.verifyStatus = async (_ticket, _target, update) => update;
    engine.agents.transition = vi.fn(async () => decision('', { outcome: 'passed', resolution: null, blocker: '', receipts: [{ id: 'status', action: 'jira-transition', target: 'QA', verified: true, uncertain: false, detail: 'Synthetic read-back' }] }));
    (engine.agents.stage as any).mockResolvedValue(decision('', { resolution: null, summary: 'Rerun result', blocker: 'Rerun result' }));
    await engine.run(limit.t.key);
    expect(engine.agents.stage).toHaveBeenCalledOnce();
    expect(limit.t.results.retest?.summary).toBe('Rerun result');
    expect(limit.store.db.prepare("SELECT COUNT(*) AS n FROM attempts WHERE ticket=? AND stage='retest'").get(limit.t.key)).toEqual({ n: 1 });

    const crash = interrupted('codex exited 1: Connection lost'), guarded = new Engine(crash.store);
    crash.t.pilot = true;
    guarded.agents.readback = vi.fn(async () => live(crash.t));
    guarded.agents.reconcile = vi.fn(async () => decision('', { resolution: null, blocker: 'Coverage is unknown', receipts: [{ id: 'x', action: 'retest', target: crash.t.key, verified: false, uncertain: true, detail: '' }] }));
    await expect(guarded.resume(crash.t.key, false)).rejects.toThrow('Reconciliation incomplete');
    expect(guarded.agents.reconcile).toHaveBeenCalledOnce();
});
