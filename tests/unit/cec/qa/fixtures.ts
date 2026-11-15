export function accessProbe() {
    const digest = `sha256:${'1'.repeat(64)}`;
    const plan: any = { kind: 'plan', schema_version: 'browser-qa/v17', run_id: 'qa-retest-4',
        workflows: [{ steps: [{ execution: [{ action: 'navigate', mutation: 'none', target: { kind: 'url', value: '/' } }] }] }] };
    const state: any = { schema_version: 'browser-qa/v17', run_id: plan.run_id, plan_digest: digest,
        assignment_lanes: [{ status: 'completed', open_call_id: null, binding_id: null }], browser_bindings: [],
        browser_calls: [{ before: { call_id: 'call-1', operation: 'navigate', operation_kind: 'read-only', mutation_intent: false,
            execution_action: { action: 'navigate', mutation: 'none', mutation_intent: false, target: { kind: 'url', value: '/' } } },
        after: { call_id: 'call-1', status: 'completed', mutation_outcome: 'not-applicable' } }] };
    return { plan, state, planDigest: digest };
}
