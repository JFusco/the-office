import type { StageResult, Ticket } from '../../src/shared';
import type { command } from '../workers/process';

const SHA = /^[a-f0-9]{40}$/;
const git = (execute: typeof command, worktree: string, args: string[]) => execute('git', args, { cwd: worktree, timeout: 30000, readOnly: true });

/**
 * True when a passing draft-PR result opened its pull request on a head that moved forward from the
 * accepted candidate: the worktree is on that head, and git shows the accepted candidate is contained
 * in it. A developer brings a branch up to date with the target before opening the pull request; that
 * rewrites nothing, but the new head has not been reviewed or tested. A rewritten or unrelated head, an
 * unreadable worktree, or a result with any write left unverified is false.
 */
export async function draftHeadMovedForward(execute: typeof command, ticket: Pick<Ticket, 'commit' | 'worktree'>, result: StageResult | undefined): Promise<boolean> {
    if (!result || result.outcome !== 'passed' || !SHA.test(ticket.commit) || !SHA.test(result.commit) || result.commit === ticket.commit || !ticket.worktree || !result.prId ||
        result.receipts.some(receipt => !receipt.verified || receipt.uncertain) || !result.receipts.some(receipt => receipt.action === 'draft-pr')) return false;
    try {
        if ((await git(execute, ticket.worktree, ['rev-parse', 'HEAD'])).trim() !== result.commit) return false;
        // Exits non-zero, and so throws, when the accepted candidate is not contained in the new head.
        await git(execute, ticket.worktree, ['merge-base', '--is-ancestor', ticket.commit, result.commit]);
        return true;
    } catch { return false; }
}

/**
 * Records the move on the ticket and sends the new head back to the developer to confirm. The pull
 * request is kept, the accepted candidate stays as it is until that confirmation passes, and no repair
 * attempt is spent: the move is not a finding. What the result carried forward is kept as `advance` would.
 */
export function recordMovedHead(ticket: Ticket, result: StageResult, at: string): void {
    ticket.headMove = { from: ticket.commit, to: result.commit, prId: result.prId, at };
    ticket.prId = result.prId;
    if (result.findings.length) ticket.findings = result.findings;
    if (result.branch) ticket.branch = result.branch;
    if (result.worktree) ticket.worktree = result.worktree;
    ticket.attempt++;
    ticket.stage = 'repair';
    ticket.activity = 'waiting';
    ticket.blocker = '';
}

/** What the Office says once a moved head is recorded. */
export function movedHeadEvent(ticket: Pick<Ticket, 'key' | 'headMove'>): string {
    const move = ticket.headMove!;
    return `${ticket.key}: draft pull request ${move.prId} was opened on ${move.to.slice(0, 10)}, which contains the accepted candidate ${move.from.slice(0, 10)} brought up to date. That head is confirmed and re-verified before publication.`;
}
