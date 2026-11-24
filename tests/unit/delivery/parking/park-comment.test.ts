import { afterEach, expect, test } from 'vitest';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { assertDeliveryMayMutate } from '../../../../server/delivery/harness/guards';
import { commentAuthor, readParkComment, settleParkComment } from '../../../../server/delivery/parking/park-comment';
afterEach(cleanupFakes);

function setup() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'lead-pr', status: 'working' }), marker = `Office decision ${job.id}:0`;
    const comment = { issue: 5, marker, body: `${marker}: PR #200 needs an edit.\n\nEdit it, then move the issue card back to Ready.`, author: 'JFusco' };
    const payload = { marker, issue: 5, body: comment.body, author: 'JFusco' };
    const posts = () => f.state.calls.filter(call => call.includes('/issues/5/comments --method POST')).length;
    const settle = (post = true) => claimedDelivery(f.store, job, () => settleParkComment(f.store, f.execute as any, job, comment, { payload, guard: () => assertDeliveryMayMutate(f.store, f.delivery.jobs, job, job.head), post }));
    const exact = (id = 900) => ({ id, html_url: `${f.issueUrl}#issuecomment-${id}`, user: { login: 'JFusco' }, body: comment.body });
    return { f, job, marker, comment, payload, posts, settle, exact };
}

test('only a comment that starts with the marker can match; a quotation or another step\'s marker is absent', async () => {
    const s = setup();
    s.f.state.comments.push({ ...s.exact(), body: `> ${s.comment.body}` }, { ...s.exact(901), body: `${s.marker}2: another step` });
    expect(await readParkComment(s.f.store, s.f.execute as any, s.comment)).toBeNull();
    s.f.state.comments.push(s.exact(902));
    expect(await readParkComment(s.f.store, s.f.execute as any, s.comment)).toEqual({ id: 902, url: `${s.f.issueUrl}#issuecomment-902` });
    await expect(readParkComment(s.f.store, s.f.execute as any, s.comment, { id: 1, url: 'x' })).rejects.toThrow('does not match its saved receipt');
    expect(await commentAuthor(s.f.store, s.f.execute as any)).toBe('JFusco');
});

test('a marked comment that is not the exact body, author or anchor, or two of them, needs reconciliation', async () => {
    for (const [name, comments] of [
        ['body', (s: ReturnType<typeof setup>) => [{ ...s.exact(), body: `${s.comment.body}!` }]],
        ['author', (s: ReturnType<typeof setup>) => [{ ...s.exact(), user: { login: 'someone' } }]],
        ['anchor', (s: ReturnType<typeof setup>) => [{ ...s.exact(), html_url: `${s.f.issueUrl}#issuecomment-1` }]],
        ['id', (s: ReturnType<typeof setup>) => [{ ...s.exact(), id: -1, html_url: `${s.f.issueUrl}#issuecomment--1` }]],
        ['duplicate', (s: ReturnType<typeof setup>) => [s.exact(), s.exact(901)]],
    ] as const) {
        const s = setup();
        s.f.state.comments.push(...comments(s));
        await expect(readParkComment(s.f.store, s.f.execute as any, s.comment), name).rejects.toThrow('needs reconciliation');
    }
});

test('the comment is posted once and a verified one is read again, never posted again; one already there is adopted with no POST', async () => {
    const s = setup();
    expect(await s.settle()).toEqual({ id: 900, url: `${s.f.issueUrl}#issuecomment-900` });
    expect(s.posts()).toBe(1);
    expect(s.f.store.getEffect(`harness:${s.job.id}:park-comment:0`)).toMatchObject({ status: 'verified', payload: s.payload });
    await s.settle();
    expect(s.posts()).toBe(1);
    s.f.state.comments.length = 0;
    await expect(s.settle()).rejects.toThrow('no longer on the issue');
    const adopted = setup();
    adopted.f.state.comments.push(adopted.exact(950));
    expect(await adopted.settle()).toEqual({ id: 950, url: `${adopted.f.issueUrl}#issuecomment-950` });
    expect(adopted.posts()).toBe(0);
});

test('a park that may not post sends nothing when no comment is there, and a saved intent of another payload is refused before it is read', async () => {
    const s = setup();
    await expect(s.settle(false)).rejects.toThrow('this park may not post one');
    expect(s.posts()).toBe(0);
    s.f.store.putEffect({ id: `harness:${s.job.id}:park-comment:0`, work: { projectId: s.f.store.project.id, kind: 'delivery', id: s.job.id }, attemptId: s.job.id, operation: 'github-issue-comment',
        target: s.f.issueUrl, authorization: 'office-harness', payload: { marker: s.marker }, expectedState: { key: 'park-comment:0' }, status: 'uncertain', createdAt: '', dispatchedAt: 'x', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
    const reads = s.f.state.calls.length;
    await expect(s.settle()).rejects.toThrow("is not this park's");
    expect(s.f.state.calls.length).toBe(reads); expect(s.posts()).toBe(0);
});
