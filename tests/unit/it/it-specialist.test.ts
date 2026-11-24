import { partialLocalCleanupKey } from '../../../server/delivery/recovery/closeout/local-worktree-removal';
import { markAwaitingRepair, unmark } from '../incidents/repair/mark-fixture';
import { REPAIR_WAIT_MS } from '../../../server/incidents/repair/repair-wait';
import * as closeoutRecovery from '../../../server/delivery/recovery/closeout/closeout-recovery-evidence';
import * as scopeRepair from '../../../server/delivery/recovery/scope-repair/scope-repair-resume';
import { GitHubDelivery } from '../../../server/delivery/pipeline/github-delivery';
import { expect, test, vi } from 'vitest';
import { ITSpecialist } from '../../../server/it/it-specialist';
import { initialSnapshot } from '../../../server/store/store';
import { coordination } from '../../../server/scheduling/coordination';
import { projectById } from '../../../server/office/projects';
import { syncOutbox } from '../../../server/conversations/outbox';
import { DatabaseSync } from 'node:sqlite';
import { initializeStoreSchema } from '../../../server/store/store-schema';
function setup() {
    const state = initialSnapshot();
    state.project = projectById('brain');
    state.coordination = coordination();
    // enqueueRequest writes the request and its admission row in one transaction.
    const db = new DatabaseSync(':memory:'); initializeStoreSchema(db);
    const store = { state, project: state.project, clock: { now: () => new Date() }, activeClaims: () => [], save: vi.fn(), emit: vi.fn(), db, transaction: <T>(operation: () => T) => operation() };
    const coordinator = { poll: vi.fn(async () => { }), retryCheckpoint: vi.fn() }, engine = { observe: vi.fn(async () => { }) };
    const offices = { entries: new Map([['brain', { store, engine, coordinator }]]) };
    const health = { report: vi.fn(async () => ({ checkedAt: '', context: '', services: [{ id: 'github', name: 'GitHub', status: 'connected', detail: 'Verified', checkedAt: '' }] })) };
    return { state, store, coordinator, engine, health, it: new ITSpecialist(offices as any, health as any) };
}
test('IT enqueues durable read recovery and does not execute it outside the scheduler', async () => {
    const a = setup(), now = new Date('2026-10-28T21:00:00Z');
    a.state.coordination!.listener.error = 'connection reset';
    await a.it.tick(now);
    expect(a.coordinator.poll).not.toHaveBeenCalled();
    expect(a.state.coordination!.requests).toHaveLength(1);
    expect(a.state.it!.status).toBe('retrying');
    await a.it.tick(new Date(now.getTime() + 60000), true);
    expect(a.state.coordination!.requests).toHaveLength(1);
    expect(a.state.it!.recoveries['assignment-listener'].attempts).toBe(1);
    a.state.coordination!.requests![0].status = 'completed';
    a.state.coordination!.listener.error = '';
    await a.it.tick(new Date(now.getTime() + 120000), true);
    expect(a.state.it!.recoveries['assignment-listener'].status).toBe('resolved');
});
test('failed queued reads retain bounded retry ownership with Morgan', async () => {
    const a = setup();
    a.state.github = { status: 'blocked', error: 'HTTP 503', observedAt: '', issues: [], prs: [], runs: [] };
    for (const ms of [0, 60000, 180000, 600000]) {
        for (const request of a.state.coordination!.requests || [])
            request.status = 'blocked';
        await a.it.tick(new Date(1793221200000 + ms), true);
    }
    expect(a.engine.observe).not.toHaveBeenCalled();
    expect(a.state.coordination!.requests).toHaveLength(3);
    expect(a.state.it!.recoveries['project-progress'].status).toBe('needs-human');
    expect(a.state.it!.reports.at(-1)!.followUps[0]).toMatchObject({ owner: 'Morgan' });
});
test('unknown provider checks never request a login after retries, while confirmed authentication failures do', async () => {
    const a = setup();
    a.health.report.mockResolvedValue({ checkedAt: '', context: '', services: [{ id: 'anthropic', name: 'Claude', status: 'unknown', detail: 'Status check timed out', checkedAt: '', nextStep: 'Run /login' }] } as any);
    for (const ms of [0, 60000, 180000, 600000])
        await a.it.tick(new Date(1793221200000 + ms), true);
    // An incomplete probe stays with Ellis however often it repeats; only a confirmed logout reaches Joe.
    expect(a.state.it!.reports.at(-1)!.followUps).toEqual([expect.objectContaining({ id: 'probe:anthropic', owner: 'IT', routine: true })]);
    // Listed, not counted: a watch on the Office's surroundings does not make Ellis look busy.
    expect(a.state.it!.status).toBe('monitoring');
    expect(a.state.it!.reports.at(-1)!.summary).toContain('no operational recovery is pending');
    syncOutbox(a.state);
    expect(a.state.outbox.filter(o => o.status === 'open')).toEqual([]);
    a.health.report.mockResolvedValue({ checkedAt: '', context: '', services: [{ id: 'anthropic', name: 'Claude', status: 'disconnected', detail: 'Not logged in', checkedAt: '', nextStep: 'Run /login' }] } as any);
    await a.it.tick(new Date(1793222000000), true);
    syncOutbox(a.state);
    // A confirmed logout is the owner's alone: its own item with the steps, while the follow-up keeps the check's own next step.
    expect(a.state.it!.reports.at(-1)!.followUps).toEqual([expect.objectContaining({ id: 'login:anthropic', owner: 'You', detail: 'Run /login' })]);
    expect(a.state.outbox.filter(o => o.status === 'open')).toEqual([expect.objectContaining({ id: 'only-you:login:anthropic', title: 'Only you can do this: sign in to Claude', ownerSteps: expect.objectContaining({ steps: expect.arrayContaining([{ text: 'Check whether Claude is signed in.', run: 'claude auth status' }]) }) })]);
});
test('a GitHub sign-in item raised for a sign-out resolves once a rate limit is all the check reports', async () => {
    const a = setup();
    a.store.emit.mockImplementation((kind: string) => { if (kind === 'it-report') syncOutbox(a.state); });
    a.health.report.mockResolvedValue({ checkedAt: '', context: '', services: [{ id: 'github', name: 'GitHub', status: 'disconnected', detail: 'GitHub could not verify its active account.', checkedAt: '', nextStep: 'Check gh auth status in your terminal. Confirm repo and project scopes for the intended account.' }] } as any);
    await a.it.tick(new Date(1793221200000), true);
    expect(a.state.it!.reports.at(-1)!.followUps).toEqual([expect.objectContaining({ id: 'login:github', owner: 'You' })]);
    expect(a.state.outbox.find(o => o.id === 'only-you:login:github')).toMatchObject({ status: 'open', ownerSteps: expect.objectContaining({ steps: expect.any(Array) }) });
    a.health.report.mockResolvedValue({ checkedAt: '', context: '', services: [{ id: 'github', name: 'GitHub', status: 'unknown', detail: 'A GitHub API rate limit blocked this check. The Office could not verify sign-in.', checkedAt: '', nextStep: 'Ellis will check again automatically.' }] } as any);
    await a.it.tick(new Date(1793221260000), true);
    expect(a.state.it!.reports.at(-1)!.followUps).toEqual([expect.objectContaining({ id: 'probe:github', owner: 'IT', routine: true })]);
    expect(a.state.outbox.find(o => o.id === 'only-you:login:github')?.status).toBe('resolved');
});
test('public provider incidents and unreadable status pages do not request credential recovery', async () => {
    const a = setup();
    a.health.report.mockResolvedValue({ checkedAt: '', context: '', services: [
        { id: 'provider:openai', kind: 'provider', name: 'OpenAI public status', status: 'warning', detail: 'Service disruption', checkedAt: '' },
        { id: 'provider:anthropic', kind: 'provider', name: 'Claude public status', status: 'unknown', detail: 'Status unavailable', checkedAt: '' },
    ] } as any);
    await a.it.tick();
    expect(a.state.it!.reports.at(-1)!.followUps).toEqual([]);
    expect(a.state.it!.recoveries).toEqual({});
    expect(a.state.it!.services).toHaveLength(2);
});
test('a listener recovery owned by IT resolves its duplicate human outbox item', async () => {
    const a = setup();
    a.state.coordination!.listener.error = 'gh read timed out';
    syncOutbox(a.state);
    expect(a.state.outbox.some(o => o.status === 'open')).toBe(true);
    await a.it.tick();
    syncOutbox(a.state);
    expect(a.state.outbox.filter(o => o.status === 'open')).toEqual([]);
    expect(a.state.it!.reports.at(-1)!.followUps[0].owner).toBe('IT');
});
test('IT never retries auth or ambiguous writes and respects paused project work', async () => {
    const a = setup();
    a.state.coordination!.listener.error = 'Permission denied; previous write uncertain';
    a.health.report.mockResolvedValue({ checkedAt: '', context: '', services: [{ id: 'github', name: 'GitHub', status: 'disconnected', detail: 'Login unavailable', checkedAt: '', nextStep: 'Run gh auth status in the Office service account.' }] } as any);
    await a.it.tick();
    expect(a.coordinator.poll).not.toHaveBeenCalled();
    expect(a.engine.observe).not.toHaveBeenCalled();
    expect(a.state.it!.reports.at(-1)!.followUps.some(f => f.detail.includes('gh auth status'))).toBe(true);
    a.state.paused = true;
    a.state.coordination!.listener.error = 'connection reset';
    await a.it.tick(new Date(Date.now() + 60000), true);
    expect(a.coordinator.poll).not.toHaveBeenCalled();
});
test('IT restores only eligible Ready ownership reads, with a three-attempt cap and no Backlog pickup', async () => {
    const a = setup();
    const inventory = { complete: true, fresh: true };
    (a.it as any).offices.sessions = { forProject: () => inventory, refresh: vi.fn() };
    a.state.coordination!.pickup = { enabled: true, status: 'Ready' };
    a.state.coordination!.listener.assigned = [{ key: 'GH-91', pickupStatus: 'Ready' }, { key: 'GH-70', pickupStatus: 'Backlog' }] as any;
    const review = (key: string) => ({ id: key, key, status: 'blocked', detail: 'Office must restore complete session visibility; inventory unavailable', queuedAt: '' });
    a.state.coordination!.listener.reviews = [review('GH-91'), review('GH-70')] as any;
    const r = a.state.coordination!.listener.reviews[0];
    for (let i = 0; i < 4; i++) {
        r.status = 'blocked';
        r.detail = 'Office must restore complete session visibility; inventory unavailable';
        await a.it.tick(new Date(1793221200000 + i * 60000), true);
    }
    expect(r.itRecoveryAttempts).toBe(3);
    expect(r.status).toBe('blocked');
    expect(a.state.coordination!.listener.reviews[1].status).toBe('blocked');
    expect(a.state.it!.reports.at(-1)!.followUps.some(f => f.owner === 'Morgan')).toBe(true);
});
test('an ownership read awaiting a harness repair is not requeued and its attempts are not spent; it is restored once the wait ends', async () => {
    const a = setup();
    (a.it as any).offices.sessions = { forProject: () => ({ complete: true, fresh: true }), refresh: vi.fn() };
    a.state.coordination!.pickup = { enabled: true, status: 'Ready' };
    a.state.coordination!.listener.assigned = [{ key: 'GH-91', pickupStatus: 'Ready' }, { key: 'GH-92', pickupStatus: 'Ready' }] as any;
    const review = (key: string) => ({ id: key, key, status: 'blocked', detail: 'Office must restore complete session visibility; inventory unavailable', queuedAt: '', endedAt: '2026-10-29T00:00:00Z' });
    a.state.coordination!.listener.reviews = [review('GH-91'), review('GH-92')] as any;
    const [held, other] = a.state.coordination!.listener.reviews, at = new Date(1793221200000);
    a.store.clock.now = () => at;
    markAwaitingRepair(a.state, 'brain', { kind: 'intake', id: held.id }, 'assignment-review', { since: at.toISOString(), progressAt: at.toISOString() });
    const before = JSON.stringify(held);
    for (let i = 0; i < 3; i++) await a.it.tick(new Date(at.getTime() + i * 60000), true);
    expect(JSON.stringify(held)).toBe(before);
    expect(held.itRecoveryAttempts).toBeUndefined();
    // The review nothing covers is restored as before.
    expect(other.itRecoveryAttempts).toBe(1);
    expect(other.status).toBe('queued');
    unmark(a.state);
    await a.it.tick(new Date(at.getTime() + 4 * 60000), true);
    expect(held).toMatchObject({ itRecoveryAttempts: 1, status: 'queued' });
});

