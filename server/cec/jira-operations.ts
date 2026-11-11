import { jiraRecord } from './jira-record';
import { commentReadback } from './comment-readback';
import type { Store } from '../store/store';
import type { Ticket, StageResult } from '../../src/shared';
import { Effects } from '../store/effects';
import { command } from '../workers/process';
import { CEC } from '../office/config';
export const unpack = (raw: string) => {
    const result = JSON.parse(raw);
    if (result.error || result.ok === false || !result.data)
        throw new Error('Jira operation returned no verified result');
    return result.data;
};
const plain = (value: any): string => typeof value === 'string' ? value : value?.type === 'text' ? value.text : value?.type === 'hardBreak' ? '\n' : Array.isArray(value?.content) ? value.content.map(plain).join(value.type === 'doc' ? '\n' : '') : '';
export class JiraOperations {
    constructor(private store: Store, readonly execute: typeof command = command) { }
    async qaComment(ticket: Ticket, stage: string, attempt: string, result: StageResult): Promise<void> {
        const marker = `Office ${attempt} ${stage}`;
        const text = `${marker}\n${result.outcome}: ${result.summary}${result.blocker ? `\nBlocked: ${result.blocker}` : ''}\nCandidate: ${result.commit}\n${result.findings.map(finding => `${finding.id}: ${finding.status} · ${finding.summary}`).join('\n')}\n${result.evidence.map(evidence => evidence.url || evidence.path).filter(Boolean).join('\n')}`.trimEnd();
        const native = async (action: string, args: string[], readOnly: boolean) => this.execute('twg', ['jira', 'workitem', ...action.split(' '), ...args, '--site', CEC.site, '-o', 'json', '--output-summary', 'none'], { readOnly, timeout: 60000 });
        const call = async (action: string, args: string[], readOnly: boolean) => unpack(await native(action,args,readOnly));
        const comment = await new Effects(this.store).execute({ id: `qa-comment:${attempt}`, work: { projectId: this.store.project.id, kind: 'delivery', id: ticket.key }, attemptId: attempt, operation: 'jira-qa-comment', target: ticket.key, authorization: ticket.runId, payload: { text, commit: result.commit }, expectedState: { assignee: CEC.account, stage, commit: ticket.commit },
            preflight: async () => {
                const record = jiraRecord(await call('get', [ticket.key], true), ticket.key);
                const current = record.fields || record;
                if (record.key !== ticket.key || current.assignee?.accountId !== CEC.account || current.subtask || ticket.commit !== result.commit)
                    throw new Error('Jira assignment or candidate changed before QA publication');
            },
            dispatch: async (value) => { const data = await call('comment create', ['--issue-id', ticket.key, '--body', value.text, '--body-format', 'plain'], false); const record = data.comment || data; return Array.isArray(record) && record.length === 1 ? record[0] : record; },
            verify: async (receipt) => {
                if (!receipt.id)
                    return false;
                return commentReadback(receipt.id, CEC.account, text, async after => {
                    const raw = await native('comment query', ['--issue-id', ticket.key, '--first', '100', ...(after ? ['--after', after] : [])], true);
                    return {data: unpack(raw), pageInfo: JSON.parse(raw).pageInfo};
                }, plain);
            } });
        result.receipts.push({ id: comment.id, action: 'jira-comment', target: `${CEC.site}/browse/${ticket.key}?focusedCommentId=${comment.id}`, verified: true, uncertain: false, detail: `Harness saved and independently read back the ${stage} outcome.` });
    }
}
