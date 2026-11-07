import { expect, test } from 'vitest';
import { VENDOR_REVIEW_INSTRUCTIONS } from '../../../server/maintenance/vendor-review-instructions';

test('a rotated or withdrawn entry is recorded as unverifiable upstream and does not block', () => {
    expect(VENDOR_REVIEW_INSTRUCTIONS).toContain('rotated or withdrawn is not missing scan evidence');
    expect(VENDOR_REVIEW_INSTRUCTIONS).toContain('record it in the ledger as unverifiable upstream with no retained official text and no profile impact claimed');
    expect(VENDOR_REVIEW_INSTRUCTIONS).toContain('passed with zero candidates is the correct outcome');
    expect(VENDOR_REVIEW_INSTRUCTIONS).toContain('merely aged out of the feed window is not rotated: read it from the changelog page');
});

test('the existing read-only, missing-evidence, partial-pass and curl rules remain', () => {
    expect(VENDOR_REVIEW_INSTRUCTIONS.startsWith('READ ONLY.')).toBe(true);
    expect(VENDOR_REVIEW_INSTRUCTIONS).toContain('Missing scan evidence is blocked.');
    expect(VENDOR_REVIEW_INSTRUCTIONS).toContain('the harness retains it as an open observation rather than stopping the review');
    expect(VENDOR_REVIEW_INSTRUCTIONS).toContain('with curl in Bash');
    expect(VENDOR_REVIEW_INSTRUCTIONS).toContain('do not use WebFetch');
});
