import { twgConnection } from './twg-connection';
import { jiraRecord } from './jira-record';
import { commentReadback } from './comment-readback';
import { unpack } from './jira-response';
import { Effects } from '../store/effects';
import { jiraBinding } from '../office/project-bindings';
import { commentMarkdown, commentWords, markdownWords, type ReadableComment } from '../comments/readable-comment';
import { storedWords } from '../comments/stored-words';
import type { Store } from '../store/store';
import type { Ticket } from '../../src/shared';
import type { command } from '../workers/process';

export interface JiraCommentIntent { id: string; operation: string; attempt: string; commit: string; expectedState: Record<string, unknown>; comment: ReadableComment; changed: (current: any) => boolean; refusal: string }
type Recorded = { text: string; commit: string; format?: 'markdown' };

/** The words Jira must hold for a recorded comment: a document's words for markdown, the text as sent for anything recorded before that. */
export function recordedWords(payload: Recorded, fresh: ReadableComment): string {
    return payload.format !== 'markdown' ? storedWords(payload.text) : payload.text === commentMarkdown(fresh) ? commentWords(fresh) : storedWords(markdownWords(payload.text));
}

/** What will be sent for this intent: the comment as first recorded, or the fresh one. */
export function commentPayload(store: Store, intent: Pick<JiraCommentIntent, 'id' | 'commit' | 'comment'>): Recorded {
    const recorded = store.getEffect<Recorded>(intent.id)?.payload;
    return recorded ? { ...recorded, commit: intent.commit } : { text: commentMarkdown(intent.comment), commit: intent.commit, format: 'markdown' };
}

/**
 * One readable comment on a Jira ticket through Effects: recorded, sent once as markdown, then read back
 * by comment id, Office author and words. A comment already recorded keeps the wording and format it was recorded with.
 */
export async function postReadableComment(store: Store, execute: typeof command, ticket: Ticket, intent: JiraCommentIntent): Promise<{ id: string }> {
    const payload = commentPayload(store, intent), words = recordedWords(payload, intent.comment), jira = jiraBinding(store.project);
    const native = async (action: string, args: string[], readOnly: boolean) => execute('twg', ['jira', 'workitem', ...action.split(' '), ...args, ...twgConnection(jira), '-o', 'json', '--output-summary', 'none'], { readOnly, timeout: 60000 });
    const call = async (action: string, args: string[], readOnly: boolean) => unpack(await native(action, args, readOnly));
    return new Effects(store).execute({ id: intent.id, work: { projectId: store.project.id, kind: 'delivery', id: ticket.key }, attemptId: intent.attempt, operation: intent.operation, target: ticket.key, authorization: ticket.runId, payload, expectedState: intent.expectedState,
        preflight: async () => {
            const record = jiraRecord(await call('get', [ticket.key], true), ticket.key);
            const current = record.fields || record;
            if (record.key !== ticket.key || current.assignee?.accountId !== jira.account || current.subtask || intent.changed(current))
                throw new Error(intent.refusal);
        },
        dispatch: async (value) => { const data = await call('comment create', ['--issue-id', ticket.key, '--body', value.text, '--body-format', payload.format === 'markdown' ? 'markdown' : 'plain'], false); const record = data.comment || data; return Array.isArray(record) && record.length === 1 ? record[0] : record; },
        verify: async (receipt) => {
            if (!receipt.id)
                return false;
            return commentReadback(receipt.id, jira.account, words, async after => {
                const raw = await native('comment query', ['--issue-id', ticket.key, '--first', '100', ...(after ? ['--after', after] : [])], true);
                return { data: unpack(raw), pageInfo: JSON.parse(raw).pageInfo };
            }, storedWords);
        } });
}
