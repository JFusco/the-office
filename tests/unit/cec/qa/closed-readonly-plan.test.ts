import { expect, test } from 'vitest';
import { closedReadonlyPlan } from '../../../../server/cec/qa/closed-readonly-plan';

function fixture() {
    const digest = `sha256:${'a'.repeat(64)}`, run_id = 'retained-incomplete';
    const plan: any = { kind: 'plan', schema_version: 'browser-qa/v17', run_id, workflows: [{}] };
    const call = (id: string, status: string) => ({ before: { call_id: id, mutation_intent: false, executor_role: 'lead', execution_action: { mutation: 'none', mutation_intent: false } },
        after: { call_id: id, status, mutation_outcome: 'not-applicable', state_class: 'access-interruption', interruption_reason: 'tool-failure' } });
    const state: any = { schema_version: plan.schema_version, run_id, plan_digest: digest, browser_bindings: [],
        assignment_lanes: [{ status: 'completed', open_call_id: null, binding_id: null }, { status: 'pending', open_call_id: null, binding_id: null }],
        browser_calls: [call('observed-prefix', 'completed'), call('closed-tool-error', 'error')] };
    const report: any = { schema_version: plan.schema_version, run_id, kind: 'qa-run-report', status: 'pending' };
    return { plan, state, report, digest };
}

test.each(['error', 'interrupted'])('allows a truthfully incomplete closed %s without changing its original evidence', status => {
    const f = fixture(); f.state.browser_calls[1].after.status = status;
    const original = JSON.stringify(f);
    expect(closedReadonlyPlan(f.plan, f.state, f.report, f.digest)).toBe(true);
    expect(JSON.stringify(f)).toBe(original);
});

test.each(['active-owner', 'open-call', 'binding', 'missing-result', 'mutation', 'unknown-outcome', 'applied-outcome',
    'earlier-error', 'specialist-error', 'wrong-call', 'wrong-run', 'wrong-digest', 'finalized-report', 'passing-report', 'sealed-mutation', 'empty-history'])('refuses %s as authority for another plan', reason => {
    const f = fixture(), last = f.state.browser_calls[1];
    if (reason === 'active-owner') f.state.assignment_lanes[0].status = 'active';
    if (reason === 'open-call') f.state.assignment_lanes[0].open_call_id = 'open';
    if (reason === 'binding') f.state.browser_bindings.push({ status: 'active' });
    if (reason === 'missing-result') delete last.after;
    if (reason === 'mutation') last.before.mutation_intent = true;
    if (reason === 'unknown-outcome') last.after.mutation_outcome = 'unknown';
    if (reason === 'applied-outcome') last.after.mutation_outcome = 'applied';
    if (reason === 'earlier-error') f.state.browser_calls[0].after.status = 'error';
    if (reason === 'specialist-error') last.before.executor_role = 'specialist';
    if (reason === 'wrong-call') last.after.call_id = 'different';
    if (reason === 'wrong-run') f.report.run_id = 'different';
    if (reason === 'wrong-digest') f.state.plan_digest = `sha256:${'b'.repeat(64)}`;
    if (reason === 'finalized-report') f.report.kind = 'final-report';
    if (reason === 'passing-report') f.report.verdict = 'pass';
    if (reason === 'sealed-mutation') last.before.execution_action.mutation = 'update';
    if (reason === 'empty-history') f.state.browser_calls = [];
    expect(closedReadonlyPlan(f.plan, f.state, f.report, f.digest)).toBe(false);
});
