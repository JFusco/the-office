import { expect, test } from 'vitest';
import { holdFence } from '../../../server/release/hold-fence';
import { OP, tokened } from './step-fixture';

test('the fence is acquired once for the operation, and a second call confirms it without acquiring again', async () => {
    const { w, digest } = tokened();
    expect(await holdFence(w.ctx, OP, OP)).toEqual({ status: 'verified', receipt: { tokenDigest: digest, acquiredAt: expect.any(String) } });
    expect(w.fence.read()).toMatchObject({ status: 'held', tokenDigest: digest, deployment: OP });
    expect(await holdFence(w.ctx, OP, OP)).toMatchObject({ status: 'verified' });
    expect(w.calls).toEqual(['acquire']);
});

test('a fence another deployment holds is refused before anything is sent', async () => {
    const { w } = tokened();
    w.fence.acquire('another-token-0123456789', 'deploy-other');
    expect(await holdFence(w.ctx, OP, OP)).toEqual({ status: 'rejected', reason: expect.stringContaining('held by deploy-other') });
    expect(w.calls).toEqual([]);
});

test('an acquire that was sent and cannot be confirmed is uncertain, and is not sent again', async () => {
    const { w } = tokened({ acquire: 'fail' });
    expect(await holdFence(w.ctx, OP, OP)).toMatchObject({ status: 'uncertain' });
    w.behaviour.acquire = undefined;
    expect(await holdFence(w.ctx, OP, OP)).toMatchObject({ status: 'uncertain' });
    expect(w.calls).toEqual(['acquire']);
});

test('the token is never part of the saved effect', async () => {
    const { w, token } = tokened();
    await holdFence(w.ctx, OP, OP);
    const saved = JSON.stringify((w.ctx.effects as any).store.getEffect(`${OP}:fence`));
    expect(saved).toContain(OP);
    expect(saved).not.toContain(token);
});