test('a saved recovery about held work survives ticks that never visit it: not resolved, not reset, one routine follow-up; without the wait the ledger settles it', async () => {
    const run = async (wait: 'held' | 'absent' | 'released during tick') => {
        const a = setup(), at = new Date(1793221200000);
        a.store.clock.now = () => at;
        a.state.coordination!.jobs = [{ id: 'job-7', key: 'GH-7', status: 'blocked', stage: 'review', detail: 'Error: Worktree is missing', head: 'abc1234', requestedAt: 'r', updatedAt: 'u', steps: [], stop: { kind: 'unclassified', at: 't1' } }] as any;
        a.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], recoveries: { 'pr-review-readback:job-7': { attempts: 2, nextAt: '2026-10-29T00:10:00.000Z', status: 'retrying', detail: 'earlier', requestId: 'req-gone' } } } as any;
        if (wait !== 'absent') markAwaitingRepair(a.state, 'brain', { kind: 'delivery', id: 'job-7' }, 'review', { since: at.toISOString(), progressAt: at.toISOString() });
        if (wait === 'released during tick') {
            (a.it as any).offices.sessions = { forProject: () => {
                unmark(a.state);
                return { complete: true, fresh: true };
            } };
        }
        const ticks = wait === 'held' ? 3 : 1;
        for (let i = 0; i < ticks; i++) await a.it.tick(new Date(at.getTime() + i * 60000), true);
        return { recovery: a.state.it!.recoveries['pr-review-readback:job-7'], followUps: a.state.it!.reports.at(-1)!.followUps.filter(f => f.id === 'pr-review-readback:job-7') };
    };
    const held = await run('held');
    expect(held.recovery).toEqual({ attempts: 2, nextAt: '2026-10-29T00:10:00.000Z', status: 'retrying', detail: 'earlier', requestId: 'req-gone' });
    expect(held.followUps).toEqual([{ id: 'pr-review-readback:job-7', owner: 'IT', detail: 'Awaiting harness repair JFusco/the-office#389; held without spending an attempt.', routine: true }]);
    const free = await run('absent');
    expect(free.recovery).toMatchObject({ status: 'resolved', nextAt: '' });
    expect(free.followUps).toEqual([]);
    expect(await run('released during tick')).toEqual(free);
});

