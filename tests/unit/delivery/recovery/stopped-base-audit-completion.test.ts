import { afterEach, expect, test, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, appendFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { readStoppedBaseAuditCompletion } from '../../../../server/delivery/recovery/stopped-base-audit-completion';
import { stoppedBaseAuditMarker } from '../../../../server/delivery/recovery/stopped-base-audit-native';
import { assertStoppedBaseAudit } from '../../../../server/delivery/recovery/stopped-base-audit';
import { saveStoppedBaseArtifact, stoppedBaseUpdateResolved } from '../../../../server/delivery/recovery/stopped-base-disposition';
import { digest } from '../../../../server/store/readback-evidence';
import { workerProfile } from '../../../../server/workers/worker-profiles';
import { withAssignment } from '../../../../server/workers/assignment-context';
import * as processTools from '../../../../server/workers/process';
import type { StoppedBaseAuditInput } from '../../../../server/delivery/recovery/stopped-base-audit';
import type { HarnessRequest, WorkTime } from '../../../../src/shared';

afterEach(() => { vi.restoreAllMocks(); cleanupFakes(); });
function fixture(terminal = true, positive = false) {
    const f = fakeGitHub(), job = f.candidate({ existingPR: true, stage: 'update-base', status: 'interrupted' });
    job.worktree = resolve(f.artifactRoot(job), 'retained-candidate'); mkdirSync(job.worktree, { recursive: true });
    const request: HarnessRequest = { id: 'original-request', action: 'reconcile-base-update', key: job.key, head: 'original-worker',
        lane: 'delivery', status: terminal ? 'interrupted' : 'working', requestedAt: f.store.clock.now().toISOString(), detail: 'Original read-only audit' };
    (f.store.state.coordination!.requests ??= []).push(request);
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'reconciliation', id: request.id }, 'fixture', request.action, 'delivery')!;
    if (terminal) f.store.finishClaim(claim.id, 'interrupted');
    const work: WorkTime = { id: 'audit-reader', sessionId: 'native-audit-reader', requestId: job.id, ticket: job.key, claimId: claim.id, lane: 'delivery',
        role: 'lead', provider: 'codex', stage: 'stopped-base-update-audit', status: 'blocked', executionStatus: 'completed', processId: 2147483646,
        task: 'Synthetic original audit', model: 'fixture', effort: 'fixture', startedAt: claim.claimedAt, lastHeartbeatAt: claim.claimedAt,
        endedAt: claim.claimedAt, elapsedMs: 0, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: claim.claimedAt };
    (f.store.state.workLog ??= []).push(work);
    const input = { originalWorkId: request.head, nativeSha256: 'a'.repeat(64), nativeRecordCount: 3, originalArtifacts: [], rows: [] } as StoppedBaseAuditInput;
    if (positive) input.rows.push({ id: 'read:input:display', kind: 'input', sha256: 'b'.repeat(64), redacted: false,
        redactionBlocksSemantics: false, historicalVerified: false, view: { command: 'git status --porcelain' } });
    const result = { outcome: positive ? 'passed' : 'blocked', originalWorkId: request.head, nativeSha256: input.nativeSha256, noRepositorySourceOrPublicationMutation: positive,
        summary: positive ? 'Synthetic positive effects assessment' : 'Unknown original effects retained',
        rows: [{ id: positive ? input.rows[0].id : 'unresolved-call', sha256: 'b'.repeat(64), verified: positive, semanticsComplete: positive,
            redactionSafe: true, classification: positive ? 'read-only' : 'unknown', continuationUnaffected: positive,
            evidence: ['Synthetic native evidence'], uncertainty: positive ? '' : 'Missing tool result' }] };
    const root = resolve(f.store.dataRoot, 'sessions', work.id); mkdirSync(root, { recursive: true });
    const profile = workerProfile(work.stage, true);
    const records: Record<string, any> = {
        'provider.json': { project: f.store.project.id, repository: f.store.project.repository, role: work.role, provider: work.provider, readOnly: true },
        'result.json': { session: work.sessionId, result },
        'assignment.json': { id: work.id, claimId: claim.id, work: claim.work, stage: work.stage, role: work.role, lane: 'delivery', profile: profile.name,
            scope: { repository: f.store.project.repository, worktree: job.worktree, artifacts: root } },
        'assignment-identity.json': { attemptId: work.id, requestId: job.id, projectId: f.store.project.id, repository: f.store.project.repository, role: work.role, threadId: work.sessionId },
        'capabilities.json': profile,
    };
    const save = () => {
        Object.entries(records).forEach(([name, value]) => writeFileSync(resolve(root, name), JSON.stringify(value)));
        writeFileSync(resolve(root, 'execution-completion.json'), JSON.stringify({ workerId: work.id, session: work.sessionId, provider: work.provider,
            resultSha256: createHash('sha256').update(JSON.stringify(records['result.json'])).digest('hex') }));
    };
    save(); vi.spyOn(processTools, 'processGroupAlive').mockReturnValue(false);
    const nativeRoot = resolve(f.store.dataRoot, 'synthetic-native');
    const day = work.startedAt.slice(0, 10).replaceAll('-', '/'), nativePath = resolve(nativeRoot, day, `rollout-${work.sessionId}.jsonl`);
    mkdirSync(dirname(nativePath), { recursive: true });
    const native = [{ type: 'session_meta', payload: { id: work.sessionId, cwd: job.worktree } },
        { type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text: stoppedBaseAuditMarker + JSON.stringify(input) }] } },
        { type: 'event_msg', payload: { type: 'task_complete', last_agent_message: JSON.stringify(result) } }];
    const saveNative = () => writeFileSync(nativePath, native.map(record => JSON.stringify(record)).join('\n')); saveNative();
    const binding = { requestId: request.id, claimId: claim.id, workerId: work.id, cwd: job.worktree };
    return { ...f, job, request, claim, work, input, root, records, save, native, saveNative, binding,
        nativePath, run: () => readStoppedBaseAuditCompletion(f.store, job, binding, input, nativeRoot) };
}

