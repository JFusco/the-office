import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { cleanupFakes } from '../publication/support/fake-maintenance-github';
import { brainFixture } from './support/brain-followup-fixture';
import { Conversations } from '../../../../server/conversations/conversations';
import { executeRequest } from '../../../../server/scheduling/requests';
import { readBackFollowup } from '../../../../server/maintenance/brain/brain-followup-readback';
afterEach(cleanupFakes);

test('a PM recheck of the served maintenance-blocker action queues one read-back that settles the original create and sends nothing', async () => {
    const a = brainFixture(); a.followup.queue(); a.diagnose();
    a.state.faults['issue-create'] = 'lost';
    await a.pump();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'blocked', stop: { kind: 'uncertain-effect' } });
    expect(a.state.writes).toEqual(['issue-create']);
    // The served outbox action, rechecked by Joe through Morgan.
    const artifacts = mkdtempSync(resolve(tmpdir(), 'office-followup-chat-')), chat = new Conversations(a.store, a.engine, artifacts); chat.archive = () => {};
    a.engine.agents.followup = async () => { throw new Error('no discussion worker'); };
    const message = chat.enqueue({ id: crypto.randomUUID(), role: 'pm', ticket: '', actionId: 'maintenance-blocker:original', body: 'Read back the repair routing', recheck: true });
    await chat.pump();
    rmSync(artifacts, { recursive: true, force: true });
    expect(message.status).toBe('answered');
    expect(a.engine.busy).toBe(false);
    const requests = a.store.state.coordination!.requests!.filter(request => request.action === 'reconcile-maintenance' && request.key === 'original');
    expect(requests).toHaveLength(1);
    chat.enqueue({ id: crypto.randomUUID(), role: 'pm', ticket: '', actionId: 'maintenance-blocker:original', body: 'Again', recheck: true }); await chat.pump();
    expect(a.store.state.coordination!.requests!.filter(request => request.action === 'reconcile-maintenance')).toHaveLength(1);
    // The scheduler runs the request under its own claim; the read-back settles the create and queues only the unsent phase.
    const request = requests[0];
    await a.claimed(a.run, 'reconciliation', () => executeRequest(a.store, a.engine, {} as any, request), 'reconcile-maintenance', request.id);
    expect([request.status, request.detail]).toEqual(['completed', expect.anything()]);
    expect(a.store.getEffect('maintenance:original:followup:issue-create')).toMatchObject({ status: 'verified' });
    expect(a.run.blockerFollowup!.status).toBe('queued');
    expect(a.state.writes).toEqual(['issue-create']);
    // The continuation sends only the unsent card phase; the issue is never created again.
    await a.pump();
    expect(a.run.blockerFollowup!.status).toBe('completed');
    expect(a.state.writes).toEqual(['issue-create', 'board-add', 'board-status']);
    expect(a.workers()).toBe(1);
});

test('the read-back refuses without its own running request, and an inconclusive read keeps the follow-up stopped', async () => {
    const a = brainFixture(); a.followup.queue(); a.diagnose(); a.state.faults['issue-create'] = 'drop-label';
    await a.pump();
    expect(a.run.blockerFollowup!.status).toBe('blocked');
    await expect(readBackFollowup(a.store, a.execute as any, a.run, a.board)).rejects.toThrow(/own running reconcile-maintenance request/);
    const request = { id: 'req', action: 'reconcile-maintenance', key: 'original', head: '', lane: 'delivery', requestedAt: '', status: 'working', detail: '' } as any;
    a.store.state.coordination!.requests = [request];
    await a.claimed(a.run, 'reconciliation', () => readBackFollowup(a.store, a.execute as any, a.run, a.board), 'reconcile-maintenance', 'req');
    expect(a.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/read-back is incomplete/) });
    expect(a.state.writes).toEqual(['issue-create']);
});

