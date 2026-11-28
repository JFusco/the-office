import { expect, test } from 'vitest';
import { POLICIES } from '../../../../server/workers/qualification/qualification-command';
import { REQUIRED_CONTROLS } from '../../../../server/workers/qualification/required-controls';

test('the command knows every policy, its provider and every stage it qualifies', () => {
    expect(Object.keys(POLICIES).sort()).toEqual(Object.keys(REQUIRED_CONTROLS).sort());
    expect(Object.values(POLICIES).flatMap(policy => policy.stages).sort()).toEqual(['browser-verification', 'draft-pr', 'maintenance-blocker', 'package-verification', 'proposal', 'proposal-issue', 'proposal-plan', 'proposal-plan-review', 'proposal-review', 'vendor-review']);
});
