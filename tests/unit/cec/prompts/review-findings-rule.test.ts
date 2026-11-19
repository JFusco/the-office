import { expect, test } from 'vitest';
import { cecPrompt } from '../../../../server/cec/prompts/cec';
import { REVIEW_FINDINGS_RULE } from '../../../../server/cec/prompts/review-findings-rule';
import { STAGE_ROLE } from '../../../../src/shared';
import { cecStore, ticket } from '../parking/fixtures';
import type { Stage } from '../../../../src/shared';

test('both review stages are told how findings must agree with the verdict, and no other stage is', () => {
    const { store } = cecStore(), t = ticket('Code Review');
    const prompt = (stage: Stage) => cecPrompt(store, { ...t, stage }, stage, STAGE_ROLE[stage]!, '/runs/unit');
    for (const stage of ['code-review', 'repair-review'] as Stage[]) expect(prompt(stage), stage).toContain(REVIEW_FINDINGS_RULE);
    for (const stage of ['repair', 'retest', 'publish', 'implement'] as Stage[]) expect(prompt(stage), stage).not.toContain('REVIEW FINDINGS:');
});

test('the rule settles a later-stage gate without an open finding and sends source work back with a failed verdict', () => {
    expect(REVIEW_FINDINGS_RULE).toContain('A finding you leave open means this review did not pass.');
    expect(REVIEW_FINDINGS_RULE).toContain('return an earlier finding that records only that such a gate has not run yet as verified with that reason');
    expect(REVIEW_FINDINGS_RULE).toContain('a pull request that now conflicts with its target branch and must be integrated again: return it open with outcome=failed');
    expect(REVIEW_FINDINGS_RULE).toContain('Do not return passed and ask in prose for it to be routed.');
});
