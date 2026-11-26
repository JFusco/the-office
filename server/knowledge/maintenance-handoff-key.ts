import { learningDigest } from './learning-events';
import type { BlockerFollowup, MaintenanceRun } from '../../src/shared';

/** Marks a key as a maintenance run's stop; a key saved before stop keys is a bare digest of the follow-up's text. */
const PREFIX = 'maintenance-stop:';

/**
 * What a stopped maintenance run's Harper hand-off is about: the run's own stop, by the status and stage it stopped
 * in and when it ended. Both pumps take only queued runs, so a stopped run is never pumped again; a read-back adds a
 * step and rewrites `run.error` in its own words, and its only later status is `reconciled`, which is not handed off.
 * So one stop is one diagnosis, and a different prerequisite reaches Morgan through the run that replaces it, under
 * its own follow-up.
 */
export function maintenanceStopKey(run: Pick<MaintenanceRun, 'status' | 'stage' | 'endedAt'>): string {
    return `${PREFIX}${learningDigest([run.status, run.stage, run.endedAt])}`;
}

/**
 * Reads a key saved before stop keys as `stopKey`. Every key a maintenance follow-up saved came from its run's only
 * stop, so the hand-off it admitted covered that stop. Its text is not needed and may be redacted in the store. A
 * follow-up with no key is left to the first-admission check, and a stop key to the ordinary comparison.
 */
export function adoptLegacyKey(item: Pick<BlockerFollowup, 'handoffMaterialKey'>, stopKey: string): void {
    if (item.handoffMaterialKey !== undefined && !item.handoffMaterialKey.startsWith(PREFIX)) item.handoffMaterialKey = stopKey;
}
