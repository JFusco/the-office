import { afterEach, expect, test } from 'vitest';
import { appendFileSync, copyFileSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { saveStoppedBaseArtifact, stoppedBaseHandoffResolved, stoppedBaseUpdateResolved } from '../../../../server/delivery/recovery/stopped-base-disposition';
import { artifact, digest } from '../../../../server/store/readback-evidence';
import { completedExecution } from '../../../../server/workers/worker-completion';
import type { WorkTime } from '../../../../src/shared';
afterEach(cleanupFakes);
test('immutable disposition preparation may reuse identical bytes after a lost tail, but never replace them', () => {
    const f = fakeGitHub(), job = f.candidate({}); mkdirSync(resolve(f.store.dataRoot,'ticket-work',job.id),{recursive:true});
    const first = saveStoppedBaseArtifact(f.store, job, 'proof.json', { audited: true });
    expect(saveStoppedBaseArtifact(f.store, job, 'proof.json', { audited: true }, true)).toEqual(first);
    expect(() => saveStoppedBaseArtifact(f.store, job, 'proof.json', { audited: false }, true)).toThrow('differs');
    expect(() => saveStoppedBaseArtifact(f.store, job, '../escape.json', {})).toThrow();
});
test('queued stages and completed flags alone never resolve the original recovery', () => {
    const f = fakeGitHub(), job = f.candidate({stage:'lead-pr'});
    job.stoppedBaseUpdate = { originalWorkId:'original', phase:'lead', audit:{state:'completed'}, disposition:{path:'/missing',sha256:'a'} } as any;
    expect(stoppedBaseUpdateResolved(f.store,{key:job.key,head:'original'})).toBe(false);
    expect(stoppedBaseUpdateResolved(f.store,{key:job.key,head:job.head})).toBe(false);
});

function boundHandoff() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'review' }), root = f.artifactRoot(job);
    const at = f.store.clock.now().toISOString(), preserved = { head: 'c'.repeat(40), branch: 'old-candidate', worktree: job.worktree };
    const audit = { id: 'audit-reader', requestId: job.id, claimId: 'audit-claim', sessionId: 'audit-session',
        role: 'lead', provider: 'codex', stage: 'stopped-base-update-audit', status: 'blocked', executionStatus: 'completed', endedAt: at } as WorkTime;
    const worker = { ...audit, id: 'handoff-reader', claimId: 'handoff-claim', sessionId: 'handoff-session',
        stage: 'stopped-base-update-handoff', status: 'completed' } as WorkTime;
    (f.store.state.workLog ??= []).push(audit, worker);
    const session = (work: WorkTime, result: unknown) => {
        const dir = resolve(f.store.dataRoot, 'sessions', work.id); mkdirSync(dir, { recursive: true });
        const saved = { session: work.sessionId, result };
        writeFileSync(resolve(dir, 'result.json'), JSON.stringify(saved));
        writeFileSync(resolve(dir, 'execution-completion.json'), JSON.stringify({ workerId: work.id, session: work.sessionId,
            provider: work.provider, resultSha256: digest(saved) }));
        return { result: artifact(f.store, resolve(dir, 'result.json')), completion: artifact(f.store, resolve(dir, 'execution-completion.json')) };
    };
    const input = { originalWorkId: 'original', nativeSha256: 'a'.repeat(64), nativeRecordCount: 3, originalArtifacts: [],
        rows: [{ id: 'read:input:display', kind: 'input', sha256: 'b'.repeat(64), redacted: false,
            redactionBlocksSemantics: false, historicalVerified: false, view: { command: 'git status --porcelain' } }] };
    const auditFiles = session(audit, { outcome: 'passed', originalWorkId: input.originalWorkId, nativeSha256: input.nativeSha256,
        noRepositorySourceOrPublicationMutation: true, summary: 'Synthetic positive effects assessment',
        rows: [{ id: input.rows[0].id, sha256: input.rows[0].sha256, verified: true, semanticsComplete: true, redactionSafe: true,
            classification: 'read-only', continuationUnaffected: true, evidence: ['Synthetic native evidence'], uncertainty: '' }] });
    const inputFile = saveStoppedBaseArtifact(f.store, job, 'input.json', input);
    const disposition = saveStoppedBaseArtifact(f.store, job, 'disposition.json', { jobId: job.id, originalWorkId: input.originalWorkId,
        contextSha256: 'context', inputSha256: digest(input), auditWorkerId: audit.id, resultSha256: auditFiles.result.sha256,
        candidateSha256: digest(preserved) });
    const handoffFiles = session(worker, { outcome: 'passed', prerequisites: [], approach: null, summary: 'Synthetic read-only handoff',
        commit: job.head, worktree: preserved.worktree, branch: job.branch, prId: job.pr, evidence: [{ id: 'review', kind: 'review',
            summary: 'Synthetic full diff review', path: resolve(root, 'review.md'), commit: job.head, environment: 'fixture', url: '', observedAt: at }],
        findings: [], receipts: [], previewUrl: '', qaRunDir: '', paidRuns: 0, blocker: '' });
    const nativePath = resolve(root, 'handoff-native.jsonl'); writeFileSync(nativePath, 'Captured synthetic handoff rollout');
    const native = artifact(f.store, nativePath), checkout = { id: 'prospective', head: job.head, branch: job.branch, worktree: job.worktree };
    const binding = saveStoppedBaseArtifact(f.store, job, 'candidate-binding.json', { originalWorkId: input.originalWorkId,
        handoffWorkerId: worker.id, handoffResultSha256: handoffFiles.result.sha256, checkoutSha256: digest(checkout) });
    job.stoppedBaseUpdate = { originalWorkId: input.originalWorkId, originalSessionId: 'original-session', originalClaimId: 'original-claim',
        nativePath: '/retained-original', nativeSha256: input.nativeSha256, contextSha256: 'context', providerVersion: 'provider', phase: 'review',
        input: { path: inputFile.path, sha256: inputFile.sha256, inputSha256: digest(input) }, preservedCandidate: preserved,
        disposition: { path: disposition.path, sha256: disposition.sha256, at },
        audit: { key: 'reservation', state: 'completed', requestId: 'audit-request', claimId: audit.claimId!, workerId: audit.id, reservedAt: at,
            completion: { sessionId: audit.sessionId, resultPath: auditFiles.result.path, resultSha256: auditFiles.result.sha256,
                executionCompletionSha256: auditFiles.completion.sha256, nativePath: '/archived-audit', nativeSha256: 'd'.repeat(64), completedAt: at } },
        handoffStarted: { claimId: worker.claimId!, head: job.head, providerVersion: 'provider', at },
        handoff: { workerId: worker.id, head: job.head, providerVersion: 'provider', resultPath: handoffFiles.result.path,
            resultSha256: handoffFiles.result.sha256, executionCompletionSha256: handoffFiles.completion.sha256, nativePath, nativeSha256: native.sha256 },
        checkout, candidateBinding: { path: binding.path, sha256: binding.sha256 } };
    return { ...f, job, worker, nativePath, paths: { binding: binding.path, result: handoffFiles.result.path, completion: handoffFiles.completion.path },
        resolved: () => stoppedBaseHandoffResolved(f.store, { key: job.key, head: worker.id }) };
}

