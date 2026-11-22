import { expect, test, vi } from 'vitest';
import { LOOP_SAMPLE_MS, loopDelay } from '../../../server/office/loop-delay';

function histogram() {
    return {
        count: 100,
        mean: 26_860_000,
        percentile: vi.fn((p: number) => p === 50 ? 21_140_000 : 48_960_000),
        max: 62_240_000,
        enable: vi.fn(() => true),
        disable: vi.fn(() => true),
    };
}

test('the report converts histogram readings to milliseconds rounded to one decimal place', () => {
    const source = histogram();
    const since = '2026-11-22T00:00:00.000Z';
    const loop = loopDelay(source, since);
    expect(loop.report()).toEqual({
        since, resolutionMS: LOOP_SAMPLE_MS, count: 100,
        meanMS: 26.9, medianMS: 21.1, p99MS: 49, maxMS: 62.2,
    });
    expect(source.percentile.mock.calls).toEqual([[50], [99]]);
});

test('the report has numeric zero values before the first sample', () => {
    const source = { ...histogram(), count: 0, mean: NaN };
    const loop = loopDelay(source);
    expect(loop.report()).toMatchObject({ count: 0, meanMS: 0, medianMS: 0, p99MS: 0, maxMS: 0 });
    expect(source.percentile).not.toHaveBeenCalled();
});

test('starting and stopping enable and disable the histogram', () => {
    const source = histogram();
    const loop = loopDelay(source);
    expect(source.enable).toHaveBeenCalledOnce();
    expect(source.disable).not.toHaveBeenCalled();
    loop.stop();
    expect(source.disable).toHaveBeenCalledOnce();
});

test('the default monitor samples the real loop', async () => {
    const loop = loopDelay();
    try {
        await expect.poll(() => loop.report().count).toBeGreaterThan(0);
    } finally {
        loop.stop();
    }
});
