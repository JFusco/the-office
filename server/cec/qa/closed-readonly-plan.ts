type Document = Record<string, any>;
const document = (value: unknown): value is Document => !!value && typeof value === 'object' && !Array.isArray(value);

/** Additional restriction after the public QA reducer verifies the original artifacts. Never a pass or replay. */
export function closedReadonlyPlan(plan: unknown, state: unknown, report: unknown, verifiedPlanDigest: string): boolean {
    if (!document(plan) || !document(state) || !document(report) || plan.schema_version !== 'browser-qa/v17' ||
        state.schema_version !== plan.schema_version || report.schema_version !== plan.schema_version ||
        plan.kind !== 'plan' || state.run_id !== plan.run_id || report.run_id !== plan.run_id ||
        !/^sha256:[a-f0-9]{64}$/.test(verifiedPlanDigest) || state.plan_digest !== verifiedPlanDigest ||
        report.kind !== 'qa-run-report' || report.status !== 'pending' || report.result_handoff || report.verdict ||
        !Array.isArray(plan.workflows) || !plan.workflows.length ||
        !Array.isArray(state.assignment_lanes) || !state.assignment_lanes.length ||
        !Array.isArray(state.browser_bindings) || state.browser_bindings.length ||
        !Array.isArray(state.browser_calls) || !state.browser_calls.length) return false;
    if (!state.assignment_lanes.every((lane: unknown) => document(lane) && ['pending', 'completed'].includes(lane.status) &&
        lane.open_call_id === null && lane.binding_id === null)) return false;
    return state.browser_calls.every((pair: unknown, index: number) => {
        if (!document(pair) || !document(pair.before) || !document(pair.after)) return false;
        const { before, after } = pair;
        if (!document(before.execution_action) || before.execution_action.mutation !== 'none' ||
            before.execution_action.mutation_intent !== false || before.mutation_intent !== false || after.call_id !== before.call_id || after.mutation_outcome !== 'not-applicable') return false;
        if (index < state.browser_calls.length - 1) return after.status === 'completed';
        return before.executor_role === 'lead' && ['error', 'interrupted'].includes(after.status) &&
            after.state_class === 'access-interruption' && after.interruption_reason === 'tool-failure';
    });
}