test.each([false, true])('ownership recovery uses the decision clock when expiry during the health read is %s', async expires => {
    const a = setup(), markedAt = new Date('2026-10-28T21:00:00Z');
    const expiry = new Date(markedAt.getTime() + REPAIR_WAIT_MS);
    let at = new Date(expiry.getTime() - 1);
    a.store.clock.now = () => at;
    (a.it as any).offices.sessions = { forProject: () => ({ complete: true, fresh: true }) };
    const c = a.state.coordination!;
    c.pickup = { enabled: true, status: 'Ready' };
    c.listener.assigned = [{ key: 'GH-91', pickupStatus: 'Ready' }] as any;
    c.listener.reviews = [{ id: 'review', key: 'GH-91', status: 'blocked', detail: 'Session inventory unavailable', endedAt: markedAt.toISOString(), itRecoveryAttempts: 1 }] as any;
    const review = c.listener.reviews[0], before = structuredClone(review);
    markAwaitingRepair(a.state, 'brain', { kind: 'intake', id: review.id }, 'assignment-review', { since: markedAt.toISOString(), progressAt: markedAt.toISOString() });
    const report = await a.health.report();
    a.health.report.mockImplementationOnce(async () => {
        if (expires) at = expiry;
        return report;
    });
    const tickAt = at;

    await a.it.tick(tickAt, true);

    if (expires) expect(review).toMatchObject({ status: 'queued', itRecoveryAttempts: 2, queuedAt: tickAt.toISOString() });
    else expect(review).toEqual(before);
});

