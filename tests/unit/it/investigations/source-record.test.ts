import { expect, test } from 'vitest';
import { investigatedRecord } from '../../../../server/it/investigations/source-record';
import { coordination } from '../../../../server/scheduling/coordination';
import { initialSnapshot } from '../../../../server/store/store';

const source = (over: Record<string, unknown> = {}) => ({ kind: 'worker' as const, id: 'run-1', requestId: '', ticket: '', failureKind: 'timeout', workerIds: ['run-1'], ...over });
function state() {
    const state = { ...initialSnapshot(), coordination: coordination() } as any;
    state.coordination.jobs = [{ id: 'job-1', key: 'GH-1' }];
    state.coordination.listener.reviews = [{ id: 'rv-1', key: 'GH-2' }];
    state.coordination.checkpoints = [{ id: 'cp-1' }];
    state.coordination.requests = [{ id: 'req-1' }];
    state.deliveryQueue = [{ id: 'delivery-1', key: 'CEC-9' }];
    state.maintenance = { runs: [{ id: 'mr-1' }] };
    return state;
}

test('a failed run with a request belongs to the record that request is, by the kind of that record', () => {
    for (const [requestId, kind] of [['job-1', 'delivery'], ['delivery-1', 'delivery'], ['rv-1', 'intake'], ['mr-1', 'maintenance'], ['cp-1', 'checkpoint'], ['req-1', 'reconciliation']] as const)
        expect(investigatedRecord(state(), source({ requestId }))).toEqual({ kind, id: requestId });
    expect(investigatedRecord(state(), source({ requestId: 'CEC-9' }))).toBeNull();
    expect(investigatedRecord(state(), source({ requestId: 'unknown' }))).toBeNull();
    // A notice lookup and a conversation run carry the notice's or the message's request identity.
    const s = state();
    s.coordination.notices = { policy: {}, entries: [{ id: 'notice-1' }] };
    s.messages = [{ id: 'msg-1', requestId: 'req-msg-1' }];
    expect(investigatedRecord(s, source({ requestId: 'notice-1' }))).toEqual({ kind: 'notice', id: 'notice-1' });
    expect(investigatedRecord(s, source({ requestId: 'req-msg-1' }))).toEqual({ kind: 'conversation', id: 'msg-1' });
});

test('a Slack delivery is about no stopped record, even when a record shares its request ID', () => {
    expect(investigatedRecord(state(), source({ kind: 'slack', id: 'delivery', requestId: 'job-1' }))).toBeNull();
});

test('a stage run without a request belongs to a ticket only when that ticket\'s stop names it as the run that worked it', () => {
    const s = state();
    s.project = { id: 'cec' };
    s.tickets = [{ key: 'CEC-9', stage: 'develop', activity: 'blocked', blocker: 'Worktree is missing', stop: { kind: 'unclassified', at: 't1' }, results: {}, commit: '', runId: 'r1', attempt: 1, pilot: true }];
    s.workLog = [{ id: 'run-1', ticket: 'CEC-9', stage: 'develop', status: 'failed' }, { id: 'run-0', ticket: 'CEC-9', stage: 'research', status: 'failed' }];
    expect(investigatedRecord(s, source())).toEqual({ kind: 'delivery', id: 'ticket:CEC-9' });
    // A run of an earlier stage, or of another ticket, did not work this stop.
    expect(investigatedRecord(s, source({ id: 'run-0', workerIds: ['run-0'] }))).toBeNull();
    expect(investigatedRecord(s, source({ id: 'run-x', workerIds: ['run-x'] }))).toBeNull();
    expect(investigatedRecord(state(), source())).toBeNull();
});

test('a delivery request that only repeats its ticket\'s stop is the ticket; one with a stop of its own is itself', () => {
    const s = state();
    s.project = { id: 'cec' };
    s.tickets = [{ key: 'CEC-9', stage: 'develop', activity: 'blocked', blocker: 'Read-back stopped', stop: { kind: 'unclassified', at: 't1' }, results: {}, commit: '', runId: 'r1', attempt: 1, pilot: true }];
    s.deliveryQueue = [{ id: 'delivery-1', key: 'CEC-9', action: 'continue-saved-implementation', status: 'interrupted', error: 'Read-back stopped', requestedAt: 'r' }];
    expect(investigatedRecord(s, source({ requestId: 'delivery-1' }))).toEqual({ kind: 'delivery', id: 'ticket:CEC-9' });
    // Another error, a request that is not stopped, or no such ticket: the request stands for itself.
    s.deliveryQueue[0].error = 'Something else';
    expect(investigatedRecord(s, source({ requestId: 'delivery-1' }))).toEqual({ kind: 'delivery', id: 'delivery-1' });
    Object.assign(s.deliveryQueue[0], { error: 'Read-back stopped', status: 'completed' });
    expect(investigatedRecord(s, source({ requestId: 'delivery-1' }))).toEqual({ kind: 'delivery', id: 'delivery-1' });
    Object.assign(s.deliveryQueue[0], { status: 'interrupted', key: 'CEC-10' });
    expect(investigatedRecord(s, source({ requestId: 'delivery-1' }))).toEqual({ kind: 'delivery', id: 'delivery-1' });
    // A delivery job with that very ID is the record, whatever a ticket covers.
    s.coordination.jobs.push({ id: 'delivery-1', key: 'GH-9' });
    expect(investigatedRecord(s, source({ requestId: 'delivery-1' }))).toEqual({ kind: 'delivery', id: 'delivery-1' });
    s.coordination.jobs.pop();
    // A ticket that is not itself stopped absorbs nothing: beside it the request is its own subject and carries its own marker.
    s.deliveryQueue[0].key = 'CEC-9';
    expect(investigatedRecord(s, source({ requestId: 'delivery-1' }))).toEqual({ kind: 'delivery', id: 'ticket:CEC-9' });
    s.tickets[0].activity = 'working';
    expect(investigatedRecord(s, source({ requestId: 'delivery-1' }))).toEqual({ kind: 'delivery', id: 'delivery-1' });
});
