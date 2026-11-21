import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { projectOutbox } from '../../../../server/conversations/outbox';
import { freezeReads } from '../../../../server/incidents/repair/freeze-reads';
import { heldFor, repairFreeze } from '../../../../server/incidents/repair/repair-freeze';
import { repairWaitFor } from '../../../../server/incidents/repair/repair-wait';
import { HOLDS } from '../../../../server/office/config';
import type { Store } from '../../../../server/store/store';
import type { WorkRef } from '../../../../src/contracts/work';
import type { WorkTime } from '../../../../src/shared';
import { decision, ticket as cecTicket } from '../../cec/parking/fixtures';
import { markAwaitingRepair, NOTHING_STRONGER } from './mark-fixture';
import { HOUR, later, world } from './repair-wait-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); delete HOLDS['GH-1']; });
type World = ReturnType<typeof world>;
function marked(ids?: string[]) { const w = world(stores, dbs, ids); w.start(); w.pass(2); return w; }
const ONE = { kind: 'delivery' as const, id: '1' }, TWO = { kind: 'delivery' as const, id: '2' }, PROJECT = 'cms-field-vocabulary';
/** The decision as a caller with the project's store makes it: effects and prerequisites read now. */
const frozen = (w: World, work: Pick<WorkRef, 'kind' | 'id'> = ONE, minutes = 3) => repairFreeze(w.store.state, work, later(minutes), freezeReads(w.store, later(minutes)));

test('a record is frozen while a wait is in effect for its exact stop and nothing stronger explains it', () => {
    const w = marked();
    expect(frozen(w)).toMatchObject({ incident: w.id, repair: 'cli-start-1', subject: `${PROJECT}/delivery/1` });
    expect(heldFor(frozen(w)!)).toBe('Awaiting harness repair JFusco/the-office#387; held without spending an attempt.');
    // A failed or interrupted stop is held the same way; so is one the Office is already retrying by itself.
    for (const change of [{ status: 'interrupted' }, { retry: { attempts: 1, nextAt: later(9).toISOString(), history: [], exhausted: false } }]) {
        const other = world(stores, dbs);
        Object.assign(other.jobs()[0], change);
        other.observed(1); other.start('cli-start-1', 2); other.pass(3);
        expect(frozen(other, ONE, 4)).not.toBeNull();
    }
    expect(frozen(w, { kind: 'delivery', id: '9' })).toBeNull();
    expect(repairFreeze({ ...w.store.state, coordination: undefined }, ONE, later(3), NOTHING_STRONGER)).toBeNull();
});

test('without the project\'s current writes and prerequisites to read, nothing is frozen', () => {
    const w = marked();
    expect(repairFreeze(w.store.state, ONE, later(3), null)).toBeNull();
    expect(repairFreeze(w.store.state, ONE, later(3), undefined)).toBeNull();
    expect(repairFreeze(w.store.state, ONE, later(3), NOTHING_STRONGER)).not.toBeNull();
});

test('nothing is frozen once the wait ends: the stop changes, the wait expires or the marker goes', () => {
    const changed = marked();
    changed.jobs()[0].stop = { kind: 'unclassified', at: 't2' };
    expect(frozen(changed)).toBeNull();
    expect(frozen(changed, TWO)).not.toBeNull();
    const expired = marked();
    expect(frozen(expired, ONE, 50 * HOUR)).toBeNull();
    expired.pass(50 * HOUR);
    expect(frozen(expired, ONE, 50 * HOUR + 1)).toBeNull();
    const gone = marked();
    delete gone.store.state.coordination!.repairWaits;
    expect(frozen(gone)).toBeNull();
});

