import { jiraCollection } from './parking/jira-collection';
import { Effects } from '../store/effects';
import { CEC } from '../office/config';
import { sanitize } from '../office/security';
import { markdownWords } from '../comments/readable-comment';
import { storedWords } from '../comments/stored-words';
import type { Store } from '../store/store';
import type { command } from '../workers/process';

/**
 * Settles a Dev update that may have reached Jira, by reading every comment on the ticket: found (Office
 * author, same words) it is verified; absent after a complete read it is closed as not sent, keeping its
 * original error. Nothing is resent. Returns the comment id, or ''. A failed read throws and settles nothing.
 */
export async function settleDevUpdate(store: Store, execute: typeof command, key: string, id: string): Promise<string> {
    const intent = store.getEffect<{ text: string }>(id);
    if (intent?.status === 'verified') return String((intent.receipt as { id?: string } | null)?.id || '');
    if (!intent || !['dispatching', 'uncertain'].includes(intent.status)) return '';
    const words = storedWords(markdownWords(intent.payload.text));
    const saved = (await jiraCollection(execute, ['comment', 'query', '--issue-id', key], 'comments')).find(item => item.id && item.author?.accountId === CEC.account && storedWords(item.body) === words);
    if (saved)
        return await new Effects(store).reconcile(id, async () => ({ verified: true, receipt: saved })) ? String(saved.id) : '';
    store.transition('dev-update-not-sent', `${key}: a Dev update was not on the ticket after a complete read. It is closed as not sent and is not resent.`, () =>
        store.updateEffect(id, intent.status, current => { current.status = 'rejected'; current.error = sanitize(`Not on the ticket after a complete read; not resent. ${current.error}`).slice(0, 1000); }));
    return '';
}

/** Any Dev update for this ticket still unsettled from an earlier run; a read that fails leaves it for the next time. */
export async function settleDevUpdates(store: Store, execute: typeof command, key: string): Promise<void> {
    const rows = store.db.prepare("SELECT id FROM effects WHERE id LIKE 'dev-update:%' AND status IN ('dispatching', 'uncertain')").all() as { id: string }[];
    for (const { id } of rows)
        if (store.getEffect(id)?.target === key)
            await settleDevUpdate(store, execute, key, id).catch(() => undefined);
}
