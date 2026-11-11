import { expect, test, vi } from 'vitest';
import { inactivityWatch } from '../../../server/workers/inactivity-watch';

test('ongoing output extends execution and a silent worker stops once', () => {
    vi.useFakeTimers();
    try {
        const stop = vi.fn();
        const watch = inactivityWatch(1000, stop);
        for (let i = 0; i < 20; i++) {
            vi.advanceTimersByTime(900);
            watch.progress();
        }
        expect(stop).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1000);
        expect(stop).toHaveBeenCalledTimes(1);
        watch.clear();
        vi.advanceTimersByTime(2000);
        expect(stop).toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
});

test('completion clears the silence watchdog', () => {
    vi.useFakeTimers();
    try {
        const stop = vi.fn();
        const watch = inactivityWatch(1000, stop);
        watch.clear();
        vi.advanceTimersByTime(2000);
        expect(stop).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
});
