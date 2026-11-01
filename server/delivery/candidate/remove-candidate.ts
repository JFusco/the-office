import { existsSync } from 'node:fs';
import { basename, dirname, resolve, sep } from 'node:path';
import { harnessEffect } from '../harness/effect';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

type Execute = typeof command;
export interface CandidateRemoval { worktree: boolean; local: boolean; remote: boolean; skipped?: string }

/** Only a candidate the Office created for this issue is removable: never an adopted PR branch or another checkout. */
function notOwned(store: Store, job: TicketJob): string {
    const repo = store.project.repo, worktrees = resolve(dirname(repo), `${basename(repo)}-worktrees`) + sep;
    // Discovery marks every PR-linked job existingPR, including the Office's own; only candidate creation records a base.
    if (!job.candidateBase)
        return 'the Office did not create this candidate';
    if (!job.branch.startsWith(`codex/${job.key.replace(/^GH-/, '')}-`))
        return `branch ${job.branch || '(none)'} is not this issue's Office branch`;
    if (job.worktree && !resolve(job.worktree).startsWith(worktrees))
        return `worktree ${job.worktree} is outside ${worktrees}`;
    // Discovery can swap in another PR's branch; the created pair is `codex/<name>` in `<repo>-worktrees/<name>`.
    if (!job.worktree || basename(job.worktree) !== job.branch.slice('codex/'.length))
        return `branch ${job.branch} is not the branch created with worktree ${job.worktree || '(none)'}`;
    return '';
}

/**
 * Removes the candidate this job recorded as its own: its worktree, its local branch and its
 * remote branch. Uncommitted work, a changed branch, an open PR from or into the branch, or (when
 * `tip` is given) any commit beyond the delivered head preserves everything and throws before any write.
 */
export async function removeCandidate(store: Store, execute: Execute, job: TicketJob, guard: () => void, tip = ''): Promise<CandidateRemoval> {
    const repo = store.project.repo, branch = job.branch, removed: CandidateRemoval = { worktree: false, local: false, remote: false };
    if (!branch && !job.worktree)
        return removed;
    const skipped = notOwned(store, job);
    if (skipped)
        return { ...removed, skipped };
    const git = (args: string[], write = false) => execute('git', args, { cwd: repo, timeout: 120000, readOnly: !write }).then(out => out.trim());
    const atTip = (sha: string, what: string) => { if (tip && sha !== tip) throw new Error(`${what} is at ${sha.slice(0, 7)}, not the delivered ${tip.slice(0, 7)}; preserved`); };
    const localRef = () => git(['for-each-ref', '--format=%(objectname)', `refs/heads/${branch}`]);
    const remoteSha = async () => (await git(['ls-remote', '--heads', 'origin', `refs/heads/${branch}`])).split(/\s/)[0] || '';
    // Every preservation check reads before the first write, so a refusal leaves the candidate whole.
    const present = !!job.worktree && existsSync(job.worktree);
    if (present) {
        const read = (...args: string[]) => execute('git', args, { cwd: job.worktree, timeout: 30000, readOnly: true }).then(out => out.trim());
        if (await read('branch', '--show-current') !== branch)
            throw new Error(`${job.worktree} is no longer on ${branch}; preserved`);
        if (await read('status', '--porcelain=v1', '--untracked-files=all'))
            throw new Error(`${job.worktree} has uncommitted changes; preserved`);
        atTip(await read('rev-parse', 'HEAD'), job.worktree);
    }
    const local = await localRef(), remote = await remoteSha();
    if (local)
        atTip(local, `Local branch ${branch}`);
    if (remote) {
        atTip(remote, `Remote branch ${branch}`);
        for (const side of ['--head', '--base'])
            if (JSON.parse(await execute('gh', ['pr', 'list', '--repo', store.project.repository, side, branch, '--state', 'open', '--json', 'number'], { cwd: repo, timeout: 60000, readOnly: true })).length)
                throw new Error(`Remote branch ${branch} has an open PR ${side === '--base' ? 'into it' : 'from it'}; preserved`);
    }
    if (present) {
        guard();
        await git(['worktree', 'remove', '--', job.worktree], true);
        if (existsSync(job.worktree))
            throw new Error(`${job.worktree} remains after removal`);
        removed.worktree = true;
    }
    else if (job.worktree) {
        // A worktree directory deleted outside Git leaves a stale registration that pins the branch.
        guard();
        await git(['worktree', 'prune'], true);
    }
    if (local) {
        guard();
        await git(['branch', '-D', branch], true);
        if (await localRef())
            throw new Error(`Local branch ${branch} remains after deletion`);
        removed.local = true;
    }
    // An earlier uncertain delete (including a `:retry-N` intent) is settled by read-back, even when the branch is already gone.
    const unsettled = store.db.prepare("SELECT 1 FROM effects WHERE id LIKE ? AND status IN ('dispatching','uncertain')").get(`harness:${job.id}:remove-remote:${branch}%`);
    if (remote || unsettled) {
        const absent = async () => await remoteSha() ? null : { deleted: true };
        await harnessEffect(store, job, { key: `remove-remote:${branch}`, operation: 'git-remote-branch-delete', target: `refs/heads/${branch}`, payload: { branch }, guard,
            dispatch: async () => { await git(['push', 'origin', `:refs/heads/${branch}`], true); return absent(); },
            readBack: absent });
        removed.remote = !!remote;
    }
    store.emit('candidate-removed', `${job.key}: removed ${[removed.worktree && 'worktree', removed.local && 'local branch', removed.remote && 'remote branch'].filter(Boolean).join(', ') || 'nothing (already clean)'} for ${branch}.`, 'pm', job.key);
    return removed;
}

