import { expect, test } from 'vitest';
import { ownReceipts, settledReceiptNote, supersededReceipt, ticketForWorker } from '../../../server/cec/superseded-receipts';

const old = { id: 'old-implement', action: 'implement', target: 'CEC-999', verified: false, uncertain: true, detail: 'Worker did not return a verified final result' };
const comment = { id: 'c1', action: 'jira-comment', target: 'CEC-999', verified: true, uncertain: false, detail: 'Saved' };
const replaced = (implement = 'passed'): any => ({ key: 'CEC-999', implementationContinuation: { requestId: 'r', originalResult: { receipts: [old] } },
    results: { implement: { outcome: implement, receipts: [] }, 'repair-review': { outcome: 'blocked', receipts: [{ ...old, detail: 'Inherited original receipt preserved' }, comment] } } });

test('only a receipt recorded on the continuation as the replaced run\'s is superseded, and only once its replacement passed', () => {
    const ticket = replaced();
    expect(supersededReceipt(ticket, { id: 'old-implement' })).toBe(true);
    expect(supersededReceipt(ticket, { id: 'c1' })).toBe(false);
    expect(ownReceipts(ticket, [{ ...old, detail: 'Inherited original receipt, unchanged' }, comment])).toEqual([comment]);
    // While the replacement implementation has not passed, the receipt is still an open question.
    expect(ownReceipts(replaced('blocked'), [old, comment])).toEqual([old, comment]);
    expect(ownReceipts({ results: { implement: { outcome: 'passed' } } } as any, [old, comment])).toEqual([old, comment]);
});

test('a worker reads the ticket without the restated receipt and with the replaced run marked settled', () => {
    const ticket = replaced(), shown = ticketForWorker(ticket);
    expect(shown.results['repair-review']!.receipts).toEqual([comment]);
    expect(shown.implementationContinuation!.originalResult.receipts).toEqual([expect.objectContaining({ id: 'old-implement', uncertain: false, detail: expect.stringContaining('Settled') })]);
    // The saved record itself is not changed.
    expect(ticket.results['repair-review'].receipts).toHaveLength(2);
    expect(ticket.implementationContinuation.originalResult.receipts[0].uncertain).toBe(true);
    const open = replaced('blocked');
    expect(ticketForWorker(open)).toBe(open);
    // Prose about the old receipt survives in earlier results, so the worker is told it is history; not before it is.
    expect(settledReceiptNote(ticket)).toContain('It is settled');
    expect(settledReceiptNote(open)).toBe('');
});
