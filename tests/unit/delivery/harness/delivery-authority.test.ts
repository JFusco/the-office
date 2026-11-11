import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { coordination } from '../../../../server/scheduling/coordination';
import { projectById } from '../../../../server/office/projects';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { assessDeliveryAuthority, assessDeliveryEligibility, resolveDeliveryWork } from '../../../../server/delivery/harness/delivery-authority';
import { HOLDS } from '../../../../server/office/config';
import type { TicketJob, WorkKind } from '../../../../src/shared';
const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); delete HOLDS['GH-9999']; });
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-authority-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store); store.state.coordination = coordination();
    const job: TicketJob = { id: 'job', key: 'GH-9999', requestedAt: '2026-11-10T00:00:00Z', status: 'working', stage: 'prepare-pr', head: 'a'.repeat(40), pr: 161,
        steps: [], detail: '', worktree: '', branch: 'topic', prUrl: 'https://github.com/JFusco/cms-field-vocabulary/pull/161',
        admission: { kind: 'linked-pr', projectId: store.project.id, jobId: 'job', key: 'GH-9999', reference: 'https://github.com/JFusco/cms-field-vocabulary/pull/161', at: '2026-11-10T00:00:00Z' } } satisfies TicketJob;
    store.state.coordination.jobs = [job];
    const claim = store.claimWork({ projectId: store.project.id, kind: 'delivery', id: job.id }, 'Office', job.stage)!;
    const run = <T>(f: () => T) => withAssignment(claim, 'delivery', f);
    return { store, job, claim, run };
}
test('an admitted exact claim works with unavailable optional context; context never becomes complete', () => {
    const f = fixture(), context = { project: f.store.project.id, key: f.job.key, complete: false, fresh: false, ownership: { status: 'unavailable' } };
    const authority = f.run(() => assessDeliveryAuthority(f.store, f.job, { context }));
    expect(authority.authorized).toBe(true); expect(authority.context).toEqual(context); expect(context.complete).toBe(false);
    expect(assessDeliveryAuthority(f.store, f.job).authorized).toBe(false);
});
test('missing admission, stale persisted claim, foreign lane, wrong stage and subject each refuse execution', () => {
    const f = fixture(), admission = f.job.admission;
    delete f.job.admission; expect(f.run(() => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false); f.job.admission = admission;
    expect(withAssignment(f.claim, 'operations', () => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false);
    f.job.stage = 'merge'; expect(f.run(() => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false); f.job.stage = 'prepare-pr';
    expect(f.run(() => assessDeliveryAuthority(f.store, f.job, { context: { project: 'brain', key: f.job.key, complete: true, fresh: true } }).authorized)).toBe(false);
    f.store.finishClaim(f.claim.id, 'completed'); expect(f.run(() => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false);
});
test.each(['daily-cto', 'knowledge-rollup', 'knowledge-research', 'knowledge-source', 'retrospective', 'conversation', 'feature', 'maintenance', 'checkpoint', 'notice', 'intake', 'continuation', 'mail'] as WorkKind[])
    ('unrelated %s work does not become a delivery conflict (plan FIND-013)', kind => {
        const f = fixture(); f.store.claimWork({ projectId: f.store.project.id, kind, id: 'unrelated' }, 'other', 'other', 'knowledge');
        expect(f.run(() => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(true);
    });
test('unknown delivery/reconciliation and same-job cross-kind stopping claims block; foreign project does not', () => {
    const f = fixture();
    expect(resolveDeliveryWork(f.store, { projectId: 'brain', kind: 'delivery', id: 'other' }).kind).toBe('unrelated');
    expect(f.run(() => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(true);
    for (const kind of ['delivery', 'reconciliation'] as const) {
        const other = f.store.claimWork({ projectId: f.store.project.id, kind, id: 'unknown' }, 'other', 'other', 'operations')!;
        expect(f.run(() => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false); f.store.finishClaim(other.id, 'completed');
    }
    const request = { id: 'request', action: 'reconcile-pr-metadata', lane: 'delivery', status: 'working', key: f.job.key, head: f.job.head,
        prMetadataRecovery: { jobId: f.job.id, head: f.job.head }, requestedAt: '2026-11-10T00:00:00Z' } as any;
    f.store.state.coordination!.requests = [request];
    const competitor = f.store.claimWork({ projectId: f.store.project.id, kind: 'reconciliation', id: request.id }, 'other', request.action)!;
    f.store.finishClaim(competitor.id, 'stopping');
    expect(f.run(() => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false);
    f.store.finishClaim(f.claim.id, 'completed');
    expect(withAssignment(competitor, 'delivery', () => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false);
});
test('eligibility grants no write; drain permits existing stage, pause and hold do not', () => {
    const f = fixture(); f.store.finishClaim(f.claim.id, 'completed'); expect(assessDeliveryEligibility(f.store, f.job).eligible).toBe(true);
    expect(assessDeliveryAuthority(f.store, f.job).authorized).toBe(false);
    const claim = f.store.claimWork(f.claim.work, 'Office', f.job.stage)!;
    f.store.state.draining = true;
    expect(assessDeliveryEligibility(f.store, f.job).eligible).toBe(false);
    expect(withAssignment(claim, 'delivery', () => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(true);
    f.store.state.paused = true; expect(withAssignment(claim, 'delivery', () => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false);
    f.store.state.paused = false; HOLDS[f.job.key] = 'human'; expect(withAssignment(claim, 'delivery', () => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false);
});
test('accounting requests are unrelated, but a non-delivery kind borrowing a real job ID is unresolved', () => {
    const f = fixture(); f.store.state.coordination!.requests = [{ id: 'accounting', action: 'reconcile-time', key: f.job.key } as any];
    expect(resolveDeliveryWork(f.store, { projectId: f.store.project.id, kind: 'reconciliation', id: 'accounting' }).kind).toBe('unrelated');
    expect(resolveDeliveryWork(f.store, { projectId: f.store.project.id, kind: 'daily-cto', id: f.job.id }).kind).toBe('unresolved');
});
test('claim loss during an await is detected by the next assessment', async () => {
    const f = fixture(); await f.run(async () => {
        expect(assessDeliveryAuthority(f.store, f.job).authorized).toBe(true);
        await Promise.resolve().then(() => f.store.finishClaim(f.claim.id, 'completed'));
        expect(assessDeliveryAuthority(f.store, f.job).authorized).toBe(false);
    });
});
test('positively bound delivery and original readback claims exclude one another in both directions', () => {
    const f = fixture(); f.store.state.workLog!.push({ id: 'original', requestId: f.job.id, ticket: f.job.key, status: 'failed' } as any);
    const request = { id: 'readback', action: 'reconcile-validation', key: f.job.key, head: 'original', status: 'working', lane: 'delivery' } as any;
    f.store.state.coordination!.requests = [request];
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'reconciliation', id: request.id }, 'Sam', request.action)!;
    expect(resolveDeliveryWork(f.store, claim.work).kind).toBe('job');
    expect(f.run(() => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false);
    expect(withAssignment(claim, 'delivery', () => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false);
    f.store.finishClaim(f.claim.id, 'completed');
    expect(withAssignment(claim, 'delivery', () => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false);
    expect(withAssignment(claim, 'delivery', () => assessDeliveryAuthority(f.store, f.job).blockers)).toContain('This recovery retains its existing native ownership checks');
    request.head = 'unbound'; expect(withAssignment(claim, 'delivery', () => assessDeliveryAuthority(f.store, f.job).authorized)).toBe(false);
});
