import { expect, test, vi } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { observeMetadataParks } from '../../../../server/delivery/parking/observe-metadata-parks';
import { resumeParked } from '../../../../server/delivery/parking/resume';
import { projectOutbox } from '../../../../server/conversations/outbox';

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
