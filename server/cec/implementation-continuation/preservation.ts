import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { rootArtifact, ownedPath } from '../../store/readback-evidence';
import { nativeGitRead, patchArgs, sourceCopyMatches } from './candidate';
import { createHash } from 'node:crypto';
import type { Store } from '../../store/store';
import type { StageResult, Ticket } from '../../../src/shared';

/** Rechecked around the fresh writer. Original source and native failure records stay immutable. */
export async function verifyContinuationPreservation(store: Store, ticket: Ticket, result?: StageResult) {
    const binding = ticket.implementationContinuation;
    if (!binding) return;
    ownedPath(store, binding.proofPath);
    if (rootArtifact(store.dataRoot, binding.proofPath).sha256 !== binding.proofSha256) throw new Error('Saved source intent changed');
    const saved = JSON.parse(readFileSync(binding.proofPath, 'utf8'));
    if (saved.original.workerId !== binding.originalWorkerId || saved.original.originalDigest !== binding.originalDigest ||
        saved.original.patchSha256 !== binding.patchSha256 || saved.worktree !== ticket.worktree || saved.branch !== ticket.branch)
        throw new Error('Saved continuation source intent changed');
    for (const item of saved.artifacts) {
        if (rootArtifact(store.dataRoot, item.path).sha256 !== item.sha256) throw new Error('Original worker evidence changed; preserve it for reconciliation');
    }
    const git = async (cwd: string, args: string[]) => (await nativeGitRead(cwd, args)).toString('utf8').trim();
    const original = binding.oldWorktree;
    if (await git(original, ['rev-parse', 'HEAD']) !== binding.base || await git(original, ['symbolic-ref', '--short', 'HEAD']) !== binding.oldBranch ||
        !sourceCopyMatches(original, saved.files) || createHash('sha256').update(await nativeGitRead(original, patchArgs)).digest('hex') !== binding.patchSha256)
        throw new Error('Original partial source changed; no stage acceptance is permitted');
    if (result?.outcome === 'passed') {
        const checks = resolve(binding.checksRoot);
        if (result.worktree !== ticket.worktree || result.branch !== ticket.branch || result.commit !== await git(ticket.worktree, ['rev-parse', 'HEAD']) ||
            await git(ticket.worktree, ['symbolic-ref', '--short', 'HEAD']) !== ticket.branch ||
            !!await git(ticket.worktree, ['status', '--porcelain']) ||
            !result.evidence.some(e => e.kind === 'checks' && e.commit === result.commit && e.path === resolve(e.path) && e.path.startsWith(checks + '/') && !!rootArtifact(store.dataRoot, e.path)))
            throw new Error('New exact-candidate checks and commit are required; earlier failed checks cannot be reused');
    }
}
