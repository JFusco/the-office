import { expect, test } from 'vitest';
import { JiraIssuePublisher } from '../../../server/cec/issue-publication';
import { knowledgeStore } from '../knowledge/knowledge-fixture';

test.each([
    {data: []}, {data: [{ key: 'CEC-155' }]}, {data: [{ key: 'CEC-154' }, { key: 'CEC-155' }]},
])('publisher rejects ambiguous or mismatched native issue reads', async ({data}) => {
    const fixture = knowledgeStore('cec');
    try {
        const publisher = new JiraIssuePublisher(fixture.store, { id: 'test', marker: () => 'marker' }, async () => JSON.stringify({ data }));
        await expect(publisher.closed('CEC-154')).rejects.toThrow('identity mismatch');
    } finally { fixture.close(); }
});