test.each(['closeout', 'scope-repair'] as const)('an existing %s recovery preserves status until its repair wait ends', async stage => {
    const a = setup(), at = new Date('2026-10-28T21:00:00Z'), head = 'a'.repeat(40), proof = 'e'.repeat(64);
    a.store.project = a.state.project = projectById('cms-field-vocabulary');
    a.store.clock.now = () => at;
    const c = a.state.coordination!;
    c.enabled = true;
    const job = { id: 'job-7', key: 'GH-7', stage, status: 'blocked', detail: 'Saved work needs read-back', head, steps: [], stop: { kind: 'unclassified', at: at.toISOString() }, ...(stage === 'scope-repair' ? { candidateRecovery: { head } } : {}) } as any;
    c.jobs = [job];
    Object.assign(a.engine, { busy: false, agents: { active: new Map() } });
    const id = stage === 'closeout' ? `closeout-core:${job.id}:original:${proof}` : `scope-repair-resume:${a.store.project.id}:${job.id}:${head}:no-prior-readback`;
    const before = { attempts: 1, nextAt: at.toISOString(), status: 'retrying' as const, detail: 'Earlier read-back', requestId: 'req-gone' };
    const saved = a.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], recoveries: { [id]: { ...before } } };
    const candidate = stage === 'closeout'
        ? vi.spyOn(closeoutRecovery, 'closeoutRecoveryCandidate').mockReturnValue({ kind: 'core-passed', work: { id: 'original' }, checkpointSha256: proof } as any)
        : vi.spyOn(scopeRepair, 'scopeRepairResumeCandidate').mockReturnValue({ work: { id: 'original' } } as any);
    const requests = () => c.requests ?? [];
    try {
        markAwaitingRepair(a.state, a.store.project.id, { kind: 'delivery', id: job.id }, stage, { since: at.toISOString(), progressAt: at.toISOString() });
        await a.it.tick(at, true);
        expect(candidate).toHaveBeenCalledWith(a.store, job);
        expect(saved.recoveries[id]).toEqual(before);
        expect(requests()).toEqual([]);

        unmark(a.state);
        await a.it.tick(new Date(at.getTime() + 60000), true);
        expect(saved.recoveries[id]).toEqual({ ...before, status: 'needs-human' });
        expect(requests()).toEqual([]);
    } finally { candidate.mockRestore(); }
});

test('a held activation read-back keeps the count it has; its budget is rebuilt from the original requests once the wait ends', async () => {
    const a = activationFixture(), at = new Date('2026-10-30T23:35:00Z');
    a.store.clock.now = () => at;
    a.job.stop = { kind: 'unclassified', at: at.toISOString() };
    const before = { attempts: 1, status: 'retrying' as const, requestId: 'third', nextAt: '', detail: 'Raw historical diagnostic' };
    a.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], recoveries: { [a.key]: { ...before } } };
    a.state.coordination!.requests = [a.request('first'), a.request('second'), a.request('third', 'queued')];
    const activation = vi.spyOn(activationRecovery, 'savedActivationFailure').mockReturnValue(undefined), config = vi.spyOn(activationRecovery, 'sourceConfigurationRecoveryTarget').mockReturnValue(undefined);
    try {
        markAwaitingRepair(a.state, 'brain', { kind: 'delivery', id: a.job.id }, 'scope-repair', { since: at.toISOString(), progressAt: at.toISOString() });
        await a.it.tick(at, true);
        await a.it.tick(new Date(at.getTime() + 60000), true);
        expect(a.state.it.recoveries[a.key]).toEqual(before);
        expect(a.state.it.reports.at(-1)!.followUps.filter(f => f.id === a.key)).toEqual([{ id: a.key, owner: 'IT', detail: 'Awaiting harness repair JFusco/the-office#389; held without spending an attempt.', routine: true }]);
        unmark(a.state);
        await a.it.tick(new Date(at.getTime() + 120000), true);
        expect(a.state.it.recoveries[a.key]).toMatchObject({ attempts: 3, requestId: 'third' });
    } finally { activation.mockRestore(); config.mockRestore(); }
});

test('a held cleanup read-back the tick does not otherwise reach keeps its status and retry time; released, the ledger settles it', async () => {
    const a = setup(), at = new Date('2026-10-28T21:00:00Z');
    a.store.clock.now = () => at;
    // A busy engine skips the closeout recovery itself, so only the ledger's own pass over retained cleanups can touch this one.
    Object.assign(a.engine, { busy: true, agents: { active: new Map() } });
    const job = { id: 'job-9', key: 'GH-9', stage: 'closeout', status: 'blocked', detail: 'Cleanup needs read-back', head: 'a'.repeat(40), worktree: '/tmp/office/job-9', steps: [], stop: { kind: 'unclassified', at: at.toISOString() }, closeoutRecovery: { status: 'cleanup-pending', originalWorkId: 'work-1', proofSha256: 'e'.repeat(64), cleanupRequestId: 'cleanup-gone' } } as any;
    a.state.coordination!.jobs = [job];
    const key = partialLocalCleanupKey(job)!, before = { attempts: 1, nextAt: at.toISOString(), status: 'retrying' as const, detail: 'Earlier cleanup read-back', requestId: 'req-gone' };
    expect(key.startsWith('partial-local-cleanup:job-9:')).toBe(true);
    const saved = a.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], recoveries: { [key]: { ...before } } };
    markAwaitingRepair(a.state, 'brain', { kind: 'delivery', id: job.id }, 'closeout', { since: at.toISOString(), progressAt: at.toISOString() });
    await a.it.tick(at, true);
    expect(saved.recoveries[key]).toEqual(before);
    unmark(a.state);
    await a.it.tick(new Date(at.getTime() + 60000), true);
    expect(saved.recoveries[key]).toEqual({ ...before, status: 'needs-human', nextAt: '' });
});

