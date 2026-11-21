import { test, expect } from 'vitest';
import { reconcileBlockerFollowups, harperHandoff } from '../../../server/knowledge/blocker-followups';
import { job, knowledgeStore, maintenanceRun } from './knowledge-fixture';
import { markAwaitingRepair, unmark } from '../incidents/repair/mark-fixture';
import { learningMetrics } from '../../../server/knowledge/learning-metrics';
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
