import { expect, test } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { addMetadataHumanInput } from '../../../fixtures/pr-metadata';
import { finishMetadataPark } from '../../../../server/delivery/parking/finish-metadata-park';

test('the cards go to Block first and the one decision comment is posted last, after every card reads in Block', async () => {
    const f = metadataParkFixture(), order: string[] = [];
    f.hooks.before = call => {
        if (String(call.request?.query).startsWith('mutation')) order.push(`move ${call.request!.variables.item}`);
        if (call.args.includes('-f')) order.push('comment');
    };
    await f.parkNow();
    expect(order).toEqual(['move issue-card', 'move pr-card', 'comment']);
    expect(f.blockMoves()).toEqual(['issue-card>block', 'pr-card>block']);
    expect(f.writes.posts).toEqual([`Office decision ${f.job.id}:1: ${f.job.parked!.reason}\n\n${f.job.parked!.instruction}`]);
    expect(f.job).toMatchObject({ status: 'blocked', detail: `Decision needed: ${f.job.parked!.reason}`, parked: { published: true, marker: `Office decision ${f.job.id}:1` } });
    expect(f.job.parked!.metadata).toMatchObject({ step: 0, route: { issue: 'issue-card', prs: ['pr-card'], pickup: { name: 'Ready', option: 'ready' }, block: { id: 'block', name: 'Block' } },
        verified: { items: ['issue-card', 'pr-card'] } });
    expect(f.effects().find(e => e.operation === 'github-issue-comment')?.payload).toEqual({ marker: f.job.parked!.marker, issue: 5, body: f.writes.posts[0], author: 'JFusco' });
    expect(f.effects().map(e => e.status)).toEqual(['verified', 'verified', 'verified']);
});

test('a pull request without a card publishes with the issue card alone', async () => {
    const f = metadataParkFixture({ prCard: false });
    await f.parkNow();
    expect(f.blockMoves()).toEqual(['issue-card>block']); expect(f.writes.posts).toHaveLength(1);
    expect(f.job.parked).toMatchObject({ published: true, metadata: { route: { prs: [] }, verified: { items: ['issue-card'] } } });
});

test('a PR body edited between the two card moves stops the PR move and the comment, and releases the park', async () => {
    const f = metadataParkFixture();
    f.hooks.after = call => { if (String(call.request?.query).startsWith('mutation') && call.request!.variables.item === 'issue-card') f.pr.body = 'Closes #5\nJoe edited this'; };
    await expect(f.parkNow()).rejects.toThrow('was released before its decision comment was sent: PR #200 was edited after the review');
    expect(f.blockMoves()).toEqual(['issue-card>block']); expect(f.writes.posts).toEqual([]);
    expect(f.job.parked).toBeUndefined(); expect(f.job.releasedParks).toHaveLength(1);
    // The issue card is in Block, where a review does not start: Joe is told to return it first.
    expect(f.job.detail).toContain('Move the issue card from Block back to Ready first');
    expect(f.job.detail).toContain('Ask for a fresh review with review-pr.');
});

test('human input that arrives during the board reads stops the first move: nothing is written and the park is released', async () => {
    const f = metadataParkFixture();
    let added = false;
    f.hooks.after = call => { if (!added && String(call.request?.query).includes('fieldValues')) { added = true; addMetadataHumanInput(f); } };
    await expect(f.parkNow()).rejects.toThrow('new human input arrived after the review');
    expect(f.writes.moves).toEqual([]); expect(f.writes.posts).toEqual([]);
    expect(f.job.parked).toBeUndefined();
    expect(f.job.detail).not.toContain('Move the issue card from');
});

test('inputs that change after both cards reach Block, before the comment is sent, send no comment and release the park', async () => {
    const f = metadataParkFixture();
    f.hooks.after = call => { if (String(call.request?.query).startsWith('mutation') && call.request!.variables.item === 'pr-card') addMetadataHumanInput(f); };
    await expect(f.parkNow()).rejects.toThrow('new human input arrived after the review');
    expect(f.blockMoves()).toEqual(['issue-card>block', 'pr-card>block']); expect(f.writes.posts).toEqual([]);
    expect(f.job.parked).toBeUndefined();
    expect(f.effects().every(e => e.status === 'verified' || e.status === 'rejected' && !e.dispatchedAt)).toBe(true);
});

test('a comment sent before the PR was edited is settled by reading it back under its own intent, never posted again', async () => {
    const f = metadataParkFixture();
    let lose = true;
    f.hooks.after = call => { if (lose && call.args.includes('-f')) { lose = false; throw new Error('gh: HTTP 502 after the comment'); } };
    await expect(f.parkNow()).rejects.toThrow('502');
    expect(f.writes.posts).toHaveLength(1); expect(f.job.parked).toMatchObject({ published: false, unconfirmed: [{ write: 'the decision comment on issue #5' }] });
    expect(f.job.parked!.unconfirmed![0].error).toContain('HTTP 502');
    f.pr.title = 'docs(operating): require explicit source acceptance';
    expect(await f.run(() => finishMetadataPark(f.delivery, f.job))).toBe(true);
    expect(f.writes.posts).toHaveLength(1); expect(f.blockMoves()).toHaveLength(2);
    expect(f.job.parked).toMatchObject({ published: true }); expect(f.job.parked!.unconfirmed).toBeUndefined();
});
