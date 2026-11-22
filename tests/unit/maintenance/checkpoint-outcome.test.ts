import { expect, test } from 'vitest';
import { checkpointOutcome } from '../../../server/maintenance/checkpoint-outcome';

const run = (status: string, extra: Record<string, unknown> = {}) => ({ id: 'run', status, stage: 'brain-completed', error: '', ...extra }) as never;

test('a checkpoint takes the status of its ended run, with the run\'s error or its final stage as the detail', () => {
    expect(checkpointOutcome(run('completed'))).toEqual({ status: 'completed', detail: 'Maintenance run: brain-completed' });
    expect(checkpointOutcome(run('blocked', { stage: 'vendor-review', error: 'Vendor evidence missing' }))).toEqual({ status: 'blocked', detail: 'Vendor evidence missing' });
    expect(checkpointOutcome(run('interrupted', { stage: 'follow-up' }))).toEqual({ status: 'interrupted', detail: 'Maintenance run: follow-up' });
});

test.each(['queued', 'working', 'reconciled', 'cancelled'])('a run that is %s has not ended for its checkpoint', status => {
    expect(checkpointOutcome(run(status))).toBeUndefined();
});

test('a checkpoint with no run has no outcome', () => {
    expect(checkpointOutcome(undefined)).toBeUndefined();
});