test('IT and the outbox route only a stopped versioned follow-up; its writes include a delivery-kind card Effect only when bound to it', async () => {
    const { followupEffects, stoppedVersionedFollowup } = await import('../../../../server/maintenance/brain/brain-followup-readback');
    const a = brainFixture();
    expect(stoppedVersionedFollowup(a.run)).toBe(false);
    a.run.blockerFollowup = { status: 'blocked', detail: 'x', publicationVersion: 1 };
    expect(stoppedVersionedFollowup(a.run)).toBe(true);
    expect(stoppedVersionedFollowup({ ...a.run, blockerFollowup: { status: 'blocked', detail: 'legacy' } })).toBe(false);
    const intent = (id: string, kind: 'delivery' | 'maintenance', work: string, operation = 'github-project-add') => ({ id, work: { projectId: a.store.project.id, kind, id: work }, attemptId: work, operation, target: 't',
        authorization: 'office-harness', payload: {}, expectedState: {}, status: 'uncertain' as const, createdAt: '', dispatchedAt: 'x', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
    a.store.putEffect(intent('harness:original:card:5', 'delivery', 'original'));
    a.store.putEffect(intent('harness:other:card:5', 'delivery', 'other'));
    a.store.putEffect(intent('maintenance:original:followup:issue-create', 'maintenance', 'original', 'github-issue-create'));
    expect(followupEffects(a.store, a.run).map(effect => effect.id).sort()).toEqual(['harness:original:card:5', 'maintenance:original:followup:issue-create']);
});

test('a bound status write settles only against its saved project, field, option and item, never a same-named replacement', async () => {
    const statusIntent = (a: ReturnType<typeof brainFixture>) => {
        a.run.blockerFollowup = { status: 'blocked', detail: 'x', publicationVersion: 1, diagnosis: { decision: 'create', issue: 0, title: '', body: '', labels: [], defect: 'lost sitemap coverage', source: 'Content Hub', summary: '', workerId: '', at: '' } };
        const issue = a.addIssue({ title: 'Content Hub sitemap repair', body: 'Content Hub catalog lost sitemap coverage', assignees: ['JFusco'] });
        a.state.cards.push({ id: 'card-x', number: issue.number, status: 'ready' });
        a.store.putEffect({ id: 'maintenance:original:followup:card-status:card-x', work: { projectId: a.store.project.id, kind: 'maintenance', id: 'original' }, attemptId: 'original', operation: 'github-project-status',
            target: 'card-x', authorization: 'office-harness', payload: { lane: 'Ready', project: 'project', field: 'status', option: 'ready', item: 'card-x' }, expectedState: { key: 'card-status:card-x' },
            status: 'uncertain', createdAt: '', dispatchedAt: 'x', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
        return 'maintenance:original:followup:card-status:card-x';
    };
    // The Ready option was replaced by another option with the same name, and the card sits in the replacement.
    const replaced = brainFixture(), id = statusIntent(replaced);
    replaced.state.lanes = [{ id: 'ready-2', name: 'Ready' }, { id: 'backlog', name: 'Backlog' }, { id: 'progress', name: 'In progress' }];
    replaced.state.cards[0].status = 'ready-2';
    await replaced.readBack();
    expect(replaced.store.getEffect(id)!.status).toBe('uncertain');
    expect(replaced.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/read-back is incomplete: github-project-status card-x/) });
    // The saved option itself settles it, with no write.
    const same = brainFixture(), sameId = statusIntent(same);
    await same.readBack();
    expect(same.store.getEffect(sameId)!.status).toBe('verified');
    expect([...replaced.state.writes, ...same.state.writes]).toEqual([]);
});

test('a diagnosis whose launch was refused before any worker started is queued once by the recheck; one that spawned without a saved diagnosis stays blocked', async () => {
    const a = brainFixture(); a.followup.queue();
    await a.pump();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'blocked', stop: { kind: 'authority', qualification: { qualification: 'codex-reader' } } });
    expect(a.run.blockerFollowup!.diagnosis).toBeUndefined();
    expect(a.state.writes).toEqual([]);
    // Requalified: the documented recheck queues the never-started diagnosis, which then runs once and routes.
    a.qualify(); a.diagnose();
    await a.readBack();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'queued', detail: expect.stringMatching(/never started/) });
    await a.pump();
    expect(a.run.blockerFollowup!.status).toBe('completed');
    expect(a.state.writes).toEqual(['issue-create', 'board-add', 'board-status']);
    expect(a.workers()).toBe(1);
    // A diagnosis worker that spawned and left no saved diagnosis still needs its original session read back.
    const b = brainFixture(); b.followup.queue();
    await b.pump();
    b.store.state.workLog = [{ id: 'old-diagnosis', requestId: 'original', stage: 'maintenance-blocker', processId: 4242, startedAt: '2026-11-28T00:00:00Z', status: 'interrupted' } as any];
    b.qualify(); b.diagnose();
    await b.readBack();
    expect(b.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/read back its original worker session/) });
    expect(b.workers()).toBe(0);
    expect(b.state.writes).toEqual([]);
});

