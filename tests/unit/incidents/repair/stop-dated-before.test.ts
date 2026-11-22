import { expect, test } from 'vitest';
import { stopDatedBefore } from '../../../../server/incidents/repair/stop-dated-before';

const MARK = '2026-11-20T12:04:00.000Z';

test('a stop is before an instant when the project dated it at or before it', () => {
    expect(stopDatedBefore('2026-11-20T12:03:59.999Z', MARK)).toBe(true);
    expect(stopDatedBefore(MARK, MARK)).toBe(true);
    expect(stopDatedBefore('2026-11-20T12:04:00.001Z', MARK)).toBe(false);
});

test('a stop with no date, or a date or instant that cannot be read, says nothing', () => {
    for (const stoppedAt of [null, undefined, '', 't1']) expect(stopDatedBefore(stoppedAt, MARK), String(stoppedAt)).toBe(false);
    expect(stopDatedBefore('2026-11-20T12:00:00.000Z', '')).toBe(false);
    expect(stopDatedBefore('2026-11-20T12:00:00.000Z', 'not a time')).toBe(false);
});
