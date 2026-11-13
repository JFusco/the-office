import { test, expect } from 'vitest';
import { JiraIssuePublisher } from '../../../server/cec/issue-publication';
import { knowledgeStore } from '../knowledge/knowledge-fixture';
import { CEC } from '../../../server/office/config';
test('incomplete CEC duplicate coverage cannot authorize another issue', async () => {
    const f = knowledgeStore('cec');
    try {
        const provider = new JiraIssuePublisher(f.store, { id: 'fix', marker: () => 'office-improvement-fix' }, async () => JSON.stringify({ data: { issues: [], total: 1 } }));
        await expect(provider.openItems()).rejects.toThrow('incomplete');
    } finally { f.close(); }
});
test('list-mode assignment verification uses exact configured membership and refuses a non-member', async () => {
    const f = knowledgeStore('cec'), prior = CEC.intakeListUrl, calls: string[][] = [];
    CEC.intakeListUrl = CEC.site + '/jira/software/c/projects/CEC/list?jql=' + encodeURIComponent(`project = CEC AND assignee = "${CEC.account}" ORDER BY cf[10011] ASC`);
    let member = true;
    try {
        const provider = new JiraIssuePublisher(f.store, { id: 'fix', marker: () => 'office-improvement-fix' }, async (_p, args) => {
            calls.push(args);
            if (args.includes('board')) throw new Error('Deleted board must not be called');
            return JSON.stringify({ data: args.includes('query') ? { issues: member ? [{ key: 'CEC-10' }] : [] } : { key: 'CEC-10', assignee: { accountId: CEC.account } } });
        });
        const op = { kind: 'assign', payload: { assignee: CEC.account }, expected: {} } as any;
        expect(await provider.verify({ key: 'CEC-10', url: '' }, op)).toBe(true);
        expect(calls.find(args => args.includes('--jql'))?.join(' ')).toContain(`(project = CEC AND assignee = "${CEC.account}") AND key = "CEC-10"`);
        member = false;
        expect(await provider.verify({ key: 'CEC-10', url: '' }, op)).toBe(false);
    } finally { CEC.intakeListUrl = prior; f.close(); }
});
