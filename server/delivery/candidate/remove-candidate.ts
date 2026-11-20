import { removeAdoptedClone } from './remove-adopted-clone';
import { maintenanceCandidate } from './maintenance-candidate';
import { existsSync } from 'node:fs';
import { lstatSync } from 'node:fs';
import { moveAside, moveBack, purgeRemoved } from './move-aside';
import { basename, dirname, resolve, sep } from 'node:path';
import { harnessEffect } from '../harness/effect';
import { interruptedRemoval } from './interrupted-removal';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import { likePrefix } from '../../store/like-prefix';
import type { TicketJob } from '../../../src/shared';

type Execute = typeof command;
export interface CandidateRemoval { worktree: boolean; local: boolean; remote: boolean; skipped?: string; /** The candidate was one a maintenance run created (`maintenance-candidate.ts`). */ created?: boolean }

/** Only a candidate the Office created for this issue is removable: never an adopted PR branch or another checkout. */
function notOwned(store: Store, job: TicketJob): string {
    const repo = store.project.repo, worktrees = resolve(dirname(repo), `${basename(repo)}-worktrees`) + sep;
    // Discovery marks every PR-linked job existingPR, including the Office's own; only candidate creation records a base.
    if (!job.candidateBase)
        return 'the Office did not create this candidate';
    if (!job.branch.startsWith(`codex/${job.key.replace(/^GH-/, '')}-`))
        return `branch ${job.branch || '(none)'} is not this issue's Office branch`;
    if (job.worktree && resolve(dirname(resolve(job.worktree))) + sep !== worktrees)
        return `worktree ${job.worktree} is not directly inside ${worktrees}`;
    // Discovery can swap in another PR's branch; the created pair is `codex/<name>` in `<repo>-worktrees/<name>`.
    if (!job.worktree || basename(job.worktree) !== job.branch.slice('codex/'.length))
        return `branch ${job.branch} is not the branch created with worktree ${job.worktree || '(none)'}`;
    return '';
}

/**
 * Removes the candidate this job recorded as its own: its worktree, its local branch and its
 * remote branch. Uncommitted work, a changed branch, an open PR from or into the branch, or (when
 * `tip` is given) any commit beyond the delivered head preserves everything and throws before any write.
 * A candidate a completed maintenance run created for this issue is the Office's own too: after the
 * job's private repair clone, if it has one, the run's worktree and branches are removed the same way.
 */
export async function removeCandidate(store: Store, execute: Execute, job: TicketJob, guard: () => void, tip = ''): Promise<CandidateRemoval> {
    const removed: CandidateRemoval = { worktree: false, local: false, remote: false };
    if (!job.branch && !job.worktree)
        return removed;
    const created = maintenanceCandidate(store, job);
    if (job.adoptedRepairCheckout) {
        const clone = await removeAdoptedClone(store, execute, job, guard, tip);
        if (!created) return clone;
        const rest = await removeOwned(store, execute, job, created, guard, tip, true);
        return { worktree: clone.worktree || rest.worktree, local: rest.local, remote: rest.remote, created: true };
    }
    if (created) return { ...await removeOwned(store, execute, job, created, guard, tip, true), created: true };
    const skipped = notOwned(store, job);
    if (skipped)
        return { ...removed, skipped };
    return removeOwned(store, execute, job, job.worktree, guard, tip, false);
}

/**
 * Removes one Office-owned worktree and its branch. `behind` is for a maintenance run's own worktree and
 * local branch, which a later repair in the job's private clone leaves behind the delivered head: they may
 * be at it or an ancestor of it, never ahead or diverged. The remote branch is always at the delivered head.
 */