test.each(['cec', 'brain', 'cms-field-vocabulary'])('%s session visibility follow-up preserves its ownership requirement', async project => {
    const a = setup();
    a.store.project = a.state.project = projectById(project);
    (a.it as any).offices.sessions = { forProject: () => ({ complete: false, fresh: false }), refresh: vi.fn() };
    for (const ms of [0, 60000, 180000, 600000]) await a.it.tick(new Date(1793221200000 + ms), true);
    const followUp = a.state.it!.reports.at(-1)!.followUps.find(f => f.id === 'session-visibility')!;
    // Informational: it stays with Ellis after its retries, and never turns his status to needs-attention.
    expect(followUp.owner).toBe('IT');
    // Listed, not counted: it never makes Ellis look busy either.
    expect(followUp.routine).toBe(true);
    expect(a.state.it!.status).toBe('monitoring');
    if (project === 'cec') {
        expect(followUp.detail).toContain('work that needs complete live evidence reports its own block');
        expect(followUp.detail).not.toContain('Optional chat context');
    } else expect(followUp.detail).toContain('Optional chat context is unavailable');
    expect(a.state.it!.recoveries['session-visibility'].attempts).toBe(3);
    // It never becomes a request for a person, so Harper has nothing to hand to Morgan.
    expect(a.state.it!.recoveries['session-visibility'].status).toBe('retrying');
});
test('IT queues read-only closeout reconciliation only after the shared worker is free', async () => {
    const a = setup(), job: any = { id: 'done', key: 'GH-255', stage: 'closeout', status: 'blocked', detail: 'Effect needs read-back', steps: [{ stage: 'closeout', result: { outcome: 'passed' } }] };
    a.state.coordination!.jobs = [job];
    Object.assign(a.engine, { busy: false, agents: { active: new Map([['pm', {}]]) } });
    const readback = vi.spyOn(GitHubDelivery.prototype, 'reconcileCloseout').mockImplementation(async () => { expect((a.engine as any).busy).toBe(true); job.status = 'completed'; });
    try {
        await a.it.tick(new Date('2026-10-29T01:00Z'), true);
        expect(readback).not.toHaveBeenCalled();
        (a.engine as any).agents.active.clear();
        await a.it.tick(new Date('2026-10-29T01:01Z'), true);
        expect(readback).not.toHaveBeenCalled();
        expect(a.state.coordination!.requests?.[0]).toMatchObject({ action: 'reconcile-closeout', key: 'GH-255', status: 'queued' });
        expect(job.status).toBe('blocked');
        expect((a.engine as any).busy).toBe(false);
        expect(a.state.it!.reports.at(-1)!.actions[0]).toContain('queued');
    }
    finally {
        readback.mockRestore();
    }
});

test('ordinary operational recovery stays in IT history without daytime CTO or leadership reports',async()=>{
 const a=setup(),existing={id:'existing-goal-report',requestId:'human-goal-request',summary:'Previously accepted goal update',ticket:'',createdAt:'2026-10-29T21:00:00Z'};
 a.state.leadershipReports=[existing];a.state.coordination!.listener.error='connection reset';
 await a.it.tick(new Date('2026-10-30T14:00:00Z'),true);
 expect(a.state.it!.reports).toHaveLength(1);expect(a.state.it!.reports[0].actions).not.toHaveLength(0);
 expect(a.state.it!.reports[0].notified).toEqual(['pm','developer','lead','qa']);expect(a.state.leadershipReports).toEqual([existing]);
 expect(a.state.it!.services).toEqual([expect.objectContaining({id:'github',status:'connected'})]);
 expect(a.store.emit).toHaveBeenCalledWith('it-report',expect.stringContaining('Morgan, Alex, Sam and Riley'),'pm');
});

