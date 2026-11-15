import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { expect, test, vi } from 'vitest';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import type { command } from '../../../../server/workers/process';
import { ticket, decision } from '../parking/fixtures';
import { accessProbe } from './fixtures';
import { inspectClosedQAPlan } from '../../../../server/cec/qa/inspect-closed-plan';
import { requestQAPlanRetry } from '../../../../server/cec/qa/request-plan-retry';
import { consumeQAPlanRetry } from '../../../../server/cec/qa/consume-plan-retry';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { qaRunDirectory, qaPlanEvidenceGap } from '../../../../server/cec/qa/run-directory';
import { cecPrompt } from '../../../../server/cec/prompts/cec';
const clear = async () => ({ complete: true, fresh: true, ownership: { status: 'clear' } });
function fixture() {
    let now = Date.parse('2026-11-14T11:59:00Z');
    const root = mkdtempSync(resolve(tmpdir(), 'qa-plan-')), clock = { now: () => new Date(now), monotonic: () => now };
    const store = new Store(':memory:', projectById('cec'), root, clock), t = ticket();
    Object.assign(t, { key: 'CEC-154', stage: 'retest', activity: 'blocked', attempt: 4, worktree: '/synthetic/candidate', prId: 0, repairAttempts: { F1: 2 } });
    t.approach = { plan: 'reviewed', review: 'focused', validation: 'browser', reason: 'Actual feedback acceptance', checks: [] } as any;
    const run = resolve(root, 'runs', t.runId), qa = resolve(run, '.qa/runs/qa-retest-4'), dir = resolve(root, 'sessions/12345678-1234-4234-9234-123456789abc');
    mkdirSync(resolve(qa, 'orchestration'), { recursive: true }); mkdirSync(dir, { recursive: true });
    const result = decision('', { summary: 'Access probe only, no feature acceptance', blocker: 'Editor and owned fixture needed', commit: t.commit,
        worktree: t.worktree, branch: t.branch, prId: 0, qaRunDir: qa, paidRuns: 0, resolution: null });
    t.results.retest = result; store.state.tickets = [t];
    const claim = store.claimWork({ projectId: 'cec', kind: 'delivery', id: `ticket:${t.key}` }, 'owner', 'retest')!;
    store.finishClaim(claim.id, 'completed');
    const work: any = { id: '12345678-1234-4234-9234-123456789abc', ticket: t.key, stage: 'retest', role: 'qa', status: 'blocked', executionStatus: 'completed',
        claimId: claim.id, processId: 12345, provider: 'codex', sessionId: 'native-session', endedAt: '2026-11-14T11:59:00Z' };
    store.state.workLog = [work];
    now += 60000;
    const request: any = { id: 'explicit-resume', key: t.key, action: 'resume-ticket', status: 'working', requestedAt: clock.now().toISOString(), error: '' };
    store.state.deliveryQueue = [];
    const { plan, state, planDigest } = accessProbe(), intake = { content_digest: `sha256:${'3'.repeat(64)}` };
    state.browser_calls[0].before.executor_role = 'lead';
    Object.assign(state.browser_calls[0].after, { status: 'error', state_class: 'access-interruption', interruption_reason: 'tool-failure' });
    state.assignment_lanes.push({ status: 'pending', binding_id: null, open_call_id: null });
    plan.contract = { intake, target: { build_ref: t.commit } }; state.content_digest = `sha256:${'4'.repeat(64)}`;
    const write = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value));
    write(resolve(qa, 'plan.json'), plan); write(resolve(qa, 'orchestration/state.json'), state); write(resolve(qa, 'intake.json'), intake);
    write(resolve(qa, 'run.json'), { run_id: plan.run_id }); write(resolve(qa, 'report.json'), { schema_version: 'browser-qa/v17', kind: 'qa-run-report', run_id: plan.run_id, status: 'pending' });
    const nativeResult = { session: work.sessionId, provider: work.provider, result: structuredClone(result) };
    write(resolve(dir, 'result.json'), nativeResult);
    write(resolve(dir, 'execution-completion.json'), { workerId: work.id, session: work.sessionId, provider: work.provider,
        resultSha256: createHash('sha256').update(readFileSync(resolve(dir, 'result.json'))).digest('hex') });
    write(resolve(dir, 'assignment.json'), { id: work.id, claimId: claim.id, lane: 'delivery', work: claim.work, stage: t.stage, role: 'qa', profile: 'qa-native',
        scope: { repository: store.project.repository, worktree: t.worktree, artifacts: dir } });
    write(resolve(dir, 'capabilities.json'), { name: 'qa-native', cutover: 'native', readOnly: false });
    const batch: any = { kind: 'run-next-batch', run_id: plan.run_id, actions: [{ action_kind: 'command', reason_code: 'orchestration-schedule-required',
        authority_digests: [{ name: 'plan', path: resolve(qa, 'plan.json'), digest: planDigest },
            { name: 'intake', path: resolve(qa, 'intake.json'), digest: intake.content_digest },
            { name: 'orchestration-state', path: resolve(qa, 'orchestration/state.json'), digest: state.content_digest }] }] };
    const execute = vi.fn(async (program: string, args: string[], _options?: Parameters<typeof command>[2]) =>
        program === 'git' ? args[0] === 'rev-parse' ? t.commit : '' : JSON.stringify(batch));
    return { root, store, t, result, run, qa, dir, work, request, plan, state, batch, write, execute,
        close() { store.close(); rmSync(root, { recursive: true, force: true }); } };
}

