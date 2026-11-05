import { expect, test } from 'vitest';
import { dailyReviewDate } from '../../../server/leadership/daily-review-schedule';

test.each([
  ['2026-10-30T20:59:00Z', '2026-10-29'],
  ['2026-10-30T21:00:00Z', '2026-10-30'],
  ['2026-10-31T03:59:00Z', '2026-10-30'],
  ['2026-10-31T04:00:00Z', undefined],
  ['2026-10-31T21:00:00Z', undefined],
  ['2026-11-01T22:00:00Z', undefined],
  ['2026-11-02T04:59:00Z', undefined],
  ['2026-11-02T21:59:00Z', '2026-10-30'],
  ['2026-11-02T22:00:00Z', '2026-11-02'],
])('Eastern weekday schedule at %s resolves to %s', (instant, expected) => {
  expect(dailyReviewDate(new Date(instant))).toBe(expected);
});
