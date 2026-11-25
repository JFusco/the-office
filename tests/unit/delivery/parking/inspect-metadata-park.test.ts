import { expect, test } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { inspectMetadataPark } from '../../../../server/delivery/parking/inspect-metadata-park';
import { ProjectProgress } from '../../../../server/delivery/board/project-progress';

const isMove = (call: { request?: { query: string } }) => String(call.request?.query).startsWith('mutation');

/** A park whose PR card move was sent and its response lost; `lands` says whether GitHub applied it. */
async function unreadMove(lands: boolean) {
    const f = metadataParkFixture();
    let once = true;
    const fail = (call: any) => { if (once && isMove(call) && call.request.variables.item === 'pr-card') { once = false; throw new Error('gh: HTTP 502 lost'); } };
    if (lands) f.hooks.after = fail; else f.hooks.before = fail;
    await expect(f.parkNow()).rejects.toThrow('needs read-back');
    f.hooks.after = f.hooks.before = undefined;
    f.job.status = 'blocked';
    return f;
}

test('a sent write that reads back now is settled before the generic board reconciliation, which then passes; nothing is sent', async () => {
    const f = await unreadMove(true), calls = f.writes.moves.length;
    await f.run(() => inspectMetadataPark(f.delivery, f.job));
    expect(f.job.parked!.unconfirmed).toBeUndefined();
    expect(f.effects().every(e => e.status === 'verified')).toBe(true);
    await new ProjectProgress(f.store, f.delivery.execute).reconcile(f.job);
    expect(f.writes.moves).toHaveLength(calls); expect(f.writes.posts).toEqual([]);
});

test('a sent write still unread stops here with its own error; a failed read keeps the park and the error it had', async () => {
    const f = await unreadMove(false);
    await expect(f.run(() => inspectMetadataPark(f.delivery, f.job))).rejects.toThrow("the move of the pull request's card to Block was sent and is still uncertain");
    expect(f.job.parked!.unconfirmed).toEqual([{ write: "the move of the pull request's card to Block", error: expect.stringContaining('HTTP 502 lost') }]);
    f.hooks.before = call => { if (String(call.request?.query).includes('fieldValues')) throw new Error('gh: HTTP 503 reading'); };
    await expect(f.run(() => inspectMetadataPark(f.delivery, f.job))).rejects.toThrow('HTTP 503 reading');
    expect(f.job.parked!.unconfirmed).toEqual([{ write: "the move of the pull request's card to Block", error: expect.stringContaining('HTTP 502 lost') }]);
    expect(f.writes.posts).toEqual([]);
});

test('a job with no active harness park, or one with nothing sent and unread, is left alone with no read', async () => {
    const f = metadataParkFixture(), calls = f.state.calls.length;
    await f.run(() => inspectMetadataPark(f.delivery, f.job));
    f.job.parked = { stage: 'lead-pr', reason: 'r', at: '', published: true, instruction: 'i', marker: `Office decision ${f.job.id}:1` };
    await f.run(() => inspectMetadataPark(f.delivery, f.job));
    f.job.parked.published = false;
    await f.run(() => inspectMetadataPark(f.delivery, f.job));
    expect(f.state.calls.length).toBe(calls);
});