test('read-only proof retains pending/missing-final history and only inspects the public reducer', async () => {
    const f = fixture(); try {
        const old = readFileSync(resolve(f.qa, 'orchestration/state.json'));
        const proof = await inspectClosedQAPlan(f.store, f.t.key, f.root, f.execute, () => false);
        expect(proof.toRunDir).toBe(resolve(f.run, '.qa/runs/qa-retest-5'));
        expect(proof.workerId).toBe(f.work.id); expect(f.t.attempt).toBe(4);
        expect(readFileSync(resolve(f.qa, 'orchestration/state.json'))).toEqual(old);
        expect(f.execute.mock.calls.filter(c => c[0] === 'python3')).toHaveLength(1);
        expect(f.execute.mock.calls.some(c => c[1].includes('--advance'))).toBe(false);
    } finally { f.close(); }
});

test.each(['live-group','active-lane','open-call','binding','mutation','unknown-usage','uncertain-receipt','native-failure',
    'missing-after','wrong-assignment','changed-result','wrong-digest','race','existing-destination','dirty-candidate','wrong-head','final-report','competing-request'])('rejects %s without modifying the old plan or counters', async reason => {
    const f = fixture(); try {
        if (reason === 'active-lane') f.state.assignment_lanes[0].status = 'active';
        if (reason === 'open-call') f.state.assignment_lanes[0].open_call_id = 'open';
        if (reason === 'binding') f.state.browser_bindings.push({ status: 'active' });
        if (reason === 'mutation') f.state.browser_calls[0].before.mutation_intent = true;
        if (reason === 'unknown-usage') f.result.paidRuns = null;
        if (reason === 'uncertain-receipt') f.result.receipts.push({ id: 'unknown', action: 'write', target: '', verified: false, uncertain: true, detail: '' });
        if (reason === 'native-failure') f.work.failure = { category: 'uncertain-effect' };
        if (reason === 'missing-after') delete f.state.browser_calls[0].after;
        f.write(resolve(f.qa, 'orchestration/state.json'), f.state);
        if (reason === 'wrong-assignment') f.write(resolve(f.dir, 'assignment.json'), {});
        if (reason === 'changed-result') f.write(resolve(f.dir, 'result.json'), {});
        if (reason === 'wrong-digest') f.batch.actions[0].authority_digests[0].digest = `sha256:${'9'.repeat(64)}`;
        if (reason === 'final-report') f.write(resolve(f.qa, 'report.json'), { kind: 'final-report' });
        if (reason === 'existing-destination') mkdirSync(resolve(f.run, '.qa/runs/qa-retest-5'));
        if (reason === 'competing-request') f.store.state.deliveryQueue!.push(f.request);
        if (reason === 'wrong-head') f.execute.mockImplementation(async p => p === 'git' ? 'b'.repeat(40) : JSON.stringify(f.batch));
        if (reason === 'dirty-candidate') f.execute.mockImplementation(async (p,a) => p === 'git' ? a[0] === 'rev-parse' ? f.t.commit : ' M file.ts' : JSON.stringify(f.batch));
        if (reason === 'race') f.execute.mockImplementation(async (p,a) => {
            if (p === 'git') return a[0] === 'rev-parse' ? f.t.commit : '';
            f.write(resolve(f.qa, 'plan.json'), {}); return JSON.stringify(f.batch);
        });
        await expect(inspectClosedQAPlan(f.store, f.t.key, f.root, f.execute, () => reason === 'live-group')).rejects.toThrow();
        expect(f.t.attempt).toBe(4); expect(f.t.repairAttempts).toEqual({ F1: 2 }); expect(f.t.qaPlanRetries).toBeUndefined();
    } finally { f.close(); }
});

