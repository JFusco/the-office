import { test, expect } from 'vitest';
import { GitHubIssuePublisher } from '../../../server/github/issue-publication';
import { knowledgeStore } from '../knowledge/knowledge-fixture';
test('duplicate coverage includes paginated open issues and repair PRs and rejects an incomplete envelope', async () => {
    const f = knowledgeStore();
    try {
        let response = JSON.stringify([[{ number: 1, title: 'one', body: 'cause', html_url: 'https://example.com/1' }], [{ number: 2, title: 'two', body: '', html_url: '', pull_request: {} }]]);
        const provider = new GitHubIssuePublisher(f.store, { id: 'fix', marker: () => 'office-improvement-fix' }, async (_cmd, args) => { expect(args).toContain('--paginate'); return response; });
        expect(await provider.openItems()).toEqual([{ key: 'GH-1', text: 'one\ncause', url: 'https://example.com/1' }, { key: 'GH-2', text: 'two\n', url: '' }]);
        response = '{}'; await expect(provider.openItems()).rejects.toThrow('Incomplete');
    } finally { f.close(); }
});
