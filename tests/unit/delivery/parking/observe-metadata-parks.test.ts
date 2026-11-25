import { expect, test, vi } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { METADATA_PARKS_PER_OBSERVATION, observeMetadataParks } from '../../../../server/delivery/parking/observe-metadata-parks';
import { resumeParked } from '../../../../server/delivery/parking/resume';
import { projectOutbox } from '../../../../server/conversations/outbox';
import { inspectMetadataPark } from '../../../../server/delivery/parking/inspect-metadata-park';
import { parkCommentBody } from '../../../../server/delivery/parking/park-comment';
import type { HarnessRequest } from '../../../../src/shared';

/** Parks with both cards confirmed in Block and a comment POST that GitHub took but does not list yet. */
async function lostComment() {
    const f = metadataParkFixture();
    let refuse = true;
    f.hooks.before = call => { if (refuse && call.args.includes('-f')) { refuse = false; throw new Error('gh: HTTP 502 after the comment'); } };
    await expect(f.parkNow()).rejects.toThrow('502');
    f.hooks.before = undefined;
    expect(f.blockMoves()).toEqual(['issue-card>block', 'pr-card>block']); expect(f.writes.posts).toHaveLength(1);
    expect(f.job.parked).toMatchObject({ published: false, metadata: { verified: { items: ['issue-card', 'pr-card'] } } });
    const comment = f.effects().find(e => e.operation === 'github-issue-comment')!;
    expect(comment.status).toBe('uncertain');
    /** The comment GitHub took, as it shows once it is listed. */
    const appear = () => f.state.comments.push({ id: 900, html_url: `${f.issueUrl}#issuecomment-900`, user: { login: 'JFusco' }, body: f.writes.posts[0] });
    return { f, comment, appear };
}

test('a lost comment response: the observer waits while the comment is absent, then, once it shows after Joe edits and returns the card, one pass publishes and the pickup resumes a fresh review', async () => {
    const { f, comment, appear } = await lostComment();
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('blocked');
    expect(projectOutbox(f.store.state).find(action => action.id === `ticket-job:${f.job.id}`)?.title).toBe('GH-5 decision comment is not confirmed');
    // Joe read the instruction, edited the PR and returned the issue card before the Office saw its comment.
    f.pr.title = 'docs(operating): require explicit source acceptance';
    f.state.cards.find(card => card.id === 'issue-card')!.status = 'ready';
    appear();
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('queued'); expect(f.job.parked!.readBackQueued).toBeTruthy();
    // The same read-back state is queued once.
    f.job.status = 'blocked';
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('blocked');
    await f.pass();
    expect(f.job).toMatchObject({ status: 'blocked', parked: { published: true } });
    expect(f.store.getEffect(comment.id)).toMatchObject({ status: 'verified', receipt: { id: 900 } });
    expect(f.lane('issue-card')).toBe('ready');
    expect(f.store.state.events.filter(event => event.kind === 'delivery-parked')).toHaveLength(1);
    const stores = new Map([[f.store.project.id, f.store]]);
    expect(resumeParked(f.store, f.delivery.jobs, [{ key: f.job.key, pickupStatus: 'Ready' }] as any, { enabled: true, status: 'Ready' }, stores, new Date())).toEqual([f.job.key]);
    const model = vi.spyOn(f.engine.agents, 'run').mockRejectedValue(new Error('fresh review dispatched'));
    await f.pass();
    expect(model).toHaveBeenCalledOnce(); expect(model.mock.calls[0][3]).toMatchObject({ stage: 'github-lead-pr' });
    expect(f.writes.posts).toHaveLength(1); expect(f.blockMoves()).toHaveLength(2);
});

test('a receipt that never shows keeps its original intent and a visible stop; nothing is posted again', async () => {
    const { f, comment } = await lostComment();
    for (let pass = 0; pass < 3; pass++) {
        await observeMetadataParks(f.delivery);
        expect(f.job.status).toBe('blocked');
        await f.pass();
        expect(f.job.detail).toContain('the decision comment on issue #5 was sent and is still uncertain');
    }
    expect(f.effects().filter(e => e.operation === 'github-issue-comment').map(e => [e.id, e.status])).toEqual([[comment.id, 'uncertain']]);
    expect(f.writes.posts).toHaveLength(1); expect(f.blockMoves()).toHaveLength(2);
    expect(projectOutbox(f.store.state).find(action => action.id === `ticket-job:${f.job.id}`)?.detail).toContain('Not yet read back: the decision comment on issue #5. Error: gh: HTTP 502 after the comment');
});

