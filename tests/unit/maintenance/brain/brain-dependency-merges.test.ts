import { expect, test } from 'vitest';
import { BRAIN_DEPENDENCY_MERGES } from '../../../../server/maintenance/brain/brain-dependency-merges';

test('Brain treats Renovate-merged Pin Courier PRs as external merges, without the old Dependabot exception', () => {
    expect(BRAIN_DEPENDENCY_MERGES).not.toMatch(/dependabot/i);
    expect(BRAIN_DEPENDENCY_MERGES).toContain('Do not use the CMS vendor workflow');
    expect(BRAIN_DEPENDENCY_MERGES).toContain('pin-courier[bot]');
    expect(BRAIN_DEPENDENCY_MERGES).toContain('treat such a merge as an external merge');
    expect(BRAIN_DEPENDENCY_MERGES).toContain('never re-merge, revert, re-verify it as Office work or report it as unverified Office effects');
});
