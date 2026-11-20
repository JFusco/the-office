import { expect, test } from 'vitest';
import type { DeployContext } from '../../../server/release/deploy-context';
import { verifyLoaded } from '../../../server/release/verify-loaded';

const HASH = '1'.repeat(64), DIGEST = '2'.repeat(64);
const held = { status: 'held', tokenDigest: DIGEST, deployment: 'deploy-x', acquiredAt: '2026-11-20T03:00:00.000Z' };
const health = (over: Record<string, unknown> = {}) => ({ loadedHash: HASH, serviceInstanceId: 'instance-2', pid: 77, busy: false, fence: held, ...over });
function context(answers: (() => unknown)[]) {
    const clock = { ms: Date.parse('2026-11-20T03:00:00.000Z') }, reads = { count: 0 };
    const ctx = {
        office: { health: async () => { const answer = answers[Math.min(reads.count++, answers.length - 1)](); return answer; } },
        timings: { startDeadlineMs: 10_000, pollMs: 1_000 }, now: () => new Date(clock.ms), sleep: async (ms: number) => { clock.ms += ms; },
    } as unknown as DeployContext;
    return { ctx, reads };
}
const refused = () => { throw new Error('ECONNREFUSED'); };
const expectation = { hash: HASH, knownInstances: ['instance-1'], tokenDigest: DIGEST };

test('a service that answers after a few silent reads is loaded when hash, instance and fence all match', async () => {
    const { ctx, reads } = context([refused, refused, () => health()]);
    expect(await verifyLoaded(ctx, expectation)).toEqual({ ok: true, serviceInstanceId: 'instance-2', pid: 77, observedAt: '2026-11-20T03:00:02.000Z' });
    expect(reads.count).toBe(3);
});

test.each<[string, Record<string, unknown>, RegExp]>([
    ['another release hash', { loadedHash: '9'.repeat(64) }, /loaded 9{64}, not 1{64}/],
    ['an instance that was already running', { serviceInstanceId: 'instance-1' }, /already running/],
    ['an open fence', { fence: { status: 'open' } }, /fence is open/],
    ['a fence another deployment holds', { fence: { ...held, tokenDigest: '3'.repeat(64), deployment: 'deploy-y' } }, /held by deploy-y/],
])('an answer with %s fails at once, without waiting out the deadline', async (_, over, reason) => {
    const { ctx, reads } = context([() => health(over)]);
    const result = await verifyLoaded(ctx, expectation);
    expect(result).toMatchObject({ ok: false, pid: 77 });
    expect(result.ok ? '' : result.reason).toMatch(reason);
    expect(reads.count).toBe(1);
});

test('silence, or health without a fence, is waited on until the deadline and then fails with no process named', async () => {
    const silent = context([refused]);
    expect(await verifyLoaded(silent.ctx, expectation)).toEqual({ ok: false, pid: null, reason: expect.stringContaining('did not answer') });
    expect(silent.reads.count).toBe(11);
    const { fence: _, ...legacy } = health();
    expect(await verifyLoaded(context([() => legacy]).ctx, expectation)).toEqual({ ok: false, pid: null, reason: expect.stringContaining('without a readable') });
});
