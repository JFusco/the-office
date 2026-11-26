import { randomUUID } from 'node:crypto';
import { expect, test } from 'vitest';
import { EVENT_ID } from '../../../server/incidents/record-event';
import { RUNNER_DEFAULTS, type RunnerLimits } from '../../../server/overseer/config';
import { FailureEvent } from '../../../server/overseer/failure-journal';
import type { HealthSample, Outage } from '../../../server/overseer/runner-state';
import { afterHealthFailure, afterHealthSuccess } from '../../../server/overseer/service-down';
import { HEALTH } from './runner-world';

const minute = 60_000, start = Date.parse('2026-11-25T12:00:00.000Z');
const at = (minutes: number) => new Date(start + minutes * minute);
const cached: HealthSample = { ...HEALTH, at: '2026-11-25T11:58:00.000Z' };

function fail(outage: Outage | null, minutes: number, limits: RunnerLimits = RUNNER_DEFAULTS, pass = randomUUID()) {
    return afterHealthFailure(outage, { pass, now: at(minutes), reason: 'fetch failed (ECONNREFUSED)', cached }, limits);
}

test('the first failure opens an outage named after its pass and journals nothing', () => {
    const pass = randomUUID(), { next, event } = fail(null, 0, RUNNER_DEFAULTS, pass);
    expect(next).toEqual({ episode: pass, since: at(0).toISOString(), lastFailureAt: at(0).toISOString(), failures: 1, reason: 'fetch failed (ECONNREFUSED)', journaled: false });
    expect(event).toBeNull();
});

test('an outage is journaled once it has lasted five minutes over two passes, both inclusive, and only once', () => {
    let { next } = fail(null, 0);
    ({ next } = fail(next, 2));
    expect(fail(next, 4.99).event).toBeNull();
    const down = fail(next, 5);
    expect(down.event).toMatchObject({ kind: 'service-down', id: `overseer:service-down:${next.episode}`, episode: next.episode });
    expect(FailureEvent.parse(down.event)).toEqual(down.event);
    expect(down.event!.evidence).toEqual({ since: at(0).toISOString(), failures: 3, cachedHealthAt: cached.at, serviceInstanceId: 'service-1', loadedHash: 'a'.repeat(64) });
    expect(down.next.journaled).toBe(true);
    expect(fail(down.next, 30).event).toBeNull();
});

test('the elapsed time and the pass count are each required', () => {
    // Time alone: one pass is enough, so only the elapsed time can hold it back.
    const timed = { ...RUNNER_DEFAULTS, serviceDownAfterFailures: 1 };
    expect(fail(null, 0, timed).event).toBeNull();
    expect(fail(fail(null, 0, timed).next, 5, timed).event).not.toBeNull();
    // Count alone: no time is needed, so only the pass count can hold it back.
    const counted = { ...RUNNER_DEFAULTS, serviceDownAfterMs: 0 };
    expect(fail(null, 0, counted).event).toBeNull();
    expect(fail(fail(null, 0, counted).next, 0, counted).event).not.toBeNull();
});

test('the Office answering again restores a journaled outage once, and only notes a short gap', () => {
    const health = { ...HEALTH, at: at(9).toISOString(), serviceInstanceId: 'service-2' };
    let { next } = fail(null, 0);
    expect(afterHealthSuccess(next, { now: at(1), health })).toEqual({ event: null, note: expect.stringContaining('too short to count as an outage') });
    ({ next } = fail(next, 6));
    const { event } = afterHealthSuccess(next, { now: at(9), health });
    expect(event).toMatchObject({ kind: 'service-restored', id: `overseer:service-restored:${next.episode}`, evidence: { serviceInstanceId: 'service-2', failures: 2 } });
    expect(FailureEvent.parse(event)).toEqual(event);
    expect(afterHealthSuccess(null, { now: at(9), health })).toEqual({ event: null, note: null });
});

test('two outages that begin at the same moment have different IDs, both Office event IDs', () => {
    const quick = { ...RUNNER_DEFAULTS, serviceDownAfterMs: 0, serviceDownAfterFailures: 1 };
    const a = fail(null, 0, quick).event!, b = fail(null, 0, quick).event!;
    expect(a.id).not.toBe(b.id);
    for (const id of [a.id, b.id]) expect(id).toMatch(EVENT_ID);
});

test('a credential in the failure text is removed from the event', () => {
    const quick = { ...RUNNER_DEFAULTS, serviceDownAfterMs: 0, serviceDownAfterFailures: 1 };
    const { event } = afterHealthFailure(null, { pass: randomUUID(), now: at(0), reason: 'failed with token ghp_0123456789abcdefghijABCDEFGHIJ012345', cached: null }, quick);
    expect(event!.detail).not.toContain('ghp_0123456789');
    expect(event!.evidence).toMatchObject({ cachedHealthAt: null, serviceInstanceId: null });
});
