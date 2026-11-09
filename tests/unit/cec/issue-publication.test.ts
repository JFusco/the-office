import { test, expect } from 'vitest';
import { JiraIssuePublisher } from '../../../server/cec/issue-publication';
import { knowledgeStore } from '../knowledge/knowledge-fixture';
test('incomplete CEC duplicate coverage cannot authorize another issue', async () => {
    const f = knowledgeStore('cec');
    try {
        const provider = new JiraIssuePublisher(f.store, { id: 'fix', marker: () => 'office-improvement-fix' }, async () => JSON.stringify({ data: { issues: [], total: 1 } }));
        await expect(provider.openItems()).rejects.toThrow('incomplete');
    } finally { f.close(); }
});
