import { existsSync } from 'node:fs';
import type { CorrectionCheckout, ReleaseMarkerReturn } from '../../../src/contracts/release-marker';
import type { TicketJob } from '../../../src/shared';
import type { Store } from '../../store/store';
import { currentAssignment } from '../../workers/assignment-context';
import { sanitize } from '../../office/security';
import type { Execute } from './original-git';
import { correctionIdentity, pendingReturn } from './release-marker-returns';
import { blockOnReleaseMarker, ReleaseMarkerRefusal } from './release-marker-stop';

/** The original refusal evidence of the return, now as an interrupted correction with its checkout still to be read. */
export function interruptedCorrection(pending: ReleaseMarkerReturn, checkout: CorrectionCheckout = { state: 'outstanding' }, cause?: unknown): ReleaseMarkerRefusal {
    const commits = pending.offending.map(({ sha, paths, inventoryPaths }) => ({ sha, paths, inventoryPaths }));
    return new ReleaseMarkerRefusal({ reason: 'marked-package-change', disposition: 'interrupted-correction', commit: commits[0]?.sha,
        paths: [...new Set(commits.flatMap(c => c.paths))], inventoryPaths: [...new Set(commits.flatMap(c => c.inventoryPaths))], commits,
        ...(cause === undefined ? {} : { diagnostic: sanitize(String(cause).replace(/^Error:\s*/, '')).slice(0, 500) }),
        correction: { ...correctionIdentity(pending), checkout } });
}

const pendingOf = (job: TicketJob) => { try { return pendingReturn(job); } catch { return undefined; } };

/**
 * A bounded, read-only look at the recorded worktree: its symbolic branch, actual HEAD and cleanliness. A saved
 * mapping names the two tips to expect; only this read says which one is checked out. Nothing is rewritten or reset.
 */
export async function observeCorrectionCheckout(execute: Execute, pending: ReleaseMarkerReturn, now: Date): Promise<CorrectionCheckout> {
    const observedAt = now.toISOString();
    if (!pending.worktree || !existsSync(pending.worktree)) return { state: 'unreadable', diagnostic: `worktree ${pending.worktree || '(none)'} is missing`, observedAt };
    try {
        const read = async (...args: string[]) => (await execute('git', args, { cwd: pending.worktree, readOnly: true, timeout: 15_000 })).trim();
        const head = await read('rev-parse', 'HEAD'), branch = await read('branch', '--show-current'), clean = !await read('status', '--porcelain=v1', '--untracked-files=all');
        const state = head === pending.refusedHead ? 'refused-tip' : head === pending.correction?.mapping?.newHead ? 'mapped-tip' : 'other';
        return { state, head, branch, clean, observedAt };
    } catch (error) {
        return { state: 'unreadable', diagnostic: String(error).slice(0, 300), observedAt };
    }
}

/** Attach a checkout read in a short transaction, only while the same return, claim, mapping and stop still stand. */
async function attachCheckout(store: Store, execute: Execute, jobId: string): Promise<void> {
    const job = store.state.coordination?.jobs?.find(item => item.id === jobId), pending = job && pendingOf(job);
    if (!job || !pending || job.stop?.releaseMarker?.correction?.checkout?.state !== 'outstanding') return;
    const episode = job.stop.at, identity = JSON.stringify(correctionIdentity(pending));
    const checkout = await observeCorrectionCheckout(execute, pending, store.clock.now());
    store.transaction(() => {
        const current = store.state.coordination?.jobs?.find(item => item.id === jobId), still = current && pendingOf(current);
        const marker = current?.stop?.kind === 'release-marker' ? current.stop.releaseMarker : undefined;
        if (!current || !still || current.stop?.at !== episode || JSON.stringify(correctionIdentity(still)) !== identity || marker?.correction?.checkout?.state !== 'outstanding') return;
        marker.correction.checkout = checkout;
    });
}

/**
 * The step's own stop for a release-marker refusal, and for a dispatched correction it interrupted: blocked, with the
 * typed stop and detail, ahead of the generic paused or interrupted assignment. A correction this claim bound but never
 * dispatched is unbound, a typed refusal before dispatch included, so its return can still receive its first dispatch.
 */
export async function persistMarkerStop(delivery: { store: Store; execute: Execute }, job: TicketJob, error: unknown): Promise<void> {
    const { store } = delivery, now = store.clock.now();
    const pending = pendingOf(job), claim = currentAssignment()?.claim;
    // The pending return whose correction this claim bound.
    const own = pending && job.stage === 'implement' && claim && pending.correction?.claimId === claim.id ? pending : undefined;
    if (error instanceof ReleaseMarkerRefusal) {
        blockOnReleaseMarker(job, error, now);
        if (own && !own.correction?.dispatchedAt) delete own.correction;
        return;
    }
    if (!own) return;
    if (!own.correction?.dispatchedAt) { delete own.correction; return; }
    blockOnReleaseMarker(job, interruptedCorrection(own, { state: 'outstanding' }, error), now);
    store.save();
    await attachCheckout(store, delivery.execute, job.id).catch(() => undefined);
}

/**
 * Startup, inside the recovery transaction: a working implement job whose dispatched correction the service exit
 * interrupted is blocked with the same disposition before generic interruption, with its checkout read outstanding.
 * The pending record, prior accepted head, return count and checkout are kept as found.
 */
export function interruptCorrectionAtStartup(job: TicketJob, now: Date): boolean {
    const pending = pendingOf(job);
    if (job.status !== 'working' || job.stage !== 'implement' || !pending?.correction) return false;
    if (!pending.correction.dispatchedAt) { delete pending.correction; return false; }
    blockOnReleaseMarker(job, interruptedCorrection(pending), now);
    return true;
}

/** After the stores open and before dispatch starts: read each outstanding interrupted correction's checkout. */
export async function observeInterruptedCorrections(store: Store, execute: Execute): Promise<void> {
    for (const job of store.state.coordination?.jobs ?? [])
        if (job.stop?.kind === 'release-marker' && job.stop.releaseMarker?.correction?.checkout?.state === 'outstanding')
            await attachCheckout(store, execute, job.id).catch(() => undefined);
}
