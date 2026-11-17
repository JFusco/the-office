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
        expect(result.receipts.filter((receipt: any) => receipt.action === 'jira-comment')).toHaveLength(1);
        expect(store.getEffect('qa-comment:native-v2')?.status).toBe('verified');
    } finally { store.close(); }
});

test('a QA comment receipt already on the result is not added again; an unverified or uncertain one does not stand in for it', async () => {
    const cases: [string, any, number][] = [
        ['same id as a number', { id: 7, verified: true, uncertain: false }, 1],
        ['unverified', { id: '7', verified: false, uncertain: false }, 2],
        ['uncertain', { id: '7', verified: true, uncertain: true }, 2],
        ['another comment', { id: '8', verified: true, uncertain: false }, 2],
    ];
    for (const [name, existing, expected] of cases) {
        const store = new Store(':memory:', projectById('cec'));
        store.state.coordination = coordination();
        try {
            const ticket: any = { key: 'CEC-154', runId: 'acceptance', commit: 'a'.repeat(40) };
            const result: any = { outcome: 'passed', summary: 'Checked staging', commit: ticket.commit, evidence: [], findings: [], receipts: [{ action: 'jira-comment', target: ticket.key, detail: 'Carried by the result', ...existing }] };
            let saved: any;
            const execute: any = async (_program: string, args: string[], options: any) => {
                if (args.includes('get')) return JSON.stringify({ data: [{ key: ticket.key, fields: { assignee: { accountId: CEC.account } } }] });
                if (options.readOnly === false) return JSON.stringify({ data: [saved = { id: '7', author: { accountId: CEC.account }, body: args[args.indexOf('--body') + 1] }] });
                return JSON.stringify({ data: [saved], pageInfo: { hasNextPage: false, nextCursor: null } });
            };
            await new JiraOperations(store, execute).qaComment(ticket, 'qa', 'carried', result);
            const comments = result.receipts.filter((receipt: any) => receipt.action === 'jira-comment');
            expect(comments, name).toHaveLength(expected);
            expect(comments.filter((receipt: any) => receipt.verified && !receipt.uncertain && String(receipt.id) === '7'), name).toHaveLength(1);
        } finally { store.close(); }
    }
});
