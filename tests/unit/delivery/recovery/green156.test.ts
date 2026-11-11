import { afterEach, expect, test, vi } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { green156Fixture } from '../support/green156';
import { cleanupFakes } from '../support/fake-github';
import { green156Admitted, GREEN156 } from '../../../../server/delivery/recovery/green156-evidence';
import { assertAutomationEffects } from '../../../../server/delivery/readiness/automation-effects';
import { stoppedBaseUpdateResolved, stoppedBaseReassessmentReady } from '../../../../server/delivery/recovery/stopped-base-disposition';
import { assertStoppedBaseMergeReady } from '../../../../server/delivery/recovery/stopped-base-validation';
import { stoppedBaseUpdateUnresolved } from '../../../../server/it/stopped-base-update-recovery';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { HOLDS } from '../../../../server/office/config';
import { deterministicActions } from '../../../../server/scheduling/requests';
import { scheduledWork } from '../../../../server/scheduling/scheduled-work';

vi.mock('../../../../server/delivery/recovery/green156-authorization', async original => ({ GREEN156: {
    ...(await original<typeof import('../../../../server/delivery/recovery/green156-authorization')>()).GREEN156,
    audit: '26fa7fa7122b63c8db4b57a3f126c98fa0a3fbdcbd0dd815c86cc2917eb70584' } }));
