import { expect, test } from 'vitest';
import { parkDecision, parkTicket } from '../../../../server/cec/parking/park-ticket';
import { reconcileAndResumeParked } from '../../../../server/cec/parking/resume-parked';
import { cecReadbackPrompt } from '../../../../server/cec/prompts/cec-reads';
import { fakeJira } from './fake-jira';
import { cecStore, decision, ticket } from './fixtures';

async function parked(status = 'Code Review') {
    const { store, clock } = cecStore(), t = ticket(status), jira = fakeJira({ 'CEC-900': { status } });
    store.state.tickets = [t];
    await parkTicket(store, jira.execute, t, 'code-review', 'attempt-1', decision('human-hold'));
    const resumed: string[] = [];
    const poll = async () => { clock.advance(60000); return reconcileAndResumeParked(store, jira.execute, key => resumed.push(key)); };
    return { store, clock, t, jira, resumed, poll };
}

test('stays parked while Blocked, waits on any other status, and resumes once when moved back to its own status', async () => {
    const { t, jira, resumed, poll } = await parked('Code Review');
    await poll();
    expect(resumed).toEqual([]);
    jira.state['CEC-900'].status = 'To Do';
    await poll();
    expect(resumed).toEqual([]);
    expect(t.blocker).toContain('Jira is now To Do; move it to Code Review to resume');
    jira.state['CEC-900'].status = 'Code Review';
    await poll();
    expect(resumed).toEqual(['CEC-900']);
    expect(t.parked?.resumeRequestedAt).toBeTruthy();
    expect(t.status).toBe('Code Review');
    expect(t.blocker).not.toMatch(/interrupted|timed out|uncertain|reconcil/i);
    await poll();
    expect(resumed).toEqual(['CEC-900']);
    expect(jira.writes()).toBe(2);
});

test('a reassigned ticket is not resumed even when moved back', async () => {
    const { jira, resumed, poll } = await parked();
    Object.assign(jira.state['CEC-900'], { status: 'Code Review', assignee: 'someone-else' });
    await poll();
    expect(resumed).toEqual([]);
});

test('reads Jira at most once a minute and not at all with nothing parked', async () => {
    const { store, clock, jira } = await parked();
    const reads = () => jira.calls.filter(args => args[2] === 'get').length, before = reads();
    clock.advance(60000);
    await reconcileAndResumeParked(store, jira.execute, () => undefined);
    await reconcileAndResumeParked(store, jira.execute, () => undefined);
    clock.advance(30000);
    await reconcileAndResumeParked(store, jira.execute, () => undefined);
    expect(reads() - before).toBe(1);
    const empty = cecStore(), idle = fakeJira({});
    await reconcileAndResumeParked(empty.store, idle.execute, () => undefined);
    expect(idle.calls).toHaveLength(0);
});

test('a lost transition response is confirmed by read-back, then the comment is posted once', async () => {
    const { store, clock } = cecStore(), t = ticket('In Progress'), jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
    store.state.tickets = [t];
    jira.faults.loseTransitionResponse = true;
    await parkDecision(store, jira.execute, t, 'implement', 'attempt-1', decision('scope'));
    expect(t.parked?.published).toBe(false);
    jira.faults.loseTransitionResponse = false;
    clock.advance(60000);
    await reconcileAndResumeParked(store, jira.execute, () => undefined);
    expect(store.getEffect('park-transition:Office decision attempt-1')?.status).toBe('verified');
    expect(jira.calls.filter(args => args[2] === 'transition')).toHaveLength(1);
    expect(jira.state['CEC-900'].comments).toHaveLength(1);
    expect(t.parked?.published).toBe(true);
    expect(t.blocker).toBe(`Decision needed: ${t.parked!.reason}`);
});

test('a lost comment response is confirmed by read-back and never reposted', async () => {
    const { store, clock } = cecStore(), t = ticket('In Progress'), jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
    store.state.tickets = [t];
    jira.faults.loseCommentResponse = true;
    await parkDecision(store, jira.execute, t, 'implement', 'attempt-1', decision('scope'));
    jira.faults.loseCommentResponse = false;
    clock.advance(60000);
    await reconcileAndResumeParked(store, jira.execute, () => undefined);
    expect(jira.state['CEC-900'].comments).toHaveLength(1);
    expect(t.parked?.published).toBe(true);
});

test('a transition that never landed stays with IT and is not resent', async () => {
    const { store, clock } = cecStore(), t = ticket('In Progress'), jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
    store.state.tickets = [t];
    jira.faults.loseTransitionResponse = true;
    await parkDecision(store, jira.execute, t, 'implement', 'attempt-1', decision('scope'));
    jira.state['CEC-900'].status = 'In Progress';
    jira.faults.loseTransitionResponse = false;
    clock.advance(60000);
    await reconcileAndResumeParked(store, jira.execute, () => undefined);
    expect(store.getEffect('park-transition:Office decision attempt-1')?.status).toBe('uncertain');
    expect(jira.calls.filter(args => args[2] === 'transition')).toHaveLength(1);
    expect(t.parked?.published).toBe(false);
});

test('the resume read-back is told the Office decision is resolved only after Joe moves it back', async () => {
    const { store, jira, poll } = await parked();
    expect(cecReadbackPrompt(store, 'CEC-900')).not.toContain('RESOLVED OFFICE DECISION');
    jira.state['CEC-900'].status = 'Code Review';
    await poll();
    expect(cecReadbackPrompt(store, 'CEC-900')).toContain('Joe has since moved it back to Code Review');
});

