import { expect, test, vi } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { finishMetadataPark } from '../../../../server/delivery/parking/finish-metadata-park';
import { releaseMetadataPark } from '../../../../server/delivery/parking/release-metadata-park';
import { parkCommentBody } from '../../../../server/delivery/parking/park-comment';
import { currentAssignment } from '../../../../server/workers/assignment-context';
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
        authorization: 'office-harness', payload: { marker: f.job.parked!.marker, issue: 5, body: parkCommentBody(f.job.parked!), author: 'JFusco' }, expectedState: { key: 'park-comment:1' }, status: 'prepared', createdAt: at, dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null };
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

test.each([false, true])('a release sees original or retry dispatches committed at the transaction boundary (retry=%s)', async retry => {
    const { f, id } = await preparedAcrossRestart();
    const parked = f.job.parked!, dispatched = retry ? `${id}:retry-1` : id;
    await expect(f.run(async () => {
        const transaction = f.store.transaction.bind(f.store);
        vi.spyOn(f.store, 'transaction').mockImplementationOnce(((operation: () => unknown) => {
            const original = f.store.getEffect(id)!;
            if (retry) f.store.putEffect({ ...original, status: 'rejected' });
            f.store.putEffect({ ...original, id: dispatched, status: 'dispatching', dispatchedAt: f.store.clock.now().toISOString() });
            return transaction(operation);
        }) as typeof f.store.transaction);
        releaseMetadataPark(f.store, f.job, parked, 'Superseded');
    })).rejects.toThrow('it is read back, not released');
    expect(f.job.parked).toBe(parked);
    expect(f.store.getEffect(dispatched)?.status).toBe('dispatching');
    expect(f.job.releasedParks).toBeUndefined();
    expect(f.store.state.events.filter(event => event.kind === 'delivery-park-released')).toEqual([]);
});

test.each(['target', 'payload'])('release refuses a prepared row with a mismatched %s', async field => {
    const { f, id } = await preparedAcrossRestart();
    const intent = f.store.getEffect(id)!;
    f.store.putEffect({ ...intent, [field]: field === 'target' ? `${f.issueUrl}0` : { marker: f.job.parked!.marker } });
    f.pr.title += ' edited';
    await expect(f.run(() => finishMetadataPark(f.delivery, f.job))).rejects.toThrow('needs reconciliation');
    expect(f.store.getEffect(id)?.status).toBe('prepared');
    expect(f.job.parked).toBeDefined();
    expect(f.job.releasedParks).toBeUndefined();
});

test('claim loss during the release board read leaves the prepared intent and park until an authorized pass', async () => {
    const { f, id } = await preparedAcrossRestart();
    f.pr.title += ' edited';
    let decisionRead = false;
    f.hooks.after = call => {
        if (call.args[1]?.endsWith('/pulls/200')) decisionRead = true;
        if (decisionRead && call.request?.query.includes('items(first:100')) f.store.finishClaim(currentAssignment()!.claim.id, 'completed');
    };
    const finish = () => f.run(() => finishMetadataPark(f.delivery, f.job));
    await expect(finish()).rejects.toThrow('Exact running delivery scheduler claim is required');
    expect(f.store.getEffect(id)?.status).toBe('prepared');
    expect(f.job.parked).toBeDefined();
    expect(f.job.releasedParks).toBeUndefined();
    expect(f.store.state.events.filter(event => event.kind === 'delivery-park-released')).toEqual([]);
    f.hooks.after = undefined;
    await expect(finish()).rejects.toThrow('was released');
    expect(f.store.getEffect(id)?.status).toBe('rejected');
    expect(f.job.parked).toBeUndefined();
});

test('a verified merge releases an unsent park without instructions for an obsolete review', async () => {
    const { f, id } = await preparedAcrossRestart();
    f.pr.state = 'closed';
    f.pr.merged_at = '2026-11-24T00:00:00.000Z' as any;
    await expect(f.run(() => finishMetadataPark(f.delivery, f.job))).rejects.toThrow('because it was merged');
    expect(f.store.getEffect(id)?.status).toBe('rejected');
    expect(f.job.detail).toContain('because it was merged');
    expect(f.job.detail).not.toMatch(/edit|move|review-pr/i);
    expect(f.writes.posts).toEqual([]);
});

test.each(['retargeted', 'missing state'])('a parked decision distinguishes %s', async change => {
    const { f, id } = await preparedAcrossRestart();
    if (change === 'retargeted') f.pr.base.ref = 'another-branch';
    else Reflect.deleteProperty(f.pr, 'state');
    const finish = f.run(() => finishMetadataPark(f.delivery, f.job));
    if (change === 'retargeted') {
        await expect(finish).rejects.toThrow('was retargeted');
        expect(f.job.parked).toBeUndefined();
        expect(f.store.getEffect(id)?.status).toBe('rejected');
    } else {
        await expect(finish).rejects.toThrow('identity or state');
        expect(f.job.parked).toBeDefined();
        expect(f.store.getEffect(id)?.status).toBe('prepared');
    }
    expect(f.writes.posts).toEqual([]);
    expect(f.blockMoves()).toEqual(['issue-card>block']);
});
