import { afterEach, expect, test } from 'vitest';
import { cleanupFakes } from '../publication/support/fake-maintenance-github';
import { brainFixture } from './support/brain-followup-fixture';
import { Coordinator } from '../../../../server/scheduling/coordination';
afterEach(cleanupFakes);

test('only a reconciled catalog failure queues one versioned repair handoff without a nightly retry', () => {
    const a = brainFixture(); a.run.status = 'blocked'; a.followup.queue(); expect(a.run.blockerFollowup).toBeUndefined();
    a.run.status = 'reconciled'; a.store.state.coordination!.pickup = { enabled: false, status: 'Ready' }; a.followup.queue(); expect(a.run.blockerFollowup).toBeUndefined();
    a.store.state.coordination!.pickup.enabled = true; a.followup.queue();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'queued', publicationVersion: 1 });
    const saved = a.run.blockerFollowup; a.followup.queue(); expect(a.run.blockerFollowup).toBe(saved);
    expect(new Coordinator(a.store, a.engine).hasQueued()).toBe(true);
    expect(a.followup.pending('other')).toBeUndefined();
    expect(a.followup.pending('original')).toBe(a.run);
});

test('the diagnosis runs read-only and writes nothing; the harness files, assigns and places the repair, then verifies it', async () => {
    const a = brainFixture(); a.followup.queue(); a.diagnose();
    await a.pump();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'completed', issue: 100, diagnosis: { decision: 'create', source: 'Content Hub' } });
    expect(a.state.writes).toEqual(['issue-create', 'board-add', 'board-status']);
    expect(a.state.issues[0].body).toContain('Office maintenance blocker original');
    expect(a.state.issues[0].assignees).toEqual([{ login: 'JFusco' }]);
    expect(a.run.steps[0].result.outcome).toBe('blocked');
    expect(a.store.state.maintenance!.lastDaily).toBe('');
    a.followup.queue(); await a.pump();
    expect(a.workers()).toBe(1);
    expect(a.state.writes).toHaveLength(3);
});

test('an adopted repair missing the pickup account is assigned once, keeping its owners; a Backlog card moves, an ineligible lane stops', async () => {
    const a = brainFixture(), issue = a.addIssue({ title: 'Content Hub sitemap repair', body: 'Content Hub catalog lost sitemap coverage', assignees: ['someone'] });
    a.state.cards.push({ id: 'card-x', number: issue.number, status: 'backlog' });
    a.followup.queue(); a.diagnose({ decision: 'adopt', issue: issue.number });
    await a.pump();
    expect(a.state.writes).toEqual(['issue-assign', 'board-status']);
    expect(issue.assignees.map((owner: any) => owner.login)).toEqual(['someone', 'JFusco']);
    expect(a.run.blockerFollowup!.status).toBe('completed');
    const b = brainFixture(), other = b.addIssue({ title: 'Content Hub sitemap repair', body: 'Content Hub catalog lost sitemap coverage', assignees: ['JFusco'] });
    b.state.cards.push({ id: 'card-y', number: other.number, status: 'progress' });
    b.followup.queue(); b.diagnose({ decision: 'adopt', issue: other.number });
    await b.pump();
    expect(b.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/does not move/) });
    expect(b.state.writes).toEqual([]);
});

test('a blocked diagnosis stops before any write; an unqualified diagnosis launch is an authority stop', async () => {
    const a = brainFixture(); a.followup.queue(); a.diagnose({ decision: 'blocked', summary: 'Needs a Sitecore API key from Joe' });
    await a.pump();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringContaining('Sitecore API key') });
    expect(a.state.writes).toEqual([]);
    const b = brainFixture(); b.followup.queue();
    await b.pump();
    expect(b.run.blockerFollowup).toMatchObject({ status: 'blocked', stop: { kind: 'authority', qualification: { stage: 'maintenance-blocker', qualification: 'codex-reader' } } });
    expect(b.state.writes).toEqual([]);
});

test('a pickup lane changed during routing stops without a write; the deliberate read-back resumes under the current lane only', async () => {
    const a = brainFixture(); a.followup.queue(); a.diagnose();
    const diagnose = a.engine.agents.run;
    a.engine.agents.run = (async (...args: any[]) => { const result = await (diagnose as any)(...args); a.store.state.coordination!.pickup = { enabled: true, status: 'In progress' }; return result; }) as any;
    await a.pump();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/pickup setting changed/), diagnosis: { decision: 'create' } });
    expect(a.state.writes).toEqual([]);
    // Disabled pickup holds the follow-up entirely.
    a.store.state.coordination!.pickup = { enabled: false, status: 'In progress' };
    expect(a.followup.pending()).toBeUndefined();
    a.store.state.coordination!.pickup = { enabled: true, status: 'In progress' };
    const request = { id: 'req', action: 'reconcile-maintenance', key: 'original', head: '', lane: 'delivery', requestedAt: '', status: 'working', detail: '' } as any;
    a.store.state.coordination!.requests = [request];
    const { readBackFollowup } = await import('../../../../server/maintenance/brain/brain-followup-readback');
    await a.claimed(a.run, 'reconciliation', () => readBackFollowup(a.store, a.execute as any, a.run, a.board), 'reconcile-maintenance', 'req');
    expect(a.run.blockerFollowup!.status).toBe('queued');
    await a.pump();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'completed', routing: { card: { lane: 'In progress' } } });
    expect(a.state.cards[0].status).toBe('progress');
    expect(a.state.writes).toEqual(['issue-create', 'board-add', 'board-status']);
    expect(a.workers()).toBe(1);
});

