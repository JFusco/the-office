import { expect, test } from 'vitest';
import { initialSnapshot } from '../../../server/store/store';
import { coordination } from '../../../server/scheduling/coordination';
import { projectOutbox } from '../../../server/conversations/outbox';
import { planReadRetry, readRetryPending, RETRY_PLAN_GRACE_MS } from '../../../server/scheduling/read-retries';

const STOPPED = '2026-11-19T19:46:40.000Z', SOON = new Date('2026-11-19T19:46:50.000Z');
const TIMED_OUT = 'Error: git read timed out; saved observations retained; safe to retry the read';
const job = (extra: Record<string, unknown> = {}) => ({ id: 'job', key: 'GH-173', status: 'blocked', stage: 'lead-pr', requestedAt: '2026-11-19T19:00:00Z', detail: TIMED_OUT, stop: { kind: 'transient', at: STOPPED }, steps: [], pr: 176, prUrl: 'https://example.test/pull/176', ...extra }) as any;
const outbox = (j: any, paused = false, at = SOON) => {
    const state = { ...initialSnapshot(), paused, coordination: coordination() } as any;
    state.coordination.jobs = [j];
    return projectOutbox(state, at).filter(action => action.id === 'ticket-job:job').map(action => action.title);
};

test('a stop the Office will retry by itself is not put to Joe, before or after the retry is scheduled', () => {
    const stopped = job();
    expect(readRetryPending(stopped, SOON)).toBe(true);
    expect(outbox(stopped)).toEqual([]);
    planReadRetry(stopped, new Date('2026-11-19T19:47:07Z'));
    expect(stopped.retry.nextAt).toBeTruthy();
    expect(readRetryPending(stopped, SOON)).toBe(true);
    expect(outbox(stopped)).toEqual([]);
});

test('a stop the Office will not retry, or has stopped retrying, is still put to Joe', () => {
    for (const [name, extra] of [
        ['retries exhausted', { retry: { attempts: 3, nextAt: '', history: [], exhausted: true } }],
        ['a third retry that failed, before the planner records it as exhausted', { retry: { attempts: 3, nextAt: '', history: [], exhausted: false } }],
        ['a stop that is not a temporary read failure', { detail: 'Error: Adopted repair ownership, inputs or effects changed' }],
        ['a permission failure that happens to time out', { detail: 'Error: OAuth token refresh timed out' }],
        ['a writer stage', { stage: 'update-base' }],
        ['a stop with no recorded time', { stop: undefined }],
        ['an attempted merge', { mergeAttempt: { head: 'a'.repeat(40) } }],
        ['an unsettled write on the job', { steps: [{ stage: 'draft', result: { receipts: [{ action: 'git-push', verified: false, uncertain: true }] } }] }],
    ] as const) {
        const stopped = job(extra);
        expect(readRetryPending(stopped, SOON), name).toBe(false);
        expect(outbox(stopped), name).toEqual(['Read back GH-173 delivery']);
    }
    // Retries are not planned while the Office is paused, so the stop is shown.
    expect(outbox(job(), true)).toEqual(['Read back GH-173 delivery']);
    // A job that is not stopped is never pending a retry.
    expect(readRetryPending(job({ status: 'working' }), SOON)).toBe(false);
});

test('an interrupted read and a reply cut off by the output limit are retried the same way', () => {
    expect(outbox(job({ status: 'interrupted' }))).toEqual([]);
    expect(outbox(job({ detail: 'Error: codex exited 1: Incomplete response returned, reason: max_output_tokens' }))).toEqual([]);
});

test('the wait for the planner is bounded: a stop nobody scheduled a retry for within the grace period is put to Joe', () => {
    const late = new Date(Date.parse(STOPPED) + RETRY_PLAN_GRACE_MS + 1000);
    expect(readRetryPending(job(), late)).toBe(false);
    expect(outbox(job(), false, late)).toEqual(['Read back GH-173 delivery']);
    // Once a retry is scheduled the job stays out of the outbox however long the back-off is.
    const scheduled = job();
    planReadRetry(scheduled, SOON);
    expect(readRetryPending(scheduled, late)).toBe(true);
    expect(outbox(scheduled, false, late)).toEqual([]);
});