test('an expired read-back claim, before the read or during the read of the first uncertain Effect, leaves the receipt and follow-up unchanged; a live bound request settles it', async () => {
    const stopped = async () => {
        const a = brainFixture(); a.followup.queue(); a.diagnose();
        a.state.faults['issue-create'] = 'lost';
        await a.pump();
        expect(a.store.getEffect('maintenance:original:followup:issue-create')!.status).toBe('uncertain');
        return a;
    };
    const { assertFollowupReadbackAuthority } = await import('../../../../server/maintenance/publication/reconcile-authority');
    const { currentAssignment } = await import('../../../../server/workers/assignment-context');
    const request = (a: Awaited<ReturnType<typeof stopped>>) => {
        const item = { id: `req-${crypto.randomUUID()}`, action: 'reconcile-maintenance', key: 'original', head: '', lane: 'delivery', requestedAt: '', status: 'working', detail: '' } as any;
        a.store.state.coordination!.requests = [item];
        return item.id;
    };
    const snapshot = (a: Awaited<ReturnType<typeof stopped>>) => JSON.stringify({ effect: a.store.getEffect('maintenance:original:followup:issue-create'), followup: a.run.blockerFollowup });
    // Expired before the read-back starts.
    const before = await stopped(), saved = snapshot(before), id = request(before);
    await expect(before.claimed(before.run, 'reconciliation', () => { before.store.finishClaim(currentAssignment()!.claim.id, 'interrupted'); return readBackFollowup(before.store, before.execute as any, before.run, before.board); }, 'reconcile-maintenance', id))
        .rejects.toThrow(/no longer running/);
    expect(snapshot(before)).toBe(saved);
    // Expired while the provider read of the first uncertain Effect is in flight: the read verifies, the settlement is refused.
    const during = await stopped(), savedDuring = snapshot(during), duringId = request(during);
    const execute = async (program: string, args: string[], options: any = {}) => {
        if (program === 'gh' && String(args[1]).includes('issues?state=all')) during.store.finishClaim(currentAssignment()!.claim.id, 'interrupted');
        return during.execute(program, args, options);
    };
    await expect(during.claimed(during.run, 'reconciliation', () => readBackFollowup(during.store, execute as any, during.run, during.board), 'reconcile-maintenance', duringId)).rejects.toThrow(/no longer running/);
    expect(snapshot(during)).toBe(savedDuring);
    // Each sent only its one original create, before it stopped; the read-back sent nothing.
    expect(before.state.writes).toEqual(['issue-create']);
    expect(during.state.writes).toEqual(['issue-create']);
    // A live bound request settles the same Effect with no write.
    const live = await stopped();
    await live.readBack();
    expect(live.store.getEffect('maintenance:original:followup:issue-create')!.status).toBe('verified');
    expect(live.state.writes).toEqual(['issue-create']);
    expect(() => assertFollowupReadbackAuthority(live.store, 'original')).toThrow(/own running reconcile-maintenance request/);
});

test.each(['disabled', 'changed lane', 'card moved', 'unchanged'] as const)('a saved route is reverified, with no continuation or write on drift (%s)', async change => {
    const a = brainFixture();
    a.followup.queue();
    a.diagnose();
    let changePickup = () => {};
    const board = async () => { const view = await a.board(); changePickup(); return view; };
    if (change === 'disabled') changePickup = () => { a.store.state.coordination!.pickup = { enabled: false, status: 'Ready' }; };
    if (change === 'changed lane') changePickup = () => { a.store.state.coordination!.pickup = { enabled: true, status: 'Backlog' }; };
    a.engine.github.board = board as typeof a.engine.github.board;
    await a.pump();
    const pickupDrift = change === 'disabled' || change === 'changed lane';
    const followup = a.run.blockerFollowup!;
    expect(followup.status).toBe(pickupDrift ? 'blocked' : 'completed');
    expect(followup.routing).toMatchObject({ issue: expect.anything(), assigned: 'JFusco', card: { lane: 'Ready' } });
    if (change === 'card moved') a.state.cards[0].status = 'progress';
    followup.status = 'blocked';
    a.store.state.coordination!.pickup = { enabled: true, status: 'Ready' };
    const writes = [...a.state.writes];
    await a.readBack(board);
    expect(followup.status).toBe(change === 'unchanged' ? 'completed' : 'blocked');
    if (change === 'disabled') expect(followup.detail).toContain('Pickup is disabled');
    if (change === 'changed lane') expect(followup.detail).toContain('Pickup now uses Backlog');
    if (change === 'card moved') expect(followup.detail).toContain('is in In progress instead of Ready');
    expect(a.state.writes).toEqual(writes);
});
