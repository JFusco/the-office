import { expect, test } from 'vitest';
import { ownReceipts, supersededReceipt } from '../../../server/cec/superseded-receipts';

const old = { id: 'old-implement', action: 'implement', target: 'CEC-999', verified: false, uncertain: true, detail: 'Worker did not return a verified final result' };
const comment = { id: 'c1', action: 'jira-comment', target: 'CEC-999', verified: true, uncertain: false, detail: 'Saved' };

test('only a receipt recorded on the continuation as the replaced run\'s is superseded', () => {
    const ticket = { implementationContinuation: { originalResult: { receipts: [old] } } } as any;
    expect(supersededReceipt(ticket, { id: 'old-implement' })).toBe(true);
    expect(supersededReceipt(ticket, { id: 'c1' })).toBe(false);
    expect(ownReceipts(ticket, [{ ...old, detail: 'Inherited original receipt, unchanged' }, comment])).toEqual([comment]);
    // Without a continuation record nothing is dropped, however the receipt is labelled.
    expect(ownReceipts({} as any, [old, comment])).toEqual([old, comment]);
});
