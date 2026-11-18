import type { StageResult, Ticket } from '../../../src/shared';

type Carried = Pick<Ticket, 'findings' | 'results' | 'qaHistory' | 'repairCycle' | 'changeScope'>;

/**
 * The findings on the ticket that a retest must mark verified itself: those a QA stage has reported,
 * those the current repair was sent to fix, and any finding that is not already verified. Only a
 * finding another stage raised about its own work and that is already verified (a developer's note
 * that its verification was unfinished, settled by the review) is left out: QA is not asked to retest
 * what it never raised, but nothing unsettled is dropped. A ticket with no repair cycle keeps the older
 * rule: every finding is owed. A retest of a scoped change owes what is not yet verified and what the
 * repair was sent to fix: every other finding was verified on the commit the change was made on
 * (`server/cec/change-scope.ts`).
 */
export function findingsOwedToRetest(ticket: Carried): string[] {
    if (ticket.changeScope) return ticket.findings.filter(finding => finding.status !== 'verified' || ticket.repairCycle?.pendingFindingIds.includes(finding.id)).map(finding => finding.id);
    if (!ticket.repairCycle) return ticket.findings.map(finding => finding.id);
    const owed = new Set(ticket.repairCycle.pendingFindingIds);
    for (const result of [ticket.results.qa, ticket.results.retest, ticket.results['staging-qa'], ...(ticket.qaHistory || []).map(entry => entry.result)])
        for (const finding of result?.findings || []) owed.add(finding.id);
    return ticket.findings.filter(finding => owed.has(finding.id) || finding.status !== 'verified').map(finding => finding.id);
}

/** The owed findings this retest result does not mark verified. */
export function missingRetestDispositions(ticket: Carried, result: Pick<StageResult, 'findings'>): string[] {
    return findingsOwedToRetest(ticket).filter(id => !result.findings.some(finding => finding.id === id && finding.status === 'verified'));
}
