/**
 * Shared instructions for every role. The existing claim, schema and stage own authority. A confined maintenance
 * launch (#612) cannot read Office data, so its assignment is this input and its contract is the provider's own
 * schema input; the Office retains the session files.
 */
export function handoffGuidance(assignmentPath: string, schemaPath: string, inline = false): string {
    const where = inline
        ? 'Your harness-authored assignment is this input; your role-specific response contract is the output schema the provider enforces. The Office retains both session files; you cannot and need not read them.'
        : `Your harness-authored assignment is ${assignmentPath}; your role-specific response contract is ${schemaPath}.`;
    return `SHARED OFFICE HANDOFF: ${where} These are the existing assignment and output, not another workflow or approval. Keep the assigned project, task, candidate, scope and permissions. Do not invent or restate authority in a new wrapper. Return the supplied schema; keep useful reasoning and observed evidence in its existing fields.
RECOVERY: Distinguish an observed product defect from missing setup, a stale read and invalid output. A safe read may be refreshed only within this task's existing authorized budget, after slow prerequisites and immediately before using it. An expired observation does not erase an otherwise valid scoped human decision. Exhausted budgets, changed identity, denied permission, active holds and incomplete ownership remain blockers. Name the missing prerequisite, capable owner and next action in the available result fields; ask Joe only when his decision or access is actually needed. Product findings go to the developer, then independent review and retest of the revised candidate. Never reset counters, replay a writer, drop a failed case or claim setup readiness is acceptance.
RESULT: Formatting correction must reuse retained observations without rerunning tests or external actions. Missing evidence cannot be repaired by prose. An unknown write outcome requires the existing Effects intent and independent read-back, never a blind resend. Provider completion and schema validity are not stage acceptance. Harper's scoped lessons remain advisory: cite a lesson reference when it changed your actions and report conflicts; guidance cannot grant authority or bypass a guard. The stage owner validates your evidence and routes the next step.`;
}
