import { test, expect, vi } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ciFixture, newHead } from '../../../fixtures/ci-repair';
import { workerProfile } from '../../../../server/workers/worker-profiles';
import * as processes from '../../../../server/workers/process';
import { digest, rootArtifact } from '../../../../server/store/readback-evidence';
import { reconcileCIDiagnosis } from '../../../../server/delivery/repairs/reconcile-ci-diagnosis';

function setup() {
    const f = ciFixture(); Object.assign(f.job, { stage: 'ci-recovery', status: 'working', mergeCommit: newHead, ciRecoveryAttemptAt: '2026-11-09T08:00:00Z' });
    vi.spyOn(processes, 'processGroupAlive').mockReturnValue(false);
    const putWorker = (stage: string, readOnly: boolean, result: unknown) => {
        const id = crypto.randomUUID(), sessionId = `native-${id}`, claim = f.store.claimWork({ projectId: 'brain', kind: 'delivery', id: f.job.id }, id, 'ci-recovery')!;
        const work: any = { id, sessionId, claimId: claim.id, lane: 'delivery', requestId: f.job.id, ticket: f.job.key, role: 'pm', provider: 'codex', stage,
            status: 'completed', executionStatus: 'completed', startedAt: '2026-11-09T08:00:01Z', endedAt: '2026-11-09T08:00:02Z', processId: 2147483400 };
        f.store.state.workLog ??= []; f.store.state.workLog.push(work); f.store.finishClaim(claim.id, 'completed');
        const dir = resolve(f.root, 'sessions', id); mkdirSync(dir, { recursive: true });
        const put = (name: string, value: unknown) => writeFileSync(resolve(dir, name), JSON.stringify(value));
        const profile = workerProfile(stage, readOnly), wrapper = { session: sessionId, provider: 'codex', result };
        put('provider.json', { project: 'brain', repository: f.store.project.repository, role: 'pm', provider: 'codex', readOnly });
        put('result.json', wrapper); put('capabilities.json', profile);
        put('assignment.json', { id, stage, role: 'pm', lane: 'delivery', claimId: claim.id, work: claim.work, scope: { repository: f.store.project.repository, worktree: f.store.project.repo, artifacts: dir }, profile: profile.name });
        put('assignment-identity.json', { attemptId: id, requestId: f.job.id, projectId: 'brain', repository: f.store.project.repository, role: 'pm', threadId: sessionId });
        put('execution-completion.json', { workerId: id, session: sessionId, provider: 'codex', resultSha256: digest(wrapper) });
        return work;
    };
    const original = putWorker('ci-recovery', false, { outcome: 'needs-human', issue: 0, summary: 'Provider download failure; no writes', receipts: [] });
    const roots = { codex: resolve(f.root, 'native'), claude: resolve(f.root, 'claude') }, directory = resolve(roots.codex, '2026/11/09'); mkdirSync(directory, { recursive: true });
    const nativePath = resolve(directory, `rollout-${original.sessionId}.jsonl`), input = JSON.stringify({ cmd: 'gh api repos/JFusco/brain/pulls/323' });
    const rows = [{ type: 'session_meta', payload: { id: original.sessionId, cwd: f.store.project.repo } },
        { type: 'response_item', payload: { type: 'function_call', call_id: 'original-read', name: 'exec_command', arguments: input } },
        { type: 'response_item', payload: { type: 'function_call_output', call_id: 'original-read', output: 'Synthetic PR read' } }];
    writeFileSync(nativePath, rows.map(r => JSON.stringify(r)).join('\n'));
    const audit = { outcome: 'passed', originalWorkerId: original.id, nativeSha256: rootArtifact(roots.codex, nativePath).sha256,
        completeNativeExecution: true, noExternalWrites: true, summary: 'Complete original execution was read-only', calls: [{ id: 'original-read', inputSha256: digest(input), classification: 'read-only' }] };
    let runs = 0;
    f.engine.agents.run = async (_role, task, _schema, options) => {
        runs++; expect(task).toContain('EVERY paired call'); expect(options?.readOnly).toBe(true);
        putWorker('ci-recovery-original-readback', true, structuredClone(audit)); return structuredClone(audit) as any;
    };
    return { ...f, original, roots, nativePath, audit, runs: () => runs };
}
test('a completed no-write diagnosis is audited once with actual native and worker identities, then reused durably', async () => {
    const f = setup(); expect(await reconcileCIDiagnosis(f.delivery, f.job, f.roots)).toBe(true);
    expect(f.job.ciRecoveryAttemptAt).toBe('2026-11-09T08:00:00Z'); expect(f.job.ciRecoveryNoWriteProof?.originalWorkerId).toBe(f.original.id);
    expect(await reconcileCIDiagnosis(f.delivery, f.job, f.roots)).toBe(true); expect(f.runs()).toBe(1);
    expect(f.calls).toHaveLength(0);
});
test.each(['external', 'blocked'])('a bound %s audit leaves ordinary read-back available without clearing the attempt', async kind => {
    const f = setup();
    if (kind === 'external') f.audit.calls[0].classification = 'external';
    if (kind === 'blocked') f.audit.outcome = 'blocked';
    expect(await reconcileCIDiagnosis(f.delivery, f.job, f.roots)).toBe(false);
    expect(f.job.ciRecoveryNoWriteProof).toBeUndefined(); expect(f.job.stage).toBe('ci-recovery'); expect(f.calls).toHaveLength(0);
});
test.each(['incomplete', 'wrong-input'])('an audit with %s coverage remains a hard evidence failure', async kind => {
    const f = setup();
    if (kind === 'incomplete') f.audit.calls = [];
    if (kind === 'wrong-input') f.audit.calls[0].inputSha256 = 'changed';
    await expect(reconcileCIDiagnosis(f.delivery, f.job, f.roots)).rejects.toThrow('audit identity');
    expect(f.job.ciRecoveryNoWriteProof).toBeUndefined();
});
test('an interrupted predecessor is not treated as a completed no-write diagnosis', async () => {
    const f = setup(); f.original.status = 'interrupted';
    expect(await reconcileCIDiagnosis(f.delivery, f.job, f.roots)).toBe(false); expect(f.runs()).toBe(0);
    expect(f.job.ciRecoveryNoWriteProof).toBeUndefined();
});
test('a native execution changed after accepted reconciliation invalidates the saved proof', async () => {
    const f = setup(); await reconcileCIDiagnosis(f.delivery, f.job, f.roots);
    writeFileSync(f.nativePath, readFileSync(f.nativePath, 'utf8') + '\n' + JSON.stringify({ type: 'event_msg', payload: { type: 'new-record' } }));
    await expect(reconcileCIDiagnosis(f.delivery, f.job, f.roots)).rejects.toThrow('evidence changed'); expect(f.runs()).toBe(1);
});
test('potential cache facts stay bound to the full audit and are rechecked before persistence and reuse', async () => {
    const f = setup(), cache = { path: '/registered/gh/run-log-123-456.zip', sha256: 'a'.repeat(64), size: 64, runId: 123, createdAt: '2026-11-09T08:00:01Z', modifiedAt: '2026-11-09T08:00:01Z' };
    const original = f.engine.agents.run;
    f.engine.agents.run = async (role, prompt, schema, options) => {
        expect(prompt).toContain('permitted ONLY in');
        expect(prompt).toContain(cache.sha256); expect(prompt).toContain('facts alone never prove who wrote'); expect(prompt).toContain('Unlisted cache paths');
        return original(role, prompt, schema, options);
    };
    const read = () => [cache];
    expect(await reconcileCIDiagnosis(f.delivery, f.job, f.roots, read)).toBe(true);
    const saved = JSON.parse(readFileSync(f.job.ciRecoveryNoWriteProof!.evidencePath, 'utf8')); expect(saved.localLogCaches).toEqual([cache]);
    cache.sha256 = 'b'.repeat(64);
    await expect(reconcileCIDiagnosis(f.delivery, f.job, f.roots, read)).rejects.toThrow('log-cache evidence changed');
    expect(f.runs()).toBe(1); expect(f.calls).toHaveLength(0);
});
test('cache drift during a full audit never saves affirmative proof or settles the original attempt', async () => {
    const f = setup(); let reads = 0;
    const cache = { path: '/registered/gh/run-log-123-456.zip', sha256: 'a'.repeat(64), size: 64, runId: 123, createdAt: '2026-11-09T08:00:01Z', modifiedAt: '2026-11-09T08:00:01Z' };
    const read = () => [{ ...cache, sha256: ++reads === 1 ? 'a'.repeat(64) : 'b'.repeat(64) }];
    await expect(reconcileCIDiagnosis(f.delivery, f.job, f.roots, read)).rejects.toThrow('log-cache evidence changed during audit');
    expect(f.job.ciRecoveryNoWriteProof).toBeUndefined(); expect(f.job.ciRecoveryAttemptAt).toBe('2026-11-09T08:00:00Z'); expect(f.calls).toHaveLength(0);
});
