import { expect, test } from 'vitest';
import { storeTimings } from '../../../server/store/store-timings';
import { timedStep } from '../../../server/scheduling/step-timings';

function clocked() { let at = 0; return { timings: storeTimings(() => at, '2026-11-22T00:00:00.000Z'), pass: (ms: number) => { at += ms; } }; }

test('a step is timed under its name and its result passes through', () => {
    const { timings, pass } = clocked();
    expect(timedStep(timings, 'pump: blocker follow-ups', () => { pass(12); return 'done'; })).toBe('done');
    timedStep(timings, 'pump: blocker follow-ups', () => pass(30));
    expect(timings.report().timings).toEqual({ 'pump: blocker follow-ups': { calls: 2, ms: 42, slowestMS: 30, chars: 0 } });
});

test('a step that returns a promise is timed up to its first await, and the same promise is returned', async () => {
    const { timings, pass } = clocked();
    const work = async () => { pass(5); await Promise.resolve(); pass(400); return 7; };
    const pending = timedStep(timings, 'tick: session refresh (start)', work);
    expect(timings.report().timings['tick: session refresh (start)']).toEqual({ calls: 1, ms: 5, slowestMS: 5, chars: 0 });
    expect(await pending).toBe(7);
    expect(timings.report().timings['tick: session refresh (start)'].ms).toBe(5);
});

test('a step that throws is timed and its error reaches the caller unchanged', () => {
    const { timings, pass } = clocked(), failure = new Error('malformed round');
    expect(() => timedStep(timings, 'pump: question events', () => { pass(3); throw failure; })).toThrow(failure);
    expect(timings.report().timings['pump: question events'].calls).toBe(1);
});

test('with no timings the step still runs', () => {
    expect(timedStep(undefined, 'pump: stopping claims', () => 'ran')).toBe('ran');
});
