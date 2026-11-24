import { expect, test, vi } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { finishMetadataPark } from '../../../../server/delivery/parking/finish-metadata-park';
import { releaseMetadataPark } from '../../../../server/delivery/parking/release-metadata-park';
import type { EffectIntent } from '../../../../src/shared';

const isMove = (call: { request?: { query: string } }) => String(call.request?.query).startsWith('mutation');

/** A park whose issue card reached Block, with a comment intent a restart left `prepared`, never dispatched. */
async function preparedAcrossRestart() {
    const f = metadataParkFixture();
    f.hooks.after = call => { if (isMove(call)) f.store.state.paused = true; };
    await expect(f.parkNow()).rejects.toThrow('paused');
    f.hooks.after = undefined; f.store.state.paused = false;
    const id = `harness:${f.job.id}:park-comment:1`, at = f.store.clock.now().toISOString();
    const intent: EffectIntent = { id, work: { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, attemptId: f.job.id, operation: 'github-issue-comment', target: f.issueUrl,
        authorization: 'office-harness', payload: { marker: f.job.parked!.marker }, expectedState: { key: 'park-comment:1' }, status: 'prepared', createdAt: at, dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null };
    f.store.putEffect(intent);
    return { f, id };
}

test('a superseded park closes its prepared intents as rejected before dispatch and keeps every record; the metadata gate then admits a fresh review', async () => {
    const { f, id } = await preparedAcrossRestart();
    const step = structuredClone(f.job.steps), updates = structuredClone(f.job.boardUpdates), park = structuredClone(f.job.parked);
    f.pr.body = 'Closes #5\nJoe edited the body';
    await expect(f.run(() => finishMetadataPark(f.delivery, f.job))).rejects.toThrow('PR #200 was edited after the review');
    expect(f.store.getEffect(id)).toMatchObject({ status: 'rejected', dispatchedAt: '', error: expect.stringContaining('Retired before dispatch') });
    expect(f.job.parked).toBeUndefined();
    expect(f.job.releasedParks).toEqual([{ ...park, releasedAt: expect.any(String), releaseReason: expect.stringContaining('PR #200 was edited after the review') }]);
    expect(f.job.steps).toEqual(step); expect(f.job.boardUpdates).toEqual(updates);
    expect(f.effects().every(e => e.status === 'verified' || e.status === 'rejected' && !e.dispatchedAt)).toBe(true);
    expect(f.writes.posts).toEqual([]); expect(f.blockMoves()).toEqual(['issue-card>block']);
});

test('a release is refused, changing nothing, when an intent was dispatched first or a write still needs read-back', async () => {
    const { f, id } = await preparedAcrossRestart();
    const transaction = f.store.transaction.bind(f.store);
    // Another executor wins the status transition, and commits it, just before the release's transaction closes the row.
    vi.spyOn(f.store, 'transaction').mockImplementationOnce(((operation: () => unknown) => {
        const current = f.store.getEffect(id)!; current.status = 'dispatching'; current.dispatchedAt = f.store.clock.now().toISOString(); f.store.putEffect(current);
        return transaction(operation);
    }) as any);
    const parked = f.job.parked!;
    expect(() => releaseMetadataPark(f.store, f.job, parked, 'Superseded')).toThrow('was dispatched while the park was being released');
    expect(f.job.parked).toBe(parked); expect(f.job.releasedParks).toBeUndefined();
    expect(f.store.getEffect(id)?.status).toBe('dispatching');
    expect(() => releaseMetadataPark(f.store, f.job, parked, 'Superseded')).toThrow('it is read back, not released');
    expect(f.job.parked).toBe(parked);
});
