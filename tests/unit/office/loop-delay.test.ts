import { expect, test } from 'vitest';
import { LOOP_SAMPLE_MS, loopDelay } from '../../../server/office/loop-delay';

function watched() {
    let at = 0, stopped = false, tick = () => {};
    const loop = loopDelay(() => at, '2026-11-22T00:00:00.000Z', sample => { tick = sample; return () => { stopped = true; }; });
    return { loop, after: (ms: number) => { at += ms; tick(); }, stopped: () => stopped };
}

test('a sample on time adds nothing; a late one adds the time beyond the sample interval', () => {
    const { loop, after } = watched();
    after(LOOP_SAMPLE_MS); after(LOOP_SAMPLE_MS + 4.26); after(LOOP_SAMPLE_MS - 3);
    expect(loop.report()).toEqual({ since: '2026-11-22T00:00:00.000Z', sampleMS: LOOP_SAMPLE_MS, samples: 3, lateMS: 4.3, slowestMS: 4.3,
        late: { atLeast100MS: { samples: 0, ms: 0 }, atLeast200MS: { samples: 0, ms: 0 }, atLeast1000MS: { samples: 0, ms: 0 } } });
});

test('each late sample is counted in every band it reaches', () => {
    const { loop, after } = watched();
    for (const late of [99.9, 100, 250, 1200]) after(LOOP_SAMPLE_MS + late);
    expect(loop.report()).toMatchObject({ samples: 4, lateMS: 1649.9, slowestMS: 1200,
        late: { atLeast100MS: { samples: 3, ms: 1550 }, atLeast200MS: { samples: 2, ms: 1450 }, atLeast1000MS: { samples: 1, ms: 1200 } } });
});

test('stopping ends the sampling it started', () => {
    const { loop, stopped } = watched();
    loop.stop();
    expect(stopped()).toBe(true);
});

test('the default timer samples the real loop and does not keep the process alive', async () => {
    const loop = loopDelay();
    await new Promise(resolve => setTimeout(resolve, LOOP_SAMPLE_MS * 4));
    loop.stop();
    expect(loop.report().samples).toBeGreaterThan(0);
});