test('a stronger cause is never frozen, whether it stood before the wait or arose after it', () => {
    // A park that reached the board is never held, whatever the stage's saved result calls the wait; one that never went out is not a park yet.
    const providerWait = [{ stage: 'review', result: { outcome: 'blocked', blocker: 'Worktree /tmp/w/1 is missing', summary: '', evidence: [], findings: [], receipts: [], resolution: { kind: 'provider-wait' } } }];
    for (const change of [{ parked: { published: true, reason: 'choose', stage: 'review', marker: 'm' } }, { parked: { published: true, release: { key: 'GH-2' }, reason: 'wait', stage: 'review', marker: 'm' } }, { parked: { published: true, reason: 'checks', stage: 'review', marker: 'm' }, steps: providerWait }]) {
        const w = marked();
        Object.assign(w.jobs()[0], change);
        expect(frozen(w)).toBeNull();
        expect(frozen(w, TWO)).not.toBeNull();
        (w.jobs()[0].parked as unknown as { published: boolean }).published = false;
        expect(frozen(w)).not.toBeNull();
    }
    // A saved stop that names its own cause. A new stop ends the wait, so the record is marked as it stands with it.
    for (const kind of ['hold', 'authority', 'uncertain-effect', 'paused'] as const) {
        const w = world(stores, dbs);
        w.jobs()[0].stop = { kind, at: 't1' };
        markAwaitingRepair(w.store.state, PROJECT, ONE, 'review', { since: later(3).toISOString(), progressAt: later(3).toISOString() });
        expect(frozen(w, ONE, 4)).toBeNull();
        // The wait itself is in effect for that stop; it is the cause that keeps it from holding anything back.
        expect(repairWaitFor(w.store.state, { projectId: PROJECT, ...ONE }, 'review', later(4))).not.toBeNull();
        // The same when the explanation beside the stop repeats a model's refused result: the saved stop still decides.
        w.jobs()[0].steps = [{ stage: 'review', result: { outcome: 'blocked', blocker: 'Worktree /tmp/w/1 is missing', summary: '', evidence: [], findings: [], receipts: [] } }] as any;
        expect(frozen(w, ONE, 4)).toBeNull();
    }
    const w = marked();
    for (const flag of ['paused', 'draining'] as const) {
        w.store.state[flag] = true;
        expect(frozen(w)).toBeNull();
        w.store.state[flag] = false;
    }
    HOLDS['GH-1'] = 'held for a release';
    expect(frozen(w)).toBeNull();
    expect(frozen(w, TWO)).not.toBeNull();
    delete HOLDS['GH-1'];
    expect(frozen(w)).not.toBeNull();
});

test('a write for the record that is unsettled now keeps its read-back, with no pass in between; once it settles the record is held', () => {
    const w = marked();
    expect(frozen(w)).not.toBeNull();
    w.store.db.prepare("INSERT INTO effects(id, work_key, status, body) VALUES('e1', 'cms-field-vocabulary:delivery:1', 'uncertain', ?)").run(JSON.stringify({ attemptId: 'attempt-1' }));
    expect(frozen(w)).toBeNull();
    expect(frozen(w, TWO)).not.toBeNull();
    w.store.db.prepare("UPDATE effects SET status='dispatching' WHERE id='e1'").run();
    expect(frozen(w)).toBeNull();
    w.store.db.prepare("UPDATE effects SET status='verified' WHERE id='e1'").run();
    expect(frozen(w)).not.toBeNull();
    // Nothing about it is kept on the marker.
    expect(Object.keys(w.waits()['delivery/1']).sort()).toEqual(['digest', 'incident', 'issue', 'progressAt', 'repair', 'since', 'stands', 'subject']);
});

test('a published Jira park keeps the ticket help item open even when its saved result waits on a release', () => {
    const w = world(stores, dbs), state = w.store.state, at = later(2);
    const reason = 'Wait for the fixed package release';
    const ticket = cecTicket('Blocked');
    ticket.activity = 'blocked';
    ticket.blocker = `Decision needed: ${reason}`;
    ticket.parked = { stage: ticket.stage, reason, at: later(1).toISOString(), fromStatus: 'In Progress', marker: 'Office decision test', published: true };
    ticket.results[ticket.stage] = decision('provider-wait', {
        blocker: reason,
        resolution: { kind: 'provider-wait', findingIds: [], evidenceIds: [], release: { registry: 'npm', package: 'fixture', minimum: '1.0.0' } },
        receipts: [{ id: 'x', action: 'jira-transition', target: ticket.key, verified: true, uncertain: false, detail: 'verified' }],
    });
    state.tickets = [ticket];
    const work = { kind: 'delivery' as const, id: `ticket:${ticket.key}` };
    markAwaitingRepair(state, PROJECT, work, ticket.stage, { since: later(1).toISOString(), progressAt: later(1).toISOString() });
    const help = () => projectOutbox(state, at, freezeReads(w.store, at)).find(item => item.id === `${work.id}:${ticket.stage}`);

    expect(frozen(w, work, 2)).toBeNull();
    expect(help()?.status).toBe('open');
    ticket.parked.published = false;
    expect(frozen(w, work, 2)).not.toBeNull();
    expect(help()).toBeUndefined();
});

