import { performance } from 'node:perf_hooks';

export const LOOP_SAMPLE_MS = 20;
const LATE_MS = [100, 200, 1000] as const;
export interface LoopDelayReport { since: string; sampleMS: number; samples: number; lateMS: number; slowestMS: number; late: Record<string, { samples: number; ms: number }> }
export interface LoopDelay { sample(): void; report(): LoopDelayReport; stop(): void }

/**
 * How late the main thread is to a timer due every `LOOP_SAMPLE_MS`, since this process started watching: each
 * sample's lateness is the time something else held the thread. Reports the total, the slowest sample, and the
 * count and total of samples at least 100 ms, 200 ms and 1 s late. Measurement only: nothing reads it to decide
 * anything. The timer does not keep the process alive.
 */
export function loopDelay(now: () => number = () => performance.now(), since = new Date().toISOString(), start: (sample: () => void) => () => void = repeat): LoopDelay {
    let last = now(), samples = 0, lateMS = 0, slowestMS = 0;
    const late = LATE_MS.map(atLeast => ({ atLeast, samples: 0, ms: 0 }));
    const sample = () => {
        const at = now(), delay = Math.max(0, at - last - LOOP_SAMPLE_MS);
        last = at; samples++; lateMS += delay;
        if (delay > slowestMS) slowestMS = delay;
        for (const band of late)
            if (delay >= band.atLeast) { band.samples++; band.ms += delay; }
    };
    const stop = start(sample), tenth = (value: number) => Math.round(value * 10) / 10;
    return { sample, stop,
        report: () => ({ since, sampleMS: LOOP_SAMPLE_MS, samples, lateMS: tenth(lateMS), slowestMS: tenth(slowestMS),
            late: Object.fromEntries(late.map(band => [`atLeast${band.atLeast}MS`, { samples: band.samples, ms: tenth(band.ms) }])) }) };
}

function repeat(sample: () => void): () => void {
    const timer = setInterval(sample, LOOP_SAMPLE_MS);
    timer.unref();
    return () => clearInterval(timer);
}
