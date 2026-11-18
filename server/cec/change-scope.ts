import { ApproachSchema } from '../delivery/pipeline/approach';
import type { Role, Stage, StageResult, Ticket, WorkApproach } from '../../src/shared';
import type { command } from '../workers/process';

const SHA = /^[a-f0-9]{40}$/, REVIEW = ['none', 'focused', 'full'], VALIDATION = ['developer-checks', 'independent-checks', 'browser'];
const settled = (result: StageResult | undefined, commit: string, closed: (status: string) => boolean) => !!result && result.outcome === 'passed' && result.commit === commit &&
    result.paidRuns !== null && result.receipts.every(receipt => receipt.verified && !receipt.uncertain) && result.findings.every(finding => closed(finding.status));
const levels = (approach: WorkApproach) => JSON.stringify([approach.review, approach.validation, approach.checks]);

/**
 * The current candidate, when the verification the team selected passed on it; otherwise ''. The
 * latest review and the latest QA must each have passed on this commit with nothing left open: one the
 * approach selects must exist, and one that ran anyway (a retest follows every repair) must not have
 * failed. A ticket whose approach selects neither, one bound to a feature (its plan fixes the levels),
 * and one already verifying a scoped change have no verified candidate to scope from.
 */
export function verifiedCandidate(ticket: Pick<Ticket, 'approach' | 'commit' | 'results' | 'changeScope' | 'featureBinding'>): string {
    const approach = ticket.approach;
    if (!approach || ticket.changeScope || ticket.featureBinding || !SHA.test(ticket.commit) || approach.review === 'none' && approach.validation === 'developer-checks') return '';
    const review = ticket.results['repair-review'] || ticket.results['code-review'], qa = ticket.results.retest || ticket.results.qa;
    if ((approach.review !== 'none' || review) && !settled(review, ticket.commit, status => status !== 'open')) return '';
    if ((approach.validation !== 'developer-checks' || qa) && !settled(qa, ticket.commit, status => status === 'verified')) return '';
    return ticket.commit;
}

/**
 * What an approach stated on a passing result is: the `scope` for verifying a change, the `ticket`'s own
 * approach under the ticket-wide rule, or `ignored`.
 * - While a scope is in force nothing a stage states replaces it; a route change is the way to widen it.
 * - A repair that started from a verified candidate states the scope for its own change, never the
 *   ticket's approach, when git shows its commit contains that candidate. If that cannot be shown, what
 *   it states is ignored and the ticket's approach applies in full.
 * - A stated approach that raises review or validation above the ticket's is a lasting decision, as is
 *   anything stated where no candidate is verified: the ticket-wide rule decides, and it refuses a
 *   reduction while work is unresolved.
 */
export async function statedApproach(execute: typeof command, ticket: Pick<Ticket, 'approach' | 'commit' | 'results' | 'changeScope' | 'featureBinding' | 'worktree'>, stage: Stage, result: StageResult): Promise<'scope' | 'ticket' | 'ignored'> {
    if (ticket.changeScope) return 'ignored';
    const base = stage === 'repair' ? verifiedCandidate(ticket) : '', prior = ticket.approach, stated = result.approach!;
    if (!base || !prior || REVIEW.indexOf(stated.review) > REVIEW.indexOf(prior.review) || VALIDATION.indexOf(stated.validation) > VALIDATION.indexOf(prior.validation) || levels(stated) === levels(prior)) return 'ticket';
    if (!ticket.worktree || !SHA.test(result.commit) || result.commit === base) return 'ignored';
    // Exits non-zero, and so throws, when the verified candidate is not contained in the repair's commit.
    try { await execute('git', ['merge-base', '--is-ancestor', base, result.commit], { cwd: ticket.worktree, timeout: 30000, readOnly: true }); return 'scope'; }
    catch { return 'ignored'; }
}

/**
 * Makes the stated scope the approach for verifying this change and keeps the ticket's own approach to
 * return to. The plan level is the ticket's. A review that failed or was blocked on the ticket keeps a
 * review on the change, because publication requires a passing review on the current head after one.
 */
export function applyChangeScope(ticket: Ticket, proposed: WorkApproach, role: Role, stage: Stage, at: string): void {
    const prior = ticket.approach!, stated = ApproachSchema.parse(proposed);
    const reviewOwed = ['failed', 'blocked'].includes(ticket.results['code-review']?.outcome || '');
    const scope: WorkApproach = { ...stated, plan: prior.plan, review: reviewOwed && stated.review === 'none' ? 'focused' : stated.review };
    ticket.changeScope = { base: ticket.commit, approach: prior };
    ticket.approach = scope;
    (ticket.decisions ??= []).push({ role, stage, at, approach: scope });
}

/** Returns the ticket to its own approach and records that. True when a scope was in force. */
export function endChangeScope(ticket: Pick<Ticket, 'approach' | 'changeScope' | 'decisions'>, stage: Stage, at: string): boolean {
    if (!ticket.changeScope) return false;
    ticket.approach = ticket.changeScope.approach;
    delete ticket.changeScope;
    (ticket.decisions ??= []).push({ role: 'pm', stage, at, approach: ticket.approach });
    return true;
}
