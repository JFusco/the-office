import { realpathSync, readFileSync } from 'node:fs';
import { resolve, relative, isAbsolute, basename, dirname } from 'node:path';
import { ownedPath } from '../../store/readback-evidence';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { installDependencies } from '../candidate/install-dependencies';
import { assertMetadataBinding } from './metadata-context';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import type { PRMetadataRepair } from '../../../src/contracts/pr-metadata';

/** A stored head is not a validation workspace; never fall back to the Office or project root. */
export async function metadataWorkspace(delivery: GitHubDelivery, job: TicketJob, install = false, admission?: PRMetadataRepair): Promise<string> {
    const guard = () => assertMetadataBinding(delivery, job, admission || job.prMetadataRepair, admission ? 'admission' : 'retained');
    guard();
    const { store, execute } = delivery, root = realpathSync(resolve(store.dataRoot, 'ticket-work', job.id));
    if (!job.worktree || !isAbsolute(job.worktree)) throw new Error('Owned exact-head metadata workspace is required');
    const cwd = realpathSync(job.worktree), within = relative(root, cwd);
    const conventional = job.branch.startsWith('codex/') && /^\d+-[a-z0-9-]+$/.test(job.branch.slice(6)) &&
        job.branch.slice(6).startsWith(`${Number(job.key.slice(3))}-`) &&
        cwd === resolve(realpathSync(dirname(store.project.repo)), `${basename(store.project.repo)}-worktrees`, job.branch.slice(6));
    if ((!within || within.startsWith('..') || isAbsolute(within)) && !conventional || cwd === realpathSync(store.project.repo))
        throw new Error('Metadata validation cannot use an unowned or root workspace');
    if (!conventional) ownedPath(store, resolve(job.worktree, 'package.json'));
    await verifyRepairCandidate(store.project, job, execute); guard();
    const pkg = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf8'));
    const version = /^pnpm@(\d+\.\d+\.\d+)(?:\+.*)?$/.exec(pkg.packageManager || '')?.[1];
    if (!version || (await execute('pnpm', ['--version'], { cwd, timeout: 30000, readOnly: true })).trim() !== version)
        throw new Error('Metadata validation needs the exact declared package manager');
    if (install && await installDependencies(execute, cwd, { timeout: 5 * 60000 }) !== 'installed')
        throw new Error('Metadata validation needs installed locked dependencies');
    guard();
    return cwd;
}

