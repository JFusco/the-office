import { monitorEventLoopDelay, type ELDHistogram } from 'node:perf_hooks';

export const LOOP_SAMPLE_MS = 20;
export interface LoopDelayReport {
    since: string;
    resolutionMS: number;
    count: number;
    meanMS: number;
    medianMS: number;
    p99MS: number;
    maxMS: number;
}
export interface LoopDelay { report(): LoopDelayReport; stop(): void }
type DelayHistogram = Pick<ELDHistogram, 'enable' | 'disable' | 'count' | 'mean' | 'percentile' | 'max'>;

/**
 * Node's event-loop delay distribution since the monitor started. A sample is the time between two firings of a
 * timer due every `LOOP_SAMPLE_MS`, so it reads about `resolutionMS` when nothing holds the main thread and the
 * excess is the time something did. Measurement only: nothing reads it to decide anything.
 */
export function loopDelay(
    histogram: DelayHistogram = monitorEventLoopDelay({ resolution: LOOP_SAMPLE_MS }),
    since = new Date().toISOString(),
): LoopDelay {
    histogram.enable();
    const toMS = (ns: number) => Math.round(ns / 100_000) / 10;
    return {
        stop() { histogram.disable(); },
        report() {
            const count = histogram.count;
            const metadata = { since, resolutionMS: LOOP_SAMPLE_MS, count };
            if (count === 0)
                return { ...metadata, meanMS: 0, medianMS: 0, p99MS: 0, maxMS: 0 };
            return {
                ...metadata,
                meanMS: toMS(histogram.mean),
                medianMS: toMS(histogram.percentile(50)),
                p99MS: toMS(histogram.percentile(99)),
                maxMS: toMS(histogram.max),
            };
        },
    };
}
