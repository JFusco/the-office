import { test, expect } from 'vitest';
import { reconcileBlockerFollowups, harperHandoff } from '../../../server/knowledge/blocker-followups';
import { job, knowledgeStore, maintenanceRun } from './knowledge-fixture';
import { markAwaitingRepair, unmark } from '../incidents/repair/mark-fixture';
import { learningMetrics } from '../../../server/knowledge/learning-metrics';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { learningDigest } from '../../../server/knowledge/learning-events';
import { materialKey } from '../../../server/knowledge/handoff-admission';
import { temporaryReadFailure } from '../../../server/scheduling/read-retries';
import { readSavedState } from '../../../server/store/read-saved-state';
import { scheduledWork, type OfficeEntry } from '../../../server/scheduling/scheduled-work';
import type { TeamMessage } from '../../../src/shared';
test('source loss records one unknown transition without rewriting prior confirmed coverage', () => {
    const f = knowledgeStore();
    try {
        const source = job({ status: 'blocked' }); f.store.state.coordination!.jobs!.push(source);
        reconcileBlockerFollowups(f.store); f.advance(1000);
        source.status = 'completed'; reconcileBlockerFollowups(f.store); f.advance(1000);
        const cutoff = f.store.clock.now().toISOString();
        f.store.state.coordination!.jobs = []; reconcileBlockerFollowups(f.store);
        const k = f.store.state.knowledge!, history = JSON.stringify(k.followups![0].history), consumed = [...k.learningConsumed!];
        expect(learningMetrics(k, '2026-11-01', cutoff)).toMatchObject({ resolved: 1, unknown: 0 });
        f.advance(1000);
        expect(learningMetrics(k, '2026-11-01', f.store.clock.now().toISOString())).toMatchObject({ resolved: 0, unknown: 1 });
        reconcileBlockerFollowups(f.store);
        expect(JSON.stringify(k.followups![0].history)).toBe(history); expect(k.learningConsumed).toEqual(consumed);
        expect(k.followups![0].resolvedAt).toBeUndefined();
    } finally { f.close(); }
});
test('explicit owner supersession preserves the original failure and suppresses only its handoff', () => {
    const f = knowledgeStore();
    try {
        const original = maintenanceRun({ id: 'original', status: 'blocked', error: 'Original failure' });
        const replacement = maintenanceRun({ id: 'replacement', supersedes: ['original'] });
        const unrelated = maintenanceRun({ id: 'unrelated', status: 'blocked', error: 'Still blocked' });
        f.store.state.maintenance = { runs: [original, replacement, unrelated], lastDaily: '', lastWeekly: '', ledger: '' };
        reconcileBlockerFollowups(f.store); reconcileBlockerFollowups(f.store);
        const followup = f.store.state.knowledge!.followups!.find(item => item.source.id === original.id)!;
        expect(followup.disposition).toBe('superseded'); expect(followup.history).toHaveLength(1);
        expect(f.store.state.messages).toHaveLength(1); expect(original).toMatchObject({ status: 'blocked', error: 'Original failure' });
        f.advance(1000);
        expect(learningMetrics(f.store.state.knowledge!, '2026-11-01', f.store.clock.now().toISOString())).toMatchObject({ superseded: 1, resolved: 0, unresolved: 1 });
        delete replacement.supersedes; reconcileBlockerFollowups(f.store);
        expect(followup.disposition).toBe('unresolved'); expect(f.store.state.messages).toHaveLength(2);
    } finally { f.close(); }
});
test('Harper nudges IT once, never spends a recovery budget, and source disappearance cannot prove success', () => {
    const { store, close } = knowledgeStore();
    try {
        const source = job({ status: 'blocked' }); store.state.coordination!.jobs!.push(source);
        reconcileBlockerFollowups(store); reconcileBlockerFollowups(store);
        expect(store.state.coordination!.requests!.filter(item => item.action === 'check-it')).toHaveLength(1);
        const followup = store.state.knowledge!.followups!.find(item => item.source.kind === 'job')!;
        expect(followup.disposition).toBe('unresolved');
        source.status = 'completed'; reconcileBlockerFollowups(store); expect(followup.disposition).toBe('confirmed');
        store.state.coordination!.jobs = []; reconcileBlockerFollowups(store); expect(followup.disposition).toBe('unknown');
    } finally { close(); }
});
test('ordinary progress after a block clears is neither a new incident nor recovery evidence', () => {
    const { store, close } = knowledgeStore();
    try {
        const source = job({ status: 'blocked', detail: 'Checks failed' }); store.state.coordination!.jobs!.push(source);
        reconcileBlockerFollowups(store);
        const recoveryEvents = () => (store.state.knowledge!.learningConsumed || []).filter(id => id.split(':')[2] === 'recovery');
        for (const [stage, detail, head] of [['review', 'Reviewing', 'c'], ['validate', 'Validating', 'd'], ['draft', 'Publishing', 'e']]) {
            Object.assign(source, { status: 'queued', stage, detail, head: head.repeat(40) });
            reconcileBlockerFollowups(store);
        }
        const followup = store.state.knowledge!.followups!.find(item => item.source.kind === 'job')!;
        expect(followup.history.length).toBeLessThanOrEqual(2);
        expect(followup.disposition).toBe('unknown');
        expect(recoveryEvents()).toEqual([]);
    } finally { close(); }
});
test('an unparked CEC ticket records one unknown transition without another Morgan handoff', () => {
    const { store, close } = knowledgeStore();
    try {
        const ticket = { key: 'CEC-7', runId: 'run-7', stage: 'qa', pilot: true, parked: { stage: 'qa', reason: 'Needs a product decision', at: '', fromStatus: 'In Progress', marker: 'park-1', published: true } } as never as import('../../../src/shared').Ticket;
        store.state.tickets.push(ticket);
        reconcileBlockerFollowups(store);
        const handoffs = () => store.state.messages.filter(message => message.id.startsWith('harper-followup:'));
        expect(handoffs()).toHaveLength(1);
        delete ticket.parked; reconcileBlockerFollowups(store);
        ticket.stage = 'retest'; reconcileBlockerFollowups(store);
        expect(handoffs()).toHaveLength(1);
        const followup = store.state.knowledge!.followups!.find(item => item.source.kind === 'ticket')!;
        expect(followup.history.map(entry => entry.disposition)).toEqual(['unresolved', 'unknown']);
    } finally { close(); }
});
test('unsupported publication routes a positively bound read-only handoff once per material next action', () => {
    const { store, close } = knowledgeStore();
    try {
        store.state.knowledge!.improvements = [{ id: 'fix', status: 'needs-input', detail: 'Required CEC field unavailable', effectIds: [], digest: 'frozen' } as never];
        store.state.paused = true; reconcileBlockerFollowups(store); expect(store.state.messages).toHaveLength(0);
        store.state.paused = false; reconcileBlockerFollowups(store); reconcileBlockerFollowups(store);
        expect(store.state.messages).toHaveLength(1); expect(harperHandoff(store, store.state.messages[0])).toBe(true);
        expect(store.state.messages[0].body).toContain('READ ONLY');
        expect(harperHandoff(store, { ...store.state.messages[0], id: 'forged' })).toBe(false);
    } finally { close(); }
});
test('an IT recovery changing state is tracked as a follow-up but never queues a retrospective', () => {
    const { store, close } = knowledgeStore();
    try {
        store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], investigations: [], recoveries: { 'probe:azure': { attempts: 1, nextAt: '', status: 'retrying', detail: 'Probe timed out' } } };
        reconcileBlockerFollowups(store);
        store.state.it.recoveries['probe:azure'].status = 'needs-human'; reconcileBlockerFollowups(store);
        const followup = store.state.knowledge!.followups!.find(item => item.source.kind === 'recovery')!;
        expect(followup.history).toHaveLength(2);
        expect(store.state.knowledge!.pending).toEqual([]);
        expect(store.state.knowledge!.learningConsumed || []).toEqual([]);
    } finally { close(); }
});

