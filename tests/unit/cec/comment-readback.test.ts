import { expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { JiraOperations } from '../../../server/cec/jira-operations';
import { CEC } from '../../../server/office/config';
import { jiraDocument } from '../../fixtures/jira-markdown';

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
                saved = { id: 'verified', author: { accountId: CEC.account }, body: jiraDocument(args[args.indexOf('--body') + 1]) };
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
                if (options.readOnly === false) return JSON.stringify({ data: [saved = { id: '7', author: { accountId: CEC.account }, body: jiraDocument(args[args.indexOf('--body') + 1]) }] });
                return JSON.stringify({ data: [saved], pageInfo: { hasNextPage: false, nextCursor: null } });
            };
            await new JiraOperations(store, execute).qaComment(ticket, 'qa', 'carried', result);
            const comments = result.receipts.filter((receipt: any) => receipt.action === 'jira-comment');
            expect(comments, name).toHaveLength(expected);
            expect(comments.filter((receipt: any) => receipt.verified && !receipt.uncertain && String(receipt.id) === '7'), name).toHaveLength(1);
        } finally { store.close(); }
    }
});

test('a comment recorded before it was sent keeps the wording and format it was recorded with', async () => {
    for (const [name, recorded, format] of [['recorded as plain text by an earlier release', { text: 'Office earlier qa\npassed: Checked staging', commit: 'a'.repeat(40) }, 'plain'],
        ['recorded as markdown, then the result changed', { text: '**QA: passed**\n\nFirst wording.\n\nBuild aaaaaaa · Office ref earlier (qa)', commit: 'a'.repeat(40), format: 'markdown' }, 'markdown']] as [string, any, string][]) {
        const store = new Store(':memory:', projectById('cec'));
        store.state.coordination = coordination();
        try {
            const ticket: any = { key: 'CEC-154', runId: 'acceptance', commit: 'a'.repeat(40) };
            const result: any = { outcome: 'passed', summary: 'Second wording.', commit: ticket.commit, evidence: [], findings: [], receipts: [] };
            store.putEffect({ id: 'qa-comment:earlier', work: { projectId: store.project.id, kind: 'delivery', id: ticket.key }, attemptId: 'earlier', operation: 'jira-qa-comment', target: ticket.key, authorization: ticket.runId,
                payload: recorded, expectedState: { assignee: CEC.account, stage: 'qa', commit: ticket.commit }, status: 'prepared', createdAt: '', dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null } as any);
            let sent: string[] = [], saved: any;
            const execute: any = async (_program: string, args: string[], options: any) => {
                if (args.includes('get')) return JSON.stringify({ data: [{ key: ticket.key, fields: { assignee: { accountId: CEC.account } } }] });
                if (options.readOnly === false) { sent = args; const body = args[args.indexOf('--body') + 1]; saved = { id: '9', author: { accountId: CEC.account }, body: format === 'markdown' ? jiraDocument(body) : body }; return JSON.stringify({ data: [saved] }); }
                return JSON.stringify({ data: [saved], pageInfo: { hasNextPage: false, nextCursor: null } });
            };
            await new JiraOperations(store, execute).qaComment(ticket, 'qa', 'earlier', result);
            expect(sent[sent.indexOf('--body') + 1], name).toBe(recorded.text);
            expect(sent[sent.indexOf('--body-format') + 1], name).toBe(format);
            expect(store.getEffect('qa-comment:earlier')?.status, name).toBe('verified');
        } finally { store.close(); }
    }
});
