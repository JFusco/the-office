import type { Stage, Ticket } from '../../src/shared';

/**
 * Said to the stages that re-verify a head that moved at the draft pull request. The developer is told
 * while the accepted candidate is still the old commit; the reviewer and QA while the candidate is the
 * commit that confirming pass settled on. A later repair of a real finding changes the commit again and
 * is told nothing here.
 */
export function movedHeadNote(ticket: Pick<Ticket, 'headMove' | 'commit'>, stage: Stage): string {
    const move = ticket.headMove;
    if (!move) return '';
    const confirmed = !!move.confirmed && ticket.commit === move.confirmed;
    const what = stage === 'repair' && !move.confirmed && ticket.commit === move.from ? 'Confirm that head as the candidate: run the required repository checks on it and save their evidence, change source only if a check fails, and return commit as the current HEAD. No finding is being repaired by this run.'
        : stage === 'repair-review' && confirmed ? 'Review what changed between the two commits, including the merge and any conflict resolution, as the candidate that will be published.'
            : ['retest', 'qa'].includes(stage) && confirmed ? 'Earlier review and QA evidence is for the previous commit; what you verify here is this head.' : '';
    return what ? `HEAD MOVED AT DRAFT PR: Draft pull request ${move.prId} was opened on ${move.to}, which contains the previously accepted candidate ${move.from} brought up to date with the target branch. The pull request is recorded and must be kept as it is. ${what}` : '';
}