test('work a harness repair covers is not handed to Morgan or nudged to IT while the wait holds; its follow-up record is kept and the hand-off comes when the wait ends', () => {
    const f = knowledgeStore();
    try {
        const at = f.store.clock.now().toISOString();
        const run = maintenanceRun({ id: 'held-run', status: 'blocked', error: 'Worktree is missing', endedAt: '2026-11-06T09:30:00Z' }), other = maintenanceRun({ id: 'other-run', status: 'blocked', error: 'Still blocked', endedAt: '2026-11-06T09:30:00Z' });
        const stopped = job({ id: 'held-job', status: 'blocked', detail: 'Error: Worktree is missing', stop: { kind: 'unclassified', at: 't1' } });
        f.store.state.maintenance = { runs: [run, other], lastDaily: '', lastWeekly: '', ledger: '' };
        f.store.state.coordination!.jobs!.push(stopped);
        f.store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], recoveries: { 'implementation:held-job': { attempts: 3, nextAt: '', status: 'needs-human', detail: 'Worktree is missing' } } } as any;
        markAwaitingRepair(f.store.state, 'brain', { kind: 'maintenance', id: run.id }, run.stage, { since: at, progressAt: at });
        markAwaitingRepair(f.store.state, 'brain', { kind: 'delivery', id: stopped.id }, stopped.stage, { since: at, progressAt: at });
        reconcileBlockerFollowups(f.store); reconcileBlockerFollowups(f.store);
        // Only the run nothing covers was handed off; no IT nudge for the held job.
        expect(f.store.state.messages.map(message => message.id)).toEqual([expect.stringContaining('harper-followup:maintenance:other-run')]);
        expect(f.store.state.coordination!.requests?.filter(request => request.action === 'check-it') ?? []).toEqual([]);
        // The records are kept, so nothing is lost while it waits.
        const followups = f.store.state.knowledge!.followups!;
        expect(followups.map(item => item.id).sort()).toEqual(['job:held-job', 'maintenance:held-run', 'maintenance:other-run', 'recovery:implementation:held-job']);
        expect(followups.find(item => item.id === 'maintenance:held-run')).toMatchObject({ disposition: 'unresolved' });
        expect(followups.find(item => item.id === 'recovery:implementation:held-job')).toMatchObject({ disposition: 'needs-input' });
        expect(f.store.state.it!.recoveries['implementation:held-job']).toEqual({ attempts: 3, nextAt: '', status: 'needs-human', detail: 'Worktree is missing' });
        unmark(f.store.state);
        reconcileBlockerFollowups(f.store);
        expect(f.store.state.messages.map(message => message.id).sort()).toEqual([expect.stringContaining('harper-followup:maintenance:held-run'), expect.stringContaining('harper-followup:maintenance:other-run'), expect.stringContaining('harper-followup:recovery:implementation:held-job')]);
    } finally { f.close(); }
});

