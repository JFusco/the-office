import { afterEach, expect, test, vi } from 'vitest';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { artifact, digest } from '../../../../server/store/readback-evidence';
import { reconcileStoppedBaseUpdate, stoppedBaseUpdateCandidate } from '../../../../server/delivery/recovery/stopped-base-update';
import type { HarnessRequest, WorkTime } from '../../../../src/shared';
const facts = vi.hoisted(() => ({ current: {} as any, drift: false, positive: true, completed: false, resultFile: {} as any, completionFile: {} as any }));
vi.mock('../../../../server/delivery/recovery/stopped-base-original', () => ({ readStoppedBaseOriginal: () => structuredClone(facts.current.original) }));
vi.mock('../../../../server/delivery/recovery/stopped-base-native', () => ({ readStoppedClaudeNative: () => structuredClone(facts.current.native) }));
vi.mock('../../../../server/delivery/recovery/stopped-base-provider', () => ({ readStoppedBaseProviderContext: async () => ({
    ...structuredClone(facts.current.provider), ...(facts.drift ? { version: 'changed-provider' } : {}) }) }));
vi.mock('../../../../server/delivery/recovery/stopped-base-audit-completion', () => ({ readStoppedBaseAuditCompletion: () => {
    if (!facts.completed) throw new Error('No actual completion');
    return { proof: { files: [facts.resultFile] }, completionFiles: [facts.completionFile, facts.resultFile],
        native: { file: { path: '/synthetic/native', sha256: 'a'.repeat(64) }, result: { positive: facts.positive } } };
} }));
vi.mock('../../../../server/delivery/recovery/stopped-base-audit', async original => ({
    ...await original<typeof import('../../../../server/delivery/recovery/stopped-base-audit')>(),
    stoppedBaseAuditInput: () => structuredClone(facts.current.input),
    assertStoppedBaseAudit: () => { if (!facts.positive) throw new Error('Unknown effects remain stopped'); },
}));
afterEach(cleanupFakes);
function fixture() {
    const f = fakeGitHub(), job = f.candidate({ existingPR: true, pr: 200, stage: 'update-base', status: 'interrupted',
        repairCycle: { owner: 'developer', attempts: 6, findingAttempts: { F1: 2 }, pendingFindingIds: ['F1'], sourceStage: 'lead-pr', sourceHead: 'a'.repeat(40), phase: 'repair' } });
    (f.store.state.workLog ??= []).push({ id: 'original-worker', requestId: job.id, ticket: job.key, stage: 'github-update-base', status: 'interrupted', role: 'developer', provider: 'claude' } as WorkTime);
    const request: HarnessRequest = { id: 'original-readback', action: 'reconcile-base-update', key: job.key, head: 'original-worker', lane: 'delivery', status: 'working', requestedAt: f.store.clock.now().toISOString(), detail: '' };
    (f.store.state.coordination!.requests ??= []).push(request);
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'reconciliation', id: request.id }, 'fixture', request.action, 'delivery')!;
    mkdirSync(resolve(f.store.dataRoot, 'ticket-work', job.id), { recursive: true });
    const resultPath = resolve(f.store.dataRoot, 'sessions', 'audit', 'result.json');
    mkdirSync(resolve(resultPath, '..'), { recursive: true });
    writeFileSync(resultPath, JSON.stringify({ result: { positive: true } }));
    facts.resultFile = { path: resultPath, sha256: digest({ result: { positive: true } }) };
    const completionPath = resolve(resultPath, '..', 'execution-completion.json');
    writeFileSync(completionPath, JSON.stringify({ workerId: 'audit', session: 'audit-native', provider: 'codex', resultSha256: facts.resultFile.sha256 }));
    facts.completionFile = artifact(f.store, completionPath);
    const input = { originalWorkId: request.head, nativeSha256: 'a'.repeat(64), nativeRecordCount: 1, originalArtifacts: [], rows: [{ id: 'one', sha256: 'a'.repeat(64) }], context: { candidate: { worktree: job.worktree } } };
    facts.current = { original: { worker: { id: request.head, sessionId: request.head }, claim: { id: 'old-claim' },
        candidate: { path: job.worktree }, files: [], termination: { result: 'ESRCH' } }, native: { file: { path: '/old-native', sha256: input.nativeSha256 } },
        materialSha256: 'material', inputSha256: digest(input), input, provider: { version: 'provider', issue: {}, pr: { head: 'b'.repeat(40) } } };
    facts.drift = false; facts.positive = true; facts.completed = false;
    let calls = 0;
    f.delivery.engine.agents.run = vi.fn(async () => {
        calls++;
        expect(job.stoppedBaseUpdate!.audit.state).toBe('dispatched');
        const saved = JSON.parse((f.store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string }).body);
        expect(saved.coordination.jobs.find((j: any) => j.id === job.id).stoppedBaseUpdate.audit.state).toBe('dispatched');
        expect(JSON.parse(readFileSync(resolve(f.store.dataRoot, 'ticket-work', job.id, `stopped-base-input-${request.head}.json`), 'utf8'))).toMatchObject(input);
        throw new Error('Ambiguous return after dispatch');
    }) as any;
    const run = () => withAssignment(claim, 'delivery', () => reconcileStoppedBaseUpdate(f.delivery, request));
    const complete = () => {
        facts.completed = true;
        f.store.state.workLog!.push({ id: 'audit', requestId: job.id, claimId: claim.id, stage: 'stopped-base-update-audit', sessionId: 'audit-native',
            role: 'lead', provider: 'codex', executionStatus: 'completed', status: 'completed', endedAt: '2026-11-11T00:00:00Z' } as WorkTime);
    };
    return { ...f, job, request, claim, run, complete, calls: () => calls };
}