test('a lost return reads the one actual completed audit without relabeling it or accepting a negative result', () => {
    const f = fixture(), before = JSON.stringify({ job: f.job, work: f.work, request: f.request });
    const proof = f.run();
    expect(proof.native.result.outcome).toBe('blocked');
    expect(proof.requestId).toBe(f.request.id); expect(proof.claimId).toBe(f.claim.id);
    expect(JSON.stringify({ job: f.job, work: f.work, request: f.request })).toBe(before);
    expect(f.state.calls).toEqual([]);
});

test('a running original claim requires its actual scheduler assignment', () => {
    const f = fixture(false);
    expect(f.run).toThrow('exact current scheduler claim');
    expect(withAssignment(f.claim, 'delivery', f.run).claimId).toBe(f.claim.id);
    expect(f.state.calls).toEqual([]);
});

test.each(['completion', 'identity', 'capability', 'request', 'claim', 'duplicate-reader', 'input', 'result'])
    ('missing or contradictory original audit %s never earns completion reuse', change => {
        const f = fixture();
        if (change === 'completion') delete f.work.executionStatus;
        if (change === 'identity') f.records['assignment-identity.json'].threadId = 'foreign';
        if (change === 'capability') f.records['capabilities.json'] = workerProfile(f.work.stage, false);
        if (change === 'request') f.request.head = 'foreign';
        if (change === 'claim') f.binding.claimId = 'foreign';
        if (change === 'duplicate-reader') f.store.state.workLog!.push({ ...f.work, id: 'another-reader' });
        if (change === 'input') f.input.nativeSha256 = 'c'.repeat(64);
        if (change === 'result') f.records['result.json'].result.summary = 'Different saved response';
        f.save();
        if (change === 'completion') rmSync(resolve(f.root, 'execution-completion.json'));
        expect(f.run).toThrow(); expect(f.state.calls).toEqual([]);
    });

function appliedDisposition() {
    const f = fixture(true, true), completed = f.run();
    assertStoppedBaseAudit(f.input, completed.native.result);
    const input = saveStoppedBaseArtifact(f.store, f.job, 'input.json', f.input);
    const result = completed.completionFiles.find(file => file.path.endsWith('/result.json'))!;
    const completion = completed.completionFiles.find(file => file.path.endsWith('/execution-completion.json'))!;
    const preserved = { head: f.job.head, branch: f.job.branch, worktree: f.job.worktree };
    const value = { jobId: f.job.id, originalWorkId: f.request.head, contextSha256: 'context', inputSha256: digest(f.input),
        auditWorkerId: f.work.id, resultSha256: result.sha256, candidateSha256: digest(preserved) };
    const disposition = saveStoppedBaseArtifact(f.store, f.job, 'disposition.json', value);
    f.store.transition('synthetic-disposition', 'Apply synthetic positive disposition', () => {
        f.job.stoppedBaseUpdate = { originalWorkId: f.request.head, originalSessionId: f.request.head, originalClaimId: 'original-claim',
            nativePath: '/retained-original', nativeSha256: f.input.nativeSha256, contextSha256: value.contextSha256, providerVersion: 'provider',
            input: { path: input.path, sha256: input.sha256, inputSha256: digest(f.input) }, phase: 'lead', preservedCandidate: preserved,
            disposition: { path: disposition.path, sha256: disposition.sha256, at: f.work.endedAt },
            audit: { key: 'reservation', state: 'completed', requestId: f.request.id, claimId: f.claim.id, workerId: f.work.id, reservedAt: f.work.startedAt,
                completion: { sessionId: f.work.sessionId, resultPath: result.path, resultSha256: result.sha256,
                    executionCompletionSha256: completion.sha256, nativePath: completed.native.file.path,
                    nativeSha256: completed.native.file.sha256, completedAt: f.work.endedAt } } };
        f.job.stage = 'lead-pr'; f.job.worktree = '';
    });
    return { ...f, paths: { disposition: disposition.path, input: input.path, result: result.path, completion: completion.path },
        resolved: () => stoppedBaseUpdateResolved(f.store, { key: f.job.key, head: f.request.head }) };
}

test.each(['archived', 'deleted'])('an applied positive disposition survives an %s audit rollout', change => {
    const f = appliedDisposition(); expect(f.resolved()).toBe(true);
    if (change === 'archived') renameSync(f.nativePath, f.nativePath + '.retained'); else rmSync(f.nativePath);
    expect(f.resolved()).toBe(true);
    expect(f.state.calls).toEqual([]);
});

test.each(['disposition', 'input', 'result', 'completion'] as const)('changed owned %s bytes invalidate an applied disposition', kind => {
    const f = appliedDisposition(); expect(f.resolved()).toBe(true);
    appendFileSync(f.paths[kind], '\n');
    expect(f.resolved()).toBe(false);
    expect(f.state.calls).toEqual([]);
});
