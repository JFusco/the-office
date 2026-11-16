import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { Agents } from '../../../server/workers/agents';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import { claudeArguments } from '../../../server/workers/claude';
import { assertContinuableWorktree, continuationPrompt, MAX_CONTINUATIONS, recordedContinuation, stageContinuation } from '../../../server/cec/stage-continuation';
import { ticket, decision } from './parking/fixtures';

const made: { store: Store; root: string }[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const { store, root } of made.splice(0)) { store.close(); rmSync(root, { recursive: true, force: true }); } });
const TIMEOUT = 'claude timed out; previous action outcome must be reconciled', gone = () => false, ALIVE = 'process still alive';
const run = (id: string, extra: object = {}): any => ({ id, ticket: 'CEC-900', stage: 'repair', role: 'developer', provider: 'claude', status: 'failed', processId: 4242, startedAt: '2026-11-16T17:26:36Z', endedAt: '2026-11-16T18:11:57Z', failure: { category: 'uncertain-effect', dispatched: true, detail: TIMEOUT }, ...extra });
/** A repair whose Claude run was stopped by the stage time limit, in an existing worktree. */
function stopped() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-continue-')), store = new Store(':memory:', projectById('cec'), root);
    made.push({ store, root });
    const t = ticket(); Object.assign(t, { stage: 'repair', activity: 'blocked', worktree: root, branch: 'codex/cec-900-fix' });
    t.results.repair = decision('', { outcome: 'blocked', paidRuns: null, blocker: `Interrupted stage; external effects require reconciliation. Error: ${TIMEOUT}`, receipts: [{ id: 'attempt', action: 'repair', target: t.key, verified: false, uncertain: true, detail: 'Worker did not return a verified final result' }] });
    store.state.tickets = [t]; store.state.workLog = [run('run-1')];
    return { store, t, root };
}

test('a developer run stopped by the time limit is continued, up to the allowance', () => {
    const { store, t } = stopped();
    expect(stageContinuation(store, t, 'repair', gone)).toMatchObject({ work: { id: 'run-1' }, attempt: 1 });
    store.state.workLog!.push(run('run-2', { originalId: 'run-1' }));
    expect(stageContinuation(store, t, 'repair', gone)).toMatchObject({ work: { id: 'run-2' }, attempt: 2 });
    store.state.workLog!.push(run('run-3', { originalId: 'run-2' }));
    expect(MAX_CONTINUATIONS).toBe(2);
    expect(stageContinuation(store, t, 'repair', gone)).toBeUndefined();
});

test('any other ending is not continued', () => {
    const cases: [string, (x: ReturnType<typeof stopped>) => void][] = [
        [ALIVE, () => {}],
        ['no recorded process', x => { delete x.store.state.workLog![0].processId; }],
        ['run returned', x => { x.store.state.workLog![0].executionStatus = 'completed'; }],
        ['stalled, not timed out', x => { x.store.state.workLog![0].failure!.detail = 'claude stopped producing output; inspect the retained worker evidence'; }],
        ['provider error quoting the text', x => { x.store.state.workLog![0].failure!.detail = `claude exited 1: ${TIMEOUT} (quoted)`; }],
        ['Codex worker', x => { Object.assign(x.store.state.workLog![0], { provider: 'codex' }); x.store.state.workLog![0].failure!.detail = 'codex timed out; previous action outcome must be reconciled'; }],
        ['interrupted by a restart', x => { x.store.state.workLog![0].status = 'interrupted'; }],
        ['a later run of the stage returned', x => { x.store.state.workLog!.push(run('run-2', { status: 'blocked', failure: undefined, executionStatus: 'completed' })); }],
        ['no worktree', x => { x.t.worktree = ''; }],
        ['no accepted commit', x => { x.t.commit = ''; }],
        ['ticket result is not the timeout placeholder', x => { x.t.results.repair = decision('', { outcome: 'passed', receipts: [] }); }],
        ['placeholder written for another error', x => { x.t.results.repair!.blocker = 'Interrupted stage; external effects require reconciliation. Error: something else'; }],
        ['ticket on the older implementation-continuation route', x => { x.t.stage = 'implement'; x.store.state.workLog![0].stage = 'implement'; x.t.results.implement = x.t.results.repair; x.t.implementationContinuation = { requestId: 'r', originalWorkerId: 'w', checksRoot: x.root, oldWorktree: '/old', oldBranch: 'old', base: 'b', note: 'n' } as any; }],
    ];
    for (const [name, arrange] of cases) {
        const x = stopped(); arrange(x);
        expect(stageContinuation(x.store, x.t, x.t.stage, name === ALIVE ? () => true : gone), name).toBeUndefined();
    }
    const review = stopped(); review.store.state.workLog![0].stage = 'retest';
    expect(stageContinuation(review.store, review.t, 'retest' as any, gone)).toBeUndefined();
});

test('the worktree must still be on the ticket branch and hold the accepted commit', async () => {
    const { t } = stopped(), calls: string[] = [];
    const git = (branch: string, ancestor = true) => (async (_program: string, args: string[]) => { calls.push(args.join(' ')); if (args[0] === 'branch') return `${branch}\n`; if (!ancestor) throw new Error('not an ancestor'); return ''; }) as any;
    await expect(assertContinuableWorktree(git(t.branch), t)).resolves.toBeUndefined();
    expect(calls).toEqual(['branch --show-current', `merge-base --is-ancestor ${t.commit} HEAD`]);
    await expect(assertContinuableWorktree(git('someone-else'), t)).rejects.toThrow('left its branch');
    await expect(assertContinuableWorktree(git(t.branch, false), t)).rejects.toThrow('no longer holds the accepted commit');
    await expect(assertContinuableWorktree(git(t.branch), { ...t, worktree: '/nonexistent/office-worktree' })).rejects.toThrow('missing');
});