test('two eligible continuations each run under their own claim; the second adopts the first one\'s keyed repair instead of filing again', async () => {
    const a = brainFixture(); a.followup.queue(); a.diagnose();
    const second = structuredClone(a.run); second.id = 'second'; second.blockerFollowup = { status: 'queued', publicationVersion: 1, detail: '' };
    a.store.state.maintenance!.runs.push(second);
    expect(a.followup.pending()).toBe(a.run);
    expect(a.followup.pending('second')).toBe(second);
    // A follow-up never writes under another run's continuation claim.
    await a.claimed(a.run, 'continuation', () => a.followup.pump(second));
    expect(second.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/not this run's repair-followup claim/) });
    expect(a.state.writes).toEqual([]);
    second.blockerFollowup = { ...second.blockerFollowup!, status: 'queued' };
    await a.claimed(second, 'continuation', () => a.followup.pump(second));
    expect(second.blockerFollowup).toMatchObject({ status: 'completed', issue: 100 });
    await a.pump();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'completed', issue: 100, routing: { issue: { adopted: true } } });
    expect(a.state.writes).toEqual(['issue-create', 'board-add', 'board-status']);
});

test('a saved diagnosis with a missing or stale qualification is an authority stop with no fresh write; its attempted create keeps its read-back; requalified, only the unsent phase is sent', async () => {
    const a = brainFixture(); a.followup.queue(); a.diagnose();
    a.state.faults['issue-create'] = 'lost';
    await a.pump();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'blocked', stop: { kind: 'uncertain-effect' }, diagnosis: { decision: 'create' } });
    // The provider binary changed after the diagnosis: its record is stale. The attempted create is still read back.
    a.engine.agents.qualification = (await import('../../workers/qualification/support')).fakeEnvironment({ sha256: 'e'.repeat(64) });
    await a.readBack();
    expect(a.store.getEffect('maintenance:original:followup:issue-create')).toMatchObject({ status: 'verified' });
    expect(a.run.blockerFollowup!.status).toBe('queued');
    await a.pump();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'blocked', stop: { kind: 'authority', qualification: { stage: 'maintenance-blocker', qualification: 'codex-reader', mismatch: 'the pinned executable binary digest changed' } } });
    expect(a.state.writes).toEqual(['issue-create']);
    // A missing record stops the same way.
    const { rmSync } = await import('node:fs'); const { qualificationFile } = await import('../../../../server/workers/launch-qualification');
    a.engine.agents.qualification = (await import('../../workers/qualification/support')).fakeEnvironment();
    rmSync(qualificationFile(a.store.dataRoot, 'codex-reader'));
    await a.readBack(); await a.pump();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'blocked', stop: { kind: 'authority', qualification: { mismatch: 'no qualification record is installed' } } });
    expect(a.state.writes).toEqual(['issue-create']);
    // Requalified, the continuation sends only the unsent card phase; the diagnosis never runs again.
    a.qualify();
    await a.readBack(); await a.pump();
    expect(a.run.blockerFollowup!.status).toBe('completed');
    expect(a.state.writes).toEqual(['issue-create', 'board-add', 'board-status']);
    expect(a.workers()).toBe(1);
});

test('the diagnosis binds the reconciled run\'s own defect; an unmarked issue for another defect of the same catalog is not adopted', async () => {
    const ungrounded = brainFixture(); ungrounded.followup.queue(); ungrounded.diagnose({ defect: 'search index stale' });
    await ungrounded.pump();
    expect(ungrounded.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/not grounded in the reconciled run's outcomes/) });
    expect(ungrounded.state.writes).toEqual([]);
    const other = brainFixture(), issue = other.addIssue({ title: 'Content Hub search repair', body: 'Content Hub catalog search index is stale', assignees: ['JFusco'] });
    other.state.cards.push({ id: 'card-z', number: issue.number, status: 'backlog' });
    other.followup.queue(); other.diagnose({ decision: 'adopt', issue: issue.number });
    await other.pump();
    expect(other.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/does not establish the same evidenced change/) });
    expect(other.state.writes).toEqual([]);
    expect(other.state.cards[0].status).toBe('backlog');
});

