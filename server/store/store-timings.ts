import { performance } from 'node:perf_hooks';

export interface StoreTiming { calls: number; ms: number; slowestMS: number; chars: number }
export interface StoreTimings {
    /** Run `work`, adding its duration (and the characters of text it reports) under `name`. A throw is timed and rethrown. */
    time<T>(name: string, work: () => T, chars?: (result: T) => number): T;
    add(name: string, ms: number, chars?: number): void;
    report(): { since: string; timings: Record<string, StoreTiming> };
}

/** Names are fixed text chosen by the code, so the table is small; this bound only guards a mistake. */
export const MAX_TIMED_NAMES = 200;
const OTHER = 'other';

/**
 * Totals since this process opened the store: how often each named step ran, how long it took in all, its slowest
 * run and the characters of text it handled. Measurement only: nothing reads these to decide anything.
 */
export function storeTimings(now: () => number = () => performance.now(), since = new Date().toISOString()): StoreTimings {
    const totals = new Map<string, StoreTiming>();
    const add = (name: string, ms: number, chars = 0) => {
        let total = totals.get(name);
        if (!total) {
            if (totals.size >= MAX_TIMED_NAMES && name !== OTHER) return add(OTHER, ms, chars);
            totals.set(name, total = { calls: 0, ms: 0, slowestMS: 0, chars: 0 });
        }
        total.calls++; total.ms += ms; total.chars += chars;
        if (ms > total.slowestMS) total.slowestMS = ms;
    };
    return {
        add,
        time(name, work, chars) {
            const started = now();
            let size = 0;
            try { const result = work(); if (chars) size = chars(result); return result; }
            finally { add(name, now() - started, size); }
        },
        report() {
            const tenth = (value: number) => Math.round(value * 10) / 10;
            return { since, timings: Object.fromEntries([...totals].sort((a, b) => b[1].ms - a[1].ms)
                .map(([name, total]) => [name, { calls: total.calls, ms: tenth(total.ms), slowestMS: tenth(total.slowestMS), chars: total.chars }])) };
        },
    };
}
