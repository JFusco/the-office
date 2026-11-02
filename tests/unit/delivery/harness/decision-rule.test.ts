import { expect, test } from 'vitest';
import { DECISION_RULE } from '../../../../server/delivery/harness/stage-instructions';

test('hands-off reviewers are told hosted PR checks come after publication, at the guarded merge', () => {
    expect(DECISION_RULE).toContain('Hosted PR checks do not exist before the Office harness publishes the candidate');
    expect(DECISION_RULE).toContain('never a review or verification blocker');
});
