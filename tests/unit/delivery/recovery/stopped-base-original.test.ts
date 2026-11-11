import { afterEach, expect, test, vi } from 'vitest';
import { mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { readStoppedBaseOriginal } from '../../../../server/delivery/recovery/stopped-base-original';
import { workerProfile } from '../../../../server/workers/worker-profiles';
import * as processTools from '../../../../server/workers/process';
import type { WorkTime } from '../../../../src/shared';

afterEach(() => { vi.restoreAllMocks(); cleanupFakes(); });
function fixture() {
    const f = fakeGitHub(), job = f.candidate({ existingPR: true, pr: 200, stage: 'update-base', status: 'interrupted' });
    job.worktree = resolve(f.artifactRoot(job), 'retained-candidate'); mkdirSync(resolve(job.worktree, '.git'), { recursive: true });
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'fixture', 'update-base', 'delivery')!;
    f.store.finishClaim(claim.id, 'interrupted');
    const work: WorkTime = { id: 'original', sessionId: 'original', requestId: job.id, ticket: job.key, claimId: claim.id, lane: 'delivery',
        role: 'developer', provider: 'claude', stage: 'github-update-base', status: 'interrupted', processId: 2147483646,
        task: 'Synthetic stopped writer', model: 'fixture', effort: 'fixture', startedAt: claim.claimedAt, lastHeartbeatAt: claim.claimedAt,
        endedAt: claim.claimedAt, elapsedMs: 0, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: true, reportedAt: claim.claimedAt };
    (f.store.state.workLog ??= []).push(work);
    const root = resolve(f.store.dataRoot, 'sessions', work.id); mkdirSync(root, { recursive: true });
    const profile = workerProfile(work.stage, false);
    const records: Record<string, any> = {
        'provider.json': { project: f.store.project.id, repository: f.store.project.repository, role: work.role, provider: work.provider, readOnly: false, session: work.sessionId },
        'assignment.json': { id: work.id, claimId: claim.id, work: claim.work, stage: work.stage, role: work.role, lane: 'delivery', profile: profile.name,
            scope: { repository: f.store.project.repository, worktree: job.worktree, artifacts: root } },
        'assignment-identity.json': { attemptId: work.id, requestId: job.id, projectId: f.store.project.id, repository: f.store.project.repository, role: work.role, threadId: work.sessionId },
        'capabilities.json': profile,
    };
    const save = () => Object.entries(records).forEach(([name, value]) => writeFileSync(resolve(root, name), JSON.stringify(value)));
    save(); const alive = vi.spyOn(processTools, 'processGroupAlive').mockReturnValue(false);
    const changeClaim = (change: (value: typeof claim) => void) => {
        const value = JSON.parse((f.store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(claim.id) as { body: string }).body);
        change(value); f.store.db.prepare('UPDATE work_claims SET body=? WHERE id=?').run(JSON.stringify(value), claim.id);
    };
    return { ...f, job, work, claim, root, records, save, alive, changeClaim, run: () => readStoppedBaseOriginal(f.store, job, work.id) };
}

test('original interrupted identity remains incomplete and unchanged after read-only binding', () => {
    const f = fixture(), before = JSON.stringify({ job: f.job, work: f.work }), bytes = readFileSync(resolve(f.root, 'assignment.json'));
    const proof = f.run();
    expect(proof.worker).toEqual(f.work); expect(proof.worker.status).toBe('interrupted'); expect(proof.files).toHaveLength(4);
    expect(proof.termination.result).toBe('ESRCH'); expect(proof).not.toHaveProperty('result');
    expect(JSON.stringify({ job: f.job, work: f.work })).toBe(before); expect(readFileSync(resolve(f.root, 'assignment.json'))).toEqual(bytes);
    expect(f.state.calls).toEqual([]);
});

