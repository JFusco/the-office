import { jiraRecord } from './jira-record';
import { commentReadback } from './comment-readback';
import type { Store } from '../store/store';
import type { Ticket, StageResult } from '../../src/shared';
import { Effects } from '../store/effects';
import { command } from '../workers/process';
import { CEC } from '../office/config';
import { verifyAlreadyAtStatus } from './transition-readback';
import { unpack } from './jira-response';
import { qaComment } from './qa-comment';
import { commentMarkdown, commentWords, markdownWords } from '../comments/readable-comment';
import { storedWords } from '../comments/stored-words';
export { unpack } from './jira-response';
export class JiraOperations {
    constructor(private store: Store, readonly execute: typeof command = command) { }
    verifyStatus(ticket: Ticket, target: string, result: StageResult): Promise<StageResult> {
        return verifyAlreadyAtStatus(this.store, ticket, target, result, this.execute);
    }
    async qaComment(ticket: Ticket, stage: string, attempt: string, result: StageResult): Promise<void> {
        // A comment already recorded for this attempt keeps the wording and format it was recorded with.
        const recorded = this.store.getEffect<{ text: string; format?: 'markdown' }>(`qa-comment:${attempt}`)?.payload, fresh = qaComment(ticket.key, stage, attempt, result);
        const payload = recorded ? { ...recorded, commit: result.commit } : { text: commentMarkdown(fresh), commit: result.commit, format: 'markdown' as const };
        // Jira stores markdown as a document: only its words can be compared. Text recorded before that is compared as it was sent.
        const words = payload.format !== 'markdown' ? storedWords(payload.text) : payload.text === commentMarkdown(fresh) ? commentWords(fresh) : storedWords(markdownWords(payload.text));
        const native = async (action: string, args: string[], readOnly: boolean) => this.execute('twg', ['jira', 'workitem', ...action.split(' '), ...args, '--site', CEC.site, '-o', 'json', '--output-summary', 'none'], { readOnly, timeout: 60000 });
        const call = async (action: string, args: string[], readOnly: boolean) => unpack(await native(action,args,readOnly));
        const posted = await new Effects(this.store).execute({ id: `qa-comment:${attempt}`, work: { projectId: this.store.project.id, kind: 'delivery', id: ticket.key }, attemptId: attempt, operation: 'jira-qa-comment', target: ticket.key, authorization: ticket.runId, payload, expectedState: { assignee: CEC.account, stage, commit: ticket.commit },
            preflight: async () => {
                const record = jiraRecord(await call('get', [ticket.key], true), ticket.key);
                const current = record.fields || record;
                if (record.key !== ticket.key || current.assignee?.accountId !== CEC.account || current.subtask || ticket.commit !== result.commit)
                    throw new Error('Jira assignment or candidate changed before QA publication');
            },
            dispatch: async (value) => { const data = await call('comment create', ['--issue-id', ticket.key, '--body', value.text, '--body-format', payload.format === 'markdown' ? 'markdown' : 'plain'], false); const record = data.comment || data; return Array.isArray(record) && record.length === 1 ? record[0] : record; },
            verify: async (receipt) => {
                if (!receipt.id)
                    return false;
                return commentReadback(receipt.id, CEC.account, words, async after => {
                    const raw = await native('comment query', ['--issue-id', ticket.key, '--first', '100', ...(after ? ['--after', after] : [])], true);
                    return {data: unpack(raw), pageInfo: JSON.parse(raw).pageInfo};
                }, storedWords);
            } });
        // An adopted result already carries this comment's receipt; Effects returned the saved one without posting.
        if (result.receipts.some(receipt => receipt.action === 'jira-comment' && receipt.verified && !receipt.uncertain && String(receipt.id) === String(posted.id)))
            return;
        result.receipts.push({ id: posted.id, action: 'jira-comment', target: `${CEC.site}/browse/${ticket.key}?focusedCommentId=${posted.id}`, verified: true, uncertain: false, detail: `Harness saved and independently read back the ${stage} outcome.` });
    }
}
