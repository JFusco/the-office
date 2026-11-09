import { test, expect } from 'vitest';
import { reconcileBlockerFollowups, harperHandoff } from '../../../server/knowledge/blocker-followups';
import { job, knowledgeStore, maintenanceRun } from './knowledge-fixture';
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
        expect(store.state.knowledge!.procedureUses).toHaveLength(1);
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
