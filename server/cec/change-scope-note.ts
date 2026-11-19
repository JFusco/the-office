import type { Stage, Ticket } from '../../src/shared';
import { verifiedCandidate } from './change-scope';

type Scoped = Pick<Ticket, 'approach' | 'commit' | 'results' | 'changeScope' | 'featureBinding'>;

/**
 * Said to a repair that starts from a verified candidate: it may state how much review and validation
 * its own change needs. Said to a later repair of a scoped change: the scope stands while the commit does. Said to the stages that review, test and publish a scoped change: what the
 * scope covers, and that the reviewer and QA may widen it. Every other run is told nothing.
 */
export function changeScopeNote(ticket: Scoped, stage: Stage): string {
    const scope = ticket.changeScope, base = stage === 'repair' ? verifiedCandidate(ticket) : '';
    if (base) return `VERIFIED CANDIDATE: The verification the team selected passed on ${base}; your change starts from verified work. When what you change is contained and understood (the target branch merged in, a conflict resolved, a build or check fixed), state what that change needs in approach on your passed result, not through a reroute: review none|focused|full, validation independent-checks|browser, checks naming only what verifies the change and that QA can run at the retest (a hosted build on the published pull request belongs to the ci stage), and a reason that says what changed and why this is enough. QA retests every repair; with independent-checks it runs the listed checks without a browser. The harness applies what you state to this change only and returns to the current approach once the change is published, or if a later repair changes it again without stating a scope. The reviewer and QA may widen it. Return approach=null when the change alters behaviour the earlier review or QA covered; the current approach then applies in full.`;
    if (scope && stage === 'repair') return `SCOPED CHANGE: The verification the team selected passed on ${scope.base}, and what changed from that commit to the current HEAD is being verified at the scope in CURRENT TEAM APPROACH above. If this repair commits nothing (a finding needs a disposition, or a check needs running again), return the same commit and approach=null: the scope stands. If you commit anything, even a log, state approach again for the whole change from ${scope.base} to your new HEAD, with checks QA can run at the retest; you may restate the same scope, and review and validation stay at least where they are. With a new commit and approach=null the ticket's own approach applies in full from here.`;
    if (!scope || !['repair-review', 'preview', 'qa', 'retest', 'publish'].includes(stage)) return '';
    const duty = stage === 'publish' ? 'Evidence for the unchanged work is the verification that passed on that commit; evidence for the change is on the current HEAD.'
        : 'Verify that change with the listed checks and a regression case next to it. This replaces the general instruction to cover every ticket acceptance criterion and to retest every earlier finding: those were verified on that commit, and work the change does not touch is not repeated. A finding that is not yet verified is still yours to settle. If the change reaches further than this scope covers, return outcome=reroute with a wider approach before executing.';
    return `SCOPED VERIFICATION: The verification the team selected passed on ${scope.base}. CURRENT TEAM APPROACH above is the scope the developer set for what changed from that commit to the current HEAD, not for the whole ticket; the ticket's own approach returns after publication. Read the change first (git diff ${scope.base} HEAD) so you know what it is. ${duty}`;
}
