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
