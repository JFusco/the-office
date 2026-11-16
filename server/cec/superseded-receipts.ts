import type { StageResult, Ticket } from '../../src/shared';

type Receipt = StageResult['receipts'][number];
type Settled = Pick<Ticket, 'implementationContinuation' | 'results'>;

/**
 * A receipt of the implementation run that this ticket's recorded continuation replaced, once the
 * replacement implementation has passed. That run's effects were taken over by the continuation,
 * so the receipt is history: it stays on the continuation record, and a later stage that restates
 * it has neither performed that action nor found it open.
 */
export function supersededReceipt(ticket: Settled, receipt: Pick<Receipt, 'id'>): boolean {
    return ticket.results.implement?.outcome === 'passed' &&
        !!ticket.implementationContinuation?.originalResult.receipts.some(original => original.id === receipt.id);
}

/** A stage's receipts without restated receipts of the replaced implementation run. */
export function ownReceipts(ticket: Settled, receipts: Receipt[]): Receipt[] {
    return receipts.filter(receipt => !supersededReceipt(ticket, receipt));
}

/** Said to every worker once the replaced run is settled, because earlier results still mention it in prose. */
export const SETTLED_RECEIPT_NOTE = 'SETTLED HISTORY: an earlier implementation run on this ticket timed out and was replaced; the implementation that replaced it passed. Older results and evidence may still call its receipt an inherited, uncertain or unreconciled effect. It is settled. Do not cite it as a blocker, an open effect or a next owner, and do not restate its receipt.';

/** The note above when it applies to this ticket, else nothing. */
export function settledReceiptNote(ticket: Ticket): string {
    return ticket.implementationContinuation && ticket.results.implement?.outcome === 'passed' ? SETTLED_RECEIPT_NOTE : '';
}

/**
 * The ticket as a worker should read it: saved stage results without the restated receipt, and the
 * replaced run's own receipt marked settled, so no worker reports it as someone else's open item.
 */
export function ticketForWorker<T extends Ticket>(ticket: T): T {
    const continuation = ticket.implementationContinuation;
    if (!continuation || ticket.results.implement?.outcome !== 'passed') return ticket;
    const results = Object.fromEntries(Object.entries(ticket.results).map(([stage, result]) => [stage, result && { ...result, receipts: ownReceipts(ticket, result.receipts) }])) as T['results'];
    const settled = continuation.originalResult.receipts.map(receipt => ({ ...receipt, uncertain: false, detail: `Settled: the implementation that replaced this run passed. History only; not an open effect. (${receipt.detail})` }));
    return { ...ticket, results, implementationContinuation: { ...continuation, originalResult: { ...continuation.originalResult, receipts: settled } } };
}
