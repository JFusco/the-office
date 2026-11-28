import { expect, test } from 'vitest';
import { DRAFT_CONTENT_INSTRUCTIONS, editorInstructions } from '../../../../server/maintenance/publication/versioned-instructions';

test('the draft-pr contract asks for content only; the editor is bound to the harness worktree, branch and issue', () => {
    expect(DRAFT_CONTENT_INSTRUCTIONS).not.toMatch(/Push normally|open ONE|Add its URL/);
    expect(DRAFT_CONTENT_INSTRUCTIONS).toContain('you publish nothing');
    const text = editorInstructions({ worktree: '/w', branch: 'codex/7-x', gitDir: '', gitCommonDir: '' }, { number: 7, url: 'u' }, { plan: 'none', review: 'focused', validation: 'developer-checks', checks: [], reason: 'r' } as any, { issue: 0, worktree: '', branch: '', head: '', summary: 's' });
    expect(text).toContain('owned worktree /w on branch codex/7-x, for the verified issue #7');
    expect(text).toContain('No push, pull request, issue, comment');
    expect(text).not.toMatch(/create\/reuse one verified issue|freshly fetched origin\/main/);
});