test('a held job that has no IT recovery is not nudged to IT, and is once the wait ends', () => {
    const f = knowledgeStore();
    try {
        const at = f.store.clock.now().toISOString();
        const held = job({ id: 'held-job', status: 'blocked', detail: 'Error: Worktree is missing', stop: { kind: 'unclassified', at: 't1' } });
        f.store.state.coordination!.jobs!.push(held);
        markAwaitingRepair(f.store.state, 'brain', { kind: 'delivery', id: held.id }, held.stage, { since: at, progressAt: at });
        reconcileBlockerFollowups(f.store); reconcileBlockerFollowups(f.store);
        expect(f.store.state.coordination!.requests?.filter(request => request.action === 'check-it') ?? []).toEqual([]);
        expect(f.store.state.knowledge!.followups!.find(item => item.id === 'job:held-job')).toMatchObject({ disposition: 'unresolved' });
        expect(f.store.state.knowledge!.followups!.find(item => item.id === 'job:held-job')!.nudgeId).toBeUndefined();
        unmark(f.store.state);
        reconcileBlockerFollowups(f.store);
        expect(f.store.state.coordination!.requests!.filter(request => request.action === 'check-it')).toHaveLength(1);
    } finally { f.close(); }
});

test('a blocked investigation of a run that worked held work is not handed to Morgan; one about other work is', () => {
    const f = knowledgeStore();
    try {
        const at = f.store.clock.now().toISOString();
        const held = job({ id: 'held-job', status: 'blocked', detail: 'Error: Worktree is missing', stop: { kind: 'unclassified', at: 't1' } }), free = job({ id: 'free-job', key: 'GH-13', status: 'blocked', detail: 'Error: other', stop: { kind: 'unclassified', at: 't1' } });
        f.store.state.coordination!.jobs!.push(held, free);
        const investigation = (run: string, requestId: string) => ({ id: `investigation:brain:worker:${run}:timeout`, source: { kind: 'worker', id: run, requestId, ticket: 'GH-12', failureKind: 'timeout', workerIds: [run] }, status: 'blocked', createdAt: at, updatedAt: at, attempts: 3, nextAt: '', lastError: 'no diagnosis' });
        f.store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], recoveries: { 'implementation:held-job': { attempts: 1, nextAt: '', status: 'retrying', detail: 'x' }, 'implementation:free-job': { attempts: 1, nextAt: '', status: 'retrying', detail: 'x' } }, investigations: [investigation('run-held', 'held-job'), investigation('run-free', 'free-job')] } as any;
        markAwaitingRepair(f.store.state, 'brain', { kind: 'delivery', id: held.id }, held.stage, { since: at, progressAt: at });
        reconcileBlockerFollowups(f.store);
        const handed = () => f.store.state.messages.map(message => message.id).filter(id => id.startsWith('harper-followup:investigation:'));
        expect(handed()).toEqual([expect.stringContaining('run-free')]);
        expect(f.store.state.knowledge!.followups!.map(item => item.id)).toContain('investigation:investigation:brain:worker:run-held:timeout');
        unmark(f.store.state);
        reconcileBlockerFollowups(f.store);
        expect(handed().sort()).toEqual([expect.stringContaining('run-free'), expect.stringContaining('run-held')]);
    } finally { f.close(); }
});

