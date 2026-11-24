import { expect, test } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { parkIntents, readParkWrite, settleParkWrites, unconfirmedWrites, unreadStopWords } from '../../../../server/delivery/parking/park-writes';

const isMove = (call: { request?: { query: string } }) => String(call.request?.query).startsWith('mutation');

/** A park whose PR card move was sent and its response lost; `lands` says whether GitHub applied it. */
async function unreadMove(lands: boolean) {
    const f = metadataParkFixture();
    let once = true;
    const fail = (call: any) => { if (once && isMove(call) && call.request.variables.item === 'pr-card') { once = false; throw new Error('gh: HTTP 502 lost'); } };
    if (lands) f.hooks.after = fail; else f.hooks.before = fail;
    await expect(f.parkNow()).rejects.toThrow('needs read-back');
    f.hooks.after = f.hooks.before = undefined;
    return f;
}

test('the park\'s intents are its own comment and card moves only, under any attempt id; another step\'s are not', async () => {
    const f = await unreadMove(true);
    f.store.putEffect({ ...f.effects()[0], id: `harness:${f.job.id}:park-comment:12`, status: 'uncertain' });
    expect(parkIntents(f.store, f.job).map(intent => intent.id.replace(f.job.id, 'job').replace(f.job.id, 'job')).sort())
        .toEqual(['harness:job:park:job:1:lane:issue-card', 'harness:job:park:job:1:lane:pr-card']);
});

test('a sent move that landed is settled, its Effect and its board update together; nothing is sent', async () => {
    const f = await unreadMove(true);
    expect(unconfirmedWrites(f.store, f.job)).toEqual([{ write: "the move of the pull request's card to Block", error: expect.stringContaining('HTTP 502 lost') }]);
    const moves = f.writes.moves.length;
    expect(await settleParkWrites(f.store, f.delivery.execute, f.job)).toEqual([]);
    expect(f.effects().every(e => e.status === 'verified')).toBe(true);
    expect(f.job.boardUpdates!.every(update => update.status === 'verified')).toBe(true);
    expect(f.writes.moves).toHaveLength(moves);
});

test('a sent move that never shows stays unread with the error its attempt left, and its update stays unsettled', async () => {
    const f = await unreadMove(false);
    const unread = await settleParkWrites(f.store, f.delivery.execute, f.job);
    expect(unread).toEqual([{ write: "the move of the pull request's card to Block", error: expect.stringContaining('HTTP 502 lost') }]);
    expect(unreadStopWords(unread)).toContain('is still uncertain; it needs read-back');
    expect(f.job.boardUpdates!.some(update => update.item === 'pr-card' && update.status === 'uncertain')).toBe(true);
});

test('a card move intent that is not to the park\'s field and Block lane is refused before it is read', async () => {
    const f = await unreadMove(false);
    const intent = f.effects().find(e => e.id.endsWith(':pr-card'))!;
    f.store.putEffect({ ...intent, payload: { ...intent.payload, option: 'done' } });
    const calls = f.state.calls.length;
    await expect(readParkWrite(f.store, f.delivery.execute, f.job, f.store.getEffect<Record<string, unknown>>(intent.id)!)).rejects.toThrow("is not this park's");
    expect(f.state.calls.length).toBe(calls);
});
