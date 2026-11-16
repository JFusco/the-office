import { expect, test } from 'vitest';
import { confirmSetupStopCap, consecutiveSetupStops, SETUP_STOP_CAP } from '../../../../server/cec/qa/setup-stop-cap';

const HEAD = 'a'.repeat(40);
const stop = (n: number, extra: object = {}) => ({ outcome: 'blocked', commit: HEAD, blocker: `stop ${n}`, qa: { setup: { status: 'blocked', summary: `Browser unavailable (${n}).` } }, ...extra }) as any;
/** A retest whose current result and `earlier` archived results are given oldest first. */
function ticket(current: any, earlier: any[] = []) {
    return { key: 'CEC-900', stage: 'retest', commit: HEAD, results: { retest: current }, qaHistory: earlier.map(result => ({ stage: 'retest', result })) } as any;
}

test('setup stops are counted in a row on the current candidate, and the current result is not counted twice once archived', () => {
    expect(consecutiveSetupStops(ticket(stop(3), [stop(1), stop(2)]))).toBe(3);
    expect(consecutiveSetupStops(ticket(stop(3), [stop(1), stop(2), stop(3)]))).toBe(3);
    // A tested run, another candidate or another stage in between breaks the run of stops.
    expect(consecutiveSetupStops(ticket(stop(3), [stop(1), { outcome: 'failed', commit: HEAD, qa: { setup: { status: 'ready' } } }, stop(2)]))).toBe(2);
    expect(consecutiveSetupStops(ticket(stop(3), [stop(1, { commit: 'b'.repeat(40) }), stop(2)]))).toBe(2);
    const other = ticket(stop(3), [stop(1), stop(2)]); other.qaHistory[1].stage = 'qa';
    expect(consecutiveSetupStops(other)).toBe(2);
    expect(consecutiveSetupStops(ticket({ outcome: 'passed', commit: HEAD, qa: { setup: { status: 'ready' } } }, [stop(1), stop(2)]))).toBe(0);
    expect(consecutiveSetupStops({ ...ticket(stop(1)), stage: 'repair', results: { repair: stop(1) } })).toBe(0);
});

test('below the cap a resume runs; at the cap the first resume shows the reason and the second runs one more attempt', () => {
    const below = ticket(stop(2), [stop(1)]);
    expect(SETUP_STOP_CAP).toBe(3);
    expect(confirmSetupStopCap(below)).toBeNull();
    expect(below.qaSetupStopsConfirmed).toBeUndefined();
    const capped = ticket(stop(3), [stop(1), stop(2)]);
    expect(confirmSetupStopCap(capped)).toContain('stopped 3 times in a row');
    expect(capped.qaSetupStopsConfirmed).toBe(3);
    expect(confirmSetupStopCap(capped)).toBeNull();
    // The attempt that follows stops again: the count moved, so the next resume asks again.
    const again = ticket(stop(4), [stop(1), stop(2), stop(3)]); again.qaSetupStopsConfirmed = 3;
    expect(confirmSetupStopCap(again)).toContain('Browser unavailable (4).');
    expect(confirmSetupStopCap(again)).toBeNull();
});
