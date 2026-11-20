import { expect, test } from 'vitest';
import { waitIdle } from '../../../server/release/wait-idle';

const INSTANCE = 'instance-1', DIGEST = 'a'.repeat(64);
const held = { status: 'held', tokenDigest: DIGEST, deployment: 'deploy-x', acquiredAt: '2026-11-20T00:00:00.000Z' };
const health = (over: Record<string, unknown> = {}) => ({ ok: true, serviceInstanceId: INSTANCE, busy: false, fence: held, ...over });

function run(answers: (unknown | Error)[], deadlineMs = 10_000, { sleepDelay = 0, secondReadDelay = 0 } = {}) {
    let clock = Date.parse('2026-11-20T00:00:00.000Z'), reads = 0;
    const sleeps: number[] = [];
    return waitIdle({
        observe: async () => {
            if (reads === 1) clock += secondReadDelay;
            const answer = answers[Math.min(reads++, answers.length - 1)];
            if (answer instanceof Error) throw answer;
            return answer;
        },
        serviceInstanceId: INSTANCE, tokenDigest: DIGEST, deadlineMs, intervalMs: 1000,
        sleep: async ms => { sleeps.push(ms); clock += ms + sleepDelay; }, now: () => new Date(clock),
    }).then(result => ({ result, reads, sleeps }));
}

test('idle needs two consecutive qualifying observations, fetched an interval apart', async () => {
    const { result, reads, sleeps } = await run([health()]);
    expect(result).toEqual({ status: 'idle', observations: [{ at: '2026-11-20T00:00:00.000Z', serviceInstanceId: INSTANCE }, { at: '2026-11-20T00:00:01.000Z', serviceInstanceId: INSTANCE }] });
    expect(reads).toBe(2);
    expect(sleeps).toEqual([1000]);
});

test('a busy observation between two idle ones starts the count again', async () => {
    const { result, reads } = await run([health(), health({ busy: true }), health(), health()]);
    expect(result.status).toBe('idle');
    expect(reads).toBe(4);
});

test('a service that stays busy times out, naming the busy observation', async () => {
    const { result, reads } = await run([health({ busy: true })], 3000);
    expect(result).toMatchObject({ status: 'timeout', reason: expect.stringContaining('the service was busy at') });
    expect(reads).toBe(3);
});

test('one idle observation at the deadline is not idle', async () => {
    expect((await run([health()], 500)).result).toEqual({ status: 'timeout', reason: 'the deadline passed before a second idle observation' });
});

test('an interval that runs past the deadline prevents a second read', async () => {
    const { result, reads } = await run([health(), health()], 1500, { sleepDelay: 501 });
    expect(result).toEqual({ status: 'timeout', reason: 'the deadline passed before a second idle observation' });
    expect(reads).toBe(1);
});

test('a second qualifying read that completes past the deadline cannot earn a receipt', async () => {
    const { result, reads } = await run([health(), health()], 1500, { secondReadDelay: 501 });
    expect(result).toEqual({ status: 'timeout', reason: 'the deadline passed before a second idle observation' });
    expect(reads).toBe(2);
});

test.each([
    ['unreachable', [health(), new Error('connect ECONNREFUSED')]],
    ['instance-changed', [health(), health({ serviceInstanceId: 'instance-2' })]],
    ['fence-not-held', [health(), health({ fence: { status: 'open' } })]],
    ['fence-not-held', [health({ fence: { ...held, tokenDigest: 'b'.repeat(64) } })]],
    ['fence-not-held', [health({ fence: { status: 'invalid', reason: 'unreadable' } })]],
    ['unreadable-health', [{ ok: true, busy: false }]],
    ['unreadable-health', [health(), health({ fence: { ...held, deployment: '   ' } })]],
    ['unreadable-health', [health(), health({ fence: { ...held, acquiredAt: 'yesterday' } })]],
    ['unreadable-health', [health(), health({ fence: { ...held, tokenDigest: DIGEST.toUpperCase() } })]],
] as const)('%s ends the wait at once with no idle receipt', async (status, answers) => {
    const { result, reads } = await run([...answers]);
    expect(result.status).toBe(status);
    expect(reads).toBe(answers.length);
});

test('an unbounded deadline or interval is refused before any read', async () => {
    let reads = 0;
    const observe = async () => { reads++; return health(); };
    for (const [deadlineMs, intervalMs] of [[Infinity, 1000], [NaN, 1000], [1000, 0], [1000, Infinity], [-1, 1000]])
        await expect(waitIdle({ observe, serviceInstanceId: INSTANCE, tokenDigest: DIGEST, deadlineMs, intervalMs })).rejects.toThrow('finite positive');
    expect(reads).toBe(0);
});

test('a health read that never answers ends as unreachable at the deadline', async () => {
    const result = await waitIdle({ observe: () => new Promise(() => {}), serviceInstanceId: INSTANCE, tokenDigest: DIGEST, deadlineMs: 40, intervalMs: 10 });
    expect(result).toEqual({ status: 'unreachable', reason: expect.stringContaining('did not answer before the deadline') });
});