test('a park stopped on a known missing prerequisite, a claimed job, a pause or a drain is not queued', async () => {
    for (const [name, change] of [
        ['a missing prerequisite', (f: any) => { f.job.parked.stopped = 'The park sends nothing more: automatic pickup is turned off.'; }],
        ['a pause', (f: any) => { f.store.state.paused = true; }],
        ['a claim', (f: any) => { f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'other', 'lead-pr'); }],
        ['a drain', (f: any) => { f.store.state.draining = true; }],
    ] as const) {
        const { f, appear } = await lostComment();
        appear(); change(f);
        await observeMetadataParks(f.delivery);
        expect(f.job.status, name).toBe('blocked');
    }
});

test('an interrupted park reconstructs its missing outbox detail and continues once the original comment appears', async () => {
    const { f, appear } = await lostComment();
    f.job.status = 'interrupted';
    delete f.job.parked!.unconfirmed;
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('interrupted');
    expect(projectOutbox(f.store.state).find(item => item.id === `ticket-job:${f.job.id}`)).toMatchObject({
        title: 'GH-5 decision comment is not confirmed', detail: expect.stringContaining('the decision comment on issue #5'),
    });
    appear();
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('queued');
    await f.pass();
    expect(f.job.parked?.published).toBe(true);
    expect(f.writes.posts).toHaveLength(1);
});

test('a claimed pass that loses sight of the queued receipt can be queued again', async () => {
    const { f, appear } = await lostComment();
    appear();
    await observeMetadataParks(f.delivery);
    await observeMetadataParks(f.delivery);
    expect(f.store.state.events.filter(event => event.kind === 'metadata-park-readback')).toHaveLength(1);
    f.state.comments.length = 0;
    await f.pass();
    expect(f.job.status).toBe('blocked');
    expect(f.job.parked!.readBackQueued).toBeUndefined();
    appear();
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('queued');
    await f.pass();
    expect(f.job.parked!.published).toBe(true);
    expect(f.writes.posts).toHaveLength(1);
    expect(f.store.state.events.filter(event => event.kind === 'metadata-park-readback')).toHaveLength(2);
});

test.each(['already held', 'starts during read'])('a reconciliation claim that %s prevents the observer from queueing', async timing => {
    const { f, appear } = await lostComment();
    appear();
    const { worker } = f.nativeAssessment();
    const request = { id: 'review-recovery', action: 'reconcile-review', key: f.job.key, head: worker.id } as HarnessRequest;
    (f.store.state.coordination!.requests ??= []).push(request);
    const hold = () => f.store.claimWork({ kind: 'reconciliation', id: request.id, projectId: f.store.project.id }, 'bound recovery', request.action, 'delivery')!;
    let claim: ReturnType<typeof hold> | undefined;
    if (timing === 'already held') claim = hold();
    f.hooks.before = call => {
        if (!claim && call.args[1]?.includes('/comments?')) claim = hold();
    };
    await observeMetadataParks(f.delivery);
    expect(claim).toBeDefined();
    expect(f.job.status).toBe('blocked');
    f.store.finishClaim(claim!.id, 'completed');
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('queued');
    expect(f.store.state.events.filter(event => event.kind === 'metadata-park-readback')).toHaveLength(1);
});

test('a restart after a landed lane write is settled can continue before a comment intent exists', async () => {
    const f = metadataParkFixture();
    f.hooks.after = call => {
        if (call.request?.query.startsWith('mutation') && call.request.variables.item === 'pr-card') throw new Error('Lost lane response');
    };
    await expect(f.parkNow()).rejects.toThrow('Lost lane response');
    f.hooks.after = undefined;
    await f.run(() => inspectMetadataPark(f.delivery, f.job));
    f.job.status = 'interrupted';
    expect(f.effects().map(effect => [effect.operation, effect.status])).toEqual([['github-project-status', 'verified'], ['github-project-status', 'verified']]);
    expect(f.job.parked!.unconfirmed).toBeUndefined();
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('queued');
    await f.pass();
    expect(f.job.parked!.published).toBe(true);
    expect(f.blockMoves()).toEqual(['issue-card>block', 'pr-card>block']);
    expect(f.writes.posts).toHaveLength(1);
});

