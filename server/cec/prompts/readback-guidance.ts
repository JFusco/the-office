import type { Ticket } from '../../../src/shared';
import { RESUME_STEP_AHEAD, type ResumeStep } from '../resume-step';
import { READBACK_OWNER_SCOPE } from '../readback-schema';

/**
 * The PM checks assignment eligibility; the assigned QA lead owns its run setup. `step` is what the resume
 * will do next. Every read-back is told that step and that the step's own inputs (open findings, earlier
 * results, the repair budget) are not blockers for it; three steps add detail of their own.
 */
export function readbackDispatchGuidance(ticket?: Pick<Ticket, 'stage' | 'approach' | 'repairCycle'>, step?: ResumeStep): string {
    const interruptedRerun = step === 'rerun-interrupted-qa';
    // The harness's own answer to an exhausted repair budget; the PM is told so it does not ask for that answer as a prerequisite.
    const assessment = ticket?.stage === 'code-review' && ticket.repairCycle?.phase === 'diagnosis' && !ticket.repairCycle.diagnosisAttempted ? `
REVISED-APPROACH ASSESSMENT: This ticket's repair budget is exhausted after a failed QA result. The harness's recorded recovery route for that is one assessment by Sam of a single revised technical approach on the same candidate, and that assessment is what this read-back is for. It is not a code review of a new candidate and asks for no Jira status move. It grants no repair attempt by itself: a further repair follows only if Sam establishes a changed approach. The exhausted budget, the failed QA result and the absence of a later repair are the reason for this dispatch, not blockers for it. Still return any other current hold.` : '';
    // Sam's assessment came back but was not applied to the ticket; the PM is told the resume applies it and runs nothing.
    const returned = step === 'apply-returned-result' && ticket?.stage === 'code-review' && ticket.repairCycle?.phase === 'diagnosis' && ticket.repairCycle.diagnosisAttempted ? `
RETURNED ASSESSMENT: Sam's single revised-approach assessment for this ticket has already run and returned its result, which the harness has saved but not yet applied to the ticket. This read-back is for applying that saved result: no assessment, review or paid run is repeated, and no Jira status move is asked for. The harness decides from that result whether one further bounded repair follows. The open finding, the exhausted repair budget, the failed QA result and the ticket's current error text are the reason for this step, not blockers for it. Still return any other current hold.` : '';
    // Every resume says what it will do next and what that step, not this read-back, is responsible for.
    const next = ticket && step ? `
HARNESS NEXT STEP: Once this read-back passes, the harness ${RESUME_STEP_AHEAD[step]} (${ticket.stage}). This read-back decides only whether that step may start now. Findings an earlier run left open, an earlier failed or blocked result, the repair budget and the routing of any repair, review or retest are inputs to that step and to the harness's own routing after it: they are not blockers for this read-back, and you are not asked to route work or establish a recovery route. Still return any current hold: a human hold or unanswered decision, missing assignment or eligibility, a positively identified competing owner, missing provider access, or an external action whose outcome is unknown.` : '';
    const owner = `\nREADBACK OWNER SCOPE: ${READBACK_OWNER_SCOPE}${next}${assessment}${returned}`;
    if (!ticket || !['qa', 'retest'].includes(ticket.stage)) return owner;
    const browser = !ticket.approach || ticket.approach.validation === 'browser';
    return `${owner}
QA DISPATCH BOUNDARY: This ticket awaits ${ticket.stage}; this read-back decides whether that stage can be assigned, not whether it has passed. Do not require its future report.json, final.md or completed acceptance before dispatch. ${browser ? 'The assigned QA agent owns current actor/editor permissions, tenant/test-data qualification, resource claim/lease and supported same-run browser recovery/intake-origin revision. These must be verified through its assigned QA protocol before feature actions; a coordinated run-owned browser handoff may be prepared without claiming an existing QA lease.' : 'The assigned QA agent owns the selected check-based validation; do not invent a browser, browser lease or browser-intake prerequisite.'}
Do not perform QA setup or feature checks in this read-only PM assignment. A confirmed access denial, missing human authorization, human hold, positively identified competing execution/live lease or uncertain external action remains blocking. If current eligibility/ownership/provider/hold checks pass and only ordinary QA setup and acceptance remain, return blocker="" and the verified live dispatch fields. This does not accept QA or waive the harness's saved-plan, uncertain-action, usage, stage-result or deployment/version gates.${interruptedRerun ? `
INTERRUPTED RUN: The previous ${ticket.stage} run was cut off by a provider usage limit before it returned a result. The harness treats that run's work as confined to its own test environment and report; it posts the Jira QA comment itself and posted none for that run, and no harness write for this ticket is unsettled. That interruption, the test fixtures and test revisions it left in that environment, and its IT investigation are not blockers for this read-back: the harness decides whether the stage runs again. Still return any other current hold, including a change that run made outside its test environment if you positively find one.` : ''}`;
}
