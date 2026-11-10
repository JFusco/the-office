import { afterEach, expect, test, vi } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import { boardPreflightCandidate, reconcileBoardPreflight } from '../../../../server/delivery/recovery/board-preflight';
import { HOLDS } from '../../../../server/office/config';
import { enqueueRequest } from '../../../../server/scheduling/requests';
import { withAssignment } from '../../../../server/workers/assignment-context';
import type { TicketJob } from '../../../../src/shared';

afterEach(() => { delete HOLDS['GH-5']; cleanupFakes(); });
function fixture() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'update-base', status: 'blocked', pr: 156, existingPR: true,
        prUrl: `https://github.com/${f.store.project.repository}/pull/156`, detail: 'Error: Board transition needs read-back: Error: gh exited 1: gh: HTTP 499' });
    f.store.state.coordination!.enabled = true;
    job.repairCycle = { owner: 'developer', attempts: 1, findingAttempts: { F001: 1, F002: 1 }, phase: 'repair', pendingFindingIds: ['F001', 'F002'], publishedHead: HEAD } as any;
    job.boardUpdates = [{ stage: 'update-base', head: HEAD, project: 'project', item: 'pr-card', field: 'status', option: 'progress', target: 'In progress',
        at: '2026-11-10T02:05:29.447Z', status: 'uncertain', detail: 'Error: gh exited 1: gh: HTTP 499' }];
    f.state.cards[0].status = 'review'; f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 156, status: 'progress' });
    f.state.prs.push({ number: 156, html_url: job.prUrl, state: 'open', body: 'Closes #5', head: { sha: HEAD, ref: job.branch, repo: { full_name: f.store.project.repository } },
        base: { ref: 'main', sha: BASE, repo: { full_name: f.store.project.repository } }, merged_at: null });
    const request = enqueueRequest(f.store, 'reconcile-base-update', job.key, HEAD);
    request.status = 'working';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'reconciliation', id: request.id }, 'fixture', request.action)!;
    const owner = async () => ({ complete: true, fresh: true, project: f.store.project.id, key: job.key, ownership: { status: 'clear' } });
    let writes = 0;
    let afterRead = () => {};
    f.delivery.execute = async (p, a, o) => {
        if (p !== 'gh' || a[0] === 'api' && a[1] === 'graphql' && JSON.parse(o!.input!).query.startsWith('mutation')) { writes++; throw new Error('No write/source process is authorized in this recovery'); }
        const result = await f.execute(p, a, o);
        afterRead();
        return result;
    };
    const worker = vi.fn(async () => { throw new Error('No source worker is authorized in this recovery'); });
    f.engine.agents.run = worker as any;
    const reconcile = (ownership = owner) => withAssignment(claim, 'delivery', () => reconcileBoardPreflight(f.delivery, request, ownership));
    const persistedJob = (): TicketJob => JSON.parse((f.store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string }).body).coordination.jobs.find((current: TicketJob) => current.id === job.id);
    f.store.save();
    return { f, job, request, claim, owner, reconcile, worker, persistedJob, writes: () => writes, afterRead: (fn: typeof afterRead) => { afterRead = fn; } };
}

test('the exact landed pre-worker transition settles once and preserves the same candidate, failures and budget', async () => {
    const x = fixture(), before = structuredClone(x.job);
    expect(boardPreflightCandidate(x.f.store, x.job)?.head).toBe(HEAD);
    expect(await x.reconcile()).toBe(true);
    expect(x.job).toMatchObject({ id: before.id, key: before.key, head: before.head, branch: before.branch, worktree: before.worktree, status: 'queued', stage: 'update-base', repairCycle: before.repairCycle });
    expect(x.job.steps).toEqual(before.steps);
    expect(x.job.boardUpdates![0]).toMatchObject({ ...before.boardUpdates![0], status: 'verified', detail: expect.stringContaining('HTTP 499') });
    expect(x.persistedJob()).toEqual(x.job);
    expect(x.writes()).toBe(0);
    expect(x.worker).not.toHaveBeenCalled();
    expect(await x.reconcile()).toBe(false);
    expect(x.f.store.state.events.filter(event => event.kind === 'board-preflight-reconciled')).toHaveLength(1);
});