test('a Backlog card moved to an ineligible lane during the status preflight receives no status write', async () => {
    const a = brainFixture(), issue = a.addIssue({ title: 'Content Hub sitemap repair', body: 'Content Hub catalog lost sitemap coverage', assignees: ['JFusco'] });
    a.state.cards.push({ id: 'card-x', number: issue.number, status: 'backlog' });
    let reads = 0;
    const execute = a.execute;
    // The status read the routing decides on sees Backlog; the next one, in the write's preflight, sees a person's move.
    (a as any).followup = new (await import('../../../../server/maintenance/brain/brain-followup')).BrainFollowup(a.store, a.engine, (async (program: string, args: string[], options: any = {}) => {
        if (program === 'gh' && args[1] === 'graphql' && String(options.input).includes('fieldValues') && ++reads === 2) a.state.cards[0].status = 'progress';
        return execute(program, args, options);
    }) as any);
    a.followup.queue(); a.diagnose({ decision: 'adopt', issue: issue.number });
    await a.claimed(a.run, 'continuation', () => (a as any).followup.pump(a.run));
    expect(a.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/moved to a lane the pickup policy does not move/) });
    expect(a.state.writes).toEqual([]);
    expect(a.state.cards[0].status).toBe('progress');
});

test('a recheck of a saved blocked diagnosis keeps the decision and its reason and queues nothing', async () => {
    const a = brainFixture(); a.followup.queue(); a.diagnose({ decision: 'blocked', summary: 'Needs a Sitecore API key from Joe' });
    await a.pump();
    const diagnosis = JSON.stringify(a.run.blockerFollowup!.diagnosis);
    await a.readBack();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringContaining('Needs a Sitecore API key from Joe') });
    expect(JSON.stringify(a.run.blockerFollowup!.diagnosis)).toBe(diagnosis);
    expect(a.followup.pending()).toBeUndefined();
    expect(a.workers()).toBe(1);
    expect(a.state.writes).toEqual([]);
});

test('an adoption that names no issue is never routed as a create, fresh or persisted; named adoption and an explicit create still route', async () => {
    const fresh = brainFixture(); fresh.followup.queue(); fresh.diagnose({ decision: 'adopt', issue: 0 });
    await fresh.pump();
    expect(fresh.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/adopts a repair issue but names none/) });
    expect(fresh.state.writes).toEqual([]);
    expect(fresh.state.issues).toEqual([]);
    // The same decision, persisted from an earlier claim, stops the continuation the same way.
    const persisted = brainFixture(); persisted.qualify();
    persisted.run.blockerFollowup = { status: 'queued', publicationVersion: 1, detail: '', diagnosis: { decision: 'adopt', issue: 0, title: '[Bug] Restore Content Hub sitemap coverage', body: (await import('../publication/support/issue-body')).BODY,
        labels: ['bug', 'area:catalog'], source: 'Content Hub', defect: 'lost sitemap coverage', summary: 'One repair', workerId: 'w', at: '' } };
    await persisted.pump();
    expect(persisted.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/names none/) });
    expect(persisted.state.writes).toEqual([]);
    const create = brainFixture(); create.followup.queue(); create.diagnose();
    await create.pump();
    expect(create.run.blockerFollowup!.status).toBe('completed');
});

test('a recorded repair issue closed while the follow-up was stopped gets no assignment and no card write; an open one continues', async () => {
    const { brainIssueKey } = await import('../../../../server/maintenance/publication/issue-key');
    /** A follow-up whose verified repair issue is recorded, with its assignment and card still unsent (or only the card). */
    const setup = (state: 'open' | 'closed', assigned: boolean) => {
        const a = brainFixture(); a.qualify();
        const issue = a.addIssue({ title: '[Bug] Restore Content Hub sitemap coverage', body: 'Content Hub catalog lost sitemap coverage', assignees: assigned ? ['JFusco'] : [], extra: { state } });
        const diagnosis = { decision: 'create' as const, issue: 0, title: issue.title, body: issue.body, labels: ['bug', 'area:catalog'], source: 'Content Hub', defect: 'lost sitemap coverage', summary: 'One repair', workerId: 'w', at: '' };
        a.run.blockerFollowup = { status: 'queued', publicationVersion: 1, detail: '', diagnosis,
            routing: { key: brainIssueKey(a.store.project.repository, { source: diagnosis.source, defect: diagnosis.defect }),
                issue: { number: issue.number, url: issue.html_url, nodeId: issue.node_id, effectId: 'e', adopted: false }, ...(assigned ? { assigned: 'JFusco' } : {}) } };
        return a;
    };
    for (const assigned of [false, true]) {
        const closed = setup('closed', assigned);
        await closed.pump();
        expect(closed.run.blockerFollowup, `assigned ${assigned}`).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/closed or no longer the recorded issue/) });
        expect(closed.state.writes, `assigned ${assigned}`).toEqual([]);
    }
    const open = setup('open', false);
    await open.pump();
    expect(open.run.blockerFollowup!.status).toBe('completed');
    expect(open.state.writes).toEqual(['issue-assign', 'board-add', 'board-status']);
});
