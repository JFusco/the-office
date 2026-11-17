import { expect, test } from 'vitest';
import { devUpdate } from '../../../server/cec/dev-update';
import { commentMarkdown } from '../../../server/comments/readable-comment';

const finding = (status: string, summary: string): any => ({ id: summary, status, summary, expected: '', actual: '', attempts: 1 });

test('a repair update reads as a headline, a plain summary, the findings and the pull request link', () => {
    const result: any = { outcome: 'passed', commit: '7d6ce8896da1102af6972afe594e313e36cebbec', summary: 'The header now offers Generate for a saved spec with no interview. Evidence is in /Users/x/.local/runs/r/checks.json.',
        findings: [finding('fixed', 'Regenerate'), finding('open', 'Local date-format test failures are environmental.')] };
    expect(commentMarkdown(devUpdate('repair', '9f2c11aa-0000-4000-8000-000000000000', result, 'https://dev.azure.com/org/p/_git/r/pullrequest/7'))).toBe([
        '**Dev update: fixes ready for review**', 'The header now offers Generate for a saved spec with no interview.',
        '**Findings**\n- 1 finding fixed, not yet verified\n- Open: Local date-format test failures are environmental.',
        '**Links**\n- [Pull request](https://dev.azure.com/org/p/_git/r/pullrequest/7)', 'Build 7d6ce88 · Office ref 9f2c11aa (repair)'].join('\n\n'));
});

test('a draft PR update names the draft and leaves out a link it does not have', () => {
    const result: any = { outcome: 'passed', commit: 'a'.repeat(40), summary: 'Draft pull request opened against staging.', findings: [] };
    expect(commentMarkdown(devUpdate('draft-pr', 'attempt-1', result, 'https://dev.azure.com/x/pullrequest/7'))).toBe('**Dev update: draft pull request opened**\n\nDraft pull request opened against staging.\n\n**Links**\n- [Draft pull request](https://dev.azure.com/x/pullrequest/7)\n\nBuild aaaaaaa · Office ref attempt- (draft-pr)');
    expect(commentMarkdown(devUpdate('draft-pr', 'attempt-1', result, ''))).not.toContain('Links');
});
