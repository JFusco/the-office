import { expect, test } from 'vitest';
import { savedPlanFollowup } from '../../../src/conversations/saved-plan-followup';
test('only a passed saved-plan artifact gap is an Office follow-up, never an invented product question', () => {
    const ticket: any = { key: 'CEC-154', pilot: true, stage: 'plan', activity: 'blocked', blocker: 'Saved implementation plan is required', results: { plan: { outcome: 'passed' } } }, snapshot: any = { tickets: [ticket] };
    expect(savedPlanFollowup(snapshot, 'ticket:CEC-154:plan')).toBe(ticket);
    expect(savedPlanFollowup(snapshot, 'ticket:CEC-155:plan')).toBeUndefined();
    ticket.results.plan.outcome = 'blocked'; expect(savedPlanFollowup(snapshot, 'ticket:CEC-154:plan')).toBeUndefined();
    ticket.results.plan.outcome = 'passed'; ticket.blocker = 'Which locale?'; expect(savedPlanFollowup(snapshot, 'ticket:CEC-154:plan')).toBeUndefined();
});
