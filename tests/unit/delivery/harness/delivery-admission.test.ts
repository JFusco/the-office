import { afterEach, expect, test } from 'vitest';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { deliveryAdmission } from '../../../../server/delivery/harness/delivery-admission';
afterEach(cleanupFakes);
test('job presence and missing automaticStatus are not admission; a positive existing original claim binds historical work', () => {
    const f = fakeGitHub(), job = f.candidate(); delete job.admission; delete job.automaticStatus;
    expect(deliveryAdmission(f.store, job)).toBeUndefined();
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'Office', job.stage)!;
    f.store.finishClaim(claim.id, 'interrupted');
    f.store.state.workLog!.push({ id: 'original', requestId: job.id, ticket: job.key, claimId: claim.id, status: 'interrupted' } as any);
    expect(deliveryAdmission(f.store, job)).toBe('historical-assignment:original');
    // Provenance does not claim completion or allow that worker to replay.
    expect(f.store.state.workLog!.at(-1)!.status).toBe('interrupted');
    f.store.state.workLog!.at(-1)!.claimId = 'foreign'; expect(deliveryAdmission(f.store, job)).toBeUndefined();
});
test('new admission is bound to its project, exact job and key', () => {
    const f = fakeGitHub(), job = f.candidate(), original = structuredClone(job.admission!);
    for (const change of [{ jobId: 'other' }, { projectId: 'brain' }, { key: 'GH-6' }, { kind: 'unknown' }, { reference: '' }]) {
        job.admission = { ...original, ...change } as any; expect(deliveryAdmission(f.store, job)).toBeUndefined();
    }
});

test.each(['foreign-owner', 'cancelled-intervening-job', 'immediately-preceding-ready'] as const)('historical admission binds the original review: %s', scenario => {
    const f = fakeGitHub(), job = f.candidate({ requestedAt: '2026-11-10T01:00:00Z' });
    delete job.admission;
    f.store.state.coordination!.listener.reviews.push({
        id: 'prior', key: job.key, status: scenario === 'foreign-owner' ? 'owned' : 'ready',
        workRequested: 'manual', owner: scenario === 'foreign-owner' ? 'another-job' : undefined,
        queuedAt: '2026-11-10T00:00:00Z',
    } as any);
    if (scenario === 'cancelled-intervening-job') f.delivery.jobs.push({
        ...job, id: 'retired', status: 'cancelled', requestedAt: '2026-11-10T00:30:00Z',
    });
    expect(deliveryAdmission(f.store, job)).toBe(scenario === 'immediately-preceding-ready' ? 'historical-review:prior' : undefined);
});

test.each(['unowned-linked-pr', 'foreign-owned-linked-pr', 'exact-owned-linked-pr', 'exact-owner'] as const)('historical owned review admits only its bound job: %s', scenario => {
    const f = fakeGitHub(), job = f.candidate({ pr: scenario === 'exact-owner' ? 0 : 200, requestedAt: '2026-11-10T01:00:00Z' });
    delete job.admission;
    f.store.state.coordination!.listener.reviews.push({
        id: 'prior', key: job.key, status: 'owned', prNumber: 200,
        owner: scenario === 'unowned-linked-pr' ? '' : scenario === 'foreign-owned-linked-pr' ? 'another-job' : job.id,
        queuedAt: '2026-11-10T00:00:00Z',
    } as any);
    expect(f.store.state.workLog).toEqual([]);
    expect(deliveryAdmission(f.store, job)).toBe(scenario === 'foreign-owned-linked-pr' ? undefined : 'historical-review:prior');
});