test('a mailbox checkpoint repeating the intake worker failure keeps its authentication follow-up open', () => {
    const w = world(stores, dbs), state = w.store.state, at = later(2);
    const error = 'Mailbox read stopped';
    state.intake = { ...state.intake, status: 'blocked', error };
    state.coordination!.checkpoints = [{ id: 'mailbox', status: 'blocked', runId: '', detail: `Error: ${error}`, endedAt: later(1).toISOString(), date: '2026-11-20', dueAt: '', requestedAt: '', startedAt: '' }];
    const failure: NonNullable<WorkTime['failure']> = { category: 'authentication', dispatched: true, detail: error };
    const worker: Pick<WorkTime, 'id' | 'stage' | 'status' | 'failure' | 'completionAccepted'> = { id: 'mailbox-reader', stage: 'intake', status: 'failed', failure };
    state.workLog = [worker as WorkTime];
    const work = { kind: 'checkpoint' as const, id: 'mailbox' };
    markAwaitingRepair(state, PROJECT, work, 'checkpoint', { since: later(1).toISOString(), progressAt: later(1).toISOString() });
    const followUp = () => projectOutbox(state, at, freezeReads(w.store, at)).find(item => item.id === 'checkpoint:mailbox');

    expect(frozen(w, work, 2)).toBeNull();
    expect(followUp()?.status).toBe('open');
    worker.completionAccepted = true;
    expect(frozen(w, work, 2)).not.toBeNull();
    delete worker.completionAccepted;
    failure.category = 'timeout';
    expect(frozen(w, work, 2)).not.toBeNull();
    expect(followUp()).toBeUndefined();
});

test('a saved result that reports a write of unknown outcome is never frozen, whatever the Effects ledger holds', () => {
    const w = world(stores, dbs);
    w.store.state.maintenance = { runs: [{ id: 'run-1', requestedAt: 'r', startedAt: 's', endedAt: 'e1', status: 'blocked', weekly: false, stage: 'follow-up', error: 'Brain reported 1 write(s) with an unknown outcome (publish); read-back is required', steps: [{ stage: 'follow-up', result: { outcome: 'passed', reason: '', receipts: [{ action: 'publish', target: 'brain', uncertain: true }] } }] }], lastDaily: '', lastWeekly: '', ledger: '' } as any;
    const run = { kind: 'maintenance' as const, id: 'run-1' };
    markAwaitingRepair(w.store.state, PROJECT, run, 'follow-up', { since: later(1).toISOString(), progressAt: later(1).toISOString() });
    expect(frozen(w, run, 2)).toBeNull();
    // The same run stopped for another reason, with every write confirmed, is held.
    (w.store.state.maintenance as any).runs[0].steps[0].result.receipts[0].uncertain = false;
    expect(frozen(w, run, 2)).not.toBeNull();
    const job = marked();
    job.jobs()[0].steps = [{ stage: 'review', result: { outcome: 'passed', blocker: '', summary: 'ok', evidence: [], findings: [], receipts: [{ action: 'push', target: 'origin', uncertain: true }] } }] as any;
    expect(frozen(job)).toBeNull();
});

