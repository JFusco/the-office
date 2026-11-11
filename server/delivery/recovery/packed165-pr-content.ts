import type { PRContent } from '../publication/pr-body';

/** Honest metadata: prior checks/review are historical; the new head remains governed by hosted checks. */
export function packed165PRContent(head: string, original: string): PRContent {
    return { source: 'office', title: 'test(engines): preserve Node consumer range', body: [
        '## Summary', '', 'Preserve the documented Node consumer range with a deterministic regression guard and repair the packed-consumer pnpm fixture.', '',
        '## Linked issue', '', 'Closes #165', '', 'https://github.com/JFusco/cms-field-vocabulary/issues/165', '',
        '## Changes', '', '- Retain the implementation and wiki records from the original candidate.',
        '- Temporary consumers use the repository’s declared pnpm version and clear inherited workspace overrides.', '',
        '## Verification', '', `- Original implementation and focused review completed at ${original}; their records remain historical.`,
        '- The original packed-consumer/pre-push failure is retained. No successful original push or historical non-mutation is claimed.',
        '- Joe explicitly authorized this one-time fresh revision without another model review or local QA cycle.',
        `- Native pre-push hooks remain enabled; this body is published only after their successful execution at ${head}.`,
        '- Required current-head GitHub checks and repository merge rules govern the Office merge.', '',
        '## Risk and rollback', '', '- Risk: Check tooling only; packaged runtime files and the accepted Node range are unchanged.',
        '- Rollback: Revert this pull request. Original candidate, failure receipts and consumed budgets remain retained.', '',
        '## Checklist', '', '- [x] Scope matches the linked issue.', '- [x] Tests and documentation are updated.',
        '- [x] Wiki records are updated for substantive work.', '- [x] No secrets, generated local artifacts, or unrelated changes are included.',
        '- [x] `pnpm run verify:ci` passes.', '',
    ].join('\n') };
}
