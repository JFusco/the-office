import { expect, test } from 'vitest';
import { nextAttemptAt } from '../../../../server/delivery/attempts/attempt-backoff';

test('re-runs wait 30 seconds, 2 minutes and 5 minutes, then the allowance is used up', () => {
    const stopped = new Date('2026-11-16T12:00:00Z');
    expect([0, 1, 2, 3].map(n => nextAttemptAt(n, stopped)?.toISOString())).toEqual(['2026-11-16T12:00:30.000Z', '2026-11-16T12:02:00.000Z', '2026-11-16T12:05:00.000Z', undefined]);
});
