import { resolve } from 'node:path';
import type { Store } from '../store/store';
import type { Ticket } from '../../src/shared';
import type { command } from '../workers/process';
import { draftHeadMovedForward, movedHeadEvent, recordMovedHead } from './draft-pr-moved-head';
import { postDevUpdate } from './post-dev-update';
import { resultGate } from './workflow';

/**
 * On resume, a ticket stopped at the draft pull request because its recorded result is on a head that
 * moved forward takes that result as it stands: the pull request already exists, so the stage is not
 * run again (a second run could bring the branch up to date once more and move the head again).
 * Returns true when the ticket was sent on to confirm the new head.
 */
export async function resumeMovedHead(store: Store, execute: typeof command, ticket: Ticket): Promise<boolean> {
    const result = ticket.results['draft-pr'];
    if (ticket.stage !== 'draft-pr' || ticket.headMove || !result || !await draftHeadMovedForward(execute, ticket, result) ||
        resultGate({ ...ticket, commit: result.commit }, 'draft-pr', result, resolve(store.dataRoot, 'runs', ticket.runId))) return false;
    const attempt = (store.db.prepare("SELECT id FROM attempts WHERE ticket=? AND stage='draft-pr' ORDER BY rowid DESC LIMIT 1").get(ticket.key) as { id: string } | undefined)?.id;
    recordMovedHead(ticket, result, store.clock.now().toISOString());
    // Informational, as after any accepted draft pull request: whether it reaches Jira never changes the route.
    if (attempt) await postDevUpdate(store, execute, ticket, 'draft-pr', attempt, result);
    store.emit('draft-pr-head-moved', movedHeadEvent(ticket), 'developer', ticket.key);
    return true;
}
