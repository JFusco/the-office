import type { Ticket, WorkTime } from '../../src/shared';

type Attempt = Pick<WorkTime, 'ticket' | 'stage' | 'role' | 'status' | 'failure'>;

/** Decide whether a resume must reconstruct an action, rather than rerun its read. */
export function needsResumeReconciliation(ticket: Ticket, attempts: readonly Attempt[]): boolean {
    const result = ticket.results[ticket.stage];
    if (result?.receipts.some(receipt => receipt.uncertain)) return true;

    // A successful fresh ownership read does not overwrite the failed read that
    // produced this blocker. Only harness-classified, matching reader failures
    // can exempt a timeout; model prose alone cannot establish read-only safety.
    const previous = [...attempts].reverse().find(attempt => attempt.ticket === ticket.key &&
        !(attempt.stage === 'readback' && attempt.status === 'completed'));
    if (previous?.failure?.category === 'uncertain-effect') return true;
    if (previous?.role === 'pm' && ['readback', 'reconcile'].includes(previous.stage) &&
        previous.status === 'failed' && previous.failure?.category === 'transient-read' &&
        !previous.failure.code && ticket.blocker.replace(/^Error:\s*/, '') === previous.failure.detail) {
        return ['qa', 'retest', 'staging-qa'].includes(ticket.stage) && result?.paidRuns === null;
    }

    // Retain legacy action-reconciliation signals, without treating an incidental
    // mention such as "the harness owns saved-plan reconciliation" as a command
    // to reconstruct and advance a QA stage that has never passed.
    return /interrupted|timed out|uncertain|^Reconciliation incomplete:|\breconcil[a-z-]* (?:is )?(?:required|incomplete|needed)\b|\b(?:requires?|required|needs?|must|for)\b[^.;\n]*\breconcil/i.test(ticket.blocker);
}
