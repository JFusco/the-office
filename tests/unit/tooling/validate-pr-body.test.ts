import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const { REQUIRED_CHECKS, REQUIRED_SECTIONS, validatePullRequestBody } = require('../../../scripts/validate_pr_body.cjs') as {
    REQUIRED_CHECKS: string[]; REQUIRED_SECTIONS: string[]; validatePullRequestBody: (body: string) => string[];
};
const template = readFileSync(new URL('../../../.github/pull_request_template.md', import.meta.url), 'utf8');

/** The repository template filled in the way a real PR body is. */
const completed = () => template
    .replace('<!-- Describe the outcome and why it is needed in 1-3 concise sentences. -->', 'Adds the shared delivery flow so work starts from a labelled issue.')
    .replace('<!-- Use a GitHub closing keyword so the issue closes on merge, for example: Closes #123 -->', 'Closes #268')
    .replace('<!-- List the concrete, in-scope changes. -->', '- Adds the PR template, validator and CI step.')
    .replace('<!-- List the exact checks run and their outcomes. Distinguish local, hosted, and live-provider evidence. -->', '- `pnpm run verify:ci` passed locally.')
    .replace('<!-- Describe the remaining risk, or state why risk is negligible. -->', 'Low; documentation and tooling only.')
    .replace('<!-- Describe the smallest safe way to revert or disable the change. -->', 'Revert the merge commit.')
    .replaceAll('- [ ] ', '- [x] ');

test('the template carries exactly the sections and checklist the validator requires', () => {
    expect([...template.matchAll(/^##\s+(.+?)\s*$/gm)].map(match => match[1])).toEqual(REQUIRED_SECTIONS);
    for (const item of REQUIRED_CHECKS) expect(template).toContain(`- [ ] ${item}`);
});

test('a completed body passes', () => {
    expect(validatePullRequestBody(completed())).toEqual([]);
});

test('the unedited template fails with every named gap', () => {
    const errors = validatePullRequestBody(template);
    expect(errors).toContain('Summary must contain meaningful content, not only template placeholders.');
    expect(errors).toContain('Linked issue must contain a GitHub closing reference such as `Closes #123`.');
    expect(errors).toContain('Risk and rollback must include a nonempty `Risk:` entry.');
    expect(errors).toContain('Risk and rollback must include a nonempty `Rollback:` entry.');
    for (const item of REQUIRED_CHECKS) expect(errors).toContain(`Complete required checklist item: ${item}`);
});

test('a missing closing reference, a renamed heading or an unticked item each fail', () => {
    expect(validatePullRequestBody(completed().replace('Closes #268', 'Related to 268'))).toEqual(['Linked issue must contain a GitHub closing reference such as `Closes #123`.']);
    expect(validatePullRequestBody(completed().replace('## Changes', '## Changez'))[0]).toMatch(/^Use these level-two headings exactly once and in order/);
    const unticked = completed().replace(`- [x] ${REQUIRED_CHECKS[2]}`, `- [ ] ${REQUIRED_CHECKS[2]}`);
    expect(validatePullRequestBody(unticked)).toEqual([`Complete required checklist item: ${REQUIRED_CHECKS[2]}`]);
});
