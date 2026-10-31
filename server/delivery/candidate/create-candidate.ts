import { existsSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import type { command } from '../../process';
import type { Store } from '../../store';
import type { TicketJob } from '../../../src/shared';

type Execute = typeof command;

export function candidateSlug(title: string): string {
    return title.replace(/^\[[^\]]*\]\s*/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '') || 'change';
}

/** Project convention: `<repo>-worktrees/<n>-<slug>` on branch `codex/<n>-<slug>`. */
export function candidateIdentity(repo: string, issueNumber: number, title: string) {
    const name = `${issueNumber}-${candidateSlug(title)}`;
    return { branch: `codex/${name}`, worktree: resolve(dirname(repo), `${basename(repo)}-worktrees`, name) };
}

function repositoryOf(origin: string): string {
    return origin.trim().replace(/^https:\/\/github\.com\//, '').replace(/^git@github\.com:/, '').replace(/^ssh:\/\/git@github\.com\//, '').replace(/\.git$/, '').toLowerCase();
}

async function readCandidate(execute: Execute, worktree: string) {
    const read = async (...args: string[]) => (await execute('git', args, { cwd: worktree, timeout: 30000, readOnly: true })).trim();
    return { head: await read('rev-parse', 'HEAD'), branch: await read('branch', '--show-current'), dirty: await read('status', '--porcelain=v1', '--untracked-files=all') };
}

/**
 * Creates (or verifiably reuses) the isolated worktree for this job before Alex starts.
 * Never resets, adopts an unrelated path, or reuses a dirty tree.
 */
export async function createCandidate(store: Store, execute: Execute, job: TicketJob, issue: { number: number; title: string }): Promise<{ branch: string; worktree: string; base: string; reused: boolean }> {
    const repo = store.project.repo, target = store.project.target;
    if (job.worktree && job.branch && !existsSync(job.worktree) && !job.head) {
        // Intent was saved but the worktree was never created; no implementation exists to lose.
        Object.assign(job, { branch: '', worktree: '', candidateBase: undefined });
    }
    if (job.worktree && job.branch) {
        if (!existsSync(job.worktree))
            throw new Error(`Recorded candidate worktree ${job.worktree} is missing; reconcile before implementation`);
        const current = await readCandidate(execute, job.worktree);
        if (current.branch !== job.branch || current.dirty)
            throw new Error('Recorded candidate changed branch or has uncommitted changes; preserve it for reconciliation');
        if (job.candidateBase)
            await execute('git', ['merge-base', '--is-ancestor', job.candidateBase, current.head], { cwd: job.worktree, timeout: 30000, readOnly: true });
        return { branch: job.branch, worktree: job.worktree, base: job.candidateBase || '', reused: true };
    }
    const origin = await execute('git', ['remote', 'get-url', 'origin'], { cwd: repo, timeout: 30000, readOnly: true });
    if (repositoryOf(origin) !== store.project.repository.toLowerCase())
        throw new Error('Configured repository origin does not match this project');
    await execute('git', ['fetch', 'origin', target], { cwd: repo, timeout: 120000, readOnly: true });
    const base = (await execute('git', ['rev-parse', `refs/remotes/origin/${target}`], { cwd: repo, timeout: 30000, readOnly: true })).trim();
    if (!/^[a-f0-9]{40}$/.test(base))
        throw new Error('Fetched target identity is unavailable');
    const identity = candidateIdentity(repo, issue.number, issue.title);
    if (existsSync(identity.worktree))
        throw new Error(`Candidate path ${identity.worktree} already exists; the harness will not adopt it`);
    const existingRef = (await execute('git', ['for-each-ref', '--format=%(objectname)', `refs/heads/${identity.branch}`], { cwd: repo, timeout: 30000, readOnly: true })).trim();
    if (existingRef)
        throw new Error(`Branch ${identity.branch} already exists; the harness will not adopt it`);
    // Durable intent precedes the local write so a crash leaves a recognizable, reusable candidate.
    Object.assign(job, { branch: identity.branch, worktree: identity.worktree, candidateBase: base });
    store.save();
    await execute('git', ['worktree', 'add', '-b', identity.branch, identity.worktree, base], { cwd: repo, timeout: 120000 });
    const created = await readCandidate(execute, identity.worktree);
    if (created.head !== base || created.branch !== identity.branch || created.dirty)
        throw new Error('Created candidate read-back does not match the fetched target');
    store.emit('candidate-created', `${job.key}: worktree ${identity.worktree} on ${identity.branch} from ${target} ${base.slice(0, 7)}.`, 'developer', job.key);
    return { ...identity, base, reused: false };
}
