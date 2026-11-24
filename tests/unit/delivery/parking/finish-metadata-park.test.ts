import { expect, test, vi } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { activeMetadataPark, finishMetadataPark } from '../../../../server/delivery/parking/finish-metadata-park';
import { projectOutbox } from '../../../../server/conversations/outbox';
import { requeuePRReview } from '../../../../server/scheduling/review-transitions';

const isMove = (call: { request?: { query: string } }) => String(call.request?.query).startsWith('mutation');
const outboxItem = (f: ReturnType<typeof metadataParkFixture>) => projectOutbox(f.store.state).find(action => action.id === `ticket-job:${f.job.id}`);

/** Parks with the first card move made, then refuses the next write before dispatch by pausing the Office. */
async function pausedAfterFirstMove(f: ReturnType<typeof metadataParkFixture>) {
    f.hooks.after = call => { if (isMove(call)) f.store.state.paused = true; };
    await expect(f.parkNow()).rejects.toThrow('paused');
    f.hooks.after = undefined; f.store.state.paused = false;
    return f;
}

test('a PR card move refused before dispatch is sent once on the next pass, and only then the comment', async () => {
    const f = await pausedAfterFirstMove(metadataParkFixture());
    expect(f.blockMoves()).toEqual(['issue-card>block']); expect(f.writes.posts).toEqual([]);
    expect(f.job.parked).toMatchObject({ published: false }); expect(f.job.parked!.unconfirmed).toBeUndefined();
    expect(await f.run(() => finishMetadataPark(f.delivery, f.job))).toBe(true);
    expect(f.blockMoves()).toEqual(['issue-card>block', 'pr-card>block']); expect(f.writes.posts).toHaveLength(1);
    expect(f.job.parked).toMatchObject({ published: true });
});

test('a PR card move whose response was lost after it landed is settled by read-back, not sent again; the comment follows', async () => {
    const f = metadataParkFixture();
    let lose = true;
    f.hooks.after = call => { if (lose && isMove(call) && call.request!.variables.item === 'pr-card') { lose = false; throw new Error('gh: HTTP 502 after the move'); } };
    await expect(f.parkNow()).rejects.toThrow('Board transition needs read-back');
    expect(f.writes.posts).toEqual([]);
    expect(f.job.parked!.unconfirmed).toEqual([{ write: "the move of the pull request's card to Block", error: expect.stringContaining('HTTP 502 after the move') }]);
    await f.pass();
    expect(f.blockMoves()).toEqual(['issue-card>block', 'pr-card>block']); expect(f.writes.posts).toHaveLength(1);
    expect(f.job).toMatchObject({ status: 'blocked', parked: { published: true } });
    expect(f.effects().filter(e => e.operation === 'github-project-status').map(e => e.status)).toEqual(['verified', 'verified']);
});

test('a dispatched PR card move that stays unobservable stops every pass with its own error, sends nothing more, and the outbox says so', async () => {
    const f = metadataParkFixture();
    f.hooks.before = call => { if (isMove(call) && call.request!.variables.item === 'pr-card') throw new Error('gh: HTTP 502 Bad Gateway'); };
    await expect(f.parkNow()).rejects.toThrow('Board transition needs read-back');
    f.hooks.before = undefined;
    for (let pass = 0; pass < 2; pass++) {
        await f.pass();
        expect(f.job.status).toBe('blocked');
        // Not the generic board check's words: the park's own write and the provider error its attempt left.
        expect(f.job.detail).not.toContain('Previous board transition remains uncertain');
        expect(f.job.detail).toContain("The park's the move of the pull request's card to Block was sent and is still uncertain; it needs read-back");
        expect(f.job.detail).toContain('HTTP 502 Bad Gateway');
    }
    expect(f.blockMoves()).toEqual(['issue-card>block', 'pr-card>block']); expect(f.writes.posts).toEqual([]);
    const item = outboxItem(f)!;
    expect(item.title).toBe('GH-5 decision comment is not confirmed');
    expect(item.detail).toContain(f.job.parked!.reason);
    expect(item.detail).toContain('The Office has not confirmed its decision comment on the issue, and a card may already be in Block.');
    expect(item.detail).toContain("Not yet read back: the move of the pull request's card to Block. Error: gh: HTTP 502 Bad Gateway");
    expect(item.detail).toContain('Moving a card cannot resume this job until the comment is confirmed.');
    // A read that fails keeps the park and the error the attempt left; the outbox still names it.
    let failRead = true;
    f.hooks.before = call => { if (failRead && String(call.request?.query).includes('fieldValues') && call.request!.variables.item === 'pr-card') { failRead = false; throw new Error('gh: HTTP 503 reading the card'); } };
    await f.pass();
    expect(f.job.detail).toContain('HTTP 503 reading the card');
    expect(outboxItem(f)!.detail).toContain('HTTP 502 Bad Gateway');
    expect(f.job.parked).toMatchObject({ published: false });
    expect(f.writes.posts).toEqual([]);
});