async function removeOwned(store: Store, execute: Execute, job: TicketJob, worktree: string, guard: () => void, tip: string, behind: boolean): Promise<CandidateRemoval> {
    const repo = store.project.repo, branch = job.branch, removed: CandidateRemoval = { worktree: false, local: false, remote: false };
    const git = (args: string[], write = false) => execute('git', args, { cwd: repo, timeout: 120000, readOnly: !write }).then(out => out.trim());
    const atTip = (sha: string, what: string) => { if (tip && sha !== tip) throw new Error(`${what} is at ${sha.slice(0, 7)}, not the delivered ${tip.slice(0, 7)}; preserved`); };
    const localRef = () => git(['for-each-ref', '--format=%(objectname)', `refs/heads/${branch}`]);
    const remoteSha = async () => (await git(['ls-remote', '--heads', 'origin', `refs/heads/${branch}`])).split(/\s/)[0] || '';
    // Every preservation check reads before the first write, so a refusal leaves the candidate whole.
    const present = !!worktree && existsSync(worktree);
    // Nothing of its own beyond the delivered head: at it, or (for a maintenance run's copy) an ancestor of it.
    const delivered = async (sha: string, what: string) => {
        if (!tip || sha === tip) return;
        if (!behind) atTip(sha, what);
        // The delivered head may never have been fetched here; the read below needs the object.
        await git(['fetch', '--quiet', 'origin', tip], true).catch(() => undefined);
        await git(['merge-base', '--is-ancestor', sha, tip]).catch(() => { throw new Error(`${what} is at ${sha.slice(0, 7)}, which is not in the delivered ${tip.slice(0, 7)}; preserved`); });
    };
    let interrupted = false;
    if (present) {
        const read = (...args: string[]) => execute('git', args, { cwd: worktree, timeout: 30000, readOnly: true }).then(out => out.trim());
        if (await read('branch', '--show-current') !== branch)
            throw new Error(`${worktree} is no longer on ${branch}; preserved`);
        // Untrimmed: porcelain status columns are significant.
        const status = await execute('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: worktree, timeout: 30000, readOnly: true });
        interrupted = interruptedRemoval(status);
        if (status.trim() && !interrupted)
            throw new Error(`${worktree} has uncommitted changes; preserved`);
        await delivered(await read('rev-parse', 'HEAD'), worktree);
    }
    const local = await localRef(), remote = await remoteSha();
    if (local)
        await delivered(local, `Local branch ${branch}`);
    if (remote) {
        atTip(remote, `Remote branch ${branch}`);
        for (const side of ['--head', '--base'])
            if (JSON.parse(await execute('gh', ['pr', 'list', '--repo', store.project.repository, side, branch, '--state', 'open', '--json', 'number'], { cwd: repo, timeout: 60000, readOnly: true })).length)
                throw new Error(`Remote branch ${branch} has an open PR ${side === '--base' ? 'into it' : 'from it'}; preserved`);
    }
    if (present) {
        guard();
        // Re-read just before acting: anything written during the network checks above is real work.
        const now = await execute('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: worktree, timeout: 30000, readOnly: true });
        if (now.trim() && !(interrupted && interruptedRemoval(now)))
            throw new Error(`${worktree} changed during cleanup; preserved`);
        const registration = (await git(['worktree', 'list', '--porcelain'])).split('\n\n').find(block => block.split('\n')[0] === `worktree ${worktree}`) || '';
        if (/^locked/m.test(registration))
            throw new Error(`${worktree} is locked; preserved`);
        if (lstatSync(worktree).isSymbolicLink() || existsSync(resolve(worktree, '.gitmodules')))
            // Git's own removal handles submodules and linked trees; it refuses anything it would lose.
            await execute('git', ['worktree', 'remove', ...(interrupted ? ['--force'] : []), '--', worktree], { cwd: repo, timeout: 10 * 60 * 1000 });
        else {
            // Deleting a worktree's dependencies can take minutes; set it aside instantly, unregister it, then delete in the background.
            const aside = moveAside(worktree);
            await git(['worktree', 'prune'], true);
            if ((await git(['worktree', 'list', '--porcelain'])).split('\n').some(line => line === `worktree ${worktree}`)) {
                moveBack(aside, worktree);
                throw new Error(`${worktree} stayed registered after it was set aside; restored in place`);
            }
            purgeRemoved(execute, repo);
        }
        if (existsSync(worktree))
            throw new Error(`${worktree} remains after removal`);
        removed.worktree = true;
    }
    else if (worktree) {
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
    const unsettled = store.db.prepare("SELECT 1 FROM effects WHERE id LIKE ? ESCAPE '\\' AND status IN ('dispatching','uncertain')").get(likePrefix(`harness:${job.id}:remove-remote:${branch}`));
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

