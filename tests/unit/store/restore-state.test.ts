import { afterEach, expect, test } from 'vitest';
import { restoreInPlace } from '../../../server/store/restore-state';
import { Store } from '../../../server/store/store';
import { savedState } from './saved-state-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));

test('contents return to the saved copy while every held object stays the same object', () => {
    const ticket = { key: 'CEC-1', stage: 'retest', results: { retest: { outcome: 'failed' } }, findings: [{ id: 'F1', status: 'open' }] };
    const state: any = { paused: false, tickets: [ticket, { key: 'CEC-2', stage: 'plan' }], workLog: [{ id: 'w1', status: 'running' }], notes: ['a'], extra: 1 };
    const saved = structuredClone(state), results = ticket.results, finding = ticket.findings[0];
    // Changes of every kind, as a transaction that then fails would leave them.
    ticket.stage = 'repair'; (ticket.results as any).repair = { outcome: 'passed' }; finding.status = 'verified'; ticket.findings.push({ id: 'F2', status: 'open' });
    state.tickets.reverse(); state.tickets.push({ key: 'CEC-3', stage: 'mailbox' }); state.workLog.length = 0; state.notes.push('b'); delete state.extra; state.added = true;
    restoreInPlace(state, saved);
    expect(state).toEqual(saved);
    expect(state.tickets[0]).toBe(ticket);
    expect(ticket.results).toBe(results);
    expect(ticket.findings[0]).toBe(finding);
});

test('records without an id, duplicates and changed shapes are restored by value', () => {
    const state: any = { steps: [{ stage: 'a' }, { stage: 'b' }], twice: [{ id: 'x', n: 1 }, { id: 'x', n: 2 }], shape: { a: 1 } };
    const saved = structuredClone(state);
    state.steps.pop(); state.twice[0].n = 9; state.shape = ['now', 'a', 'list'];
    restoreInPlace(state, saved);
    expect(state).toEqual(saved);
    expect(state.twice[0]).not.toBe(state.twice[1]);
});

test('a ticket held across a failed transaction still receives later writes', () => {
    const store = new Store(':memory:'); stores.push(store);
    store.state.tickets = [{ key: 'CEC-1', stage: 'retest', activity: 'working', results: {} } as any];
    store.save();
    const held = store.ticket('CEC-1');
    expect(() => store.transaction(() => { held.activity = 'blocked'; throw new Error('rolled back'); })).toThrow('rolled back');
    // The failed change is undone, and the reference the runner holds is still the saved ticket.
    expect(held.activity).toBe('working');
    expect(store.ticket('CEC-1')).toBe(held);
    held.results.retest = { outcome: 'blocked' } as any; store.save();
    const reopened = savedState<any>(store);
    expect(reopened.tickets[0].results.retest.outcome).toBe('blocked');
});

test('a frozen record and a record reachable twice take the saved value, and the result still equals the saved copy', () => {
    const frozen = Object.freeze({ id: 'conflict', head: 'a' }), shared = [{ id: 'F1', status: 'open' }];
    const state: any = { jobs: [{ id: 'job', initialDraftConflict: frozen, note: 'x' }], tickets: [{ key: 'T', findings: [{ id: 'F0', status: 'open' }], results: { qa: { findings: [{ id: 'F1', status: 'open' }] } } }] };
    const saved = structuredClone(state), job = state.jobs[0];
    job.note = 'changed';
    // As a stage runner does: the ticket's findings become the very array its result holds.
    state.tickets[0].results.qa.findings = shared; state.tickets[0].findings = shared; shared[0].status = 'verified';
    expect(() => restoreInPlace(state, saved)).not.toThrow();
    expect(state).toEqual(saved);
    expect(state.jobs[0]).toBe(job);
    expect(state.tickets[0].findings).not.toBe(state.tickets[0].results.qa.findings);
});
