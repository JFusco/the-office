import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { recoverSavedPlan, MISSING_SAVED_PLAN } from '../../../server/cec/recover-saved-plan';
import { ticket, decision } from './parking/fixtures';

function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'saved-plan-')), store = new Store(':memory:', projectById('cec'), root), t = ticket();
    Object.assign(t, { stage: 'plan', activity: 'blocked', blocker: MISSING_SAVED_PLAN, commit: '', branch: '', worktree: '', prId: 0, attempt: 1, repairAttempts: { F1: 1 } });
    t.approach = { plan: 'reviewed', review: 'focused', validation: 'developer-checks', reason: 'Review before source', checks: [] } as any;
    const result = decision('', { outcome: 'passed', summary: 'Complete revised plan', commit: '', prId: 0, blocker: '', paidRuns: 0, findings: [{ id: 'F1', summary: 'fixed', expected: '', actual: '', status: 'fixed', attempts: 1 }] });
    t.results.plan = result; t.results['plan-review'] = decision('', { outcome: 'failed' }); store.state.tickets = [t];
    const claim = store.claimWork({ projectId: 'cec', kind: 'delivery', id: `ticket:${t.key}` }, 'owner', 'plan')!; store.finishClaim(claim.id, 'completed');
    const dir = resolve(root, 'sessions', 'worker'), run = resolve(root, 'runs', t.runId); mkdirSync(dir, { recursive: true }); mkdirSync(run, { recursive: true });
    const work: any = { id: 'worker', ticket: t.key, stage: 'plan', role: 'developer', status: 'completed', executionStatus: 'completed', claimId: claim.id, processId: 12345, provider: 'claude', sessionId: 'worker', endedAt: '2026-11-13' }; store.state.workLog = [work];
    const saved = JSON.stringify({ session: 'worker', provider: 'claude', result });
    const write = (name: string, data: unknown) => writeFileSync(resolve(dir, name), JSON.stringify(data));
    writeFileSync(resolve(dir, 'result.json'), saved);
    write('execution-completion.json', { workerId: 'worker', session: 'worker', provider: 'claude', resultSha256: createHash('sha256').update(saved).digest('hex') });
    write('assignment.json', { id: 'worker', claimId: claim.id, lane: 'delivery', work: claim.work, role: 'developer', stage: 'plan', profile: 'reader', scope: { repository: store.project.repository, worktree: run, artifacts: dir } });
    write('capabilities.json', { name: 'reader', readOnly: true, cutover: 'verified' });
    const analysis = resolve(run, 'worker-analysis.md'); writeFileSync(analysis, result.summary);
    return { root, store, t, result, work, write, analysis, dir, close() { store.close(); rmSync(root, { recursive: true, force: true }); } };
}
test('reconnects exact existing plan once, preserving all counters/raw artifacts and returning to independent review', () => {
    const f = fixture(); try {
        const before = readFileSync(resolve(f.dir, 'result.json')), counters = structuredClone(f.t.repairAttempts);
        expect(recoverSavedPlan(f.store, f.t, f.root, () => false)).toBe(true);
        expect(f.t.stage).toBe('plan-review'); expect(f.t.attempt).toBe(1); expect(f.t.repairAttempts).toEqual(counters);
        expect(f.t.results.plan?.evidence[0].path).toBe(f.analysis); expect(f.result.evidence).toEqual([]);
        expect(readFileSync(resolve(f.dir, 'result.json'))).toEqual(before); expect(f.t.savedPlanRecovery?.resultSha256).toHaveLength(64);
        expect(recoverSavedPlan(f.store, f.t, f.root, () => false)).toBe(false);
    } finally { f.close(); }
});
test('an earlier live read-back failure does not erase the original missing-plan recovery class', () => {
    const f = fixture(); try {
        f.t.blocker = 'Error: session inventory changed during provider read-back; no dispatch occurred';
        const before = readFileSync(resolve(f.dir, 'result.json')), attempts = structuredClone(f.t.repairAttempts);
        expect(recoverSavedPlan(f.store, f.t, f.root, () => false)).toBe(true);
        expect(f.t.stage).toBe('plan-review'); expect(f.t.savedPlanRecovery?.workerId).toBe('worker');
        expect(f.t.repairAttempts).toEqual(attempts); expect(f.t.attempt).toBe(1);
        expect(readFileSync(resolve(f.dir, 'result.json'))).toEqual(before);
    } finally { f.close(); }
});
test.each(['live-group', 'wrong-text', 'result-tamper', 'symlink', 'failed-result', 'candidate', 'uncertain-receipt', 'wrong-assignment'])('refuses %s without clearing the blocker or rerunning a worker', reason => {
    const f = fixture(); try {
        if (reason === 'wrong-text') writeFileSync(f.analysis, 'Different text');
        if (reason === 'result-tamper') f.write('result.json', { result: f.result });
        if (reason === 'symlink') { rmSync(f.analysis); symlinkSync(resolve(f.dir, 'result.json'), f.analysis); }
        if (reason === 'failed-result') f.result.outcome = 'failed';
        if (reason === 'candidate') f.t.commit = 'a'.repeat(40);
        if (reason === 'uncertain-receipt') f.result.receipts.push({ id: 'e', action: 'write', target: 't', verified: false, uncertain: true, detail: '' });
        if (reason === 'wrong-assignment') f.write('assignment.json', { stage: 'plan', profile: 'reader' });
        expect(() => recoverSavedPlan(f.store, f.t, f.root, () => reason === 'live-group')).toThrow();
        expect(f.t.stage).toBe('plan'); expect(f.t.blocker).toBe(MISSING_SAVED_PLAN); expect(f.t.savedPlanRecovery).toBeUndefined(); expect(f.t.attempt).toBe(1);
        const current = f.store.ticket(f.t.key); expect(current.savedPlanRecoveryFailure).toBeDefined();
        current.blocker = 'Error: provider/artifact guard failed';
        expect(() => recoverSavedPlan(f.store, current, f.root, () => true)).toThrow();
    } finally { f.close(); }
});