test('one explicit decision survives duplicate calls and consumes once under its exact scheduler claim', async () => {
    const f = fixture(); try {
        const inspect: typeof inspectClosedQAPlan = (s,k,r,_e,_g,id) => inspectClosedQAPlan(s,k,r,f.execute,() => false,id);
        const proof = await inspect(f.store,f.t.key,f.root);
        const input = { workerId: proof.workerId, fingerprint: proof.fingerprint, acknowledgeIncompleteHistory: true };
        const first = await requestQAPlanRetry(f.store,f.t.key,input,f.root,clear,inspect);
        expect((await requestQAPlanRetry(f.store,f.t.key,input,f.root,clear,inspect)).request.id).toBe(first.request.id);
        expect(f.store.state.deliveryQueue).toHaveLength(1);
        const original = structuredClone(f.result); first.request.status = 'working';
        const claim = f.store.claimWork({ projectId:'cec', kind:'delivery', id:first.request.id },'scheduler','resume-ticket')!;
        await expect(consumeQAPlanRetry(f.store,first.request,f.root,clear,inspect)).rejects.toThrow('scheduler-owned');
        await withAssignment(claim,'delivery',() => consumeQAPlanRetry(f.store,first.request,f.root,clear,inspect));
        expect(first.request.qaPlanRetry!.consumedAt).toBeTruthy(); expect(f.t.attempt).toBe(5);
        expect(f.t.qaPlanRetries![0].originalResult).toEqual(original); expect(f.t.results.retest).toEqual(original);
        expect(f.t.repairAttempts).toEqual({F1:2}); expect(qaRunDirectory(f.t,'retest',f.run)).toBe(proof.toRunDir);
        expect(qaPlanEvidenceGap(f.t,'retest',f.result,f.run)).toContain('incomplete history');
        const prompt = cecPrompt(f.store,f.t,'retest','qa',f.run);
        expect(prompt).toContain('--run-id qa-retest-5'); expect(prompt).toContain('ONE CORRECTED CEC-154 PLAN');
        expect(prompt).toContain('8. Adjacent Non-Visual');
        await expect(withAssignment(claim,'delivery',() => consumeQAPlanRetry(f.store,first.request,f.root,clear,inspect))).rejects.toThrow();
        first.request.status = 'blocked';
        expect((await requestQAPlanRetry(f.store,f.t.key,input,f.root,clear,inspect)).request.status).toBe('blocked');
        expect(f.t.attempt).toBe(5);
    } finally { f.close(); }
});
test.each(['unknown-ownership','changed-proof','wrong-decision','unacknowledged'])('does not enqueue %s', async reason => {
    const f = fixture(); try {
        const inspect: typeof inspectClosedQAPlan = (s,k,r) => inspectClosedQAPlan(s,k,r,f.execute,() => false);
        const proof = await inspect(f.store,f.t.key,f.root);
        const input:any = {workerId:proof.workerId, fingerprint:proof.fingerprint, acknowledgeIncompleteHistory:true};
        if(reason === 'changed-proof') input.fingerprint = 'b'.repeat(64);
        if(reason === 'wrong-decision') input.workerId = '22345678-1234-4234-9234-123456789abc';
        if(reason === 'unacknowledged') input.acknowledgeIncompleteHistory = false;
        const ownership = reason === 'unknown-ownership' ? async () => ({complete:false,fresh:true}) : clear;
        await expect(requestQAPlanRetry(f.store,f.t.key,input,f.root,ownership,inspect)).rejects.toThrow();
        expect(f.store.state.deliveryQueue).toEqual([]); expect(f.t.attempt).toBe(4);
    } finally {f.close();}
});
