import { expect, test } from 'vitest';
import { PUBLICATION_OPERATIONS } from '../../../../server/maintenance/publication/publication-operations';

test('maintenance publication read-back knows exactly the four fixed adapters the harness sends', () => {
    expect([...PUBLICATION_OPERATIONS]).toEqual(['github-issue-create', 'git-push', 'github-pr-create', 'github-issue-comment']);
    expect(new Set(PUBLICATION_OPERATIONS).size).toBe(PUBLICATION_OPERATIONS.length);
    // Brain's assignment and board writes are read back by their own reader, not this list.
    for (const operation of ['github-issue-assign', 'github-project-add', 'github-project-status']) expect(PUBLICATION_OPERATIONS as readonly string[]).not.toContain(operation);
});