test.each(['ticket-work', 'job'])('a symlink at %s cannot redirect the retained private candidate outside the store', kind => {
    const f = fixture(), ticketWork = resolve(f.store.dataRoot, 'ticket-work');
    const ancestor = kind === 'ticket-work' ? ticketWork : resolve(ticketWork, f.job.id);
    const outside = resolve(f.repo, 'outside-candidate-ancestry');
    renameSync(ancestor, outside); symlinkSync(outside, ancestor, 'dir');
    expect(f.records['assignment.json'].scope.worktree).toBe(f.job.worktree);
    f.store.save();
    const before = JSON.stringify({ job: f.job, work: f.work }), saved = f.store.db.prepare('SELECT body FROM state WHERE id=1').get();
    const artifacts = Object.keys(f.records).map(name => ({ path: resolve(f.root, name), bytes: readFileSync(resolve(f.root, name)) }));
    expect(f.run).toThrow('must not contain symbolic links');
    expect(JSON.stringify({ job: f.job, work: f.work })).toBe(before);
    expect(f.store.db.prepare('SELECT body FROM state WHERE id=1').get()).toEqual(saved);
    for (const file of artifacts) expect(readFileSync(file.path)).toEqual(file.bytes);
    expect(f.state.calls).toEqual([]);
});

test.each(['live-group', 'missing-pid', 'stopping', 'completion-flag', 'uncertain-timing', 'future-heartbeat', 'foreign-session',
    'duplicate-worker', 'active-source-claim', 'source-result', 'primary-candidate', 'assignment', 'capability', 'missing-artifact',
    'running-original-claim', 'claim-binding', 'claim-ended-too-early', 'invalid-worker-id', 'invalid-job-id', 'negative-elapsed'])('original binding rejects %s without changing the saved job', kind => {
    const f = fixture();
    if (kind === 'live-group') f.alive.mockReturnValue(true);
    if (kind === 'missing-pid') delete f.work.processId;
    if (kind === 'stopping') f.work.status = 'stopping';
    if (kind === 'completion-flag') f.work.executionStatus = 'completed';
    if (kind === 'uncertain-timing') f.work.durationUncertain = false;
    if (kind === 'future-heartbeat') f.work.lastHeartbeatAt = new Date(Date.parse(f.work.endedAt) + 1000).toISOString();
    if (kind === 'foreign-session') f.work.sessionId = 'foreign';
    if (kind === 'duplicate-worker') f.store.state.workLog!.push({ ...f.work, id: 'duplicate' });
    if (kind === 'active-source-claim') f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'fixture', 'update-base', 'delivery');
    if (kind === 'source-result') f.job.steps.push({ stage: 'update-base', workerId: f.work.id, result: {} as any });
    if (kind === 'primary-candidate') f.job.worktree = f.store.project.repo;
    if (kind === 'assignment') f.records['assignment.json'].claimId = 'foreign';
    if (kind === 'capability') f.records['capabilities.json'] = workerProfile(f.work.stage, true);
    if (kind === 'running-original-claim') f.changeClaim(c => { c.status = 'running'; c.endedAt = ''; });
    if (kind === 'claim-binding') f.changeClaim(c => { c.work.id = 'foreign'; });
    if (kind === 'claim-ended-too-early') f.changeClaim(c => { c.endedAt = new Date(Date.parse(f.work.startedAt) - 1000).toISOString(); });
    if (kind === 'invalid-worker-id') f.work.id = f.work.sessionId = '../original';
    if (kind === 'invalid-job-id') f.job.id = '../job';
    if (kind === 'negative-elapsed') f.work.elapsedMs = -1;
    f.save(); if (kind === 'missing-artifact') rmSync(resolve(f.root, 'provider.json'));
    const before = JSON.stringify({ job: f.job, work: f.work }); expect(f.run).toThrow();
    expect(JSON.stringify({ job: f.job, work: f.work })).toBe(before); expect(f.state.calls).toEqual([]);
});

test.each(['result.json', 'execution-completion.json', 'provider-completion.json', 'completed-output.json'])('unexpected original %s stays with its existing completion readback path', name => {
    const f = fixture(); writeFileSync(resolve(f.root, name), '{}'); expect(f.run).toThrow('existing readback');
});