test('a continued run resumes the stopped session under its own session id, and is told what happened', () => {
    const plain = claudeArguments({}, 'new-run', false, ['/repo']), resumed = claudeArguments({}, 'new-run', false, ['/repo'], 'run-1');
    expect(plain).not.toContain('--resume');
    expect(resumed.slice(-3)).toEqual(['--resume', 'run-1', '--fork-session']);
    expect(resumed[resumed.indexOf('--session-id') + 1]).toBe('new-run');
    const prompt = continuationPrompt(1, 90 * 60 * 1000);
    expect(prompt).toContain('continuation 1 of at most 2');
    expect(prompt).toContain('git status');
    expect(prompt).toContain('You have 90 minutes from now.');
});

test('the stage continues a run that times out, then stops when the allowance is used up', async () => {
    const { store, t } = stopped(); store.state.workLog = []; delete t.results.repair;
    const passed: any = { outcome: 'passed', commit: t.commit, summary: 'Repaired', evidence: [], findings: [], receipts: [], paidRuns: 0, blocker: '', qa: null, qaRunDir: '', branch: t.branch, worktree: t.worktree, previewUrl: '', prId: 0 };
    let n = 0;
    const timeoutOnce = (limit: number) => vi.spyOn(WorkerRuntime.prototype, 'run').mockImplementation((async function (this: any, _role: string, _task: string, _schema: unknown, opts: any) {
        n++;
        if (n <= limit) { store.state.workLog!.push(run(`run-${n}`, { originalId: opts.originalWorkId })); throw new Error(`Error: ${TIMEOUT}`); }
        return passed;
    }) as any);
    const agents = new Agents(store, (async (_program: string, args: string[]) => args[0] === 'branch' ? `${t.branch}\n` : '') as any);
    vi.spyOn(agents as any, 'active', 'get').mockReturnValue(new Map());
    let spy = timeoutOnce(1);
    await expect(agents.stage(t, 'repair', 'developer')).resolves.toBe(passed);
    expect(spy.mock.calls).toHaveLength(2);
    expect(spy.mock.calls[0][3]?.resumeSession).toBeUndefined();
    expect(spy.mock.calls[1][3]).toMatchObject({ resumeSession: 'run-1', originalWorkId: 'run-1', timeout: 90 * 60 * 1000 });
    expect(spy.mock.calls[1][1]).toContain('CONTINUE THE SAME ASSIGNMENT');
    // Three stops in a row: the first run plus two continuations, then the stage fails as before.
    spy.mockRestore(); store.state.workLog = []; n = 0; spy = timeoutOnce(99);
    await expect(agents.stage(t, 'repair', 'developer')).rejects.toThrow(TIMEOUT);
    expect(spy.mock.calls).toHaveLength(3);
    expect(spy.mock.calls.map(call => call[3]?.resumeSession)).toEqual([undefined, 'run-1', 'run-2']);
});

test('a ticket already saved as interrupted starts its stage in continue mode; an unusable worktree falls back to reconciliation', async () => {
    const { store, t } = stopped();
    const passed: any = { outcome: 'passed', commit: t.commit, summary: 'Repaired', evidence: [], findings: [], receipts: [], paidRuns: 0, blocker: '', qa: null, qaRunDir: '', branch: t.branch, worktree: t.worktree, previewUrl: '', prId: 0 };
    const spy = vi.spyOn(WorkerRuntime.prototype, 'run').mockResolvedValue(passed);
    const onBranch = (async (_program: string, args: string[]) => args[0] === 'branch' ? `${t.branch}\n` : '') as any, offBranch = (async () => 'elsewhere\n') as any;
    expect(await new Agents(store, onBranch).continuable(t)).toBe(true);
    expect(await new Agents(store, offBranch).continuable(t)).toBe(false);
    expect(await recordedContinuation(store, offBranch, t, 'repair')).toBeUndefined();
    await expect(new Agents(store, onBranch).stage(t, 'repair', 'developer')).resolves.toBe(passed);
    expect(spy.mock.calls).toHaveLength(1);
    expect(spy.mock.calls[0][3]).toMatchObject({ resumeSession: 'run-1', originalWorkId: 'run-1' });
    expect(spy.mock.calls[0][1]).toContain('continuation 1 of at most 2');
});

test('a failure that is not a new time-limit stop, or a pause, ends the stage instead of continuing', async () => {
    const other = stopped(); other.store.state.workLog = []; delete other.t.results.repair;
    const git = (async (_program: string, args: string[]) => args[0] === 'branch' ? 'codex/cec-900-fix\n' : '') as any;
    let spy = vi.spyOn(WorkerRuntime.prototype, 'run').mockImplementation((async () => { other.store.state.workLog!.push(run('run-1', { failure: { category: 'other', dispatched: true, detail: 'claude exited 1: boom' } })); throw new Error('boom'); }) as any);
    await expect(new Agents(other.store, git).stage(other.t, 'repair', 'developer')).rejects.toThrow('boom');
    expect(spy.mock.calls).toHaveLength(1);
    spy.mockRestore();
    const paused = stopped(); paused.store.state.workLog = []; delete paused.t.results.repair;
    spy = vi.spyOn(WorkerRuntime.prototype, 'run').mockImplementation((async () => { paused.store.state.workLog!.push(run('run-1')); paused.store.state.paused = true; throw new Error(TIMEOUT); }) as any);
    await expect(new Agents(paused.store, git).stage(paused.t, 'repair', 'developer')).rejects.toThrow(TIMEOUT);
    expect(spy.mock.calls).toHaveLength(1);
});