// Qualification retains its own native/source guards. These fixtures exercise IT's
// real durable intent lifecycle when that qualification temporarily disappears.
function activationFixture(source=false) {
 const a=setup(),job:any={id:'original-job',key:'GH-67',stage:'scope-repair',status:'blocked',detail:'Original readback unresolved',head:'a'.repeat(40),steps:[],implementationContinuation:{phase:source?'repair':'activation'}};
 const original:any={id:'original-worker',requestId:job.id,ticket:job.key,lane:'delivery',claimId:'original-claim',role:'developer',stage:'github-scope-repair',status:'failed'};
 if(source)job.implementationContinuation.sourceConfig={attempts:1,maxAttempts:2,attemptOpen:true,reservation:{claimId:original.claimId,head:job.head,phase:'repair'}};
 a.state.coordination!.jobs=[job];a.state.workLog=[original];Object.assign(a.engine,{busy:false,agents:{active:new Map()}});
 const key=`${source?'source-config':'activation'}-readback:${job.id}:${original.id}`;
 const request=(id:string,status='blocked',extra={})=>({id,action:'reconcile-activation',key:job.key,head:original.id,lane:'delivery',status,detail:'Original saved readback',createdAt:'2026-10-30T23:00:00Z',...extra} as any);
 return {...a,job,original,key,request};
}
import * as activationRecovery from '../../../server/delivery/recovery/implementation/activation-recovery';
test('IT keeps a resolved activation readback resolved when a newer activation worker replaces its original',async()=>{
 const a=activationFixture(),recovery={attempts:1,status:'resolved' as const,requestId:'completed',nextAt:'',detail:'Original readback completed'};
 a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:structuredClone(recovery)}};
 a.state.coordination!.requests=[a.request('completed','completed')];
 a.state.workLog!.push({...a.original,id:'newer-worker',claimId:'newer-claim',status:'running'});
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockReturnValue(undefined);
 try{
  const requests=structuredClone(a.state.coordination!.requests);await a.it.tick(new Date('2026-10-30T23:35Z'),true);
  expect(a.state.it.recoveries[a.key]).toEqual(recovery);expect(a.state.coordination!.requests).toEqual(requests);
  expect(a.state.it.reports.at(-1)!.followUps.some(f=>f.id===a.key)).toBe(false);
 }finally{activation.mockRestore();}
});
test.each([false,true])('IT retains the exact original %s readback budget while its reader runs, then increments without refund',async source=>{
 const a=activationFixture(source);let eligible=true;
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockImplementation(()=>!source&&eligible?{}as any:undefined),config=vi.spyOn(activationRecovery,'sourceConfigurationRecoveryTarget').mockImplementation(()=>source&&eligible?a.original.id:undefined);
 try {
  await a.it.tick(new Date('2026-10-30T23:00Z'),true);
  const first=a.state.coordination!.requests![0];expect(first).toMatchObject({action:'reconcile-activation',head:a.original.id,status:'queued'});
  first.status='working';eligible=false;
  await a.it.tick(new Date('2026-10-30T23:01Z'),true);
  expect(a.state.it!.recoveries[a.key]).toMatchObject({attempts:1,status:'retrying',requestId:first.id});
  expect(a.state.it!.reports.at(-1)!.actions.join(' ')).not.toContain('failure cleared');
  first.status='blocked';eligible=true;await a.it.tick(new Date('2026-10-30T23:02Z'),true);
  expect(a.state.coordination!.requests).toHaveLength(2);expect(a.state.it!.recoveries[a.key]).toMatchObject({attempts:2,status:'retrying'});
  expect(a.engine.observe).not.toHaveBeenCalled();
 }finally{activation.mockRestore();config.mockRestore();}
});
test.each([false,true].flatMap(source=>['paused','draining','ineligible'].map(control=>({source,control}))))('IT repairs historical original-readback undercounts without dispatch while %j',async({source,control})=>{
 const a=activationFixture(source);a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:{attempts:1,status:'resolved',requestId:'third',nextAt:'',detail:'Raw historical diagnostic'}}};
 a.state.coordination!.requests=[a.request('first'),a.request('second'),a.request('third','queued')];
 if(control==='paused')a.state.paused=true;if(control==='draining')a.state.draining=true;
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockReturnValue(undefined),config=vi.spyOn(activationRecovery,'sourceConfigurationRecoveryTarget').mockReturnValue(undefined);
 try {
  const before=structuredClone(a.state.coordination!.requests);await a.it.tick(new Date('2026-10-30T23:35Z'),true);
  expect(a.state.coordination!.requests).toEqual(before);
  expect(a.state.it.recoveries[a.key]).toMatchObject({attempts:3,status:'retrying',requestId:'third',detail:'Raw historical diagnostic'});
  expect(a.state.it.reports.at(-1)!.followUps).toContainEqual(expect.objectContaining({id:a.key,owner:'IT'}));
  a.state.coordination!.requests![2].status='blocked';await a.it.tick(new Date('2026-10-30T23:36Z'),true);
  expect(a.state.it.recoveries[a.key]).toMatchObject({attempts:3,status:'needs-human',requestId:'third'});
  expect(a.state.it.reports.at(-1)!.status).toBe('needs-attention');
  expect(a.state.it.reports.at(-1)!.followUps).toContainEqual(expect.objectContaining({id:a.key,owner:'Morgan'}));
  expect(a.state.coordination!.requests).toHaveLength(3);
 }finally{activation.mockRestore();config.mockRestore();}
});
test.each([false,true])('IT keeps exhausted %s readback budgets through repeated ticks and resolves only actual progress',async source=>{
 const a=activationFixture(source);a.state.coordination!.requests=[a.request('first'),a.request('second'),a.request('third')];
 a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:{attempts:1,status:'resolved',requestId:'third',nextAt:'',detail:'Original error'}}};
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockImplementation(()=>!source?{}as any:undefined),config=vi.spyOn(activationRecovery,'sourceConfigurationRecoveryTarget').mockReturnValue(source?a.original.id:undefined);
 try {
  for(const minute of [35,36])await a.it.tick(new Date(`2026-10-30T23:${minute}Z`),true);
  expect(a.state.coordination!.requests).toHaveLength(3);expect(a.state.it.recoveries[a.key]).toMatchObject({attempts:3,status:'needs-human',requestId:'third'});
  a.job.status='completed';activation.mockReturnValue(undefined);config.mockReturnValue(undefined);
  await a.it.tick(new Date('2026-10-30T23:37Z'),true);
  expect(a.state.it.recoveries[a.key]).toMatchObject({attempts:3,status:'resolved',requestId:'third'});
 }finally{activation.mockRestore();config.mockRestore();}
});
test.each([{key:'GH-foreign'},{head:'foreign-worker'},{action:'reconcile-implementation'}])('foreign intent identity %j cannot consume or dedupe the original budget',async extra=>{
 const a=activationFixture();a.state.coordination!.requests=[a.request('foreign','queued',extra)];
 a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:{attempts:1,status:'resolved',requestId:'old',nextAt:'',detail:'Original error'}}};
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockReturnValue({}as any);
 try{await a.it.tick(new Date('2026-10-30T23:35Z'),true);expect(a.state.it.recoveries[a.key].attempts).toBe(2);expect(a.state.coordination!.requests).toHaveLength(2);expect(a.state.coordination!.requests![1]).toMatchObject({head:a.original.id,key:a.job.key,action:'reconcile-activation',lane:'delivery'});}finally{activation.mockRestore();}
});
test('foreign owning project and original worker cannot reconstruct an original Brain recovery count',async()=>{
 const a=activationFixture();a.state.paused=true;a.store.project={...a.store.project,id:'other'};a.state.project=a.store.project;
 a.state.coordination!.requests=[a.request('first'),a.request('second')];
 a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:{attempts:1,status:'needs-human',requestId:'old',nextAt:'',detail:'Original error'}}};
 await a.it.tick(new Date('2026-10-30T23:35Z'),true);expect(a.state.it.recoveries[a.key].attempts).toBe(1);
});

