import { expect, test } from 'vitest';
import { partialVendorReview, partialVendorReviewLedger } from '../../../server/maintenance/vendor-review-outcome';

const candidate = { issue: 0, worktree: '', branch: '', head: '', summary: 'Propose a blocks refinement', approach: null };
test('a blocked vendor review with evidenced candidates is a partial pass', () => {
    expect(partialVendorReview({ outcome: 'blocked', candidates: [candidate] })).toBe(true);
});
test('blocked without candidates, passed and reroute are not partial', () => {
    expect(partialVendorReview({ outcome: 'blocked', candidates: [] })).toBe(false);
    expect(partialVendorReview({ outcome: 'passed', candidates: [candidate] })).toBe(false);
    expect(partialVendorReview({ outcome: 'reroute', candidates: [candidate] })).toBe(false);
});
test('the open observation is appended to the ledger, dated and marked non-blocking', () => {
    const ledger = partialVendorReviewLedger({ ledger: 'Main verified.\n', blocker: 'Retrieve the official description for the November 4 entry.' }, '2026-11-06');
    expect(ledger).toBe('Main verified.\nOPEN OBSERVATION (vendor-review 2026-11-06, retained, not blocking): Retrieve the official description for the November 4 entry.');
    expect(partialVendorReviewLedger({ ledger: '', blocker: 'x' }, '2026-11-06')).toBe('OPEN OBSERVATION (vendor-review 2026-11-06, retained, not blocking): x');
    expect(partialVendorReviewLedger({ ledger: 'Main verified.', blocker: '  ' }, '2026-11-06')).toBe('Main verified.');
});
test('an empty returned ledger keeps the retained ledger instead of wiping it', () => {
    expect(partialVendorReviewLedger({ ledger: '', blocker: 'x' }, '2026-11-06', 'Retained notes.\n')).toBe('Retained notes.\nOPEN OBSERVATION (vendor-review 2026-11-06, retained, not blocking): x');
    expect(partialVendorReviewLedger({ ledger: '', blocker: '' }, '2026-11-06', 'Retained notes.')).toBe('Retained notes.');
    expect(partialVendorReviewLedger({ ledger: 'New ledger.', blocker: 'x' }, '2026-11-06', 'Retained notes.')).toBe('New ledger.\nOPEN OBSERVATION (vendor-review 2026-11-06, retained, not blocking): x');
});
