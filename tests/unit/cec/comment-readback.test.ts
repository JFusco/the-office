import { expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { JiraOperations } from '../../../server/cec/jira-operations';
import { CEC } from '../../../server/office/config';

test('native v2 QA comments verify after paginated read-back and dispatch once across retries', async () => {
    const store = new Store(':memory:', projectById('cec'));
    store.state.coordination = coordination();
    try {
        const ticket: any = { key: 'CEC-154', runId: 'acceptance', commit: 'a'.repeat(40) };
        const result: any = { outcome: 'passed', summary: 'Checked staging', commit: ticket.commit, evidence: [], findings: [], receipts: [] };
        let writes = 0;
        let saved: any;
        const execute: any = async (_program: string, args: string[], options: any) => {
            if (args.includes('get')) return JSON.stringify({ data: [{ key: ticket.key, fields: { assignee: { accountId: CEC.account } } }] });
            if (options.readOnly === false) {
                writes++;
                saved = { id: 'verified', author: { accountId: CEC.account }, body: args[args.indexOf('--body') + 1] };
                return JSON.stringify({ data: [saved] });
            }
            const last = args.includes('--after');
            return JSON.stringify({ data: last ? [saved] : [{ id: 'other', body: 'Unrelated' }],
                pageInfo: { hasNextPage: !last, nextCursor: last ? null : 'page-two' } });
        };
        const adapter = new JiraOperations(store, execute);
        await adapter.qaComment(ticket, 'qa', 'native-v2', result);
        await adapter.qaComment(ticket, 'qa', 'native-v2', result);
        expect(writes).toBe(1);
        expect(result.receipts.every((receipt: any) => receipt.verified)).toBe(true);
        expect(store.getEffect('qa-comment:native-v2')?.status).toBe('verified');
    } finally { store.close(); }
});