test('a park interrupted before its transition was recorded is completed by the poll', async () => {
    const { store, clock } = cecStore(), t = ticket('In Progress'), jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
    t.parked = { stage: 'implement', reason: 'Needs a product decision', at: '2026-10-31T20:00:00Z', fromStatus: 'In Progress', marker: 'Office decision crashed-1', published: false };
    store.state.tickets = [t];
    clock.advance(60000);
    await reconcileAndResumeParked(store, jira.execute, () => undefined);
    expect(jira.state['CEC-900'].status).toBe('Blocked');
    expect(jira.state['CEC-900'].comments).toHaveLength(1);
    expect(t.parked?.published).toBe(true);
});

test('a comment refused after Blocked landed keeps the park and retries the comment as a fresh intent', async () => {
    const { store, clock } = cecStore(), t = ticket('In Progress'), jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
    store.state.tickets = [t];
    jira.faults.afterTransition = () => { store.state.paused = true; };
    await parkDecision(store, jira.execute, t, 'implement', 'attempt-1', decision('scope'));
    expect(jira.state['CEC-900'].status).toBe('Blocked');
    expect(t.parked).toMatchObject({ published: false, commentAttempt: 1 });
    expect(t.blocker).toContain('decision comment pending');
    store.state.paused = false;
    jira.faults.afterTransition = undefined;
    clock.advance(60000);
    await reconcileAndResumeParked(store, jira.execute, () => undefined);
    expect(jira.state['CEC-900'].comments).toHaveLength(1);
    expect(store.getEffect('park-comment:Office decision attempt-1:1')?.status).toBe('verified');
    expect(t.parked?.published).toBe(true);
    expect(jira.calls.filter(args => args[2] === 'transition')).toHaveLength(1);
});

test('a reassignment after Blocked landed keeps watching without commenting on someone else\'s ticket', async () => {
    const { store, clock } = cecStore(), t = ticket('In Progress'), jira = fakeJira({ 'CEC-900': { status: 'In Progress' } });
    store.state.tickets = [t];
    jira.faults.loseTransitionResponse = true;
    await parkDecision(store, jira.execute, t, 'implement', 'attempt-1', decision('scope'));
    jira.faults.loseTransitionResponse = false;
    jira.state['CEC-900'].assignee = 'someone-else';
    clock.advance(60000);
    await reconcileAndResumeParked(store, jira.execute, () => undefined);
    expect(store.getEffect('park-transition:Office decision attempt-1')?.status).toBe('verified');
    expect(t.parked).toMatchObject({ published: false, commentAttempt: 1 });
    expect(jira.state['CEC-900'].comments).toHaveLength(0);
    expect(jira.writes()).toBe(1);
});

test('a resume that did not complete re-arms when the ticket goes to Blocked and back', async () => {
    const { store, t, jira, resumed, poll } = await parked('Code Review');
    store.state.deliveryQueue = [];
    jira.state['CEC-900'].status = 'Code Review';
    await poll();
    expect(resumed).toEqual(['CEC-900']);
    store.state.deliveryQueue.push({ id: 'r1', key: 'CEC-900', action: 'resume-ticket', requestedAt: '', status: 'blocked', error: 'Morgan saw a newer hold', intakeStatus: undefined } as any);
    await poll();
    expect(t.blocker).toContain('Resume did not complete: Morgan saw a newer hold');
    jira.state['CEC-900'].status = 'Blocked';
    await poll();
    expect(t.parked?.resumeRequestedAt).toBeUndefined();
    jira.state['CEC-900'].status = 'Code Review';
    await poll();
    expect(resumed).toEqual(['CEC-900', 'CEC-900']);
});

test('a resume that cannot be queued is noted and retried, not marked requested', async () => {
    const { store, clock, t, jira } = await parked('Code Review');
    jira.state['CEC-900'].status = 'Code Review';
    clock.advance(60000);
    await reconcileAndResumeParked(store, jira.execute, () => { throw new Error('Office is paused or pipeline is occupied'); });
    expect(t.parked?.resumeRequestedAt).toBeUndefined();
    expect(t.blocker).toContain('Resume could not be queued: Error: Office is paused or pipeline is occupied');
    const resumed: string[] = [];
    clock.advance(60000);
    await reconcileAndResumeParked(store, jira.execute, key => resumed.push(key));
    expect(resumed).toEqual(['CEC-900']);
    expect(t.parked?.resumeRequestedAt).toBeTruthy();
});

test('one unreadable parked ticket does not stop the others', async () => {
    const { store, clock } = cecStore(), jira = fakeJira({ 'CEC-901': { status: 'Code Review' } });
    const good = { ...ticket('Code Review'), key: 'CEC-901' }, bad = { ...ticket('Code Review'), key: 'CEC-902' };
    for (const t of [bad, good]) t.parked = { stage: 'code-review', reason: 'Needs a decision', at: '', fromStatus: 'Code Review', marker: `Office decision ${t.key}`, published: true };
    store.state.tickets = [bad, good];
    const resumed: string[] = [];
    clock.advance(60000);
    await expect(reconcileAndResumeParked(store, jira.execute, key => resumed.push(key))).rejects.toThrow('CEC-902');
    expect(resumed).toEqual(['CEC-901']);
});
