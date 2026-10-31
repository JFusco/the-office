import { useSyncExternalStore } from 'react';
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const subscribers = new Set<() => void>();
let lastWall = Date.now();
const sample = () => {
    const wall = Date.now(), monotonic = performance.now();
    if (now && (monotonic - now > 5000 || Math.abs((wall - lastWall) - (monotonic - now)) > 2000))
        window.dispatchEvent(new Event('office-clock-gap'));
    lastWall = wall;
    now = monotonic;
    for (const subscriber of subscribers)
        subscriber();
};
const subscribe = (listener: () => void) => {
    subscribers.add(listener);
    if (!timer) {
        lastWall = Date.now();
        now = performance.now();
        timer = setInterval(sample, 1000);
    }
    return () => {
        subscribers.delete(listener);
        if (!subscribers.size) {
            clearInterval(timer);
            timer = undefined;
        }
    };
};
/** All timer consumers share one clock. No network or recorded-time writes. */
export const useLiveClock = () => useSyncExternalStore(subscribe, () => now, () => 0);