test('an unlanded transition or a partial multi-card readback changes no attempt and never resends', async () => {
    for (const partial of [false, true]) {
        const x = fixture();
        if (partial) x.job.boardUpdates!.push({ ...x.job.boardUpdates![0], item: 'issue-card' });
        else x.f.state.cards[1].status = 'review';
        const before = structuredClone(x.job);
        x.f.store.save();
        await expect(x.reconcile()).rejects.toThrow('uncertain');
        expect(x.job).toEqual(before); expect(x.writes()).toBe(0);
        expect(x.persistedJob()).toEqual(before);
    }
});

test('any previous source worker/result or original claim refuses pre-worker admission', () => {
    for (const change of [
        (x: ReturnType<typeof fixture>) => { x.f.store.state.workLog!.push({ requestId: x.job.id, stage: 'github-update-base', status: 'failed' } as any); },
        (x: ReturnType<typeof fixture>) => { x.job.steps.push({ stage: 'update-base', result: { receipts: [] } } as any); },
        (x: ReturnType<typeof fixture>) => { x.f.store.activeClaims = () => [{ work: { kind: 'delivery', id: x.job.id } }] as any; },
        (x: ReturnType<typeof fixture>) => { x.f.store.state.draining = true; },
        (x: ReturnType<typeof fixture>) => { HOLDS[x.job.key] = 'Joe hold'; },
        (x: ReturnType<typeof fixture>) => { x.job.prerequisites = [{}] as any; },
    ]) { const x = fixture(); change(x); expect(boardPreflightCandidate(x.f.store, x.job)).toBeUndefined(); delete HOLDS['GH-5']; }
});

test('head/link/board/ownership drift refuses without changing the original record', async () => {
    for (const change of [
        (x: ReturnType<typeof fixture>) => { x.f.state.prs[0].head.sha = 'c'.repeat(40); },
        (x: ReturnType<typeof fixture>) => { x.f.state.prs[0].body = 'Closes #6'; },
        (x: ReturnType<typeof fixture>) => { x.job.boardUpdates![0].field = 'foreign-field'; },
    ]) {
        const x = fixture(); change(x); const before = structuredClone(x.job);
        await expect(x.reconcile()).rejects.toThrow();
        expect(x.job).toEqual(before); expect(x.writes()).toBe(0);
    }
    const x = fixture(), before = structuredClone(x.job);
    await expect(x.reconcile(async () => ({ ...await x.owner(), fresh: false }))).rejects.toThrow('ownership');
    expect(x.job).toEqual(before);
});

test('a control change after asynchronous native readback cannot queue or settle the job', async () => {
    const x = fixture(), original = x.f.delivery.execute, before = structuredClone(x.job);
    x.f.delivery.execute = async (p, a, o) => { const result = await original(p, a, o); if (p === 'gh' && a[1] === 'graphql' && JSON.parse(o!.input!).query.includes('fieldValues')) x.f.store.state.paused = true; return result; };
    await expect(x.reconcile()).rejects.toThrow('changed');
    expect(x.job).toEqual(before); expect(x.writes()).toBe(0);
});

test('a missing assignment cannot settle the registered request', async () => {
    const x = fixture(), before = structuredClone(x.job);
    await expect(reconcileBoardPreflight(x.f.delivery, x.request, x.owner)).rejects.toThrow('claim');
    expect(x.job).toEqual(before);
    expect(x.persistedJob()).toEqual(before);
    expect(x.writes()).toBe(0);
});

