import { expect, test } from 'vitest';
import { closedTicketRequest, retiredFollowup, supersededCheckpoint, supersededRun, touchesUnsettled } from '../../../server/operations/stale-records';

test('a stopped recovery request is history once its ticket is closed, never while it is open or after it completed', () => {
    const tickets = [{ key: 'GH-310', status: 'closed' }, { key: 'GH-67', status: 'open' }];
    expect(closedTicketRequest({ status: 'blocked', key: 'GH-310' }, tickets)).toMatch(/^Superseded: GH-310 is closed/);
    expect(closedTicketRequest({ status: 'interrupted', key: 'GH-310' }, tickets)).toBeDefined();
    expect(closedTicketRequest({ status: 'blocked', key: 'GH-67' }, tickets)).toBeUndefined();
    expect(closedTicketRequest({ status: 'queued', key: 'GH-310' }, tickets)).toBeUndefined();
    expect(closedTicketRequest({ status: 'completed', key: 'GH-310' }, tickets)).toBeUndefined();
    expect(closedTicketRequest({ status: 'blocked', key: '' }, tickets)).toBeUndefined();
});

test('a missed daily checkpoint is history only after a later day completed', () => {
    const days = [{ id: 'a', date: '2026-11-10', status: 'blocked' as const }, { id: 'b', date: '2026-11-11', status: 'interrupted' as const }, { id: 'c', date: '2026-11-12', status: 'completed' as const }, { id: 'd', date: '2026-11-13', status: 'blocked' as const }];
    expect(supersededCheckpoint(days[0], days)).toBe('Superseded: the 2026-11-12 checkpoint completed; this day\'s stopped checkpoint is kept as history');
    expect(supersededCheckpoint(days[1], days)).toBeDefined();
    expect(supersededCheckpoint(days[3], days)).toBeUndefined();
    expect(supersededCheckpoint(days[2], days)).toBeUndefined();
});

test('a stopped maintenance run is history after a later completed run or explicit supersession, but not while read-back recovery is active', () => {
    const run = (id: string, status: string, requestedAt: string, extra = {}) => ({ id, status, requestedAt, ...extra }) as never;
    const old = run('old', 'blocked', '2026-11-10'), later = run('later', 'completed', '2026-11-12', { stage: 'complete' });
    expect(supersededRun(old, [old, later])).toMatch(/later maintenance run completed/);
    expect(supersededRun(old, [old, run('brain', 'completed', '2026-11-12', { stage: 'brain-completed' })])).toMatch(/later maintenance run completed/);
    expect(supersededRun(old, [old, run('skip', 'completed', '2026-11-12', { stage: 'skipped: backoff' })])).toBeUndefined();
    expect(supersededRun(old, [old, run('next', 'blocked', '2026-11-11', { supersedes: ['old'] })])).toMatch(/proceeded past/);
    expect(supersededRun(old, [old, run('earlier', 'completed', '2026-11-09', { stage: 'complete' })])).toBeUndefined();
    expect(supersededRun(run('old', 'blocked', '2026-11-10', { readbackRetry: { exhausted: false } }), [later])).toBeUndefined();
    expect(supersededRun(run('old', 'blocked', '2026-11-10', { readbackRetry: { exhausted: true } }), [later])).toBeDefined();
    expect(supersededRun(run('done', 'completed', '2026-11-10'), [later])).toBeUndefined();
});

test('a failed read-only Harper hand-off is retired; one that verifies an original\'s writes stays while a reply recorded an unverified receipt', () => {
    const followup = (actionId: string) => ({ id: 'f', requestId: 'r', from: 'knowledge', status: 'failed', actionId }) as { id: string; requestId: string; from: string; status: string; actionId: string };
    const reply = (verified: boolean, uncertain = false) => ({ id: 'a', requestId: 'r', receipts: [{ verified, uncertain }] }) as never;
    expect(retiredFollowup(followup('harper:item') as never, [reply(false)])).toMatch(/Advisory follow-up failed/);
    expect(retiredFollowup(followup('message:orig') as never, [reply(false)])).toBeUndefined();
    expect(retiredFollowup(followup('message:orig') as never, [reply(true, true)])).toBeUndefined();
    expect(retiredFollowup(followup('message:orig') as never, [reply(true)])).toBeDefined();
    expect(retiredFollowup({ ...followup('harper:item'), status: 'interrupted' } as never, [])).toBeUndefined();
    expect(retiredFollowup({ ...followup('harper:item'), from: 'human' } as never, [])).toBeUndefined();
});

test('a missed checkpoint with a recorded re-run path is left alone', () => {
    const done = { id: 'c', date: '2026-11-12', status: 'completed' as const };
    expect(supersededCheckpoint({ id: 'a', date: '2026-11-10', status: 'blocked', repairResume: {} as never }, [done])).toBeUndefined();
    expect(supersededCheckpoint({ id: 'a', date: '2026-11-10', status: 'blocked', continuationId: 'k' }, [done])).toBeUndefined();
});

test('any linked unsettled write, by work key or attempt id, keeps a record stopped', () => {
    const unsettled = { workKeys: new Set(['brain:delivery:job-1']), attempts: new Set(['req-1']) };
    expect(touchesUnsettled(unsettled, [{ projectId: 'brain', kind: 'reconciliation', id: 'req-9' }, { projectId: 'brain', kind: 'delivery', id: 'job-1' }])).toBe(true);
    expect(touchesUnsettled(unsettled, [{ projectId: 'brain', kind: 'reconciliation', id: 'req-1' }])).toBe(true);
    expect(touchesUnsettled(unsettled, [{ projectId: 'brain', kind: 'checkpoint', id: 'cp' }])).toBe(false);
});
