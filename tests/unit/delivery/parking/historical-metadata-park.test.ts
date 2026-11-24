import { expect, test } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { finishMetadataPark } from '../../../../server/delivery/parking/finish-metadata-park';
import type { EffectIntent } from '../../../../src/shared';

/**
 * A harness-worded park saved before parks kept a binding: comment first, `{ marker }` payload. `comment` seeds its
 * comment intent; `lanes` seeds a verified card move for each card with the cards in Block.
 */
function historical(comment?: 'verified' | 'uncertain', lanes = true) {
    const f = metadataParkFixture(), marker = `Office decision ${f.job.id}:1`, at = '2026-11-23T20:00:00.000Z';
    f.job.parked = { stage: 'lead-pr', reason: 'PR #200 needs an edit to its title that the Office may not make itself.', at, published: false, marker,
        instruction: "Sam's review found: [skip release]. The edit it asks for: Remove [skip release] from the title.\n\nWhat's needed: edit the title of PR #200 on GitHub. Then move the issue card back to Ready." };
    const body = `${marker}: ${f.job.parked.reason}\n\n${f.job.parked.instruction}`, work = { projectId: f.store.project.id, kind: 'delivery' as const, id: f.job.id };
    const intent = (id: string, operation: string, target: string, payload: Record<string, unknown>, key: string, status: EffectIntent['status'], receipt: unknown = null): EffectIntent =>
        ({ id, work, attemptId: f.job.id, operation, target, authorization: 'office-harness', payload, expectedState: { key }, status, createdAt: at, dispatchedAt: at, verifiedAt: status === 'verified' ? at : '', receipt, error: status === 'uncertain' ? 'Error: gh: HTTP 502' : '', elapsedMs: null });
    const commentId = `harness:${f.job.id}:park-comment:1`, exact = { id: 900, html_url: `${f.issueUrl}#issuecomment-900`, user: { login: 'JFusco' }, body };
    if (comment) f.store.putEffect(intent(commentId, 'github-issue-comment', f.issueUrl, { marker }, 'park-comment:1', comment, comment === 'verified' ? { id: 900, url: exact.html_url } : null));
    if (lanes) for (const card of f.state.cards) {
        card.status = 'block';
        const key = `park:${f.job.id}:1:lane:${card.id}`;
        f.store.putEffect(intent(`harness:${f.job.id}:${key}`, 'github-project-status', `project:${card.id}`, { project: 'project', item: card.id, field: 'status', option: 'block', head: f.job.head }, key, 'verified', { item: card.id, option: 'block' }));
    }
    const finish = () => f.run(() => finishMetadataPark(f.delivery, f.job));
    const commentIntent = () => f.store.getEffect(commentId);
    return { f, marker, body, exact, finish, commentIntent, commentId };
}

test('the exact historical comment, on the second page, is adopted under its original intent and payload with no POST, and the park publishes', async () => {
    const h = historical();
    h.f.hooks.respond = call => call.args[1]?.includes('/issues/5/comments?') ? JSON.stringify([[{ id: 1, html_url: `${h.f.issueUrl}#issuecomment-1`, user: { login: 'someone' }, body: 'Looks good' }], [h.exact]]) : undefined;
    await h.finish();
    expect(h.commentIntent()).toMatchObject({ status: 'verified', payload: { marker: h.marker }, receipt: { id: 900, url: h.exact.html_url } });
    expect(h.f.writes.posts).toEqual([]); expect(h.f.writes.moves).toEqual([]);
    expect(h.f.job.parked).toMatchObject({ published: true });
});

test('an uncertain historical comment intent is verified by the exact comment under its original id; nothing is sent', async () => {
    const h = historical('uncertain');
    h.f.state.comments.push(h.exact);
    await h.finish();
    expect(h.commentIntent()).toMatchObject({ id: h.commentId, status: 'verified', payload: { marker: h.marker } });
    expect(h.f.writes.posts).toEqual([]); expect(h.f.writes.moves).toEqual([]);
    expect(h.f.job.parked).toMatchObject({ published: true });
});

test.each([
    ['a quoted marker only', 'uncertain', (h: ReturnType<typeof historical>) => { h.f.state.comments.push({ ...h.exact, body: `> ${h.body}` }); }, 'still uncertain'],
    ['another author', 'uncertain', (h: ReturnType<typeof historical>) => { h.f.state.comments.push({ ...h.exact, user: { login: 'someone' } }); }, "not the Office's exact decision comment"],
    ['another anchor', 'uncertain', (h: ReturnType<typeof historical>) => { h.f.state.comments.push({ ...h.exact, html_url: 'https://github.com/other/repo/issues/5#issuecomment-900' }); }, "not the Office's exact decision comment"],
    ['an edited body', 'uncertain', (h: ReturnType<typeof historical>) => { h.f.state.comments.push({ ...h.exact, body: `${h.body} (edited)` }); }, "not the Office's exact decision comment"],
    ['duplicates', 'uncertain', (h: ReturnType<typeof historical>) => { h.f.state.comments.push(h.exact, { ...h.exact, id: 901, html_url: `${h.f.issueUrl}#issuecomment-901` }); }, '2 comments start with'],
    ['a deleted comment', 'verified', () => {}, 'no longer on the issue'],
    ['a receipt mismatch', 'verified', (h: ReturnType<typeof historical>) => { h.f.state.comments.push({ ...h.exact, id: 902, html_url: `${h.f.issueUrl}#issuecomment-902` }); }, 'does not match its saved receipt'],
    ['no comment and no intent', undefined, () => {}, 'this park may not post one'],
] as const)('a historical park with %s stays a visible stop: no replacement POST, the original intent kept', async (_name, comment, change, error) => {
    const h = historical(comment);
    change(h);
    const before = h.commentIntent();
    await expect(h.finish()).rejects.toThrow(error);
    expect(h.f.writes.posts).toEqual([]); expect(h.f.writes.moves).toEqual([]);
    expect(h.f.job.parked).toMatchObject({ published: false, marker: h.marker });
    if (before) expect(h.commentIntent()).toMatchObject({ id: before.id, status: before.status, payload: { marker: h.marker } });
});

test('a historical park whose comment is confirmed but whose card move was never sent keeps the stop: it has no review or route evidence to send it', async () => {
    const h = historical('verified', false);
    h.f.state.comments.push(h.exact);
    await expect(h.finish()).rejects.toThrow('keeps no record of its review or route to send a move');
    expect(h.f.writes.moves).toEqual([]); expect(h.f.writes.posts).toEqual([]);
    expect(h.f.job.parked).toMatchObject({ published: false, stopped: expect.stringContaining('saved before parks kept the review and route') });
});
