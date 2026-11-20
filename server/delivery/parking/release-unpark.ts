import { holdReason } from '../../office/project-holds';
import type { Execute } from '../board/project-graphql';
import { returnCardToPickup } from './return-to-pickup';
import { highestStableAtLeast } from './release-version';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

export const RELEASE_CHECK_MS = 6 * 60 * 60 * 1000, MAX_RELEASE_UNPARKS = 2;

const due = (job: TicketJob, now: Date) => job.status === 'blocked' && !!job.parked?.published && !!job.parked.release && (job.releaseUnparks || 0) < MAX_RELEASE_UNPARKS
    && (!job.parked.releaseCheckedAt || now.getTime() - Date.parse(job.parked.releaseCheckedAt) >= RELEASE_CHECK_MS);

/**
 * A job the harness parked on an npm release goes back to the pickup lane once a stable version at or above its
 * minimum is published; resumeParked then resumes it on a later poll. A condition already met at its first check
 * is not a future release, so it is dropped and the card stays in Block for Joe; each job unparks at most
 * MAX_RELEASE_UNPARKS times. Holds, human decisions and cards a person moved out of Block are never touched.
 * Failures are recorded and never stop the poll.
 */
export async function unparkReleasedWaits(store: Store, execute: Execute, jobs: TicketJob[], pickup: { enabled: boolean; status: string }, now: Date): Promise<string[]> {
    const moved: string[] = [];
    if (!pickup.enabled || !store.project.githubProject || store.state.paused || store.state.draining) return moved;
    for (const job of jobs.filter(candidate => due(candidate, now) && !holdReason(store.project, candidate.key))) {
        const parked = job.parked!, release = parked.release!, firstCheck = !parked.releaseBaselineAt;
        parked.releaseCheckedAt = now.toISOString();
        store.save();
        try {
            const raw = JSON.parse(await execute('npm', ['view', release.package, 'versions', '--json'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
            const found = highestStableAtLeast((Array.isArray(raw) ? raw : [raw]).map(String), release.minimum);
            // The baseline is the first successful read, so a failed check never counts as the wait having been observed.
            if (firstCheck) { parked.releaseBaselineAt = now.toISOString(); store.save(); }
            if (!found) continue;
            if (firstCheck) {
                delete parked.release;
                store.emit('release-wait-already-met', `${job.key}: ${release.package}@${found} was already published when the ticket parked; the card stays in Block for Joe.`, 'pm', job.key);
                store.save();
                continue;
            }
            parked.releaseFound = found;
            store.save();
            if (await returnToPickup(store, execute, job, pickup.status, found)) moved.push(job.key);
        }
        catch (error) {
            store.emit('release-wait-unavailable', `${job.key}: release check for ${release.package} failed: ${String(error)}`, 'pm', job.key);
        }
    }
    return moved;
}

async function returnToPickup(store: Store, execute: Execute, job: TicketJob, lane: string, found: string): Promise<boolean> {
    const parked = job.parked!, release = parked.release!;
    const returned = await returnCardToPickup(store, execute, job, lane, { slug: 'release', label: 'Release unpark',
        body: pickup => `${release.package}@${found} is published on npm, which meets this ticket's wait for a stable release at or above ${release.minimum}. The Office is moving the card back to ${pickup} to resume from ${parked.stage}.` });
    if (returned === null) return false;
    job.releaseUnparks = (job.releaseUnparks || 0) + 1;
    // One unpark per park: a card a person puts back in Block afterwards stays there for Joe.
    delete parked.release;
    store.emit('delivery-release-unparked', `${job.key}: ${release.package}@${found} is published; card moved back to ${returned}.`, 'pm', job.key);
    store.save();
    return true;
}
