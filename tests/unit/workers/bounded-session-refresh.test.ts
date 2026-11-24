import { afterEach, expect, test, vi } from 'vitest';
import { refreshUntilComplete, refreshWithin } from '../../../server/workers/bounded-session-refresh';

afterEach(() => vi.useRealTimers());

test('a fast refresh is awaited to completion', async () => {
    let done = false;
    await refreshWithin({ refresh: async () => { done = true; return {} as never; } }, 1000);
    expect(done).toBe(true);
});
test('a slow refresh stops holding the caller at the limit and still finishes', async () => {
    vi.useFakeTimers();
    let finish!: () => void, done = false, returned = false;
    const slow = new Promise<never>(resolve => { finish = () => { done = true; resolve({} as never); }; });
    const wait = refreshWithin({ refresh: () => slow }, 8000).then(() => { returned = true; });
    await vi.advanceTimersByTimeAsync(7999); expect(returned).toBe(false);
    await vi.advanceTimersByTimeAsync(1); await wait;
    expect(returned).toBe(true); expect(done).toBe(false);
    finish(); await slow; expect(done).toBe(true);
});
test('a refresh that fails after the limit is not an unhandled rejection', async () => {
    vi.useFakeTimers();
    let fail!: (error: Error) => void;
    const late = new Promise<never>((_, reject) => { fail = reject; });
    const wait = refreshWithin({ refresh: () => late }, 10);
    await vi.advanceTimersByTimeAsync(10); await wait;
    // No handler of our own: only refreshWithin's race may observe `late`, so vitest fails the run if it does not.
    vi.useRealTimers(); fail(new Error('late')); await new Promise(resolve => setImmediate(resolve));
});

test('an incomplete inventory is read again until it is complete or the time is up', async () => {
    vi.useFakeTimers();
    const answers = [false, false, true, false], bridge = { reads: 0, current: { complete: false, expiresAt: new Date(Date.now() + 45000).toISOString() }, async refresh() { this.current = { complete: answers[this.reads++] ?? false, expiresAt: new Date(Date.now() + 45000).toISOString() }; return {} as never; } };
    const bridgeResult = refreshUntilComplete(bridge, 5000);
    await vi.runAllTimersAsync();
    await bridgeResult;
    expect([bridge.reads, bridge.current.complete]).toEqual([3, true]);
    const never = { reads: 0, current: { complete: false, expiresAt: '' }, async refresh() { this.reads++; return {} as never; } };
    const neverResult = refreshUntilComplete(never, 5000);
    await vi.runAllTimersAsync();
    await neverResult;
    expect(never.reads).toBe(4);
    const limited = {
        ...never,
        reads: 0,
        async refresh() {
            this.reads++;
            await new Promise(resolve => setTimeout(resolve, 200));
            return {} as never;
        },
    };
    const start = Date.now();
    const elapsed = refreshUntilComplete(limited, 1500).then(() => Date.now() - start);
    await vi.runAllTimersAsync();
    expect(await elapsed).toBe(1500);
    expect(limited.reads).toBe(2);
});
