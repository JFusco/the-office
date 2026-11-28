import { expect, test } from 'vitest';
import { carriesMarker, issueContentFault, issueMarker, publishedIssueBody } from '../../../../server/maintenance/publication/issue-content';

import { BODY } from './support/issue-body';

test('the issue-creator rules: prefix, five ordered headings and acceptance criteria under Expected Outcome', () => {
    expect(issueContentFault('[Bug] Restore field x', BODY)).toBeUndefined();
    expect(issueContentFault('Restore field x', BODY)).toMatch(/prefix/);
    expect(issueContentFault('[Bug] x', BODY.replace('## Context', '## Background'))).toMatch(/headings/);
    expect(issueContentFault('[Bug] x', BODY.replace('**Acceptance Criteria**\n- [ ] The profile carries x.', ''))).toMatch(/Acceptance Criteria/);
    expect(issueContentFault('[Bug] x', `${BODY}\nCloses #3`)).toMatch(/closing keyword/);
    expect(issueContentFault('[Bug] x', `${BODY}\n${issueMarker('cms-1')}`)).toMatch(/marker/);
});

test('the harness appends its marker on a line of its own; a quoted marker does not count', () => {
    const body = publishedIssueBody(BODY, 'cms-1', 'Office maintenance blocker r1');
    expect(body.endsWith(`Office maintenance blocker r1\n\n${issueMarker('cms-1')}\n`)).toBe(true);
    expect(carriesMarker(body, 'cms-1')).toBe(true);
    expect(carriesMarker(`see ${issueMarker('cms-1')} above`, 'cms-1')).toBe(false);
});
