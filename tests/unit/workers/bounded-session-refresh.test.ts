import { afterEach, expect, test, vi } from 'vitest';
import { refreshWithin } from '../../../server/workers/bounded-session-refresh';

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
    fail(new Error('late')); await expect(late).rejects.toThrow('late');
});
