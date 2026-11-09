import { existsSync, lstatSync, realpathSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** Remove only the recorded private repair clone, preserving the adopted remote branch and evidence. */
export async function removeAdoptedClone(store: Store, execute: typeof command, job: TicketJob, guard: () => void, tip: string) {
    const candidate = job.adoptedRepairCheckout!;
    const root = resolve(store.dataRoot, 'ticket-work', job.id), expected = resolve(root, `ci-${candidate.id}`, 'candidate');
    if (!tip || tip !== job.head || candidate.worktree !== expected || job.worktree !== expected || candidate.branch !== job.branch ||
        expected === resolve(store.project.repo)) throw new Error('Adopted clone cleanup identity changed; preserved');
    if (!existsSync(expected)) return { worktree: false, local: false, remote: false };
    if (lstatSync(expected).isSymbolicLink() || realpathSync(expected) !== resolve(realpathSync(root), `ci-${candidate.id}`, 'candidate'))
        throw new Error('Adopted clone cleanup path changed; preserved');
    await verifyRepairCandidate(store.project, { head: tip, branch: job.branch, worktree: expected }, execute);
    guard();
    // A final read protects new uncommitted work arriving during the earlier checks.
    await verifyRepairCandidate(store.project, { head: tip, branch: job.branch, worktree: expected }, execute);
    guard();
    rmSync(expected, { recursive: true });
    return { worktree: true, local: false, remote: false };
}
