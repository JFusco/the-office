import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { expect, test, vi } from 'vitest';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { continueAccessOnlyPlan } from '../../../../server/cec/qa/continue-access-only-plan';
import { qaRunDirectory } from '../../../../server/cec/qa/run-directory';
import type { command } from '../../../../server/workers/process';
import { cecPrompt } from '../../../../server/cec/prompts/cec';
import { qaEvidenceGap } from '../../../../server/cec/workflow';
import { ticket, decision } from '../parking/fixtures';
import { accessProbe } from './fixtures';

function fixture() {
    let now = Date.parse('2026-11-14T11:59:00Z');
    const root = mkdtempSync(resolve(tmpdir(), 'qa-plan-')), clock = { now: () => new Date(now), monotonic: () => now };
    const store = new Store(':memory:', projectById('cec'), root, clock), t = ticket();
    Object.assign(t, { stage: 'retest', activity: 'blocked', attempt: 4, worktree: '/synthetic/candidate', prId: 0, repairAttempts: { F1: 2 } });
    t.approach = { plan: 'reviewed', review: 'focused', validation: 'browser', reason: 'Actual feedback acceptance', checks: [] } as any;
    const run = resolve(root, 'runs', t.runId), qa = resolve(run, '.qa/runs/qa-retest-4'), dir = resolve(root, 'sessions/qa-worker');
    mkdirSync(resolve(qa, 'orchestration'), { recursive: true }); mkdirSync(dir, { recursive: true });
    const result = decision('', { summary: 'Access probe only, no feature acceptance', blocker: 'Editor and owned fixture needed', commit: t.commit,
        worktree: t.worktree, branch: t.branch, prId: 0, qaRunDir: qa, paidRuns: 0, resolution: null });
    t.results.retest = result; store.state.tickets = [t];
    const claim = store.claimWork({ projectId: 'cec', kind: 'delivery', id: `ticket:${t.key}` }, 'owner', 'retest')!;
    store.finishClaim(claim.id, 'completed');
    const work: any = { id: 'qa-worker', ticket: t.key, stage: 'retest', role: 'qa', status: 'blocked', executionStatus: 'completed',
        claimId: claim.id, processId: 12345, provider: 'codex', sessionId: 'native-session', endedAt: '2026-11-14T11:59:00Z' };
    store.state.workLog = [work];
    now += 60000;
    const request: any = { id: 'explicit-resume', key: t.key, action: 'resume-ticket', status: 'working', requestedAt: clock.now().toISOString(), error: '' };
    store.state.deliveryQueue = [request];
    const { plan, state, planDigest } = accessProbe(), intake = { content_digest: `sha256:${'3'.repeat(64)}` };
    plan.contract = { intake, target: { build_ref: t.commit } }; state.content_digest = `sha256:${'4'.repeat(64)}`;
    const write = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value));
    write(resolve(qa, 'plan.json'), plan); write(resolve(qa, 'orchestration/state.json'), state); write(resolve(qa, 'intake.json'), intake);
    write(resolve(qa, 'run.json'), { run_id: plan.run_id }); write(resolve(qa, 'report.json'), { kind: 'qa-run-report', run_id: plan.run_id, status: 'pending' });
    const nativeResult = { session: work.sessionId, provider: work.provider, result: structuredClone(result) };
    write(resolve(dir, 'result.json'), nativeResult);
    write(resolve(dir, 'execution-completion.json'), { workerId: work.id, session: work.sessionId, provider: work.provider,
        resultSha256: createHash('sha256').update(readFileSync(resolve(dir, 'result.json'))).digest('hex') });
    write(resolve(dir, 'assignment.json'), { id: work.id, claimId: claim.id, lane: 'delivery', work: claim.work, stage: t.stage, role: 'qa', profile: 'qa-native',
        scope: { repository: store.project.repository, worktree: t.worktree, artifacts: dir } });
    write(resolve(dir, 'capabilities.json'), { name: 'qa-native', cutover: 'native', readOnly: false });
    const batch: any = { kind: 'run-next-batch', run_id: plan.run_id, actions: [{ action_kind: 'input-required', reason_code: 'handoff-required',
        authority_digests: [{ name: 'plan', path: resolve(qa, 'plan.json'), digest: planDigest },
            { name: 'intake', path: resolve(qa, 'intake.json'), digest: intake.content_digest },
            { name: 'orchestration-state', path: resolve(qa, 'orchestration/state.json'), digest: state.content_digest }] }] };
    const execute = vi.fn(async (program: string, args: string[], _options?: Parameters<typeof command>[2]) =>
        program === 'git' ? args[0] === 'rev-parse' ? t.commit : '' : JSON.stringify(batch));
    return { root, store, t, result, run, qa, dir, work, request, plan, state, batch, write, execute,
        close() { store.close(); rmSync(root, { recursive: true, force: true }); } };
}
test('binds one acceptance plan to a later explicit resume while retaining old evidence and every counter', async () => {
    const f = fixture(); try {
        const result = structuredClone(f.result), repairs = structuredClone(f.t.repairAttempts), old = readFileSync(resolve(f.qa, 'orchestration/state.json'));
        expect(await continueAccessOnlyPlan(f.store, f.t, f.root, f.execute, () => false)).toBe(true);
        expect(f.t.results.retest).toEqual(result); expect(f.t.attempt).toBe(4); expect(f.t.repairAttempts).toEqual(repairs);
        expect(readFileSync(resolve(f.qa, 'orchestration/state.json'))).toEqual(old);
        expect(f.t.qaPlanContinuations).toHaveLength(1); expect(f.t.qaPlanContinuations![0].previousPaidRuns).toBe(0);
        expect(qaRunDirectory(f.t, 'retest', f.run)).toBe(`${f.qa}-acceptance`);
        const native = f.execute.mock.calls.filter(call => call[0] === 'python3');
        expect(native).toHaveLength(1); expect(native[0][1]).not.toContain('--advance');
        const calls = f.execute.mock.calls.length;
        expect(await continueAccessOnlyPlan(f.store, f.t, f.root, f.execute, () => false)).toBe(false); expect(f.execute).toHaveBeenCalledTimes(calls);
        const prompt = cecPrompt(f.store, f.t, 'retest', 'qa', f.run);
        expect(prompt).toContain('--run-id qa-retest-4-acceptance'); expect(prompt).toContain('home/navigation-only queue is insufficient');
        expect(prompt).toContain('does not mark the earlier run successful or reset');
        expect(qaEvidenceGap(f.t, 'retest', { ...f.result, outcome: 'passed' }, f.run)).toContain('old access probe cannot pass');
        expect(qaEvidenceGap(f.t, 'retest', { ...f.result, outcome: 'passed', qaRunDir: `${f.qa}-acceptance` }, f.run)).toContain('browser evidence');
    } finally { f.close(); }
});
test.each(['no-request', 'earlier-request', 'live-group', 'unknown-usage', 'spent-usage', 'uncertain-receipt', 'native-failure',
    'unsettled-call', 'changed-result', 'wrong-assignment', 'wrong-native-digest', 'race', 'existing-destination', 'dangling-destination', 'duplicate-request', 'changed-candidate', 'dirty-candidate', 'finalized-report', 'different-plan-head'])('blocks %s without modifying original QA or consuming another attempt', async reason => {
    const f = fixture(); try {
        if (reason === 'no-request') f.store.state.deliveryQueue = [];
        if (reason === 'earlier-request') f.request.requestedAt = '2026-11-14T11:58:00Z';
        if (reason === 'unknown-usage') f.result.paidRuns = null;
        if (reason === 'spent-usage') f.result.paidRuns = 1;
        if (reason === 'uncertain-receipt') f.result.receipts.push({ id: 'unknown', action: 'write', target: 'fixture', verified: false, uncertain: true, detail: '' });
        if (reason === 'native-failure') f.work.failure = { category: 'uncertain-effect' };
        if (reason === 'unsettled-call') { delete f.state.browser_calls[0].after; f.write(resolve(f.qa, 'orchestration/state.json'), f.state); }
        if (reason === 'changed-result') f.write(resolve(f.dir, 'result.json'), { result: {} });
        if (reason === 'wrong-assignment') f.write(resolve(f.dir, 'assignment.json'), { role: 'developer' });
        if (reason === 'wrong-native-digest') f.batch.actions[0].authority_digests[0].digest = `sha256:${'9'.repeat(64)}`;
        if (reason === 'finalized-report') f.write(resolve(f.qa, 'report.json'), { kind: 'final-report', product_verdict: 'fail' });
        if (reason === 'different-plan-head') { f.plan.contract.target.build_ref = 'b'.repeat(40); f.write(resolve(f.qa, 'plan.json'), f.plan); }
        if (reason === 'existing-destination') mkdirSync(`${f.qa}-acceptance`);
        if (reason === 'dangling-destination') symlinkSync(resolve(f.root, 'missing'), `${f.qa}-acceptance`);
        if (reason === 'duplicate-request') f.store.state.deliveryQueue!.push({ ...f.request, id: 'another-resume' });
        if (reason === 'changed-candidate') f.execute.mockImplementation(async program => program === 'git' ? 'b'.repeat(40) : JSON.stringify(f.batch));
        if (reason === 'dirty-candidate') f.execute.mockImplementation(async (program, args) => program === 'git' ? args[0] === 'rev-parse' ? f.t.commit : ' M tracked-file.ts' : JSON.stringify(f.batch));
        if (reason === 'race') f.execute.mockImplementation(async (program, args) => {
            if (program === 'git') return args[0] === 'rev-parse' ? f.t.commit : '';
            f.write(resolve(f.qa, 'plan.json'), { replaced: true }); return JSON.stringify(f.batch);
        });
        await expect(continueAccessOnlyPlan(f.store, f.t, f.root, f.execute, () => reason === 'live-group')).rejects.toThrow();
        expect(f.store.ticket(f.t.key).qaPlanContinuations).toBeUndefined(); expect(f.t.attempt).toBe(4); expect(f.t.repairAttempts).toEqual({ F1: 2 });
    } finally { f.close(); }
});
test('leaves a feature-capable plan on its existing same-run recovery path', async () => {
    const f = fixture(); try {
        f.plan.workflows[0].steps[0].execution[0].target.value = '/projects/test/feedback'; f.write(resolve(f.qa, 'plan.json'), f.plan);
        expect(await continueAccessOnlyPlan(f.store, f.t, f.root, f.execute, () => false)).toBe(false);
        expect(f.execute).not.toHaveBeenCalled(); expect(qaRunDirectory(f.t, 'retest', f.run)).toBe(f.qa);
    } finally { f.close(); }
});
