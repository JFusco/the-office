import { expect, test } from 'vitest';
import { investigationFixture } from './fixture';
import { finishedSubjectResolution } from '../../../../server/it/investigations/finished-subject-resolution';
import { investigationResolution } from '../../../../server/it/investigations/ledger';
import { investigationReady } from '../../../../server/it/investigations/readiness';
import { retriedReadResolution } from '../../../../server/it/investigations/retried-read';

const entry = (source: object): any => ({ id: 'investigation', source: { kind: 'worker', id: 'run', requestId: '', ticket: '', failureKind: 'uncertain-effect', workerIds: ['run'], ...source }, status: 'queued', attempts: 0 });

test('an investigation is history once the delivery, ticket or issue its worker ran for is finished', () => {
    const f = investigationFixture();
    try {
        const jobs: any[] = [{ id: 'job-1', key: 'GH-350', status: 'blocked' }, { id: 'job-2', key: 'GH-351', status: 'working' }];
        f.store.state.coordination!.jobs = jobs;
        const byRequest = entry({ requestId: 'job-1', ticket: 'GH-350' });
        expect(finishedSubjectResolution(f.store, byRequest)).toBeUndefined();
        for (const status of ['completed', 'cancelled']) { jobs[0].status = status; expect(finishedSubjectResolution(f.store, byRequest)).toEqual({ kind: 'superseded', sourceId: 'job-1', receipt: `job:job-1:${status}` }); }
        // A worker tied to an issue by ticket only: every delivery for that issue must be finished.
        const byIssue = entry({ requestId: 'notice', ticket: 'GH-351' });
        expect(finishedSubjectResolution(f.store, byIssue)).toBeUndefined();
        jobs[1].status = 'completed';
        expect(finishedSubjectResolution(f.store, byIssue)).toMatchObject({ kind: 'superseded', sourceId: 'job-2' });
        // A Jira/Azure ticket is finished only at its final stage.
        f.store.state.tickets = [{ key: 'CEC-154', stage: 'retest' } as any];
        const byTicket = entry({ ticket: 'CEC-154' });
        expect(finishedSubjectResolution(f.store, byTicket)).toBeUndefined();
        f.store.state.tickets[0].stage = 'complete';
        expect(finishedSubjectResolution(f.store, byTicket)).toEqual({ kind: 'superseded', sourceId: 'CEC-154', receipt: 'ticket:CEC-154:complete' });
        // Nothing to read as finished: an issue with no delivery, no ticket at all, or a Slack source.
        expect(finishedSubjectResolution(f.store, entry({ ticket: 'GH-999' }))).toBeUndefined();
        expect(finishedSubjectResolution(f.store, entry({}))).toBeUndefined();
        expect(finishedSubjectResolution(f.store, entry({ kind: 'slack', ticket: 'CEC-154' }))).toBeUndefined();
        // A GitHub issue keeps a ticket row that only reaches `complete` at closeout: cancelled deliveries still settle it.
        f.store.state.tickets.push({ key: 'GH-351', stage: 'mailbox' } as any);
        expect(finishedSubjectResolution(f.store, byIssue)).toMatchObject({ kind: 'superseded', sourceId: 'job-2' });
        // A leftover-helper failure is diagnosed once before it can close with its subject, and a proposed Office fix never closes this way.
        const survivor = entry({ ticket: 'CEC-154', failureKind: 'surviving-subprocesses' });
        expect(investigationResolution(f.store, survivor)).toBeUndefined();
        survivor.status = 'diagnosed';
        expect(investigationResolution(f.store, survivor)).toMatchObject({ kind: 'superseded', receipt: 'ticket:CEC-154:complete' });
        survivor.report = { officeFix: { status: 'proposed' } };
        expect(investigationResolution(f.store, survivor)).toBeUndefined();
        expect(finishedSubjectResolution(f.store, { ...byTicket, report: { officeFix: { status: 'proposed' } } })).toBeUndefined();
    }
    finally { f.close(); }
});

test('a worker recorded without a request is investigated on its own, and a later run of the same ticket stage settles its read failure', () => {
    const f = investigationFixture();
    try {
        const dead = () => false, stage = (id: string, extra: object): any => ({ id, requestId: '', ticket: 'CEC-154', stage: 'reconcile', role: 'pm', status: 'failed', processId: 2147483600, startedAt: '2026-11-15T05:00:00Z', endedAt: '2026-11-15T05:45:00Z', failure: { category: 'transient-read', dispatched: true, detail: 'read timed out' }, ...extra });
        // Other request-less runs, one with no recorded process and one still running, are not this run's "request".
        f.store.state.workLog = [stage('run', {}), stage('intake', { ticket: 'CEC-101', stage: 'understand', processId: undefined }), stage('live', { ticket: 'CEC-200', stage: 'implement', status: 'running' })];
        const item = entry({ failureKind: 'transient-read', ticket: 'CEC-154' });
        expect(investigationReady(f.store, item, dead)).toBe(true);
        expect(investigationReady(f.store, item, () => true)).toBe(false);
        expect(retriedReadResolution(f.store, item)).toBeUndefined();
        f.store.state.workLog.push(stage('other-ticket', { ticket: 'CEC-200', status: 'completed', failure: undefined, startedAt: '2026-11-15T06:00:00Z' }));
        expect(retriedReadResolution(f.store, item)).toBeUndefined();
        f.store.state.workLog.push(stage('rerun', { status: 'completed', failure: undefined, startedAt: '2026-11-15T06:10:00Z' }));
        expect(retriedReadResolution(f.store, item)).toEqual({ kind: 'confirmed', sourceId: 'rerun', receipt: 'worker:rerun' });
    }
    finally { f.close(); }
});
