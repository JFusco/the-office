import type { Store } from '../../store/store';
import type { StageResult, Ticket } from '../../../src/shared';
import type { command } from '../../workers/process';
import { verifiedTransition, verifyAlreadyAtStatus } from '../transition-readback';

/**
 * Whether Jira already shows the ticket in `target`, established by the harness's own two matching reads
 * and no model run. A QA stage run again after a setup stop tested nothing and moved nothing, so its
 * ticket is normally still where the earlier run put it; asking the PM to move it again buys nothing.
 * Returns the verified read-back to record, or undefined when the status must be moved the usual way.
 */
export async function statusHeld(store: Store, ticket: Ticket, target: string, execute: typeof command): Promise<StageResult | undefined> {
    const read: StageResult = { outcome: 'passed', summary: `Already ${target}; no status move was needed.`, blocker: '', commit: ticket.commit, evidence: [], findings: [],
        receipts: [{ id: `status-held:${ticket.key}`, action: 'jira-read-only', target: ticket.key, verified: true, uncertain: false, detail: 'Harness read of the current Jira status' }],
        previewUrl: ticket.previewUrl, worktree: ticket.worktree, branch: ticket.branch, prId: ticket.prId, qaRunDir: '', paidRuns: 0 };
    const verified = await verifyAlreadyAtStatus(store, ticket, target, read, execute);
    return verifiedTransition(verified) ? verified : undefined;
}