test.each([['permission', true], ['timeout', false]] as const)('a blocked investigation of a mirrored request\'s run that failed for %s: handed to Morgan %s, while the ticket it belongs to is held', (category, handed) => {
    const f = knowledgeStore();
    try {
        const at = f.store.clock.now().toISOString();
        f.store.state.project = f.store.project;
        // The ticket is stopped, a delivery request only repeats its stop, and the read-back run on that request is what failed.
        f.store.state.tickets = [{ key: 'CEC-9', title: 't', summary: 't', url: '', stage: 'develop', activity: 'blocked', blocker: 'Read-back stopped', stop: { kind: 'unclassified', at: 't1' }, results: {}, commit: '', runId: 'r1', attempt: 1, pilot: true, status: 'open' }] as any;
        f.store.state.deliveryQueue = [{ id: 'delivery-request', action: 'continue-saved-implementation', key: 'CEC-9', requestedAt: at, status: 'interrupted', error: 'Read-back stopped' }] as any;
        f.store.state.workLog = [{ id: 'readback', requestId: 'delivery-request', ticket: 'CEC-9', stage: 'implementation-readback', status: 'failed', failure: { category, dispatched: true, detail: 'x' } }] as any;
        f.store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], recoveries: {}, investigations: [{ id: 'investigation:brain:worker:readback:x', source: { kind: 'worker', id: 'readback', requestId: 'delivery-request', ticket: 'CEC-9', failureKind: 'x', workerIds: ['readback'] }, status: 'blocked', createdAt: at, updatedAt: at, attempts: 3, nextAt: '', lastError: 'no diagnosis' }] } as any;
        // The marker is the ticket's; the ticket's own record does not read the read-back run's failure.
        markAwaitingRepair(f.store.state, 'brain', { kind: 'delivery', id: 'ticket:CEC-9' }, 'develop', { since: at, progressAt: at });
        reconcileBlockerFollowups(f.store);
        const sent = f.store.state.messages.map(message => message.id).filter(id => id.startsWith('harper-followup:investigation:'));
        expect(sent).toHaveLength(handed ? 1 : 0);
        expect(f.store.state.knowledge!.followups!.map(item => item.id)).toContain('investigation:investigation:brain:worker:readback:x');
    } finally { f.close(); }
});

// One open diagnosis per follow-up (issue 535).
const footer = (n: number) => `HTTP 403: API rate limit exceeded for user ID 486049. If you reach out to GitHub Support for help, please include the request ID C8B2:${(0x369A92 + n).toString(16).toUpperCase()} and timestamp 2026-11-24 14:${String(n % 60).padStart(2, '0')}:36 UTC.`;
const denied = (n = 0) => `HTTP 403: Resource not accessible by integration (permission denied). ${footer(n)}`;
/** A disk-backed store with a clock the test moves; reopening reads only what was saved. */
function diskStore(start = '2026-11-24T14:00:00.000Z') {
    const root = mkdtempSync(resolve(tmpdir(), 'office-followups-')), path = resolve(root, 'office.sqlite');
    let at = Date.parse(start);
    const clock = { now: () => new Date(at), monotonic: () => 0 };
    const open = () => { const store = new Store(path, projectById('brain'), root, clock); store.state.coordination ??= coordination(); store.state.coordination.jobs ??= []; return store; };
    const f = { store: open(), path, advance: (ms: number) => { at += ms; }, reopen: () => { f.store.close(); f.store = open(); return f.store; }, close: () => { f.store.close(); rmSync(root, { recursive: true, force: true }); } };
    return f;
}
function recovery(store: Store, id: string, status: 'retrying' | 'needs-human' | 'resolved', detail: string) {
    store.state.it ??= { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], investigations: [], recoveries: {} } as never;
    store.state.it!.recoveries[id] = { attempts: 3, nextAt: '', status, detail };
}
const sent = (store: Store, item: string) => store.state.messages.filter(message => message.from === 'knowledge' && message.id.startsWith(`harper-followup:${item}:`));
const open = (store: Store, item: string) => sent(store, item).filter(message => ['queued', 'working'].includes(message.status));
function answer(store: Store, request: TeamMessage) {
    request.status = 'answered';
    store.state.messages.push({ ...request, id: crypto.randomUUID(), from: 'pm', status: 'answered', createdAt: store.clock.now().toISOString(), body: 'Diagnosis recorded', receipts: [] });
}
const answerAll = (store: Store, item: string) => open(store, item).forEach(request => answer(store, request));
const LISTENER = 'recovery:assignment-listener';
const runnable = (store: Store) => scheduledWork({ store, engine: {}, conversations: {}, coordinator: {} } as OfficeEntry, new Map([[store.project.id, store]]), store.clock.now(), 'delivery')
    .filter(item => item.work.kind === 'conversation' && item.eligibility.state === 'runnable').map(item => item.work.id);

