import { expect, test } from 'vitest';
import { parkDecision, parkTicket } from '../../../../server/cec/parking/park-ticket';
import { parksInJira } from '../../../../server/cec/parking/parks-in-jira';
import { fakeJira } from './fake-jira';
import { cecStore, decision, ticket } from './fixtures';

test('only structured decisions without an uncertain write park in Jira', () => {
    for (const kind of ['human-hold', 'scope', 'permission', 'provider-wait'])
        expect(parksInJira(decision(kind))).toBe(true);
    for (const kind of ['source-repair', 'conflict-repair', 'uncertain-effect'])
        expect(parksInJira(decision(kind))).toBe(false);
    expect(parksInJira({ ...decision('human-hold'), outcome: 'failed' })).toBe(false);
    expect(parksInJira({ ...decision('human-hold'), resolution: null })).toBe(false);
    expect(parksInJira(decision('scope', { receipts: [{ id: 'x', action: 'jira-update', target: 'CEC-900', verified: false, uncertain: true, detail: '' }] }))).toBe(false);
});

test('parks once: Blocked first, then one comment naming the status that resumes it', async () => {
    const { store } = cecStore(), t = ticket('Code Review'), jira = fakeJira({ 'CEC-900': { status: 'Code Review' } });
    store.state.tickets = [t];
    await parkTicket(store, jira.execute, t, 'code-review', 'attempt-1', decision('human-hold'));
    expect(jira.state['CEC-900'].status).toBe('Blocked');
    expect(jira.state['CEC-900'].comments).toHaveLength(1);
    expect(jira.state['CEC-900'].comments[0].body).toContain('Office decision attempt-1: Which locale');
    expect(jira.state['CEC-900'].comments[0].body).toContain('Move it back to Code Review to resume');
    expect(t.parked).toMatchObject({ stage: 'code-review', fromStatus: 'Code Review', published: true });
    expect(t).toMatchObject({ activity: 'blocked', status: 'Blocked' });
    expect(jira.calls.findIndex(args => args[2] === 'transition')).toBeLessThan(jira.calls.findIndex(args => args[3] === 'create'));
    await parkTicket(store, jira.execute, t, 'code-review', 'attempt-1', decision('human-hold')).catch(() => undefined);
    expect(jira.writes()).toBe(2);
});

test('a reassigned or already Blocked ticket is never written', async () => {
    for (const issue of [{ status: 'In Progress', assignee: 'someone-else' }, { status: 'Blocked' }]) {
        const { store } = cecStore(), t = ticket(), jira = fakeJira({ 'CEC-900': issue });
        store.state.tickets = [t];
        await parkDecision(store, jira.execute, t, 'implement', 'attempt-1', decision('scope'));
        expect(jira.writes()).toBe(0);
        expect(t.activity).toBe('blocked');
        expect(t.blocker).toContain('not parked in Jira');
        expect(t.parked).toBeUndefined();
    }
});

test('a lost transition response leaves the Office block, posts no comment and is never resent', async () => {
    const { store } = cecStore(), t = ticket(), jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
    store.state.tickets = [t];
    jira.faults.loseTransitionResponse = true;
    await parkDecision(store, jira.execute, t, 'implement', 'attempt-1', decision('provider-wait'));
    expect(t).toMatchObject({ activity: 'blocked', parked: { published: false } });
    expect(jira.state['CEC-900'].comments).toHaveLength(0);
    await expect(parkTicket(store, jira.execute, t, 'implement', 'attempt-1', decision('provider-wait'))).rejects.toThrow();
    expect(jira.calls.filter(args => args[2] === 'transition')).toHaveLength(1);
});

test('a park refused at preflight (here an Office pause) is released to a plain Office block with nothing sent', async () => {
    const { store } = cecStore(), t = ticket(), jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
    store.state.tickets = [t];
    store.state.paused = true;
    await parkDecision(store, jira.execute, t, 'implement', 'attempt-1', decision('permission'));
    expect(jira.writes()).toBe(0);
    expect(t.parked).toBeUndefined();
    expect(t).toMatchObject({ activity: 'blocked' });
    expect(t.blocker).toContain('not parked in Jira');
});
