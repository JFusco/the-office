import { afterDraft } from '../delivery/pipeline/approach';
import type { Stage, StageResult, Ticket } from '../../src/shared';
import type { command } from '../workers/process';

type Moved = Pick<Ticket, 'commit' | 'headMove'>;

/** True while the repair in front of the ticket is the pass that confirms a head moved at the draft pull request. */
export const confirmsMovedHead = (ticket: Moved, stage: Stage) => stage === 'repair' && !!ticket.headMove && !ticket.headMove.confirmed && ticket.commit === ticket.headMove.from;

/**
 * Why a passing confirming repair does not confirm the moved head, or ''. It must report the moved head
 * or a commit that contains it; reporting the old commit again would leave the pull request ahead of
 * everything verified.
 */
export async function movedHeadUnconfirmed(execute: typeof command, ticket: Moved & Pick<Ticket, 'worktree'>, stage: Stage, result: StageResult): Promise<string> {
    const move = ticket.headMove;
    if (!move || !confirmsMovedHead(ticket, stage) || result.outcome !== 'passed' || result.commit === move.to) return '';
    const refused = `The repair must confirm the head the draft pull request was opened on (${move.to.slice(0, 10)}); it reported ${String(result.commit).slice(0, 10)}`;
    if (!/^[a-f0-9]{40}$/.test(result.commit) || result.commit === move.from) return refused;
    try { await execute('git', ['merge-base', '--is-ancestor', move.to, result.commit], { cwd: ticket.worktree, timeout: 30000, readOnly: true }); return ''; }
    catch { return refused; }
}

/** Records the commit a passing confirming repair settled on. Call before that result advances the ticket. */
export function recordConfirmedHead(ticket: Moved, stage: Stage, result: StageResult): void {
    if (confirmsMovedHead(ticket, stage) && result.outcome === 'passed') ticket.headMove!.confirmed = result.commit;
}

/**
 * A head confirmed before any QA ran goes on to the validation the approach selected, as it would have
 * after the draft pull request; a retest is for a head that QA has already seen. Call after a result advanced.
 */
export function routeConfirmedHead(ticket: Pick<Ticket, 'stage' | 'commit' | 'headMove' | 'results' | 'qaHistory' | 'approach'>): void {
    if (ticket.stage === 'retest' && ticket.headMove?.confirmed === ticket.commit && !ticket.results.qa && !ticket.results.retest && !ticket.qaHistory?.length) ticket.stage = afterDraft(ticket as Ticket);
}