test('a continuation with nothing left to read is queued once for its sent writes, not again after it fails', async () => {
    const f = metadataParkFixture();
    f.hooks.after = call => {
        if (call.request?.query.startsWith('mutation') && call.request.variables.item === 'pr-card') throw new Error('Lost lane response');
    };
    await expect(f.parkNow()).rejects.toThrow('Lost lane response');
    f.hooks.after = undefined;
    await f.run(() => inspectMetadataPark(f.delivery, f.job));
    f.job.status = 'interrupted';
    Reflect.deleteProperty(f.pr, 'state');
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('queued');
    await f.pass().catch(() => undefined);
    expect(f.job.status).toBe('blocked');
    expect(f.job.detail).toContain('identity or state');
    await observeMetadataParks(f.delivery);
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('blocked');
    expect(f.job.detail).toContain('identity or state');
    expect(f.store.state.events.filter(event => event.kind === 'metadata-park-readback')).toHaveLength(1);
    expect(f.blockMoves()).toEqual(['issue-card>block', 'pr-card>block']);
    expect(f.writes.posts).toHaveLength(0);
});

test('observation bounds comment reads and rotates past parks with missing receipts', async () => {
    const { f, comment } = await lostComment();
    const extras = Array.from({ length: METADATA_PARKS_PER_OBSERVATION + 1 }, (_, index) => {
        const job = structuredClone(f.job), issue = 10 + index, marker = `Office decision parked-${issue}:1`;
        job.id = `parked-${issue}`;
        job.key = `GH-${issue}`;
        job.parked!.marker = marker;
        const body = parkCommentBody(job.parked!), target = `https://github.com/${f.store.project.repository}/issues/${issue}`;
        f.delivery.jobs.push(job);
        f.store.putEffect({ ...comment, id: `harness:${job.id}:park-comment:1`, work: { ...comment.work, id: job.id }, attemptId: job.id,
            target, payload: { marker, issue, body, author: 'JFusco' } });
        return { job, issue, body, target };
    });
    const last = extras.at(-1)!;
    let reads = 0;
    f.hooks.respond = call => {
        if (!call.args[1]?.includes('/comments?')) return;
        ++reads;
        return call.args[1].startsWith(`repos/${f.store.project.repository}/issues/${last.issue}/`)
            ? JSON.stringify([[{ id: 900, html_url: `${last.target}#issuecomment-900`, body: last.body, user: { login: 'JFusco' } }]])
            : '[[]]';
    };
    await observeMetadataParks(f.delivery);
    expect(reads).toBe(METADATA_PARKS_PER_OBSERVATION);
    expect(last.job.status).toBe('blocked');
    reads = 0;
    await observeMetadataParks(f.delivery);
    expect(reads).toBeLessThanOrEqual(METADATA_PARKS_PER_OBSERVATION);
    expect(last.job.status).toBe('queued');
    await observeMetadataParks(f.delivery);
    expect(f.store.state.events.filter(event => event.kind === 'metadata-park-readback')).toHaveLength(1);
    expect(f.writes.posts).toHaveLength(1);
});

test('a missing live copy of a verified receipt has its own read-back detail and can finish later', async () => {
    const { f, appear, comment } = await lostComment();
    appear();
    await f.run(() => inspectMetadataPark(f.delivery, f.job));
    f.state.comments.length = 0;
    await f.pass();
    expect(f.store.getEffect(comment.id)?.status).toBe('verified');
    expect(f.job.parked).toMatchObject({ published: false, commentReadError: expect.stringContaining('no longer on the issue') });
    expect(projectOutbox(f.store.state).find(item => item.id === `ticket-job:${f.job.id}`)?.detail).toMatch(/Remove \[skip release\].*\n[\s\S]*Read-back of the decision comment on issue #5 failed/);
    appear();
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('queued');
    await f.pass();
    expect(f.job.parked!.published).toBe(true);
    expect(f.writes.posts).toHaveLength(1);
});

test('the ordinary issue gate records known assignment loss before a confirmed park can publish', async () => {
    const { f, appear, comment } = await lostComment();
    appear();
    await f.run(() => inspectMetadataPark(f.delivery, f.job));
    f.job.existingPR = false;
    f.state.issue.assignees = [];
    await f.pass();
    expect(f.job.parked).toMatchObject({ published: false, stopped: expect.stringContaining('not assigned to JFusco') });
    expect(f.store.getEffect(comment.id)?.status).toBe('verified');
    const outbox = projectOutbox(f.store.state).find(item => item.id === `ticket-job:${f.job.id}`)!;
    expect(outbox.title).toBe('GH-5 metadata park needs a prerequisite restored');
    expect(outbox.detail).toContain('not assigned to JFusco');
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('blocked');
    expect(f.writes.posts).toHaveLength(1);
});