test('a prerequisite that gates the record keeps it from being frozen; once it is complete the ordinary decision applies', () => {
    const w = marked();
    const needs = (projectId: string, id: string, observedAt = later(1).toISOString()) => [{ target: { projectId, kind: 'delivery', id }, condition: 'job-completed', evidence: 'recorded at intake', observedAt }] as any;
    w.jobs()[0].prerequisites = needs(PROJECT, '2');
    expect(frozen(w)).toBeNull();
    expect(frozen(w, TWO)).not.toBeNull();
    // A prerequisite in a project these reads cannot see gates as well, for every caller alike.
    w.jobs()[0].prerequisites = needs('brain', 'x');
    expect(frozen(w)).toBeNull();
    // One the scheduler's own validation refuses gates too: it would block the job whatever the target says.
    w.jobs()[1].status = 'completed';
    w.jobs()[0].prerequisites = needs(PROJECT, '2', 'not a time');
    expect(frozen(w)).toBeNull();
    w.jobs()[0].prerequisites = needs(PROJECT, '1');
    expect(frozen(w)).toBeNull();
    w.jobs()[0].prerequisites = needs(PROJECT, '2');
    expect(frozen(w)).not.toBeNull();
});

test('a stop whose read-back is owed is never frozen: an unverified status change on a ticket, an earlier step\'s unknown write, a run that failed for authentication', () => {
    const w = world(stores, dbs);
    const at = { since: later(1).toISOString(), progressAt: later(1).toISOString() };
    w.store.state.tickets = [{ key: 'CEC-9', title: 't', url: '', stage: 'develop', activity: 'blocked', blocker: 'PM transition could not be verified', results: {}, commit: '', runId: 'r1', attempt: 1, pilot: true, status: 'open',
        progressUpdates: [{ stage: 'develop', target: 'In Review', at: 't0', result: { outcome: 'passed', blocker: '', summary: '', evidence: [], findings: [], receipts: [{ id: 'x', action: 'jira-transition', target: 'CEC-9', verified: false, detail: 'sent' }] } }] }] as any;
    const ticket = { kind: 'delivery' as const, id: 'ticket:CEC-9' };
    markAwaitingRepair(w.store.state, PROJECT, ticket, 'develop', at);
    expect(frozen(w, ticket, 2)).toBeNull();
    (w.store.state.tickets[0] as any).progressUpdates[0].result.receipts[0].verified = true;
    expect(frozen(w, ticket, 2)).not.toBeNull();
    const stageReceipt = { id: 'y', action: 'jira-transition', target: 'CEC-9', verified: false, uncertain: false, detail: 'sent' };
    (w.store.state.tickets[0] as any).results = { develop: { outcome: 'passed', blocker: '', summary: '', evidence: [], findings: [], receipts: [stageReceipt] } };
    expect(frozen(w, ticket, 2)).toBeNull();
    stageReceipt.verified = true;
    expect(frozen(w, ticket, 2)).not.toBeNull();
    stageReceipt.uncertain = true;
    expect(frozen(w, ticket, 2)).toBeNull();

    const job = marked();
    const push = { action: 'git-push', target: 'origin', verified: false, uncertain: false };
    const read = { action: 'read PR metadata', target: 'origin', verified: false, uncertain: false };
    job.jobs()[0].steps = [
        { stage: 'draft', result: { outcome: 'passed', blocker: '', summary: 'ok', evidence: [], findings: [], receipts: [push] } },
        { stage: 'review', result: { outcome: 'passed', blocker: '', summary: 'ok', evidence: [], findings: [], receipts: [read] } },
    ] as any;
    expect(frozen(job)).toBeNull();
    push.verified = true;
    expect(frozen(job)).not.toBeNull();
    read.uncertain = true;
    expect(frozen(job)).toBeNull();
    // A maintenance run whose worker failed for authentication is a person's to settle; one that timed out is not.
    for (const [category, held] of [['authentication', false], ['permission', false], ['ownership', false], ['timeout', true]] as const) {
        const m = world(stores, dbs);
        m.store.state.maintenance = { runs: [{ id: 'run-1', requestedAt: 'r', startedAt: 's', endedAt: 'e1', status: 'blocked', weekly: false, stage: 'follow-up', error: 'Brain maintenance stopped', steps: [] }], lastDaily: '', lastWeekly: '', ledger: '' } as any;
        m.store.state.workLog = [{ id: 'mw-1', requestId: 'run-1', stage: 'follow-up', status: 'failed', failure: { category, dispatched: true, detail: 'x' } }] as any;
        const run = { kind: 'maintenance' as const, id: 'run-1' };
        markAwaitingRepair(m.store.state, PROJECT, run, 'follow-up', at);
        expect(!!frozen(m, run, 2), category).toBe(held);
        // A failure whose saved completion was accepted no longer stands.
        (m.store.state.workLog![0] as any).completionAccepted = true;
        expect(!!frozen(m, run, 2), category).toBe(true);
    }
});

