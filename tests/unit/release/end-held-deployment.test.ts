import { expect, test } from 'vitest';
import { existsSync, writeFileSync } from 'node:fs';
import { startDeployJournal } from '../../../server/release/deploy-journal';
import { deployLockPath } from '../../../server/release/deploy-lock';
import { concludeOperation, readOutcome } from '../../../server/release/deploy-outcome';
import { readDeployStop, writeDeployStop } from '../../../server/release/deploy-stop';
import { endHeldDeployment } from '../../../server/release/end-held-deployment';
import { sampleFacts } from './deploy-world';
import { OP, tokened } from './step-fixture';

const END = 'end-20261120t031000z-0a0b0c0d';

test('a person ends a stopped deployment: its fence is released, its STOP record stays, and an unfinished one is recorded ended', async () => {
    const { w, token } = tokened();
    w.fence.acquire(token, OP);
    startDeployJournal(w.dataRoot, OP, ['fence'], sampleFacts('c'.repeat(40)));
    writeDeployStop(w.dataRoot, { operation: OP, step: 'stop', reason: 'x', instruction: 'y' });
    expect(await endHeldDeployment(w.ctx, { operation: END, owner: OP })).toEqual({ status: 'ended', operation: END, step: null, reason: `the fence held by ${OP} is released` });
    expect(w.fence.read()).toEqual({ status: 'open' });
    expect(readDeployStop(w.dataRoot)).toMatchObject({ operation: OP });
    expect(readOutcome(w.dataRoot, OP)).toMatchObject({ status: 'ended', reason: `ended by a person through ${END}` });
    expect(existsSync(deployLockPath(w.dataRoot))).toBe(false);
    expect(w.calls).toEqual(['release']);
});

test('an outcome the deployment already recorded is kept', async () => {
    const { w, token } = tokened();
    w.fence.acquire(token, OP);
    startDeployJournal(w.dataRoot, OP, ['fence'], sampleFacts('c'.repeat(40)));
    concludeOperation(w.ctx, { status: 'stopped', operation: OP, step: 'release', reason: 'release unconfirmed' });
    expect(await endHeldDeployment(w.ctx, { operation: END, owner: OP })).toMatchObject({ status: 'ended' });
    expect(readOutcome(w.dataRoot, OP)).toMatchObject({ status: 'stopped', step: 'release' });
});

test('a fence another deployment holds, a missing token, or a running deployment is refused', async () => {
    const other = tokened();
    other.w.fence.acquire('another-token-0123456789', 'deploy-other');
    expect(await endHeldDeployment(other.w.ctx, { operation: END, owner: OP })).toMatchObject({ status: 'refused', reason: expect.stringContaining('held by deploy-other') });
    expect(await endHeldDeployment(other.w.ctx, { operation: END, owner: 'deploy-20261120t020000z-ffffffff' })).toMatchObject({ status: 'refused', reason: expect.stringContaining('no saved fence token') });
    expect(other.w.fence.read()).toMatchObject({ status: 'held', deployment: 'deploy-other' });
    const busy = tokened();
    writeFileSync(deployLockPath(busy.w.dataRoot), JSON.stringify({ pid: process.pid, operation: OP, at: '2026-11-20T03:00:00.000Z' }));
    expect(await endHeldDeployment(busy.w.ctx, { operation: END, owner: OP })).toMatchObject({ status: 'refused', reason: expect.stringContaining('holds the deploy lock') });
    expect(busy.w.calls).toEqual([]);
});