test('an issue card a person took out of Block before the comment releases the park, even with a PR card first in provider order; a fresh review follows', async () => {
    const f = await pausedAfterFirstMove(metadataParkFixture({ prCard: false }));
    expect(f.blockMoves()).toEqual(['issue-card>block']); expect(f.writes.posts).toEqual([]);
    // A PR card appears ahead of the issue card, its move never sent, and Joe returns the issue card.
    f.state.cards.unshift({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' });
    f.state.cards.find(card => card.id === 'issue-card')!.status = 'ready';
    const moves = f.writes.moves.length;
    await f.pass();
    expect(f.writes.moves).toHaveLength(moves); expect(f.writes.posts).toEqual([]);
    expect(f.job.parked).toBeUndefined();
    expect(f.job).toMatchObject({ status: 'blocked', releasedParks: [{ marker: `Office decision ${f.job.id}:1`, releaseReason: expect.stringContaining('a person moved the issue card from Block to Ready') }] });
    expect(f.job.detail).toContain('Ask for a fresh review with review-pr.');
    expect(f.job.detail).not.toContain('Move the issue card from');
    // review-pr now starts an ordinary review: no park is entered again and nothing of the old one is sent.
    const model = vi.spyOn(f.engine.agents, 'run').mockRejectedValue(new Error('fresh review dispatched'));
    requeuePRReview(f.store, f.job);
    await f.pass();
    expect(model).toHaveBeenCalledOnce(); expect(model.mock.calls[0][3]).toMatchObject({ stage: 'github-lead-pr', requestId: f.job.id });
    expect(f.lane('issue-card')).toBe('review');
    expect(f.blockMoves()).toEqual(['issue-card>block']); expect(f.writes.posts).toEqual([]);
});

test('an issue card that was already in Block when the park read the board counts as this park\'s: taking it out releases the park', async () => {
    const f = metadataParkFixture();
    f.state.cards.find(card => card.id === 'issue-card')!.status = 'block';
    f.state.cards.find(card => card.id === 'pr-card')!.status = 'done';
    await expect(f.parkNow()).rejects.toThrow('a human lane');
    expect(f.writes.moves).toEqual([]); expect(f.job.parked!.metadata!.observed).toEqual(['issue-card']);
    f.state.cards.find(card => card.id === 'issue-card')!.status = 'ready';
    f.state.cards.find(card => card.id === 'pr-card')!.status = 'review';
    await f.pass();
    expect(f.writes.moves).toEqual([]); expect(f.writes.posts).toEqual([]);
    expect(f.job.parked).toBeUndefined(); expect(f.job.detail).toContain('a person moved the issue card from Block to Ready');
});

test('an older same-head Block note from before this park is not this park\'s: the issue card is moved as usual', async () => {
    const f = metadataParkFixture();
    f.job.boardUpdates = [{ stage: 'lead-pr', head: f.job.head, project: 'project', item: 'issue-card', field: 'status', option: 'block', target: 'Block', at: '2026-11-01T00:00:00Z', status: 'verified', detail: 'Block already verified.' }];
    f.state.cards.find(card => card.id === 'issue-card')!.status = 'ready';
    await f.parkNow();
    expect(f.blockMoves()).toEqual(['issue-card>block', 'pr-card>block']); expect(f.writes.posts).toHaveLength(1);
    expect(f.job.parked).toMatchObject({ published: true, metadata: { boardStart: 1, observed: [] } });
});

test.each([
    ['the board is removed', (f: ReturnType<typeof metadataParkFixture>) => { delete (f.store.project as any).githubProject; }, 'this project has no configured board'],
    ['pickup changes from Ready to In progress', (f: ReturnType<typeof metadataParkFixture>) => { f.store.state.coordination!.pickup = { enabled: true, status: 'In progress' }; }, 'the pickup lane, which was Ready, changed after the park was recorded'],
    ['the Block option is replaced under the same name', (f: ReturnType<typeof metadataParkFixture>) => { f.state.lanes.find(lane => lane.id === 'block')!.id = 'block-2'; }, 'changed after the park was recorded'],
    ['the issue card is replaced', (f: ReturnType<typeof metadataParkFixture>) => { f.state.cards.find(card => card.id === 'issue-card')!.id = 'issue-card-2'; }, 'the issue card changed after the park was recorded'],
    ['the adopted issue loses its assignment', (f: ReturnType<typeof metadataParkFixture>) => { f.job.existingPR = true; f.state.issue.assignees = []; }, 'the issue is not assigned to JFusco'],
] as const)('on a retry after %s nothing more is sent and the park names what to restore', async (_name, change, missing) => {
    const f = await pausedAfterFirstMove(metadataParkFixture());
    change(f);
    const moves = f.writes.moves.length;
    await expect(f.run(() => finishMetadataPark(f.delivery, f.job))).rejects.toThrow(missing);
    expect(f.writes.moves).toHaveLength(moves); expect(f.writes.posts).toEqual([]);
    expect(f.job.parked).toMatchObject({ published: false, stopped: expect.stringContaining('Restore it, then ask for review-pr to finish the park.') });
    expect(outboxItem(f)!.detail).toContain(f.job.parked!.stopped!);
});

test('only an unpublished harness-worded park of the saved review takes the pass', async () => {
    for (const [name, change] of [
        ['a published park', (f: any) => { f.job.parked.published = true; }],
        ['a model park', (f: any) => { delete f.job.parked.instruction; delete f.job.parked.marker; }],
        ['a later step', (f: any) => { f.job.steps.push({ stage: 'superseded-stage-result', result: f.result }); }],
        ['another head', (f: any) => { f.job.head = 'c'.repeat(40); }],
        ['another stage', (f: any) => { f.job.stage = 'prepare-pr'; }],
    ] as const) {
        const f = await pausedAfterFirstMove(metadataParkFixture());
        change(f);
        expect(activeMetadataPark(f.store, f.job), name).toBe(false);
        const before = JSON.stringify(f.job);
        expect(await f.run(() => finishMetadataPark(f.delivery, f.job)), name).toBe(false);
        expect(JSON.stringify(f.job), name).toBe(before);
    }
});
