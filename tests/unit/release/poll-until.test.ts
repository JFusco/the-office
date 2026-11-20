import { expect, test } from 'vitest';
import { until } from '../../../server/release/poll-until';

function clocked() {
    const clock = { ms: 0 }, sleeps: number[] = [];
    return { sleeps, ctx: { now: () => new Date(clock.ms), sleep: async (ms: number) => { sleeps.push(ms); clock.ms += ms; }, timings: { pollMs: 1000 } as any } };
}

test('polling returns the first answer that is done, sleeping the poll interval between reads', async () => {
    const { ctx, sleeps } = clocked();
    let reads = 0;
    expect(await until(ctx, 10_000, async () => ++reads, value => value === 3)).toBe(3);
    expect(sleeps).toEqual([1000, 1000]);
});

test('at the deadline the last answer is returned even though it is not done', async () => {
    const { ctx, sleeps } = clocked();
    let reads = 0;
    expect(await until(ctx, 3000, async () => ++reads, () => false)).toBe(4);
    expect(sleeps).toHaveLength(3);
});
