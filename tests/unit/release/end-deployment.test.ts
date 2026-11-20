import { expect, test } from 'vitest';
import { existsSync } from 'node:fs';
import { operationPaths } from '../../../server/release/deploy-paths';
import { endDeployment } from '../../../server/release/end-deployment';
import { OP, tokened } from './step-fixture';

test('ending releases the fence this deployment holds and then removes its token', async () => {
    const { w, token } = tokened();
    w.fence.acquire(token, OP);
    expect(await endDeployment(w.ctx, OP, OP)).toEqual({ status: 'verified', receipt: { fence: 'open' } });
    expect(w.fence.read()).toEqual({ status: 'open' });
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(false);
    // Ended already: an open fence with no token left is confirmed, with nothing sent.
    expect(await endDeployment(w.ctx, OP, OP)).toMatchObject({ status: 'verified' });
    expect(w.calls).toEqual(['release']);
});

test('a fence another token holds is never released, and the token is kept', async () => {
    const { w } = tokened();
    w.fence.acquire('another-token-0123456789', 'deploy-other');
    expect(await endDeployment(w.ctx, OP, OP)).toEqual({ status: 'rejected', reason: expect.stringContaining('held by deploy-other, not') });
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: 'deploy-other' });
    expect(w.calls).toEqual([]);
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(true);
});

test('a release that cannot be confirmed keeps the token so a person can still end it', async () => {
    const { w, token } = tokened({ release: 'fail' });
    w.fence.acquire(token, OP);
    expect(await endDeployment(w.ctx, OP, OP)).toMatchObject({ status: 'uncertain' });
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(true);
    // A separately identified operation may release it later.
    w.behaviour.release = undefined;
    expect(await endDeployment(w.ctx, 'end-20261120t031000z-0a0b0c0d', OP)).toMatchObject({ status: 'verified' });
    expect(w.fence.read()).toEqual({ status: 'open' });
});

test('a missing token with the fence still held is an error, not a release', async () => {
    const { w, token } = tokened();
    w.fence.acquire(token, OP);
    await expect(endDeployment(w.ctx, OP, 'deploy-20261120t020000z-ffffffff')).rejects.toThrow('no saved fence token');
    expect(w.calls).toEqual([]);
});
