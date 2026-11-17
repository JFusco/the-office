import { supersededReceipt } from './superseded-receipts';
import type { StageResult, Ticket, WorkTime } from '../../src/shared';

type Attempt = Pick<WorkTime, 'ticket' | 'stage' | 'role' | 'status' | 'failure' | 'completionAccepted' | 'executionStatus'>;

/** Read-only verdict stages: running one again repeats nothing. */
const REVIEW_STAGES = ['plan-review', 'code-review', 'repair-review'];

/**
 * A QA stage whose latest run returned a setup stop on this exact candidate, with no paid run: it
 * tested nothing, so there is no QA action to reconstruct and the only way forward is to run the
 * stage again. A later run that died leaves this saved result behind and does not qualify.
 */
function stoppedInSetup(ticket: Ticket, result: StageResult | undefined, attempts: readonly Attempt[]): boolean {
    if (!['qa', 'retest', 'staging-qa'].includes(ticket.stage) || result?.outcome !== 'blocked' || result.qa?.setup?.status !== 'blocked' ||
        result.paidRuns !== 0 || result.commit !== ticket.commit) return false;
    const latest = attempts.filter(attempt => attempt.ticket === ticket.key && attempt.role === 'qa' && attempt.stage === ticket.stage).at(-1);
    return !!latest && ['blocked', 'completed'].includes(latest.status) && !latest.failure;
}

/** Decide whether a resume must reconstruct an action, rather than rerun its read. */
export function needsResumeReconciliation(ticket: Ticket, attempts: readonly Attempt[]): boolean {
    const result = ticket.results[ticket.stage];
    const setupOnly = stoppedInSetup(ticket, result, attempts);
    // A restated receipt of the replaced implementation run is that run's history, not a QA action.
    if (result?.receipts.some(receipt => receipt.uncertain && !supersededReceipt(ticket, receipt))) return true;

    // A successful fresh ownership read does not overwrite the failed read that
    // produced this blocker. Only harness-classified, matching reader failures
    // can exempt a timeout; model prose alone cannot establish read-only safety.
    const previous = [...attempts].reverse().find(attempt => attempt.ticket === ticket.key &&
        !(attempt.stage === 'readback' && attempt.status === 'completed'));
    // A timed-out run whose saved result the stage accepted is settled; its failure record is history.
    if (previous?.failure?.category === 'uncertain-effect' && !previous.completionAccepted) return true;
    if (previous?.role === 'pm' && ['readback', 'reconcile'].includes(previous.stage) &&
        previous.status === 'failed' && previous.failure?.category === 'transient-read' &&
        !previous.failure.code && ticket.blocker.replace(/^Error:\s*/, '') === previous.failure.detail) {
        return ['qa', 'retest', 'staging-qa'].includes(ticket.stage) && result?.paidRuns === null;
    }

    // Wording about uncertainty or reconciliation in a setup stop's blocker describes history, not a QA action.
    if (setupOnly) return false;
    // Sam's revised-approach assessment that has not run yet is not an interrupted stage: there is nothing to
    // reconstruct, whatever a refused dispatch said about reconciliation on the way to it.
    if (ticket.stage === 'code-review' && ticket.repairCycle?.phase === 'diagnosis' && !ticket.repairCycle.diagnosisAttempted) return false;
    // A review whose latest run returned its own verdict has nothing to reconstruct: the review runs again.
    const latest = attempts.filter(attempt => attempt.ticket === ticket.key && attempt.stage === ticket.stage).at(-1);
    // Bound to this blocked episode, and never past the single revised-approach assessment a repair cycle allows.
    const verdict = !!result && result.outcome !== 'passed' && ticket.blocker.replace(/^Error:\s*/, '') === (result.blocker || result.summary);
    const assessed = ticket.repairCycle?.phase === 'diagnosis' && ticket.repairCycle.diagnosisAttempted;
    if (REVIEW_STAGES.includes(ticket.stage) && verdict && !assessed && latest?.executionStatus === 'completed' && !latest.failure) return false;

    // Retain legacy action-reconciliation signals, without treating an incidental
    // mention such as "the harness owns saved-plan reconciliation" as a command
    // to reconstruct and advance a QA stage that has never passed.
    return /interrupted|timed out|uncertain|^Reconciliation incomplete:|\breconcil[a-z-]* (?:is )?(?:required|incomplete|needed)\b|\b(?:requires?|required|needs?|must|for)\b[^.;\n]*\breconcil/i.test(ticket.blocker);
}