test('a matching non-delivery intent is neither adopted nor duplicated',async()=>{
 const a=activationFixture();a.state.coordination!.requests=[a.request('foreign','queued',{lane:'operations'})];
 a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:{attempts:1,status:'resolved',requestId:'old',nextAt:'',detail:'Original error'}}};
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockReturnValue({}as any);
 try{await a.it.tick(new Date('2026-10-30T23:35Z'),true);expect(a.state.it.recoveries[a.key]).toMatchObject({attempts:1,status:'needs-human',requestId:'old'});expect(a.state.coordination!.requests).toHaveLength(1);}finally{activation.mockRestore();}
});

test('an already completed exact readback is not refunded or counted again while original qualification remains',async()=>{
 const a=activationFixture();a.state.coordination!.requests=[a.request('completed','completed')];
 a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:{attempts:1,status:'resolved',requestId:'completed',nextAt:'',detail:'Original error'}}};
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockReturnValue({}as any);
 try{for(const minute of [35,36])await a.it.tick(new Date(`2026-10-30T23:${minute}Z`),true);expect(a.state.it.recoveries[a.key]).toMatchObject({attempts:1,status:'needs-human',requestId:'completed'});expect(a.state.coordination!.requests).toHaveLength(1);}finally{activation.mockRestore();}
});

test('a service this project does not use raises no probe follow-up', async () => {
    const a = setup();
    a.health.report.mockResolvedValue({ checkedAt: '', context: '', services: [{ id: 'atlassian', name: 'Atlassian', status: 'unknown', detail: 'Upgrade required', checkedAt: '' }, { id: 'azure', name: 'Azure DevOps', status: 'unknown', detail: 'Timed out', checkedAt: '' }, { id: 'github', name: 'GitHub', status: 'unknown', detail: 'Timed out', checkedAt: '' }] } as any);
    await a.it.tick(new Date(1793221200000), true);
    expect(a.state.it!.reports.at(-1)!.followUps.map(f => f.id)).toEqual(['probe:github']);
});
test('a routine watch beside a real recovery: only the recovery is counted, and Ellis shows as retrying', async () => {
    const a = setup();
    (a.it as any).offices.sessions = { forProject: () => ({ complete: false, fresh: false }), refresh: vi.fn() };
    a.state.github = { error: 'connection reset' } as any;
    await a.it.tick(new Date(1793221200000), true);
    const report = a.state.it!.reports.at(-1)!;
    expect(report.followUps.map(f => [f.id, !!f.routine]).sort()).toEqual([['project-progress', false], ['session-visibility', true]]);
    expect(a.state.it!.status).toBe('retrying');
    expect(report.summary).toMatch(/\b1 (?:operational )?follow-up remains\./);
});
test('one failed project refresh is retried by Ellis; Morgan is told only after three in a row', async () => {
    const a = setup(), start = 1793221200000;
    a.state.github = { error: 'Worker exited with surviving subprocesses; effects require reconciliation' } as any;
    await a.it.tick(new Date(start), true);
    expect(a.state.it!.reports.at(-1)!.followUps.find(f => f.id === 'project-progress')).toMatchObject({ owner: 'IT' });
    expect(a.state.it!.status).toBe('retrying');
    // Each queued refresh finishes and the same error is still there.
    for (const ms of [60000, 180000, 600000, 1200000]) { for (const request of a.state.coordination!.requests || []) request.status = 'completed'; await a.it.tick(new Date(start + ms), true); }
    expect(a.state.it!.recoveries['project-progress'].attempts).toBe(3);
    expect(a.state.it!.reports.at(-1)!.followUps.find(f => f.id === 'project-progress')).toMatchObject({ owner: 'Morgan' });
});

