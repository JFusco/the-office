import type { Store } from '../store/store';
import { carriedNotRepeated } from './carried-not-repeated';
import type { Ticket, StageResult } from '../../src/shared';
import { command } from '../workers/process';
import { jiraBinding } from '../office/project-bindings';
import { verifyAlreadyAtStatus } from './transition-readback';
import { statusHeld } from './qa/status-held';
import { qaComment } from './qa-comment';
import { postReadableComment } from './readable-jira-comment';
import { postDevUpdate } from './post-dev-update';
export { unpack } from './jira-response';
export class JiraOperations {
    constructor(private store: Store, readonly execute: typeof command = command) { }
    verifyStatus(ticket: Ticket, target: string, result: StageResult): Promise<StageResult> {
        return verifyAlreadyAtStatus(this.store, ticket, target, result, this.execute);
    }
    /** The ticket's status as Jira already shows it, read by the harness itself; undefined when it has to be moved. */
    statusHeld(ticket: Ticket, target: string): Promise<StageResult | undefined> {
        return statusHeld(this.store, ticket, target, this.execute);
    }
    async qaComment(ticket: Ticket, stage: string, attempt: string, result: StageResult): Promise<void> {
        const posted = await postReadableComment(this.store, this.execute, ticket, { id: `qa-comment:${attempt}`, operation: 'jira-qa-comment', attempt, commit: result.commit, expectedState: { assignee: jiraBinding(this.store.project).account, stage, commit: ticket.commit },
            comment: qaComment(ticket.key, stage, attempt, result, stage === 'retest' && ticket.changeScope?.carried ? { checks: carriedNotRepeated(ticket), commit: ticket.changeScope.carried.commit } : undefined), changed: () => ticket.commit !== result.commit, refusal: 'Jira assignment or candidate changed before QA publication' });
        // An adopted result already carries this comment's receipt; Effects returned the saved one without posting.
        if (result.receipts.some(receipt => receipt.action === 'jira-comment' && receipt.verified && !receipt.uncertain && String(receipt.id) === String(posted.id)))
            return;
        result.receipts.push({ id: posted.id, action: 'jira-comment', target: `${jiraBinding(this.store.project).site}/browse/${ticket.key}?focusedCommentId=${posted.id}`, verified: true, uncertain: false, detail: `Harness saved and independently read back the ${stage} outcome.` });
    }
    /** Informational: the stage result is the same whether or not the update reached the ticket. */
    devUpdate(ticket: Ticket, stage: string, attempt: string, result: StageResult): Promise<string> {
        return postDevUpdate(this.store, this.execute, ticket, stage, attempt, result);
    }
}
