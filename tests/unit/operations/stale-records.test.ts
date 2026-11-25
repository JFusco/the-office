import { expect, test } from 'vitest';
import { closedTicketReport, closedTicketRequest, finishedJobsRequest, retiredFollowup, settledNotice, supersededCheckpoint, supersededDeliveryRequest, supersededEvidenceRequest, supersededHandoff, supersededRun, touchesUnsettled } from '../../../server/operations/stale-records';

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

test('a stopped recovery request is history once every delivery for its ticket is finished, even while the ticket stays open', () => {
    const jobs = [{ key: 'GH-67', status: 'cancelled' }, { key: 'GH-70', status: 'completed' }, { key: 'GH-70', status: 'blocked' }] as never[];
    expect(finishedJobsRequest({ status: 'blocked', key: 'GH-67', action: 'resume-discovery' }, jobs)).toMatch(/^Superseded: every GH-67 delivery is finished/);
    expect(finishedJobsRequest({ status: 'interrupted', key: 'GH-67', action: 'reconcile-activation' }, jobs)).toBeDefined();
    expect(finishedJobsRequest({ status: 'blocked', key: 'GH-70', action: 'reconcile-implementation' }, jobs)).toBeUndefined();
    expect(finishedJobsRequest({ status: 'blocked', key: 'GH-99', action: 'reconcile-implementation' }, jobs)).toBeUndefined();
    expect(finishedJobsRequest({ status: 'blocked', key: 'GH-67', action: 'cleanup-merged-candidate' }, jobs)).toBeUndefined();
    expect(finishedJobsRequest({ status: 'blocked', key: 'GH-67', action: 'reconcile-cost' }, jobs)).toBeUndefined();
    expect(finishedJobsRequest({ status: 'blocked', key: 'GH-67', action: 'reconcile-time' }, jobs)).toBeUndefined();
    expect(finishedJobsRequest({ status: 'queued', key: 'GH-67', action: 'resume-discovery' }, jobs)).toBeUndefined();
});

test('a stopped Start or Resume is history only after a later request for the same ticket completed', () => {
    const request = (id: string, status: string, requestedAt: string, key = 'CEC-154', action = 'resume-ticket') => ({ id, key, action, status, requestedAt }) as never;
    const stopped = request('a', 'blocked', '2026-11-14T01:00:00Z');
    expect(supersededDeliveryRequest(stopped, [stopped, request('b', 'completed', '2026-11-14T02:00:00Z')])).toMatch(/later CEC-154 request completed/);
    expect(supersededDeliveryRequest(stopped, [stopped, request('b', 'completed', '2026-11-13T02:00:00Z')])).toBeUndefined();
    expect(supersededDeliveryRequest(stopped, [stopped, request('b', 'blocked', '2026-11-14T02:00:00Z')])).toBeUndefined();
    expect(supersededDeliveryRequest(stopped, [stopped, request('b', 'completed', '2026-11-14T02:00:00Z', 'CEC-9')])).toBeUndefined();
    expect(supersededDeliveryRequest(request('a', 'queued', '2026-11-14T01:00:00Z'), [request('b', 'completed', '2026-11-14T02:00:00Z')])).toBeUndefined();
    expect(supersededDeliveryRequest(request('a', 'blocked', '2026-11-14T01:00:00Z', 'CEC-154', 'continue-saved-implementation'), [request('b', 'completed', '2026-11-14T02:00:00Z')])).toBeUndefined();
});

test('an unconfirmed notice is history only once its delivery is settled', () => {
    expect(settledNotice({ status: 'uncertain' }, true)).toMatch(/verified replacement delivery/);
    expect(settledNotice({ status: 'uncertain' }, false)).toBeUndefined();
    expect(settledNotice({ status: 'failed' }, true)).toBeUndefined();
});