import { ServiceHealthChecks } from '../../../server/office/service-health';
import { workerFailure, type command } from '../../../server/workers/process';
import { AZURE_SIGNED_OUT, CLAUDE_SIGNED_OUT, GITHUB_BAD_TOKEN, GITHUB_NO_ACCOUNT, READ_TIMED_OUT, type RecordedRun } from '../office/signed-out-fixture';

/** The real sign-in checks with every command healthy, as in service-health.test.ts, except `target`, which replays `run`. */
function checksReplaying(target: string, run: RecordedRun | Error): ServiceHealthChecks {
    const healthy: Record<string, string> = {
        curl: JSON.stringify({ status: { indicator: 'none', description: 'All Systems Operational' }, components: [], incidents: [] }),
        claude: JSON.stringify({ loggedIn: true, email: 'fixture@example.test' }),
        codex: '',
        gh: JSON.stringify({ hosts: { 'github.com': [{ active: true, state: 'success', login: 'fixture' }] } }),
        twg: JSON.stringify({ data: { accountId: 'fixture', name: 'Fixture User' } }),
    };
    const execute: typeof command = async (program, _args, options) => {
        if (program !== target) return healthy[program] ?? '"project-id"';
        if (run instanceof Error) throw run;
        if (run.stdout) options?.onOutput?.('stdout', run.stdout);
        if (run.stderr) options?.onOutput?.('stderr', run.stderr);
        if (run.code !== 0) throw new Error(workerFailure(program, run.code, run.stdout, run.stderr));
        return run.stdout;
    };
    return new ServiceHealthChecks(execute);
}

async function checkedBy(target: string, run: RecordedRun | Error) {
    const a = setup(), checks = checksReplaying(target, run);
    a.health.report.mockImplementation((() => checks.report([a.state])) as any);
    await a.it.tick(new Date(1793222000000), true);
    syncOutbox(a.state);
    return { a, ownerItems: a.state.outbox.filter(o => o.status === 'open' && o.id.startsWith('only-you:')) };
}

const planted = (run: RecordedRun, add: (document: any) => void): RecordedRun => {
    const document = JSON.parse(run.stdout);
    add(document);
    return { ...run, stdout: JSON.stringify(document, null, 2) + '\n' };
};

test.each([
    { id: 'github', program: 'gh', name: 'a rejected token', run: planted(GITHUB_BAD_TOKEN, d => { d.hosts['github.com'][0].token = 'never-return-this'; }), quote: '401 Unauthorized' },
    { id: 'github', program: 'gh', name: 'no account', run: GITHUB_NO_ACCOUNT, quote: 'You are not logged into any GitHub hosts' },
    { id: 'anthropic', program: 'claude', name: 'no login', run: planted(CLAUDE_SIGNED_OUT, d => { d.accessToken = 'never-return-this'; }), quote: 'loggedIn: false, authMethod: none' },
    { id: 'azure', program: 'az', name: 'no credentials', run: AZURE_SIGNED_OUT, quote: 'you need to run the login command' },
])('a recorded $id sign-out ($name) opens the owner item in the provider\'s words', async ({ id, program, run, quote }) => {
    const { a, ownerItems } = await checkedBy(program, run);
    const row = a.state.it!.services.find(service => service.id === id)!;
    expect(row).toMatchObject({ status: 'disconnected', failure: expect.stringContaining(quote) });
    expect(a.state.it!.reports.at(-1)!.followUps).toContainEqual(expect.objectContaining({ id: `login:${id}`, owner: 'You' }));
    expect(ownerItems).toEqual([expect.objectContaining({ id: `only-you:login:${id}`, ownerSteps: expect.objectContaining({ providerSaid: row.failure }) })]);
    expect(JSON.stringify(a.state)).not.toContain('never-return-this');
});

test.each([
    { id: 'github', program: 'gh', name: 'a host timeout', run: { code: 0, stdout: JSON.stringify({ hosts: { 'github.com': [{ active: true, state: 'timeout', login: 'fixture', error: 'Get "https://api.github.com/": context deadline exceeded (Client.Timeout exceeded while awaiting headers)' }] } }), stderr: '' } },
    { id: 'github', program: 'gh', name: 'a DNS failure', run: { code: 0, stdout: JSON.stringify({ hosts: { 'github.com': [{ active: true, state: 'error', login: 'fixture', error: 'Get "https://api.github.com/": dial tcp: lookup api.github.com: no such host' }] } }), stderr: '' } },
    { id: 'anthropic', program: 'claude', name: 'the runner deadline', run: new Error(READ_TIMED_OUT('claude')) },
    { id: 'anthropic', program: 'claude', name: 'an unrelated failure', run: { code: 1, stdout: '{"error": "Internal failure"}\n', stderr: '' } },
    { id: 'azure', program: 'az', name: 'the runner deadline', run: new Error(READ_TIMED_OUT('az')) },
    { id: 'azure', program: 'az', name: 'a missing project', run: { code: 1, stdout: '', stderr: 'ERROR: TF200016: The following project does not exist: Fixture.\n' } },
])('a $id check that ended in $name opens no owner item', async ({ id, program, run }) => {
    const { a, ownerItems } = await checkedBy(program, run);
    const row = a.state.it!.services.find(service => service.id === id)!;
    expect(row.status).toBe('unknown');
    expect(row).not.toHaveProperty('failure');
    expect(ownerItems).toEqual([]);
});
