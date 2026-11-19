/**
 * How a review's findings must agree with its verdict. The gate refuses a review that leaves any finding
 * open, and only a failed review is sent back to the developer, so a reviewer who approves the change but
 * leaves a later stage's gate open, or hands work to the developer in prose, stops the ticket for a person.
 */
export const REVIEW_FINDINGS_RULE = 'REVIEW FINDINGS: A finding you leave open means this review did not pass. Do not carry a later stage\'s gate as an open finding: say it in your summary as the next owner\'s work, and return an earlier finding that records only that such a gate has not run yet as verified with that reason. A finding that needs a source change is the developer\'s to fix, and that includes a pull request that now conflicts with its target branch and must be integrated again: return it open with outcome=failed, so the Office routes it to the developer. Do not return passed and ask in prose for it to be routed.';
