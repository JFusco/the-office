import { expect, test } from 'vitest';
import { isAccessOnlyPlan, settledAccessOnlyState } from '../../../../server/cec/qa/access-only-plan';

import { accessProbe } from './fixtures';

test('identifies only a home access probe with settled read-only calls', () => {
    const f = accessProbe(); expect(isAccessOnlyPlan(f.plan)).toBe(true); expect(settledAccessOnlyState(f.plan, f.state, f.planDigest)).toBe(true);
});
test.each(['feature-path', 'click', 'write', 'empty-workflow'])('does not classify %s as access-only', reason => {
    const f = accessProbe(), action = f.plan.workflows[0].steps[0].execution[0];
    if (reason === 'feature-path') action.target.value = '/projects/a/feedback';
    if (reason === 'click') action.action = 'click';
    if (reason === 'write') action.mutation = 'test-data';
    if (reason === 'empty-workflow') f.plan.workflows[0].steps = [];
    expect(isAccessOnlyPlan(f.plan)).toBe(false);
});
test.each(['active-lane', 'open-call', 'binding', 'no-after', 'unknown-write', 'different-call', 'wrong-plan'])('retains the %s gate', reason => {
    const f = accessProbe(), lane = f.state.assignment_lanes[0], call = f.state.browser_calls[0];
    if (reason === 'active-lane') lane.status = 'active';
    if (reason === 'open-call') lane.open_call_id = 'call-2';
    if (reason === 'binding') f.state.browser_bindings.push({});
    if (reason === 'no-after') delete call.after;
    if (reason === 'unknown-write') call.after.mutation_outcome = 'unknown';
    if (reason === 'different-call') call.after.call_id = 'other';
    if (reason === 'wrong-plan') f.state.plan_digest = `sha256:${'2'.repeat(64)}`;
    expect(settledAccessOnlyState(f.plan, f.state, f.planDigest)).toBe(false);
});