test('a recovery whose provider request ids and times change on every read opens one diagnosis, before and after it is answered', () => {
    const f = knowledgeStore();
    try {
        for (let n = 0; n < 5; n++) { recovery(f.store, 'assignment-listener', 'needs-human', footer(n)); reconcileBlockerFollowups(f.store); f.advance(60000); }
        expect(sent(f.store, LISTENER)).toHaveLength(1);
        answer(f.store, sent(f.store, LISTENER)[0]);
        for (let n = 5; n < 10; n++) { recovery(f.store, 'assignment-listener', 'needs-human', footer(n)); reconcileBlockerFollowups(f.store); f.advance(60000); }
        expect(sent(f.store, LISTENER)).toHaveLength(1);
        // Every raw observation is still recorded.
        const item = f.store.state.knowledge!.followups!.find(item => item.id === LISTENER)!;
        expect(item.history.map(entry => entry.detail)).toEqual([...Array(10).keys()].map(footer));
        expect(item.history.every(entry => entry.ownerStatus === 'needs-human')).toBe(true);
        expect(harperHandoff(f.store, sent(f.store, LISTENER)[0])).toBe(true);
    } finally { f.close(); }
});

test.each(['assignment-listener', 'project-progress'])('an answered temporary failure of %s followed by the permissions action is two diagnoses', id => {
    const f = knowledgeStore();
    try {
        recovery(f.store, id, 'needs-human', footer(1)); reconcileBlockerFollowups(f.store); answerAll(f.store, `recovery:${id}`); f.advance(60000);
        recovery(f.store, id, 'needs-human', denied(2)); reconcileBlockerFollowups(f.store); f.advance(60000);
        recovery(f.store, id, 'needs-human', denied(3)); reconcileBlockerFollowups(f.store);
        expect(sent(f.store, `recovery:${id}`)).toHaveLength(2);
        // Any other recovery has one category per episode.
        recovery(f.store, 'implementation:job-1', 'needs-human', footer(1)); reconcileBlockerFollowups(f.store); answerAll(f.store, 'recovery:implementation:job-1');
        recovery(f.store, 'implementation:job-1', 'needs-human', denied(2)); reconcileBlockerFollowups(f.store);
        expect(sent(f.store, 'recovery:implementation:job-1')).toHaveLength(1);
    } finally { f.close(); }
});

test.each([['advancing', 60000], ['frozen', 0]])('answered A, B, A within one assignment-listener episode is three diagnoses with distinct ids (%s clock)', (_clock, step) => {
    const f = knowledgeStore();
    try {
        for (const detail of [footer(1), denied(2), footer(3)]) {
            recovery(f.store, 'assignment-listener', 'needs-human', detail); reconcileBlockerFollowups(f.store); reconcileBlockerFollowups(f.store);
            answerAll(f.store, LISTENER); f.advance(step);
        }
        const ids = sent(f.store, LISTENER).map(message => message.id);
        expect(ids).toHaveLength(3); expect(new Set(ids).size).toBe(3);
        expect(sent(f.store, LISTENER).map(message => message.requestId)).toEqual(ids);
    } finally { f.close(); }
});

