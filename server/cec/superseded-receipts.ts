import type { StageResult, Ticket } from '../../src/shared';

type Receipt = StageResult['receipts'][number];

/**
 * A receipt of the implementation run that this ticket's recorded continuation replaced. It stays
 * on the continuation record; a later stage that restates it has not performed that action.
 */
export function supersededReceipt(ticket: Pick<Ticket, 'implementationContinuation'>, receipt: Pick<Receipt, 'id'>): boolean {
    return !!ticket.implementationContinuation?.originalResult.receipts.some(original => original.id === receipt.id);
}

/** A stage's receipts without restated receipts of the replaced implementation run. */
export function ownReceipts(ticket: Pick<Ticket, 'implementationContinuation'>, receipts: Receipt[]): Receipt[] {
    return receipts.filter(receipt => !supersededReceipt(ticket, receipt));
}
