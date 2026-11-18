import type { command } from '../../workers/process';

export interface PublishedPR { number: number; headSha: string; mergeCommit: string }

const SHA = /^[a-f0-9]{40}$/;

/**
 * True when git itself shows every published pull request merged and cleaned up: its recorded merge
 * commit is on the remote target branch, and no remote branch, local branch or worktree still sits
 * at its head. Read-only. Anything unreadable or unexpected is false, never an assumption.
 */
export async function publishedWorkCleanedUp(execute: typeof command, repo: string, target: string, prs: readonly PublishedPR[]): Promise<boolean> {
    if (!prs.length || prs.some(pr => !SHA.test(pr.headSha) || !SHA.test(pr.mergeCommit))) return false;
    const git = (args: string[]) => execute('git', args, { cwd: repo, timeout: 30000, readOnly: true });
    try {
        const remote = new Map((await git(['ls-remote', '--heads', 'origin'])).split('\n').filter(Boolean).map(line => {
            const [sha, ref] = line.split('\t');
            return [ref, sha] as const;
        }));
        const targetHead = remote.get(`refs/heads/${target}`);
        if (!targetHead || !SHA.test(targetHead)) return false;
        const worktrees = await git(['worktree', 'list', '--porcelain']);
        for (const pr of prs) {
            if ([...remote.values()].includes(pr.headSha)) return false;
            if ((await git(['for-each-ref', '--points-at', pr.headSha, '--format=%(refname)', 'refs/heads'])).trim()) return false;
            if (worktrees.split('\n').includes(`HEAD ${pr.headSha}`)) return false;
            // Exits non-zero, and so throws, when the merge commit is not on the target branch or is unknown here.
            await git(['merge-base', '--is-ancestor', pr.mergeCommit, targetHead]);
        }
        return true;
    } catch { return false; }
}