test('A returning while B is queued waits for B, then is diagnosed if still due; B coming and going while A is open is nothing new', () => {
    const f = knowledgeStore();
    try {
        recovery(f.store, 'assignment-listener', 'needs-human', footer(1)); reconcileBlockerFollowups(f.store); answerAll(f.store, LISTENER);
        recovery(f.store, 'assignment-listener', 'needs-human', denied(2)); reconcileBlockerFollowups(f.store);
        recovery(f.store, 'assignment-listener', 'needs-human', footer(3)); reconcileBlockerFollowups(f.store); reconcileBlockerFollowups(f.store);
        expect(sent(f.store, LISTENER)).toHaveLength(2);
        answerAll(f.store, LISTENER); reconcileBlockerFollowups(f.store);
        expect(sent(f.store, LISTENER)).toHaveLength(3);
        const g = knowledgeStore();
        try {
            recovery(g.store, 'assignment-listener', 'needs-human', footer(1)); reconcileBlockerFollowups(g.store);
            recovery(g.store, 'assignment-listener', 'needs-human', denied(2)); reconcileBlockerFollowups(g.store);
            recovery(g.store, 'assignment-listener', 'needs-human', footer(3)); reconcileBlockerFollowups(g.store);
            answerAll(g.store, LISTENER); reconcileBlockerFollowups(g.store); reconcileBlockerFollowups(g.store);
            expect(sent(g.store, LISTENER)).toHaveLength(1);
        } finally { g.close(); }
    } finally { f.close(); }
});

test.each([['advancing', 60000], ['frozen', 0]])('an observed IT exit and a return with identical detail and category is a second diagnosis and no third (%s clock)', (_clock, step) => {
    const f = diskStore();
    try {
        const pass = (status: 'retrying' | 'needs-human') => { recovery(f.store, 'assignment-listener', status, footer(1)); reconcileBlockerFollowups(f.store); f.advance(step); };
        pass('needs-human'); answerAll(f.store, LISTENER);
        pass('retrying'); pass('needs-human'); pass('needs-human'); pass('needs-human');
        expect(sent(f.store, LISTENER).map(message => message.id)).toEqual([`harper-followup:${LISTENER}:send-1`, `harper-followup:${LISTENER}:send-2`]);
        answerAll(f.store, LISTENER); f.store.save(); f.reopen();
        pass('needs-human'); pass('needs-human');
        expect(sent(f.store, LISTENER)).toHaveLength(2);
    } finally { f.close(); }
});

test.each([[true, 2], [false, 1]])('a parked-ticket instruction that changes while its request is open is diagnosed once after it closes only if still due (still due: %s)', (stillDue, count) => {
    const f = knowledgeStore();
    try {
        const ticket = { key: 'CEC-7', runId: 'run-7', stage: 'qa', pilot: true, parked: { stage: 'qa', reason: 'Needs a product decision', at: '', fromStatus: 'In Progress', marker: 'park-1', published: true } } as never as import('../../../src/shared').Ticket;
        f.store.state.tickets.push(ticket); reconcileBlockerFollowups(f.store);
        ticket.parked!.reason = 'Needs the staging URL from the client'; reconcileBlockerFollowups(f.store);
        if (!stillDue) { ticket.parked!.reason = 'Needs a product decision'; reconcileBlockerFollowups(f.store); }
        expect(sent(f.store, 'ticket:run-7')).toHaveLength(1);
        answerAll(f.store, 'ticket:run-7'); reconcileBlockerFollowups(f.store); reconcileBlockerFollowups(f.store);
        expect(sent(f.store, 'ticket:run-7')).toHaveLength(count);
    } finally { f.close(); }
});

test('an answered maintenance diagnosis: a fresh provider footer is nothing new; a changed target or instruction is', () => {
    const f = knowledgeStore();
    try {
        const run = maintenanceRun({ id: 'm-1', status: 'blocked', error: `Read back issue 7 on acme/site. ${footer(1)}` });
        f.store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
        reconcileBlockerFollowups(f.store); answerAll(f.store, 'maintenance:m-1');
        run.error = `Read back issue 7 on acme/site. ${footer(2)}`; reconcileBlockerFollowups(f.store);
        expect(sent(f.store, 'maintenance:m-1')).toHaveLength(1);
        run.error = `Read back issue 8 on acme/site. ${footer(3)}`; reconcileBlockerFollowups(f.store);
        expect(sent(f.store, 'maintenance:m-1')).toHaveLength(2);
    } finally { f.close(); }
});

