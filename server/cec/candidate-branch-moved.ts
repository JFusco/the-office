import type { Ticket } from '../../src/shared';
import type { Store } from '../store/store';
import { command } from '../workers/process';

/**
 * A competing writer shown by fact: the candidate's remote branch holds a commit the Office's own
 * worktree does not contain. Returns the reason, or '' when the branch is unpublished or every
 * remote commit is already in the worktree (including the Office's own unaccepted push). An
 * unreadable remote or worktree is missing context, not a competing writer.
 */
export async function candidateBranchMoved(store: Store, ticket: Pick<Ticket, 'branch' | 'worktree'>, execute = command): Promise<string> {
    if (!ticket.branch || !ticket.worktree) return '';
    const git = async (cwd: string, args: string[], timeout: number) => (await execute('git', args, { cwd, timeout, readOnly: true })).trim();
    let remote: string, head: string;
    try {
        remote = (await git(store.project.repo, ['ls-remote', 'origin', `refs/heads/${ticket.branch}`], 60000)).split(/\s+/)[0] || '';
        head = await git(ticket.worktree, ['rev-parse', 'HEAD'], 30000);
    }
    catch { return ''; }
    if (!/^[a-f0-9]{40}$/.test(remote) || !/^[a-f0-9]{40}$/.test(head) || remote === head) return '';
    const moved = `Branch ${ticket.branch} on the remote is at ${remote.slice(0, 10)}, which the Office worktree (${head.slice(0, 10)}) does not contain. Another writer pushed to it; reconcile before resuming.`;
    // Git reports a commit the worktree does not have with exit 128; any other failure is missing context.
    try { await git(ticket.worktree, ['cat-file', '-e', `${remote}^{commit}`], 30000); }
    catch (error) { return /\bexited 128\b/.test(String(error)) ? moved : ''; }
    try { await git(ticket.worktree, ['merge-base', '--is-ancestor', remote, head], 30000); return ''; }
    catch (error) { return /\bexited 1\b/.test(String(error)) ? moved : ''; }
}