test('a failed Ellis report is history once its ticket closed; other senders and open tickets are left alone', () => {
    const tickets = [{ key: 'GH-159', status: 'closed' }, { key: 'GH-67', status: 'open' }];
    const report = (extra = {}) => ({ id: 'it-report:x', from: 'it', status: 'failed', ticket: 'GH-159', ...extra }) as never;
    expect(closedTicketReport(report(), tickets)).toMatch(/^Superseded: GH-159 is closed/);
    expect(closedTicketReport(report({ ticket: 'GH-67' }), tickets)).toBeUndefined();
    expect(closedTicketReport(report({ ticket: '' }), tickets)).toBeUndefined();
    expect(closedTicketReport(report({ from: 'human' }), tickets)).toBeUndefined();
    expect(closedTicketReport(report({ id: 'plain' }), tickets)).toBeUndefined();
    expect(closedTicketReport(report({ status: 'interrupted' }), tickets)).toBeUndefined();
});

test('a failed goal evidence request is history only after a later request covering the same goals was answered', () => {
    const ask = (id: string, status: string, createdAt: string, extra: Record<string, unknown> = {}) => ({ id: `goal-evidence:${id}`, from: 'cto', status, createdAt, goalEvidenceRequest: { projectId: 'cec', goalIds: ['g1', 'g2'] }, ...extra }) as never;
    const failed = ask('a', 'failed', '2026-11-01T22:00:00Z');
    expect(supersededEvidenceRequest(failed, [failed, ask('b', 'answered', '2026-11-02T22:00:00Z')])).toMatch(/later goal evidence request was answered/);
    expect(supersededEvidenceRequest(failed, [failed, ask('b', 'answered', '2026-11-02T22:00:00Z', { goalEvidenceRequest: { projectId: 'cec', goalIds: ['g1', 'g2', 'g3'] } })])).toBeDefined();
    expect(supersededEvidenceRequest(failed, [failed, ask('b', 'answered', '2026-10-31T22:00:00Z')])).toBeUndefined();
    expect(supersededEvidenceRequest(failed, [failed, ask('b', 'failed', '2026-11-02T22:00:00Z')])).toBeUndefined();
    expect(supersededEvidenceRequest(failed, [failed, ask('b', 'answered', '2026-11-02T22:00:00Z', { goalEvidenceRequest: { projectId: 'brain', goalIds: ['g1', 'g2'] } })])).toBeUndefined();
    expect(supersededEvidenceRequest(failed, [failed, ask('b', 'answered', '2026-11-02T22:00:00Z', { goalEvidenceRequest: { projectId: 'cec', goalIds: ['g1'] } })])).toBeUndefined();
    // The request's own recorded answer and a report to Avery copy its fields; neither is a later request.
    expect(supersededEvidenceRequest(failed, [failed, ask('b', 'answered', '2026-11-02T22:00:00Z', { id: 'reply-uuid', from: 'pm' })])).toBeUndefined();
    expect(supersededEvidenceRequest(failed, [failed, ask('b', 'answered', '2026-11-02T22:00:00Z', { id: 'pm-report:goal-evidence:b', from: 'pm' })])).toBeUndefined();
    expect(supersededEvidenceRequest({ id: 'goal-evidence:a', from: 'cto', status: 'failed', createdAt: '2026-11-01T22:00:00Z' } as never, [ask('b', 'answered', '2026-11-02T22:00:00Z')])).toBeUndefined();
});

test('a settled Harper duplicate is known by its failed status, Harper-to-Morgan roles and saved superseding id, never by its wording', () => {
    const settled = { from: 'knowledge', to: 'pm', status: 'failed', supersededByHandoffId: 'current' } as const;
    expect(supersededHandoff(settled)).toBe(true);
    expect(supersededHandoff({ ...settled, supersededByHandoffId: undefined })).toBe(false);
    expect(supersededHandoff({ ...settled, status: 'queued' })).toBe(false);
    expect(supersededHandoff({ ...settled, status: 'interrupted' })).toBe(false);
    expect(supersededHandoff({ ...settled, from: 'it' })).toBe(false);
    expect(supersededHandoff({ ...settled, to: 'it' })).toBe(false);
});
