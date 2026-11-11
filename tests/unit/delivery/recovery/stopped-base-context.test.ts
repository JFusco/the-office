import { afterEach, expect, test, vi } from 'vitest';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { readStoppedBaseContext, assertStoppedBaseCurrent } from '../../../../server/delivery/recovery/stopped-base-context';
import type { HarnessRequest, WorkTime } from '../../../../src/shared';

const facts = vi.hoisted(() => ({ original: {} as any, native: {} as any, provider: {} as any, scope: 'scope', mutateNative: false }));
vi.mock('../../../../server/delivery/recovery/stopped-base-original', () => ({ readStoppedBaseOriginal: () => structuredClone(facts.original) }));
vi.mock('../../../../server/delivery/recovery/stopped-base-native', () => ({ readStoppedClaudeNative: () => structuredClone(facts.native) }));
vi.mock('../../../../server/delivery/recovery/stopped-base-provider', () => ({ readStoppedBaseProviderContext: async () => {
    if (facts.mutateNative) facts.native.file.sha256 = 'b'.repeat(64);
    return structuredClone(facts.provider);
} }));
vi.mock('../../../../server/delivery/recovery/stopped-base-audit', () => ({ stoppedBaseAuditInput: () => ({
    originalWorkId: 'original-worker', nativeSha256: 'a'.repeat(64), originalArtifacts: [], rows: [], nativeRecordCount: 1,
}) }));
vi.mock('../../../../server/github/github-context', async importOriginal => ({
    ...await importOriginal<typeof import('../../../../server/github/github-context')>(), deliveryInputSha256: () => facts.scope,
}));

afterEach(cleanupFakes);
function fixture() {
    const f = fakeGitHub(), job = f.candidate({ existingPR: true, pr: 200, stage: 'update-base', status: 'interrupted' });
    const work = { id: 'original-worker', requestId: job.id, ticket: job.key, stage: 'github-update-base',
        role: 'developer', provider: 'claude', status: 'interrupted', inputTokens: null } as WorkTime;
    (f.store.state.workLog ??= []).push(work);
    const request: HarnessRequest = { id: 'original-readback', action: 'reconcile-base-update', key: job.key, head: work.id,
        lane: 'delivery', status: 'working', requestedAt: f.store.clock.now().toISOString(), detail: 'Original readback' };
    (f.store.state.coordination!.requests ??= []).push(request);
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'reconciliation', id: request.id }, 'fixture', request.action, 'delivery')!;
    facts.original = { worker: structuredClone(work), claim: { id: 'prior-original-claim' }, candidate: { path: '/synthetic-original' },
        files: [], termination: { result: 'ESRCH', observedAt: 'first observation' } };
    facts.native = { file: { path: '/synthetic-native', sha256: 'a'.repeat(64), ownership: [] } };
    facts.provider = { issue: { observedAt: 'first observation', issue: { body: 'Bound human scope' }, comments: [], board: { item: { id: 'card', status: 'In progress' } } },
        pr: { head: '9'.repeat(40) }, version: 'provider-version' };
    facts.scope = 'scope'; facts.mutateNative = false;
    const commands = vi.fn(f.execute); f.delivery.execute = commands;
    return { ...f, job, work, request, claim,
        commands,
        run: () => withAssignment(claim, 'delivery', () => readStoppedBaseContext(f.delivery, job, request)),
        current: (expected: { materialSha256: string }) => withAssignment(claim, 'delivery', () => assertStoppedBaseCurrent(f.delivery, job, request, expected)) };
}

test('observation time, the reservation and its own audit accounting do not change material input identity', async () => {
    const f = fixture(), before = await f.run();
    facts.original.termination.observedAt = 'later observation'; facts.provider.issue.observedAt = 'later observation';
    facts.original.worker.inputTokens = 12; f.work.inputTokens = 12;
    f.job.stoppedBaseUpdate = { phase: 'audit', audit: { claimId: f.claim.id, state: 'dispatched' } } as any;
    f.store.state.workLog!.push({ id: 'audit', requestId: f.job.id, claimId: f.claim.id, stage: 'stopped-base-update-audit', status: 'completed' } as WorkTime);
    expect((await f.current(before)).materialSha256).toBe(before.materialSha256);
    expect(f.commands.mock.calls.every(([, , options]) => options?.readOnly === true)).toBe(true);
});

test.each(['native', 'scope', 'provider', 'finding', 'other-worker'])('material %s drift prevents application of a saved audit', async change => {
    const f = fixture(), before = await f.run();
    if (change === 'native') facts.native.file.sha256 = 'b'.repeat(64);
    if (change === 'scope') facts.scope = 'changed scope';
    if (change === 'provider') facts.provider.pr.head = '8'.repeat(40);
    if (change === 'finding') f.job.repairCycle = { pendingFindingIds: ['new-finding'] } as any;
    if (change === 'other-worker') f.store.state.workLog!.push({ id: 'other', requestId: f.job.id, stage: 'github-implement', status: 'completed' } as WorkTime);
    await expect(f.current(before)).rejects.toThrow('audit inputs changed');
    expect(f.commands.mock.calls.every(([, , options]) => options?.readOnly === true)).toBe(true);
});

test('native evidence changing while provider reads await stops before any reservation or model dispatch', async () => {
    const f = fixture(); facts.mutateNative = true;
    await expect(f.run()).rejects.toThrow('changed during context readback');
    expect(f.job.stoppedBaseUpdate).toBeUndefined();
    expect(f.commands.mock.calls.every(([, , options]) => options?.readOnly === true)).toBe(true);
});
test.each(['head','branch','dirty'])('actual candidate %s drift is rejected with unchanged directory identity',async kind=>{
    const f=fixture(), original=structuredClone(facts.original.candidate), before=await f.run();
    if(kind==='head')f.state.local.head='c'.repeat(40);
    if(kind==='branch')f.state.local.branch='foreign-branch';
    if(kind==='dirty')f.state.local.status=' M src/retained.ts';
    await expect(f.current(before)).rejects.toThrow('candidate changed or is dirty');
    expect(facts.original.candidate).toEqual(original);
    expect(f.job.stoppedBaseUpdate).toBeUndefined();
    expect(f.commands.mock.calls.every(([, , options])=>options?.readOnly===true)).toBe(true);
});