test.each(['wrong-request', 'wrong-stage', 'interrupted', 'unregistered-request', 'queued-request'] as const)('a %s lease refuses admission', async change => {
    const x = fixture(), before = structuredClone(x.job);
    let claim = x.claim;
    if (change === 'wrong-request' || change === 'wrong-stage') {
        x.f.store.finishClaim(claim.id, 'completed');
        claim = x.f.store.claimWork({ projectId: x.f.store.project.id, kind: 'reconciliation', id: change === 'wrong-request' ? 'another-request' : x.request.id }, 'fixture', change === 'wrong-stage' ? 'reconcile-review' : x.request.action)!;
    }
    if (change === 'interrupted') x.f.store.finishClaim(claim.id, 'interrupted');
    if (change === 'unregistered-request') x.f.store.state.coordination!.requests = [];
    if (change === 'queued-request') x.request.status = 'queued';
    await expect(withAssignment(claim, 'delivery', () => reconcileBoardPreflight(x.f.delivery, x.request, x.owner))).rejects.toThrow(/request|claim/);
    expect(x.job).toEqual(before);
    expect(x.persistedJob()).toEqual(before);
    expect(x.writes()).toBe(0);
    expect(x.worker).not.toHaveBeenCalled();
});

test.each(['claim', 'request', 'head', 'action', 'removed-request', 'transaction-claim'] as const)('%s drift cannot settle the original board attempts or persist a queued job', async change => {
    const x = fixture(), before = structuredClone(x.job);
    const interrupt = () => {
        if (change === 'claim' || change === 'transaction-claim') x.f.store.finishClaim(x.claim.id, 'interrupted');
        if (change === 'request') x.request.status = 'interrupted';
        if (change === 'head') x.request.head = 'c'.repeat(40);
        if (change === 'action') x.request.action = 'reconcile-review';
        if (change === 'removed-request') x.f.store.state.coordination!.requests = [];
        x.f.store.save();
    };
    if (change === 'transaction-claim') {
        const transition = x.f.store.transition.bind(x.f.store);
        x.f.store.transition = (type, detail, apply, role, ticket) => transition(type, detail, () => { interrupt(); return apply(); }, role, ticket);
    }
    else x.afterRead(interrupt);
    await expect(x.reconcile()).rejects.toThrow('changed');
    expect(x.job).toEqual(before);
    expect(x.f.delivery.jobs.find(current => current.id === x.job.id)).toEqual(before);
    expect(x.persistedJob()).toEqual(before);
    expect(x.writes()).toBe(0);
    expect(x.worker).not.toHaveBeenCalled();
});

test.each(['block', 'backlog', 'done', 'unknown'])('an issue in %s cannot settle a pending PR-only transition', async lane => {
    const x = fixture(), before = structuredClone(x.job);
    x.f.state.cards[0].status = lane;
    await expect(x.reconcile()).rejects.toThrow('human or unknown lane');
    expect(x.job).toEqual(before);
    expect(x.persistedJob()).toEqual(before);
    expect(x.writes()).toBe(0);
    expect(x.worker).not.toHaveBeenCalled();
});

test.each(['ready', 'progress', 'review'])('an ordinary %s issue lane still permits GET-only reconciliation', async lane => {
    const x = fixture();
    x.f.state.cards[0].status = lane;
    expect(await x.reconcile()).toBe(true);
    expect(x.persistedJob()).toMatchObject({ status: 'queued', stage: 'update-base' });
    expect(x.writes()).toBe(0);
    expect(x.worker).not.toHaveBeenCalled();
});

test('an issue moved to Block before final readback retains the original uncertainty', async () => {
    const x = fixture(), before = structuredClone(x.job);
    let ownershipReads = 0;
    await expect(x.reconcile(async () => {
        if (++ownershipReads === 2) x.f.state.cards[0].status = 'block';
        return x.owner();
    })).rejects.toThrow('human or unknown lane');
    expect(ownershipReads).toBe(2);
    expect(x.job).toEqual(before);
    expect(x.persistedJob()).toEqual(before);
    expect(x.writes()).toBe(0);
    expect(x.worker).not.toHaveBeenCalled();
});
