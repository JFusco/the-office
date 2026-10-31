import { expect, test } from 'vitest';
import { incompleteReadOutput, planReadRetry, temporaryReadFailure } from '../../../server/scheduling/read-retries';

const cutoff = 'Error: codex exited 1: Incomplete response returned, reason: max_output_tokens';
test('an output-limit cutoff on a read-only stage is retried without widening the transient-read classifier', () => {
    expect(incompleteReadOutput(cutoff)).toBe(true);
    expect(temporaryReadFailure(cutoff)).toBe(false);
    const job = { status: 'blocked', detail: cutoff } as any;
    const t0 = new Date('2026-10-31T17:00:00Z');
    expect(planReadRetry(job, t0)).toBe(true);
    expect(job.status).toBe('blocked');
    expect(planReadRetry(job, new Date(t0.getTime() + 31000))).toBe(true);
    expect(job).toMatchObject({ status: 'queued' });
    expect(job.retry.attempts).toBe(1);
});
test('auth and token failures still are not retried', () => {
    expect(planReadRetry({ status: 'blocked', detail: 'codex exited 1: invalid oauth token' } as any, new Date())).toBe(false);
});
