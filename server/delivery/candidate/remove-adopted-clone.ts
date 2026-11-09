import { lstatSync, realpathSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** Remove only the recorded private repair clone, preserving the adopted remote branch and evidence. */
export async function removeAdoptedClone(store: Store, execute: typeof command, job: TicketJob, guard: () => void, tip: string) {
    const candidate = job.adoptedRepairCheckout!;
    const root = resolve(store.dataRoot, 'ticket-work', job.id), expected = resolve(root, `ci-${candidate.id}`, 'candidate');
    if (candidate.worktree && candidate.worktree !== expected || expected === resolve(store.project.repo))
        throw new Error('Adopted clone cleanup identity changed; preserved');
    const entry = lstatSync(expected, { throwIfNoEntry: false });
    if (!entry) return { worktree: false, local: false, remote: false };
    const handedOff = !!job.worktree;
    if (candidate.worktree !== expected || handedOff && (!tip || tip !== job.head || job.worktree !== expected || candidate.branch !== job.branch))
        throw new Error('Adopted clone cleanup identity changed; preserved');
    if (entry.isSymbolicLink() || realpathSync(expected) !== resolve(realpathSync(root), `ci-${candidate.id}`, 'candidate'))
        throw new Error('Adopted clone cleanup path changed; preserved');
    // A never-handed-off clone has no developer changes: only its original clean head is removable.
    const removal = { head: handedOff ? tip : candidate.head, branch: candidate.branch, worktree: expected };
    await verifyRepairCandidate(store.project, removal, execute);
    guard();
    // A final read protects new uncommitted work arriving during the earlier checks.
    await verifyRepairCandidate(store.project, removal, execute);
    guard();
    rmSync(expected, { recursive: true });
    return { worktree: true, local: false, remote: false };
}
