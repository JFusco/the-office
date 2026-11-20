import { expect, test } from 'vitest';
import { recoveryRecord } from '../../../server/it/recovery-record';
import { coordination } from '../../../server/scheduling/coordination';
import { initialSnapshot } from '../../../server/store/store';

const JOB = '0b1c2d3e-0000-4000-8000-000000000001', OTHER = '0b1c2d3e-0000-4000-8000-000000000002';
function state() {
    const state = { ...initialSnapshot(), coordination: coordination() } as any;
    state.coordination.jobs = [{ id: JOB, key: 'GH-1' }, { id: OTHER, key: 'GH-2' }];
    state.coordination.checkpoints = [{ id: 'cp-1' }];
    return state;
}

test('a recovery is about the delivery job its ID carries as one whole segment, whatever the family', () => {
    for (const id of [`implementation:${JOB}`, `implementation-audit-binding:${JOB}:abc`, `validation:${JOB}:run-9`, `native-delivery:${JOB}`, `closeout:${JOB}`, `closeout-core:${JOB}:work:sha`, `scope-repair-resume:brain:${JOB}:head:proof`, `pr-preparation:${JOB}`, `stopped-base-update:${JOB}:worker`])
        expect(recoveryRecord(state(), id), id).toEqual({ kind: 'delivery', id: JOB });
    expect(recoveryRecord(state(), `implementation:${OTHER}`)).toEqual({ kind: 'delivery', id: OTHER });
});

test('a checkpoint recovery is about its checkpoint, and a recovery about no record of the project is about none', () => {
    expect(recoveryRecord(state(), 'checkpoint:cp-1')).toEqual({ kind: 'checkpoint', id: 'cp-1' });
    expect(recoveryRecord(state(), 'checkpoint-readback:cp-1')).toEqual({ kind: 'checkpoint', id: 'cp-1' });
    for (const id of ['checkpoint:cp-9', 'session-visibility', 'assignment-listener', 'project-progress', 'listener:brain', `implementation:${JOB}x`, `implementation:x${JOB}`, 'implementation:', 'implementation', ''])
        expect(recoveryRecord(state(), id), id).toBeNull();
    // A checkpoint family never falls through to a job that happens to share the ID.
    const collide = state();
    collide.coordination.jobs.push({ id: 'cp-9', key: 'GH-3' });
    expect(recoveryRecord(collide, 'checkpoint:cp-9')).toBeNull();
    expect(recoveryRecord({ ...initialSnapshot() } as any, `implementation:${JOB}`)).toBeNull();
});

test('a conversation read-back, a service probe and a login are about no record, even when their ID is a job\'s', () => {
    for (const family of ['conversation', 'probe', 'login']) expect(recoveryRecord(state(), `${family}:${JOB}`), family).toBeNull();
    // The family is the first segment only: a job named after a family is still found by its own ID.
    const named = state();
    named.coordination.jobs.push({ id: 'conversation', key: 'GH-4' });
    expect(recoveryRecord(named, 'implementation:conversation')).toEqual({ kind: 'delivery', id: 'conversation' });
    expect(recoveryRecord(named, `${JOB}:implementation`)).toBeNull();
});
