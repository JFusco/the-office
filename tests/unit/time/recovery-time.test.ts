import { expect, test } from 'vitest';
import { startMeasurement } from '../../../server/time/work-time';
import type { WorkTime } from '../../../src/shared';
const clock = { now: () => new Date('2026-10-29T22:00:00Z'), monotonic: () => 0 };
test.each(['implementation-readback', 'discovery-readback'])('%s records administrative effort for new workers', stage => {
    const work = { stage, startedAt: clock.now().toISOString(), elapsedMs: 0 } as WorkTime;
    startMeasurement(work, clock); expect(work.effortKind).toBe('administrative');
});
test('delivery research/review remains substantive and existing measured records are preserved', () => {
    const work = { stage: 'github-review', startedAt: clock.now().toISOString(), elapsedMs: 0 } as WorkTime;
    startMeasurement(work, clock); expect(work.effortKind).toBe('substantive');
    const prior = { stage: 'implementation-readback', effortKind: 'substantive', startedAt: clock.now().toISOString() } as WorkTime;
    startMeasurement(prior, clock); expect(prior.effortKind).toBe('substantive');
});