afterEach(() => { delete HOLDS['GH-159']; cleanupFakes(); });
test('the one-time administrative request retains the existing delivery claim lane', () => {
    const f = green156Fixture(), entry = { store: f.store, engine: f.engine, conversations: {} as any };
    expect(deterministicActions.has(f.request.action)).toBe(false);
    expect(scheduledWork(entry, new Map(), new Date(), 'delivery').some(w => w.work.id === f.request.id)).toBe(true);
    expect(scheduledWork(entry, new Map(), new Date(), 'operations').some(w => w.work.id === f.request.id)).toBe(false);
});
test('one exact-head green-only admission preserves the negative audit, abandoned candidate and budgets without manufacturing review or QA', async () => {
    const f = green156Fixture(), audit = structuredClone(f.job.stoppedBaseUpdate!.audit), old = f.job.worktree;
    const bytes = readFileSync(audit.completion!.resultPath, 'utf8');
    await f.run(); await f.run();
    expect(f.job).toMatchObject({ head: GREEN156.head, stage: 'merge', status: 'queued', worktree: '', repairCycle: { attempts: 2, findingAttempts: { retained: 3 } } });
    expect(f.job.stoppedBaseUpdate!.phase).toBe('audit'); expect(f.job.stoppedBaseUpdate!.audit).toEqual(audit);
    expect(readFileSync(audit.completion!.resultPath, 'utf8')).toBe(bytes);
    const value = JSON.parse(readFileSync(f.job.stoppedBaseUpdate!.greenMerge!.path, 'utf8'));
    expect(value.preservedCandidate.worktree).toBe(old); expect(f.job.steps).toEqual([]);
    expect(freshStatus()).toBe(true);
    function freshStatus() { return green156Admitted(f.store, f.job); }
    expect(stoppedBaseUpdateResolved(f.store, { key: f.job.key, head: f.original.id })).toBe(false);
    expect(stoppedBaseReassessmentReady(f.store, { key: f.job.key, head: f.original.id })).toBe(true);
    expect(stoppedBaseUpdateUnresolved(f.store, `stopped-base-update:${f.job.id}:${f.original.id}`)).toBe(false);
    expect(() => assertStoppedBaseMergeReady(f.store, f.job, GREEN156.head)).not.toThrow();
    expect(() => assertStoppedBaseMergeReady(f.store, f.job, 'other-head')).toThrow();
    expect(f.enqueue()).toBe(f.request); expect(f.store.state.coordination!.requests).toHaveLength(1);
    expect(f.state.calls.every(c => c.startsWith('gh '))).toBe(true);
    expect(f.state.calls.some(c => /--method|POST|PUT|PATCH|merge/.test(c))).toBe(false);
});
test.each(['hold', 'paused', 'writer', 'claim', 'effect', 'native-result', 'completion', 'job', 'head', 'files'])('%s blocks before administrative admission', async kind => {
    const f = green156Fixture();
    if (kind === 'hold') HOLDS[f.job.key] = 'Fixture hold';
    if (kind === 'paused') f.store.state.paused = true;
    if (kind === 'writer') f.original.status = 'running';
    if (kind === 'claim') f.store.finishClaim(f.claim.id, 'completed');
    if (kind === 'effect') f.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('uncertain', `cms-field-vocabulary:delivery:${f.job.id}`, 'uncertain', JSON.stringify({ status: 'uncertain', dispatchedAt: 'fixture' }));
    if (kind === 'native-result') writeFileSync(f.job.stoppedBaseUpdate!.audit.completion!.resultPath, '{}');
    if (kind === 'completion') f.audit.executionStatus = undefined;
    if (kind === 'job') f.job.id = 'other';
    if (kind === 'head') f.state.prs[0].head.sha = 'd'.repeat(40);
    if (kind === 'files') f.state.prFiles[156] = ['server/code.ts', 'pnpm-lock.yaml'];
    await expect(f.run()).rejects.toThrow(); expect(f.job.stoppedBaseUpdate!.greenMerge).toBeUndefined();
});
test('current green hosted checks merge once via ordinary Office Effects without any native review or QA worker', async () => {
    const f = green156Fixture(); await f.run();
    f.request.status = 'completed'; f.store.finishClaim(f.claim.id, 'completed');
    const pr = f.state.prs[0], execute = f.delivery.execute.bind(f.delivery); let puts = 0;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'gh' && args[0] === 'api') {
            if (args[1] === 'graphql') return JSON.stringify({ data: { repository: { pullRequest: { headRefOid: GREEN156.head, baseRefName: 'main', mergeStateStatus: 'CLEAN', reviewDecision: null, reviewThreads: { nodes: [], pageInfo: { hasNextPage: false } } } } } });
            if (args[1] === `repos/${GREEN156.repository}/commits/${GREEN156.head}/status`) return JSON.stringify({ sha: GREEN156.head, state: 'success', total_count: 1, statuses: [{ state: 'success' }] });
            if (args[1] === `repos/${GREEN156.repository}`) return JSON.stringify({ allow_merge_commit: true });
            if (args[1].endsWith('/merge') && args.includes('PUT')) { puts++; pr.merged_at = 'fixture'; pr.merge_commit_sha = 'e'.repeat(40); return JSON.stringify({ merged: true, sha: pr.merge_commit_sha }); }
        }
        return execute(program, args, options);
    }) as typeof f.delivery.execute;
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'merge-owner', 'merge')!;
    f.job.status = 'working'; await withAssignment(claim, 'delivery', () => f.delivery.merge(f.job));
    expect(puts).toBe(1); expect(f.job.mergeCommit).toBe('e'.repeat(40)); expect(f.job.status).toBe('watching');
    expect(f.store.getEffect(f.job.mergeIntentId!)!.status).toBe('verified'); expect(f.job.steps).toEqual([]);
    await expect(withAssignment(claim, 'delivery', () => f.delivery.merge(f.job))).rejects.toThrow(); expect(puts).toBe(1);
});
test('a foreign or attempted merge Effect never qualifies for the preflight exemption', async () => {
    const f = green156Fixture(); await f.run(); f.job.mergeIntentId = 'merge-intent';
    const body = { id: 'merge-intent', status: 'prepared', operation: 'github-merge', payload: { sha: GREEN156.head }, dispatchedAt: '' };
    f.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run(body.id, `cms-field-vocabulary:delivery:${f.job.id}`, body.status, JSON.stringify(body));
    expect(() => assertAutomationEffects(f.store, f.job, true)).not.toThrow();
    f.store.db.prepare('UPDATE effects SET body=? WHERE id=?').run(JSON.stringify({ ...body, dispatchedAt: 'attempted' }), body.id);
    expect(() => assertAutomationEffects(f.store, f.job, true)).toThrow();
});