test.each([
    { kind: 'notice', stage: 'notice', requestId: 'notice-1', id: 'notice-1' },
    { kind: 'conversation', stage: 'conversation', requestId: 'message-request', id: 'message-1' },
    { kind: 'reconciliation', stage: 'reconcile-review', requestId: 'request-1', id: 'request-1' },
    { kind: 'intake', stage: 'assignment-review', requestId: 'review-1', id: 'review-1' },
] as const)('$kind repair waits yield to the bound worker’s still-standing authority failure', ({ kind, stage, requestId, id }) => {
    const w = world(stores, dbs), state = w.store.state, c = state.coordination!;
    c.notices = { entries: [{ id: 'notice-1', status: 'blocked', createdAt: 't1', detail: 'Notice lookup stopped' }] } as any;
    state.messages = [{ id: 'message-1', requestId: 'message-request', status: 'failed', createdAt: 't1', error: 'Conversation stopped' }] as any;
    c.requests = [{ id: 'request-1', action: 'reconcile-review', status: 'blocked', requestedAt: 't1', head: '', key: 'GH-1', detail: 'Read-back stopped' }] as any;
    c.listener.reviews = [{ id: 'review-1', status: 'blocked', endedAt: 't1', key: 'GH-1', detail: 'Intake stopped' }] as any;
    const failure = { category: 'timeout', dispatched: true, detail: 'Original failure' };
    const run = { id: 'worker-1', requestId, failure, completionAccepted: false };
    state.workLog = [run, { id: 'unbound', requestId: 'different-request', failure: { ...failure, category: 'authentication' } }] as any;
    const work = { kind, id };
    markAwaitingRepair(state, PROJECT, work, stage, { since: later(1).toISOString(), progressAt: later(1).toISOString() });

    expect(frozen(w, work, 2)).not.toBeNull();
    for (const category of ['authentication', 'permission', 'ownership']) {
        failure.category = category;
        expect(frozen(w, work, 2), category).toBeNull();
    }
    run.completionAccepted = true;
    expect(frozen(w, work, 2)).not.toBeNull();

    if (kind === 'intake') {
        run.completionAccepted = false;
        failure.category = 'timeout';
        c.listener.reviews[0].failure = { ...failure, category: 'permission' };
        expect(frozen(w, work, 2)).toBeNull();
        c.listener.reviews[0].failure = { ...failure, category: 'timeout' };
        failure.category = 'ownership';
        expect(frozen(w, work, 2)).toBeNull();
    }
});

test('a read that fails decides nothing: the record is not frozen and nothing is thrown', () => {
    const w = marked();
    const broken = { unsettled: () => { throw new Error('database is locked'); }, gated: () => false };
    expect(repairFreeze(w.store.state, ONE, later(3), broken)).toBeNull();
    w.jobs()[0].prerequisites = [{ target: { projectId: PROJECT, kind: 'delivery', id: '2' }, condition: 'job-completed', evidence: 'x', observedAt: later(1).toISOString() }] as any;
    expect(repairFreeze(w.store.state, ONE, later(3), { ...NOTHING_STRONGER, gated: () => { throw new Error('unreadable'); } })).toBeNull();
    expect(repairFreeze(w.store.state, TWO, later(3), NOTHING_STRONGER)).not.toBeNull();
});

test('a marker is honoured only for the project the snapshot names', () => {
    const w = marked();
    expect(repairFreeze({ ...w.store.state, project: w.store.project }, ONE, later(3), NOTHING_STRONGER)).not.toBeNull();
    w.store.state.coordination!.repairWaits!['delivery/1'] = { ...w.waits()['delivery/1'], subject: 'brain/delivery/1' };
    expect(repairFreeze({ ...w.store.state, project: w.store.project }, ONE, later(3), NOTHING_STRONGER)).toBeNull();
    expect(repairFreeze({ ...w.store.state, project: w.store.project }, TWO, later(3), NOTHING_STRONGER)).not.toBeNull();
});