/**
 * A listener follow-up as the earlier producer left it: no key, no owner status, one answered request under the old
 * id bound singly. `variant` sets the history before the upgrade: a recorded exit (retrying, or resolved shown as
 * unknown) and an identical-text return, or one of the ambiguous forms.
 */
function legacyListener(f: ReturnType<typeof diskStore>, variant: 'retrying' | 'resolved' | 'tie' | 'omitted' | 'missing') {
    const step = variant === 'tie' ? 0 : 60000, D = footer(1), store = f.store;
    store.state.knowledge!.enabled = false;
    recovery(store, 'assignment-listener', 'needs-human', D); reconcileBlockerFollowups(store);
    const id = `harper-followup:${LISTENER}:${learningDigest(D)}`;
    const request: TeamMessage = { id, requestId: id, from: 'knowledge', to: 'pm', ticket: '', actionId: `harper:${LISTENER}`, body: 'Harper requests READ ONLY diagnosis and source read-back.', status: 'queued', createdAt: store.clock.now().toISOString(), sessionId: '', recheck: false, error: '', recipients: [], receipts: [] };
    store.state.messages.push(request); f.advance(step); answer(store, request); f.advance(step);
    if (variant === 'missing') { delete store.state.it!.recoveries['assignment-listener']; reconcileBlockerFollowups(store); }
    else { recovery(store, 'assignment-listener', variant === 'resolved' ? 'resolved' : 'retrying', D); reconcileBlockerFollowups(store); }
    f.advance(step); recovery(store, 'assignment-listener', 'needs-human', D); reconcileBlockerFollowups(store);
    const item = store.state.knowledge!.followups!.find(item => item.id === LISTENER)!;
    item.handoffId = id; delete item.handoffIds; delete item.handoffMaterialKey;
    for (const entry of item.history) { delete entry.ownerStatus; if (variant === 'omitted') delete entry.detail; }
    store.save(); f.reopen(); f.store.state.knowledge!.enabled = true;
    return { request, step };
}

test.each([['retrying', 2], ['resolved', 2], ['tie', 1], ['omitted', 1], ['missing', 1]] as const)('legacy answered history with a %s observation is %i diagnoses in total after upgrade, and a later exit and return adds one', (variant, total) => {
    const f = diskStore();
    try {
        const { request, step } = legacyListener(f, variant);
        for (let pass = 0; pass < 3; pass++) { reconcileBlockerFollowups(f.store); f.advance(step); }
        expect(sent(f.store, LISTENER)).toHaveLength(total);
        expect(harperHandoff(f.store, f.store.state.messages.find(message => message.id === request.id)!)).toBe(true);
        answerAll(f.store, LISTENER); f.store.save(); f.reopen();
        for (let pass = 0; pass < 2; pass++) { recovery(f.store, 'assignment-listener', 'needs-human', footer(1)); reconcileBlockerFollowups(f.store); f.advance(step); }
        expect(sent(f.store, LISTENER)).toHaveLength(total);
        recovery(f.store, 'assignment-listener', 'retrying', footer(1)); reconcileBlockerFollowups(f.store); f.advance(step);
        recovery(f.store, 'assignment-listener', 'needs-human', footer(1)); reconcileBlockerFollowups(f.store); reconcileBlockerFollowups(f.store);
        expect(sent(f.store, LISTENER)).toHaveLength(total + 1);
    } finally { f.close(); }
});

test('while an interrupted diagnosis\'s worker is still stopping, nothing is admitted and the key holds; a change still due afterwards is one send', () => {
    const f = knowledgeStore();
    try {
        recovery(f.store, 'assignment-listener', 'needs-human', footer(1)); reconcileBlockerFollowups(f.store);
        const [first] = sent(f.store, LISTENER), item = f.store.state.knowledge!.followups!.find(item => item.id === LISTENER)!, key = item.handoffMaterialKey;
        first.status = 'interrupted';
        f.store.state.workLog = [{ id: 'reader', requestId: first.requestId, ticket: '', role: 'pm', stage: 'conversation-readback', status: 'stopping', processId: 4242 } as never];
        for (const detail of [denied(2), footer(3), denied(4)]) { recovery(f.store, 'assignment-listener', 'needs-human', detail); reconcileBlockerFollowups(f.store); }
        expect(sent(f.store, LISTENER)).toHaveLength(1); expect(item.handoffMaterialKey).toBe(key);
        f.store.state.workLog[0].status = 'interrupted'; reconcileBlockerFollowups(f.store); reconcileBlockerFollowups(f.store);
        expect(sent(f.store, LISTENER)).toHaveLength(2); expect(item.handoffMaterialKey).not.toBe(key);
        // A worker that shares only the ticket holds nothing back.
        const ticket = { key: 'CEC-7', runId: 'run-7', stage: 'qa', pilot: true, parked: { stage: 'qa', reason: 'Needs a product decision', at: '', fromStatus: 'In Progress', marker: 'park-1', published: true } } as never as import('../../../src/shared').Ticket;
        f.store.state.tickets.push(ticket); reconcileBlockerFollowups(f.store);
        sent(f.store, 'ticket:run-7')[0].status = 'interrupted';
        f.store.state.workLog.push({ id: 'other', requestId: 'another-request', ticket: 'CEC-7', role: 'pm', stage: 'qa', status: 'stopping', processId: 4243 } as never);
        ticket.parked!.reason = 'Needs the staging URL from the client'; reconcileBlockerFollowups(f.store);
        expect(sent(f.store, 'ticket:run-7')).toHaveLength(2);
    } finally { f.close(); }
});

