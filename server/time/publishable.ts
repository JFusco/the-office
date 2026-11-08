import type { OfficeProject, TimeEntry, TimeLedgerState, TimePublication } from '../../src/shared';

/**
 * A write for this ticket may have landed but is not yet settled: a dispatch in flight or an
 * attempted write awaiting read-back. GitHub board hours are one absolute total per ticket, so a
 * newer total must not be sent around it. A day that failed before dispatch is not a settlement
 * risk and does not block later days.
 */
export function settlementPending(ledger: TimeLedgerState, key: string): boolean {
    return ledger.entries.some(entry => entry.key === key && entry.status === 'posting')
        || (ledger.publications || []).some(publication => publication.key === key && (publication.status === 'dispatching' || publication.status === 'uncertain' && !superseded(ledger, publication)));
}

/**
 * A later verified write settles an earlier uncertain one: GitHub hours are one absolute total per
 * ticket, and a Jira worklog is one value per day, so the verified value is what stands.
 */
function superseded(ledger: TimeLedgerState, attempt: TimePublication): boolean {
    const covers = (publication: TimePublication) => attempt.provider === 'github' || publication.covered.some(item => attempt.covered.some(other => other.id === item.id));
    return (ledger.publications || []).some(publication => publication !== attempt && publication.key === attempt.key && publication.provider === attempt.provider
        && publication.status === 'verified' && publication.createdAt > attempt.createdAt && covers(publication));
}

/** Anything about the ticket's hours that needs attention, including a day stuck uncertain before dispatch. */
export function ticketUnresolved(ledger: TimeLedgerState, key: string): boolean {
    return settlementPending(ledger, key) || ledger.entries.some(entry => entry.key === key && entry.status === 'uncertain');
}

/**
 * The first pending entry that may be published now. Jira worklogs are per day and independent,
 * so only GitHub waits on settlement; a waiting entry never blocks read-back scheduling.
 */
export function publishableEntry(ledger: TimeLedgerState, provider: OfficeProject['provider'], eligible: (entry: TimeEntry) => boolean = () => true): TimeEntry | undefined {
    return ledger.entries.find(entry => entry.status === 'pending' && eligible(entry) && (provider !== 'github' || !settlementPending(ledger, entry.key)));
}
