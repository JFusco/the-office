import { sanitize } from '../office/security';
import type { RunnerLimits } from './config';
import type { FailureEvent } from './failure-journal';
import type { HealthSample, Outage } from './runner-state';

/**
 * How an Office that does not answer becomes an outage, one health reading per pass. Pure: the
 * pass journals the event and saves the outage (see pass.ts).
 */

type Thresholds = Pick<RunnerLimits, 'serviceDownAfterMs' | 'serviceDownAfterFailures'>;
const bounded = (text: string) => sanitize(text).slice(0, 500);

/**
 * A failed health reading. The first opens an outage named after its pass; later ones count.
 * Once the outage has lasted `serviceDownAfterMs` and `serviceDownAfterFailures` passes, both
 * inclusive, and has not been journaled, it yields its one `service-down` event. The evidence is
 * the cached health reading, with its time, never presented as current.
 */
export function afterHealthFailure(outage: Outage | null, reading: { pass: string; now: Date; reason: string; cached: HealthSample | null }, limits: Thresholds): { next: Outage; event: FailureEvent | null } {
    const at = reading.now.toISOString(), reason = bounded(reading.reason);
    const next: Outage = outage
        ? { ...outage, failures: outage.failures + 1, lastFailureAt: at, reason }
        : { episode: reading.pass, since: at, lastFailureAt: at, failures: 1, reason, journaled: false };
    const long = reading.now.getTime() - Date.parse(next.since) >= limits.serviceDownAfterMs && next.failures >= limits.serviceDownAfterFailures;
    if (next.journaled || !long) return { next, event: null };
    const cached = reading.cached;
    return {
        next: { ...next, journaled: true },
        event: {
            version: 1, id: `overseer:service-down:${next.episode}`, kind: 'service-down', at, episode: next.episode,
            detail: bounded(`The Office has not answered /api/health since ${next.since} (${next.failures} passes): ${reason}`),
            evidence: { since: next.since, failures: next.failures, cachedHealthAt: cached?.at ?? null, serviceInstanceId: cached?.serviceInstanceId ?? null, loadedHash: cached?.loadedHash ?? null },
        },
    };
}

/**
 * A successful health reading closes any outage. A journaled outage yields its one
 * `service-restored` event; a shorter gap is only noted.
 */
export function afterHealthSuccess(outage: Outage | null, reading: { now: Date; health: HealthSample }): { event: FailureEvent | null; note: string | null } {
    if (!outage) return { event: null, note: null };
    const at = reading.now.toISOString();
    if (!outage.journaled) return { event: null, note: `The Office answered again after ${outage.failures} failed pass(es) since ${outage.since}; too short to count as an outage` };
    return {
        note: `The Office answered again after an outage since ${outage.since}`,
        event: {
            version: 1, id: `overseer:service-restored:${outage.episode}`, kind: 'service-restored', at, episode: outage.episode,
            detail: bounded(`The Office answered /api/health again after ${outage.failures} failed passes since ${outage.since}`),
            evidence: { since: outage.since, failures: outage.failures, serviceInstanceId: reading.health.serviceInstanceId, loadedHash: reading.health.loadedHash },
        },
    };
}
