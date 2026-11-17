import { devUpdate } from './dev-update';
import { postReadableComment } from './readable-jira-comment';
import { settleDevUpdate } from './settle-dev-update';
import { prUrl } from './azure';
import { jiraBinding } from '../office/project-bindings';
import type { Store } from '../store/store';
import type { StageResult, Ticket } from '../../src/shared';
import type { command } from '../workers/process';

/**
 * Posts the Dev update for a draft PR or a repair. It informs; it never gates the stage and never throws.
 * A write that may have reached Jira is settled at once by reading the ticket, and is never resent.
 * Returns the comment id, or '' when no update is known to be on the ticket.
 */
export async function postDevUpdate(store: Store, execute: typeof command, ticket: Ticket, stage: string, attempt: string, result: StageResult): Promise<string> {
    const id = `dev-update:${attempt}`;
    try {
        const prId = result.prId || ticket.prId, comment = devUpdate(stage, attempt, result, prId ? prUrl(store.project, prId) : '');
        return String((await postReadableComment(store, execute, ticket, { id, operation: 'jira-dev-update', attempt, commit: result.commit, expectedState: { assignee: jiraBinding(store.project).account, stage }, comment, changed: () => false, refusal: 'Jira assignment changed before the Dev update' })).id);
    }
    catch {
        return settleDevUpdate(store, execute, ticket.key, id).catch(() => '');
    }
}