test('recognition separates an interrupted writer from unrelated legacy base recovery', () => {
    const f = fixture(); expect(stoppedBaseUpdateCandidate(f.store, f.job)?.head).toBe('original-worker');
    f.store.state.workLog = []; expect(stoppedBaseUpdateCandidate(f.store, f.job)).toBeUndefined();
});

test('reservation persists before one dispatch; ambiguous return cannot buy a second model call', async () => {
    const f = fixture(); await expect(f.run()).rejects.toThrow('Ambiguous return');
    expect(f.job.stoppedBaseUpdate!.audit.state).toBe('dispatched');
    await expect(f.run()).rejects.toThrow('one dispatched audit');
    expect(f.calls()).toBe(1); expect(f.job.stage).toBe('update-base'); expect(f.job.repairCycle!.attempts).toBe(6);
});

test('a lost return reuses actual saved completion and preserves old candidate and exhausted counters', async () => {
    const f = fixture(), original = { head: f.job.head, branch: f.job.branch, worktree: f.job.worktree, repairCycle: structuredClone(f.job.repairCycle) };
    await expect(f.run()).rejects.toThrow('Ambiguous return'); f.complete();
    await expect(f.run()).resolves.toBe(true);
    expect(f.calls()).toBe(1); expect(f.job.stage).toBe('lead-pr'); expect(f.job.head).toBe(original.head); expect(f.job.worktree).toBe('');
    expect(f.job.stoppedBaseUpdate!.preservedCandidate).toMatchObject(original); expect(f.job.repairCycle).toEqual(original.repairCycle);
    expect(f.job.stoppedBaseUpdate!.audit.completion!.executionCompletionSha256).toBe(facts.completionFile.sha256);
    expect(existsSync(original.worktree)).toBe(true);
    expect(f.job.steps.some(s => s.stage === 'update-base')).toBe(false);
    await expect(f.run()).resolves.toBe(true); expect(f.calls()).toBe(1);
});

test.each(['negative','drift'])('real completion is retained before a %s refusal without redispatch', async kind => {
    const f = fixture(); await expect(f.run()).rejects.toThrow('Ambiguous return'); f.complete();
    if (kind === 'negative') facts.positive = false; else facts.drift = true;
    await expect(f.run()).rejects.toThrow(kind === 'negative' ? 'Unknown effects' : 'reservation material changed');
    expect(f.job.stoppedBaseUpdate!.audit.state).toBe('completed'); expect(f.job.stage).toBe('update-base'); expect(f.calls()).toBe(1);
});

test.each(['head','dirty'])('actual candidate %s drift blocks before reservation or audit dispatch', async kind => {
    const f = fixture(), run = vi.fn(); f.delivery.engine.agents.run = run;
    if (kind === 'head') f.state.local.head = 'c'.repeat(40); else f.state.local.status = ' M src/retained.ts';
    await expect(f.run()).rejects.toThrow('candidate changed or is dirty');
    expect(f.job.stoppedBaseUpdate).toBeUndefined(); expect(run).not.toHaveBeenCalled();
});

test.each(['head','dirty'])('actual candidate %s drift during the audit preserves completion and consumed budgets', async kind => {
    const f = fixture(), before = structuredClone({ head: f.job.head, branch: f.job.branch, worktree: f.job.worktree, repairCycle: f.job.repairCycle });
    const run = vi.fn(async () => {
        f.complete();
        if (kind === 'head') f.state.local.head = 'c'.repeat(40); else f.state.local.status = ' M src/retained.ts';
        return {};
    });
    f.delivery.engine.agents.run = run as any;
    await expect(f.run()).rejects.toThrow('candidate changed or is dirty');
    const recovery = f.job.stoppedBaseUpdate!;
    expect(recovery.audit.state).toBe('completed'); expect(recovery.audit.completion!.executionCompletionSha256).toBe(facts.completionFile.sha256);
    expect(recovery.disposition).toBeUndefined(); expect(f.job).toMatchObject(before); expect(existsSync(before.worktree)).toBe(true);
    await expect(f.run()).rejects.toThrow('candidate changed or is dirty'); expect(run).toHaveBeenCalledTimes(1);
});