test.each(['archived', 'deleted'])('a bound handoff survives an %s native rollout', change => {
    const f = boundHandoff(); expect(f.resolved()).toBe(true);
    if (change === 'archived') renameSync(f.nativePath, f.nativePath + '.retained'); else rmSync(f.nativePath);
    expect(f.resolved()).toBe(true); expect(f.state.calls).toEqual([]);
});

test.each(['binding', 'result', 'completion'] as const)('changed owned handoff %s bytes invalidate resolution', kind => {
    const f = boundHandoff(); expect(f.resolved()).toBe(true);
    appendFileSync(f.paths[kind], '\n');
    if (kind === 'completion') expect(completedExecution(f.store, f.worker)).toBe(true);
    expect(f.resolved()).toBe(false); expect(f.state.calls).toEqual([]);
});

test.each(['foreign-claim', 'missing-claim', 'missing-start', 'duplicate-worker', 'worker-id', 'stage', 'request', 'role', 'provider', 'unfinished', 'result-path'])
    ('a bound handoff rejects %s evidence', change => {
        const f = boundHandoff(); expect(f.resolved()).toBe(true);
        if (change === 'foreign-claim') f.worker.claimId = 'foreign';
        if (change === 'missing-claim') { delete f.worker.claimId; f.job.stoppedBaseUpdate!.handoffStarted!.claimId = ''; }
        if (change === 'missing-start') { delete f.worker.claimId; delete f.job.stoppedBaseUpdate!.handoffStarted; }
        if (change === 'duplicate-worker') f.store.state.workLog!.push({ ...f.worker, id: 'second-handoff' });
        if (change === 'worker-id') f.job.stoppedBaseUpdate!.handoff!.workerId = 'foreign';
        if (change === 'stage') f.worker.stage = 'github-review';
        if (change === 'request') f.worker.requestId = 'foreign';
        if (change === 'role') f.worker.role = 'developer';
        if (change === 'provider') f.worker.provider = 'claude';
        if (change === 'unfinished') delete f.worker.executionStatus;
        if (change === 'result-path') {
            const copy = resolve(f.artifactRoot(f.job), 'copied-result.json');
            copyFileSync(f.paths.result, copy);
            expect(artifact(f.store, copy).sha256).toBe(f.job.stoppedBaseUpdate!.handoff!.resultSha256);
            f.job.stoppedBaseUpdate!.handoff!.resultPath = copy;
        }
        expect(f.resolved()).toBe(false); expect(f.state.calls).toEqual([]);
    });
