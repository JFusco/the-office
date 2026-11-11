import { afterEach, expect, test, vi } from 'vitest';
import { packed165Fixture } from '../support/packed165';
import { cleanupFakes } from '../support/fake-github';
import { beginPacked165Setup, checkPacked165SetupWork, PACKED165_SETUP, packed165SetupReady } from '../../../../server/delivery/recovery/packed165-setup-continuation';

vi.mock('../../../../server/workers/process', async original => ({ ...await original<any>(), processGroupAlive: vi.fn(() => false) }));
afterEach(cleanupFakes);
function failed() {
    const f = packed165Fixture(), scope = { ...PACKED165_SETUP, request: f.request.id };
    Object.assign(f.request, { status: 'blocked', detail: scope.error });
    f.store.state.workLog!.push({ id: scope.worker, requestId: f.job.id, claimId: scope.claim, provider: 'harness', stage: 'harness-packed165-forward-source',
        status: 'failed', processId: scope.processId, endedAt: scope.endedAt } as any);
    return { ...f, scope };
}
test('only the saved same-request failure gets one continuation; the failure and budgets remain retained', () => {
    const f = failed(), retry = structuredClone(f.job.retry), work = structuredClone(f.store.state.workLog);
    expect(packed165SetupReady(f.store, f.request, f.scope)).toBe(true);
    beginPacked165Setup(f.store, f.request, f.scope);
    expect(packed165SetupReady(f.store, f.request, f.scope)).toBe(false);
    expect(() => beginPacked165Setup(f.store, f.request, f.scope)).toThrow();
    expect(f.request.packed165SetupContinuation?.originalFailure).toBe(f.scope.error);
    expect(f.job.retry).toEqual(retry); expect(f.store.state.workLog).toEqual(work);
    expect(checkPacked165SetupWork(f.store, f.request, f.scope).result).toBe('ESRCH');
    f.store.state.workLog!.at(-1)!.status = 'running';
    expect(() => checkPacked165SetupWork(f.store, f.request, f.scope)).toThrow();
});
test.each(['another-request', 'another-failure', 'another-process', 'another-work', 'active-work', 'another-claim', 'completed'])('%s cannot gain a setup continuation', scenario => {
    const f = failed(), work = f.store.state.workLog!.at(-1)!;
    if (scenario === 'another-request') f.scope.request = 'other';
    if (scenario === 'another-failure') f.request.detail += ' other';
    if (scenario === 'another-process') work.processId!++;
    if (scenario === 'another-work') work.requestId = 'other';
    if (scenario === 'active-work') work.status = 'running';
    if (scenario === 'another-claim') work.claimId = 'other';
    if (scenario === 'completed') f.request.status = 'completed';
    expect(packed165SetupReady(f.store, f.request, f.scope)).toBe(false);
});
