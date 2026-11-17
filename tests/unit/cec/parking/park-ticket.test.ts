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

test('parks once with an inline decision comment and no duplicate standalone comment', async () => {
    const { store } = cecStore(), t = ticket('Code Review'), jira = fakeJira({ 'CEC-900': { status: 'Code Review' } });
    store.state.tickets = [t];
    await parkTicket(store, jira.execute, t, 'code-review', 'attempt-1', decision('human-hold'));
    expect(jira.state['CEC-900'].status).toBe('Blocked');
    expect(jira.state['CEC-900'].comments).toHaveLength(1);
    const body = JSON.stringify(jira.state['CEC-900'].comments[0].body);
    expect(body).toContain('Office decision attempt-1: Which locale');
    expect(body).toContain('Move it back to Code Review to resume');
    expect(t.parked).toMatchObject({ stage: 'code-review', fromStatus: 'Code Review', published: true });
    expect(t).toMatchObject({ activity: 'blocked', status: 'Blocked' });
    expect(jira.moves()).toEqual([['rest', 'issue', 'transition', 'CEC-900', '131']]);
    expect(store.getEffect('park-transition:Office decision attempt-1')).toMatchObject({ status: 'verified', payload: { to: 'Blocked', comment: expect.stringContaining('Office decision attempt-1') } });
    expect(jira.calls.some(args => args[3] === 'create')).toBe(false);
    await parkTicket(store, jira.execute, t, 'code-review', 'attempt-1', decision('human-hold')).catch(() => undefined);
    expect(jira.writes()).toBe(1);
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

test('a lost transition response leaves the Office block, keeps its comment and is never resent', async () => {
    const { store } = cecStore(), t = ticket(), jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
    store.state.tickets = [t];
    jira.faults.loseTransitionResponse = true;
    await parkDecision(store, jira.execute, t, 'implement', 'attempt-1', decision('provider-wait'));
    expect(t).toMatchObject({ activity: 'blocked', parked: { published: false } });
    expect(jira.state['CEC-900'].comments).toHaveLength(1);
    await expect(parkTicket(store, jira.execute, t, 'implement', 'attempt-1', decision('provider-wait'))).rejects.toThrow();
    expect(jira.moves()).toHaveLength(1);
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

test('a park without its Blocked transition, its Jira token, a token Jira accepts or the Office account behind it is refused before any write and released', async () => {
    for (const fault of ['noBlockedTransition', 'noCredential', 'revokedToken', 'tokenAccount'] as const) {
        const { store } = cecStore(), t = ticket(), jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
        store.state.tickets = [t];
        (jira.faults as any)[fault] = fault === 'tokenAccount' ? 'someone-else' : true;
        await parkDecision(store, jira.execute, t, 'implement', 'attempt-1', decision('scope'));
        expect(jira.writes(), fault).toBe(0);
        expect(store.getEffect('park-transition:Office decision attempt-1')?.status, fault).toBe('rejected');
        expect(t.parked, fault).toBeUndefined();
        expect(t.blocker, fault).toContain('not parked in Jira');
        expect(JSON.stringify(store.getEffect('park-transition:Office decision attempt-1')), fault).not.toContain('synthetic-token');
    }
});

test('the workflow refuses a TWG move to Blocked, whose comment is not in the transition request', async () => {
    const jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
    await expect(jira.execute('twg', ['jira', 'workitem', 'transition', '--id', 'CEC-900', '--transition-id', '131', '--transition-comment', 'x', '--transition-comment-format', 'plain'])).rejects.toThrow('Must leave a comment');
    expect(jira.state['CEC-900']).toMatchObject({ status: 'In Progress', comments: [] });
});

test('a move Jira refuses stays unconfirmed with Jira\'s reason and is never resent', async () => {
    const { store } = cecStore(), t = ticket(), jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
    store.state.tickets = [t];
    jira.faults.refuseRest = 'Must leave a comment';
    await parkDecision(store, jira.execute, t, 'implement', 'attempt-1', decision('scope'));
    expect(store.getEffect('park-transition:Office decision attempt-1')).toMatchObject({ status: 'uncertain', error: expect.stringContaining('Must leave a comment') });
    expect(t).toMatchObject({ activity: 'blocked', parked: { published: false } });
    expect(t.blocker).toContain('Jira Blocked move not confirmed');
    expect(jira.state['CEC-900']).toMatchObject({ status: 'In Progress', comments: [] });
    await parkDecision(store, jira.execute, t, 'implement', 'attempt-1', decision('scope'));
    expect(jira.moves()).toHaveLength(1);
});
