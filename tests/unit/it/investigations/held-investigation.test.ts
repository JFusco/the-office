import { expect, test } from 'vitest';
import { investigationHeld } from '../../../../server/it/investigations/held-investigation';
import { markAwaitingRepair, unmark } from '../../incidents/repair/mark-fixture';
import { investigationFixture } from './fixture';

/** A ticket stopped with one blocker, a delivery request that only repeats it, and the read-back run that failed working the request. */
function mirrored(category = 'timeout') {
    const f = investigationFixture(), { store } = f, at = store.clock.now().toISOString();
    store.state.project = store.project;
    store.state.slackDeliveries = [];
    store.state.tickets = [{ key: 'CEC-9', title: 't', summary: 't', url: '', stage: 'develop', activity: 'blocked', blocker: 'Read-back stopped', stop: { kind: 'unclassified', at: 't1' }, results: {}, commit: '', runId: 'r1', attempt: 1, pilot: true, status: 'open' }] as any;
    store.state.deliveryQueue = [{ id: 'delivery-request', action: 'continue-saved-implementation', key: 'CEC-9', requestedAt: at, status: 'interrupted', error: 'Read-back stopped' }] as any;
    store.state.workLog = [{ id: 'readback', requestId: 'delivery-request', ticket: 'CEC-9', stage: 'implementation-readback', role: 'developer', status: 'failed', processId: 2147483600, startedAt: at, endedAt: at, failure: { category, dispatched: true, detail: 'x' } }] as any;
    const entry = { source: { kind: 'worker' as const, id: 'readback', requestId: 'delivery-request', ticket: 'CEC-9', failureKind: category, workerIds: ['readback'] } };
    const hold = () => markAwaitingRepair(store.state, 'brain', { kind: 'delivery', id: 'ticket:CEC-9' }, 'develop', { since: at, progressAt: at });
    return { ...f, entry, hold };
}

test('an investigation is held while the record its run worked is frozen, and not once the wait ends', () => {
    const f = mirrored(); try {
        expect(investigationHeld(f.store, f.entry)).toBe(false);
        f.hold();
        expect(investigationHeld(f.store, f.entry)).toBe(true);
        f.advance(49 * 60 * 60 * 1000);
        expect(investigationHeld(f.store, f.entry)).toBe(false);
        unmark(f.store.state);
        expect(investigationHeld(f.store, f.entry)).toBe(false);
    } finally { f.close(); }
});

test('a run that itself failed for authority or an unconfirmed write is never held, although the ticket it resolves to is frozen', () => {
    for (const category of ['authentication', 'permission', 'ownership', 'uncertain-effect']) {
        const f = mirrored(category); try {
            f.hold();
            expect(investigationHeld(f.store, f.entry), category).toBe(false);
            // The failure no longer stands once its saved completion was accepted.
            (f.store.state.workLog![0] as any).completionAccepted = true;
            expect(investigationHeld(f.store, f.entry), category).toBe(true);
        } finally { f.close(); }
    }
    // A failure a repair can explain does not stand in the way.
    for (const category of ['timeout', 'transient-read', 'cancelled']) {
        const f = mirrored(category); try { f.hold(); expect(investigationHeld(f.store, f.entry), category).toBe(true); } finally { f.close(); }
    }
});

test('an investigation about no stopped record, or a run without a request judged on its own failure, follows the same rule', () => {
    const f = mirrored(); try {
        f.hold();
        expect(investigationHeld(f.store, { source: { ...f.entry.source, kind: 'slack' } })).toBe(false);
        expect(investigationHeld(f.store, { source: { ...f.entry.source, requestId: 'unknown' } })).toBe(false);
        // A stage run recorded without a request: the ticket's stop must name it, and its own failure is the one read.
        f.store.state.deliveryQueue = [];
        f.store.state.workLog = [{ id: 'stage-run', ticket: 'CEC-9', stage: 'develop', role: 'developer', status: 'failed', processId: 2147483600, failure: { category: 'timeout', dispatched: true, detail: 'x' } }] as any;
        const stage = { source: { kind: 'worker' as const, id: 'stage-run', requestId: '', ticket: 'CEC-9', failureKind: 'timeout', workerIds: ['stage-run'] } };
        expect(investigationHeld(f.store, stage)).toBe(true);
        (f.store.state.workLog![0] as any).failure.category = 'permission';
        expect(investigationHeld(f.store, stage)).toBe(false);
    } finally { f.close(); }
});

test('the diagnosis run of the investigation itself is not the run under investigation: its failure does not release the hold', () => {
    const f = mirrored('timeout'); try {
        f.hold();
        // Ellis's own read-only diagnosis of this request failed for authentication. That says nothing about why the read-back run stopped.
        f.store.state.workLog!.push({ id: 'diagnosis', requestId: 'delivery-request', ticket: 'CEC-9', stage: 'it-investigation', role: 'it', status: 'failed', processId: 2147483601, failure: { category: 'authentication', dispatched: true, detail: 'x' } } as any);
        expect(investigationHeld(f.store, f.entry)).toBe(true);
        // The same failure on the investigated run does.
        (f.store.state.workLog![0] as any).failure.category = 'authentication';
        expect(investigationHeld(f.store, f.entry)).toBe(false);
    } finally { f.close(); }
});
