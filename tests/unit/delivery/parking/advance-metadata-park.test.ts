import { expect, test } from 'vitest';
import { currentAssignment } from '../../../../server/workers/assignment-context';
import { observeMetadataParks } from '../../../../server/delivery/parking/observe-metadata-parks';
import { projectOutbox } from '../../../../server/conversations/outbox';
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

test('a PR card added after the Block move, before the decision comment, must be moved and covered before the first POST', async () => {
    const f = metadataParkFixture({ prCard: false });
    // The comment author is no longer read from the live viewer: the card arrives during the first comment read after the move.
    let moved = false, added = false;
    f.hooks.before = call => {
        if (call.request?.query.startsWith('mutation')) moved = true;
        if (moved && !added && String(call.args[1]).includes('/comments?')) { added = true; f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' }); }
    };
    await expect(f.parkNow()).rejects.toThrow('card inventory changed');
    expect(f.writes.posts).toEqual([]);
    expect(f.blockMoves()).toEqual(['issue-card>block']);
    f.hooks.before = undefined;
    await observeMetadataParks(f.delivery);
    expect(f.job.status).toBe('queued');
    await f.pass();
    expect(f.job.parked).toMatchObject({ published: true, metadata: { verified: { items: ['issue-card', 'pr-card'] } } });
    expect(f.blockMoves()).toEqual(['issue-card>block', 'pr-card>block']);
    expect(f.writes.posts).toHaveLength(1);
});

test('a PR card confirmed in Block during coverage remains required if it disappears before the POST', async () => {
    const f = metadataParkFixture({ prCard: false });
    let moved = false, removed = false;
    f.hooks.after = call => {
        if (call.request?.query.startsWith('mutation')) { moved = true; f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'block' }); }
        if (moved && !removed && String(call.args[1]).includes('/comments?')) { removed = true; f.state.cards.splice(1, 1); }
    };
    await expect(f.parkNow()).rejects.toThrow('no longer on the board');
    expect(f.job.parked!.metadata!.verified?.items).toEqual(['issue-card', 'pr-card']);
    f.hooks.after = undefined;
    await expect(f.run(() => finishMetadataPark(f.delivery, f.job))).rejects.toThrow('no longer on the board');
    expect(f.job.parked).toMatchObject({ published: false, metadata: { verified: { items: ['issue-card', 'pr-card'] } } });
    expect(f.writes.posts).toEqual([]);
});

test('a human lane change during a prepared move guard is never overwritten', async () => {
    const f = metadataParkFixture();
    f.hooks.before = call => {
        if (call.args[1]?.endsWith('/pulls/200') && f.effects().some(e => e.id.endsWith(':pr-card') && e.status === 'prepared'))
            f.state.cards.find(card => card.id === 'pr-card')!.status = 'done';
    };
    await expect(f.parkNow()).rejects.toThrow('a human lane');
    expect(f.lane('pr-card')).toBe('done');
    expect(f.blockMoves()).toEqual(['issue-card>block']);
    expect(f.writes.posts).toEqual([]);
});

test.each([{ enabled: false, status: 'Ready' }, { enabled: true, status: 'In progress' }])('pickup changed to $status (enabled=$enabled) during prepared comment preflight prevents POST', async pickup => {
    const f = metadataParkFixture();
    f.hooks.after = call => {
        if (call.request?.query.includes('fieldValues(first:100') && f.effects().some(e => e.operation === 'github-issue-comment' && e.status === 'prepared'))
            f.store.state.coordination!.pickup = pickup;
    };
    await expect(f.parkNow()).rejects.toThrow(/pickup/i);
    expect(f.job.parked).toMatchObject({ published: false, stopped: expect.stringMatching(/pickup/i) });
    expect(f.writes.posts).toEqual([]);
});

test.each(['pickup', 'assignment', 'claim'])('a newly verified comment waits to publish if %s is lost before its last read', async prerequisite => {
    const f = metadataParkFixture();
    let changed = false;
    f.hooks.after = call => {
        if (changed || !f.writes.posts.length) return;
        // End the claim in the final route read. Change the provider assignment or local pickup during the comment listing.
        if (prerequisite === 'claim' ? !call.request?.query.includes('items(first:100') : !call.args[1]?.includes('/issues/5/comments?')) return;
        changed = true;
        if (prerequisite === 'claim') f.store.finishClaim(currentAssignment()!.claim.id, 'completed');
        else if (prerequisite === 'assignment') f.state.issue.assignees = [];
        else f.store.state.coordination!.pickup!.enabled = false;
    };
    const error = prerequisite === 'claim' ? 'Exact running delivery scheduler claim is required' : prerequisite === 'assignment' ? 'not assigned to JFusco' : 'automatic pickup is turned off';
    await expect(f.parkNow()).rejects.toThrow(error);
    expect(f.job.parked!.published).toBe(false);
    const comment = f.effects().find(e => e.operation === 'github-issue-comment')!;
    expect(comment).toMatchObject({ status: 'verified', receipt: { id: 900 } });
    expect(f.store.state.events.filter(event => event.kind === 'delivery-parked')).toEqual([]);
    if (prerequisite !== 'claim') {
        const item = projectOutbox(f.store.state).find(action => action.id === `ticket-job:${f.job.id}`)!;
        expect(item.title).toContain('prerequisite restored');
        expect(item.detail).toContain(error);
        expect(item.detail).not.toContain('not confirmed');
    }
    f.store.state.coordination!.pickup!.enabled = true;
    f.state.issue.assignees = [{ login: 'JFusco' }];
    f.state.cards.find(card => card.id === 'issue-card')!.status = 'ready';
    f.pr.title = 'docs: already edited';
    await f.pass();
    expect(f.job.parked!.published).toBe(true);
    expect(f.lane('issue-card')).toBe('ready');
    expect(f.store.state.events.filter(event => event.kind === 'delivery-parked')).toHaveLength(1);
    expect(f.writes.posts).toHaveLength(1);
});

test.each(['fields', 'values', 'complete default'])('status reads distinguish %s before any provider write', async part => {
    const f = metadataParkFixture();
    f.hooks.respond = ({ request }) => {
        if (part === 'fields' && request?.query.includes('fields(first:100'))
            return JSON.stringify({ data: { user: { projectV2: { id: 'project', fields: { nodes: [{ id: 'status', name: 'Status', options: f.state.lanes }], pageInfo: {} } } } } });
        if (part !== 'fields' && request?.query.includes('fieldValues(first:100') && request.variables.item === 'pr-card' && f.lane('pr-card') !== 'block')
            return JSON.stringify({ data: { node: { id: 'pr-card', fieldValues: { nodes: [], pageInfo: part === 'values' ? {} : { hasNextPage: false } } } } });
    };
    if (part === 'complete default') {
        await f.parkNow();
        expect(f.job.parked!.published).toBe(true);
        expect(f.blockMoves()).toEqual(['issue-card>block', 'pr-card>block']);
    } else {
        await expect(f.parkNow()).rejects.toThrow('incomplete');
        expect(f.writes).toEqual({ moves: [], posts: [] });
    }
});
