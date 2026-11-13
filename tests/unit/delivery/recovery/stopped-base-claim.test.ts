import { afterEach, expect, test } from 'vitest';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { stoppedBaseClaim } from '../../../../server/delivery/recovery/stopped-base-claim';
import { assessDeliveryAuthority } from '../../../../server/delivery/harness/delivery-authority';
import { withAssignment } from '../../../../server/workers/assignment-context';
import type { HarnessRequest, WorkTime } from '../../../../src/shared';

afterEach(cleanupFakes);
function fixture() {
    const f = fakeGitHub(), job = f.candidate({ existingPR: true, pr: 200, stage: 'update-base', status: 'interrupted' });
    (f.store.state.workLog ??= []).push({ id: 'original-worker', requestId: job.id, ticket: job.key,
        stage: 'github-update-base', role: 'developer', provider: 'claude', status: 'interrupted' } as WorkTime);
    const request: HarnessRequest = { id: 'original-readback', action: 'reconcile-base-update', key: job.key, head: 'original-worker',
        lane: 'delivery', status: 'working', requestedAt: f.store.clock.now().toISOString(), detail: 'Original readback' };
    (f.store.state.coordination!.requests ??= []).push(request);
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'reconciliation', id: request.id }, 'fixture', request.action, 'delivery')!;
    return { ...f, job, request, claim, run: () => withAssignment(claim, 'delivery', () => stoppedBaseClaim(f.store, job, request)),
        authority: () => withAssignment(claim, 'delivery', () => assessDeliveryAuthority(f.store, job)) };
}

test('the real original reconciliation claim permits bounded readback before an audit is reserved', () => {
    const f = fixture();
    expect(f.run().id).toBe(f.claim.id);
    expect(f.authority().authorized).toBe(false);
    expect(f.state.calls).toEqual([]);
});

test('only the bound dispatched reservation permits the actual audit worker gate', () => {
    const f = fixture();
    f.job.stoppedBaseUpdate = { originalWorkId: f.request.head, phase: 'audit', audit: {
        state: 'reserved', requestId: f.request.id, claimId: f.claim.id } } as any;
    expect(f.authority().authorized).toBe(false);
    f.job.stoppedBaseUpdate!.audit.state = 'dispatched';
    expect(f.authority().authorized).toBe(true);
    f.job.stoppedBaseUpdate!.audit.state = 'completed';
    expect(f.authority().authorized).toBe(false);
});

test.each(['unassigned', 'paused', 'prerequisite', 'stopping', 'foreign-head', 'replaced-request', 'competing-worker'])
    ('stopped original readback refuses %s before dispatch or mutation', change => {
        const f = fixture();
        if (change === 'paused') f.store.state.paused = true;
        if (change === 'prerequisite') f.job.prerequisites = [{} as any];
        if (change === 'stopping') f.claim.status = 'stopping';
        if (change === 'foreign-head') f.request.head = 'foreign-worker';
        if (change === 'replaced-request') f.store.state.coordination!.requests![0] = { ...f.request };
        if (change === 'competing-worker') f.store.state.workLog!.push({ id: 'other', requestId: f.job.id, claimId: 'other-claim', status: 'running' } as WorkTime);
        const run = change === 'unassigned' ? () => stoppedBaseClaim(f.store, f.job, f.request) : f.run;
        expect(run).toThrow('Exact stopped-base readback claim');
        expect(f.state.calls).toEqual([]);
    });

test('draining lets the existing claim finish and unrelated knowledge work supplies no delivery conflict', () => {
    const f = fixture(); f.store.state.draining = true;
    f.store.claimWork({ projectId: f.store.project.id, kind: 'knowledge-rollup', id: 'knowledge-record' }, 'fixture', 'knowledge-rollup', 'knowledge');
    expect(f.run().id).toBe(f.claim.id);
});
