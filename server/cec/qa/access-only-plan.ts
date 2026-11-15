type Document = Record<string, any>;
const document = (value: unknown): value is Document => !!value && typeof value === 'object' && !Array.isArray(value);

/** Only the access probe shape, never a plan that already contains feature actions. */
export function isAccessOnlyPlan(value: unknown): boolean {
    if (!document(value) || value.kind !== 'plan' || value.schema_version !== 'browser-qa/v17' ||
        !Array.isArray(value.workflows) || !value.workflows.length) return false;
    return value.workflows.every((workflow: unknown) => document(workflow) && Array.isArray(workflow.steps) && workflow.steps.length > 0 &&
        workflow.steps.every((step: unknown) => document(step) && Array.isArray(step.execution) && step.execution.length > 0 &&
            step.execution.every((action: unknown) => document(action) && action.action === 'navigate' && action.mutation === 'none' &&
                document(action.target) && action.target.kind === 'url' && action.target.value === '/')));
}

/** Called after the public native reducer validates these exact artifact digests. */
export function settledAccessOnlyState(plan: unknown, value: unknown, verifiedPlanDigest: string): boolean {
    if (!isAccessOnlyPlan(plan) || !document(plan) || !document(value) || value.schema_version !== 'browser-qa/v17' ||
        value.run_id !== plan.run_id || !/^sha256:[a-f0-9]{64}$/.test(verifiedPlanDigest) || value.plan_digest !== verifiedPlanDigest ||
        !Array.isArray(value.assignment_lanes) || !value.assignment_lanes.length ||
        !Array.isArray(value.browser_bindings) || value.browser_bindings.length ||
        !Array.isArray(value.browser_calls) || !value.browser_calls.length) return false;
    if (!value.assignment_lanes.every((lane: unknown) => document(lane) && lane.status === 'completed' &&
        lane.open_call_id === null && lane.binding_id === null)) return false;
    return value.browser_calls.every((call: unknown) => {
        if (!document(call) || !document(call.before) || !document(call.after)) return false;
        const before = call.before, after = call.after, action = before.execution_action;
        if (before.mutation_intent !== false || after.status !== 'completed' || after.mutation_outcome !== 'not-applicable' ||
            after.call_id !== before.call_id || !document(action) || action.mutation !== 'none' || action.mutation_intent !== false) return false;
        return before.operation === 'accessibility-readiness' && action.action === 'accessibility-readiness' ||
            before.operation === 'navigate' && before.operation_kind === 'read-only' && action.action === 'navigate' &&
            document(action.target) && action.target.kind === 'url' && action.target.value === '/';
    });
}
