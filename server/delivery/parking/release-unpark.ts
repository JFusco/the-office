import { HOLDS } from '../../office/config';
import { harnessEffect } from '../harness/effect';
import { resolveLane } from '../board/move-lane';
import { cardStatus, projectCards, setCardStatus, statusField, type Execute } from '../board/project-graphql';
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
    for (const job of jobs.filter(candidate => due(candidate, now) && !HOLDS[candidate.key])) {
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

/** Whether any attempt of this lane write (including `:retry-n` ids after a rejected preflight) awaits read-back. */
function unreadLaneWrite(store: Store, base: string): boolean {
    for (let attempt = 0; ; attempt++) {
        const intent = store.getEffect(attempt ? `${base}:retry-${attempt}` : base);
        if (!intent) return false;
        if (['dispatching', 'uncertain'].includes(intent.status)) return true;
    }
}

async function returnToPickup(store: Store, execute: Execute, job: TicketJob, lane: string, found: string): Promise<boolean> {
    const parked = job.parked!, release = parked.release!, repository = store.project.repository, issueNumber = Number(job.key.slice(3)), attempt = job.steps.length;
    const field = await statusField(store, execute), block = resolveLane(field, 'Block');
    const pickup = field.options.filter(option => option.name.trim().toLowerCase() === lane.trim().toLowerCase());
    if (pickup.length !== 1) throw new Error(`Project board needs exactly one "${lane}" Status option; found ${pickup.length}`);
    const card = (await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number: issueNumber }]))[0];
    if (!card) throw new Error('Issue has no card on its configured board');
    const guard = async () => {
        if (store.state.paused || store.state.draining || HOLDS[job.key] || job.status !== 'blocked' || !job.parked?.published)
            throw new Error('Release unpark stopped: the parked job changed');
        if (await cardStatus(store, execute, card.id, field.fieldId) !== block.id)
            throw new Error('Release unpark stopped: the card left Block');
    };
    // A lane write whose outcome was never read back is reconciled by reading, whatever lane the card shows now.
    const reconciling = unreadLaneWrite(store, `harness:${job.id}:release-lane:${attempt}`);
    if (!reconciling && await cardStatus(store, execute, card.id, field.fieldId) !== block.id) return false;
    const marker = `Office release ${job.id}:${attempt}`;
    const findComment = async () => {
        const pages = JSON.parse(await execute('gh', ['api', `repos/${repository}/issues/${issueNumber}/comments?per_page=100`, '--paginate', '--slurp'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
        const comment = pages.flat().find((item: any) => item.body?.includes(marker));
        return comment ? { id: comment.id as number, url: comment.html_url as string } : null;
    };
    const body = `${marker}: ${release.package}@${found} is published on npm, which meets this ticket's wait for a stable release at or above ${release.minimum}. The Office is moving the card back to ${pickup[0].name} to resume from ${parked.stage}.`;
    if (!reconciling && !await findComment())
        await harnessEffect(store, job, { key: `release-comment:${attempt}`, operation: 'github-issue-comment', target: `https://github.com/${repository}/issues/${issueNumber}`, payload: { marker }, guard,
            dispatch: async () => { await execute('gh', ['api', `repos/${repository}/issues/${issueNumber}/comments`, '-f', `body=${body}`], { cwd: store.project.repo, timeout: 60000 }); return findComment(); },
            readBack: findComment });
    const readLane = async () => await cardStatus(store, execute, card.id, field.fieldId) === pickup[0].id ? { lane: pickup[0].name } : null;
    await harnessEffect(store, job, { key: `release-lane:${attempt}`, operation: 'github-project-status', target: `${field.projectId}:${card.id}`, payload: { option: pickup[0].id }, guard,
        dispatch: async () => { await setCardStatus(store, execute, field.projectId, card.id, field.fieldId, pickup[0].id); return readLane(); },
        readBack: readLane });
    job.releaseUnparks = (job.releaseUnparks || 0) + 1;
    // One unpark per park: a card a person puts back in Block afterwards stays there for Joe.
    delete parked.release;
    store.emit('delivery-release-unparked', `${job.key}: ${release.package}@${found} is published; card moved back to ${pickup[0].name}.`, 'pm', job.key);
    store.save();
    return true;
}