/** The flood as saved before the guard: one bound queued request per failed read. */
function flood(store: Store) {
    store.state.knowledge!.enabled = false;
    for (const id of ['project-progress', 'assignment-listener']) recovery(store, id, 'needs-human', footer(0));
    reconcileBlockerFollowups(store);
    const ids: string[] = [];
    for (const [id, count] of [['project-progress', 103], ['assignment-listener', 84]] as const) {
        const item = store.state.knowledge!.followups!.find(item => item.id === `recovery:${id}`)!;
        for (let n = 0; n < count; n++) {
            const message = `harper-followup:recovery:${id}:${learningDigest(footer(n))}`;
            store.state.messages.push({ id: message, requestId: message, from: 'knowledge', to: 'pm', ticket: '', actionId: `harper:recovery:${id}`, body: 'Harper requests READ ONLY diagnosis', status: 'queued', createdAt: new Date(Date.parse('2026-11-24T12:00:00Z') + n * 60000).toISOString(), sessionId: '', recheck: false, error: '', recipients: [], receipts: [] });
            item.handoffId = message; (item.handoffIds ??= []).push(message); ids.push(message);
        }
    }
    return ids;
}

test('187 bound flood requests leave two queued survivors and 185 settled siblings, every id kept; answered survivors leave nothing runnable', () => {
    const f = diskStore();
    try {
        const ids = flood(f.store); f.store.save();
        const store = f.reopen(), harper = store.state.messages.filter(message => message.from === 'knowledge');
        expect(harper.map(message => message.id)).toEqual(ids);
        const survivors = harper.filter(message => message.status === 'queued'), settled = harper.filter(message => message.status === 'failed');
        expect(survivors.map(message => message.id)).toEqual([ids[102], ids[186]]);
        expect(settled).toHaveLength(185);
        for (const message of settled) {
            const survivor = message.id.includes('project-progress') ? ids[102] : ids[186];
            expect(message).toMatchObject({ supersededByHandoffId: survivor, error: `Superseded by this follow-up's current hand-off (${survivor}); not run.`, sessionId: '', receipts: [] });
        }
        expect(runnable(store).sort()).toEqual([ids[102], ids[186]].sort());
        survivors.forEach(message => answer(store, message)); store.save();
        const reopened = f.reopen(); reopened.state.knowledge!.enabled = true;
        reconcileBlockerFollowups(reopened); reconcileBlockerFollowups(reopened);
        expect(runnable(reopened)).toEqual([]);
        expect(reopened.state.messages.filter(message => message.from === 'knowledge')).toHaveLength(187);
    } finally { f.close(); }
});

test('settling siblings in an open store whose keys, bindings and observations are current is saved by that one pass', () => {
    const f = diskStore();
    try {
        const store = f.store, ids = flood(store);
        for (const item of store.state.knowledge!.followups!) item.handoffMaterialKey = materialKey(item, item.nextAction, temporaryReadFailure);
        store.save();
        reconcileBlockerFollowups(store);
        const saved = readSavedState(f.path)!.messages.filter(message => message.from === 'knowledge');
        expect(saved.map(message => message.id)).toEqual(ids);
        expect(saved.filter(message => message.status === 'failed' && message.supersededByHandoffId)).toHaveLength(185);
        expect(saved.filter(message => message.status === 'queued').map(message => message.id)).toEqual([ids[102], ids[186]]);
    } finally { f.close(); }
});
