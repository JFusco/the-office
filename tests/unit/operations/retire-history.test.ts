import { afterEach, expect, test } from 'vitest';
import { enqueueHistoryRetirement, historicalRecordDigest, retireIncompleteHistory } from '../../../server/operations/retire-history';
import { investigationFixture } from '../it/investigations/fixture';
import { syncInvestigations } from '../../../server/it/investigations/ledger';
import { investigationFollowUps } from '../../../server/it/investigations/follow-ups';
import { scheduledInvestigations } from '../../../server/it/investigations/scheduled';
import { projectOutbox } from '../../../server/conversations/outbox';
import { supersedablePriorRuns } from '../../../server/maintenance/unverified-prior-runs';
import type { HistoryRetirementIntent } from '../../../src/contracts/history-retirement';
import type { MaintenanceRun } from '../../../src/shared';
import { commandRoute } from '../../../server/office/http/commands';
import { executeRequest } from '../../../server/scheduling/requests';

const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach(close => close()));
function fixture() {
    const f = investigationFixture(); cleanups.push(f.close);
    f.worker.failure = { category: 'uncertain-effect', code: 'surviving-subprocesses', dispatched: true, detail: 'Original group survived' };
    syncInvestigations(f.store);
    const entry = f.store.state.it!.investigations!.find(entry => entry.source.kind === 'worker')!;
    entry.status = 'blocked'; entry.attempts = 3;
    entry.report = { summary: 'Original helper not fully captured', cause: 'unknown', evidence: [], recommendation: 'Preserve evidence', blocker: 'Missing snapshots', officeFix: { status: 'blocked', reason: 'Original process identity snapshots missing', owner: 'Maintainer' } };
    const run: MaintenanceRun = { id: 'old-run', requestedAt: '2026-11-07T20:00:00Z', startedAt: '2026-11-07T20:00:01Z', endedAt: '2026-11-07T20:01:00Z', status: 'blocked', weekly: false, stage: 'brain-maintenance', error: 'Original output missing', steps: [], checkpointId: 'old-checkpoint', readbackRetry: { attempts: 3, exhausted: true, nextAt: '', history: [{ at: 'original', detail: 'Failed evidence read' }] } };
    f.store.state.maintenance = { runs: [run], ledger: 'Incomplete original work', lastDaily: '', lastWeekly: '' };
    f.store.state.workLog!.push({ ...f.worker, id: 'reader', requestId: run.id, stage: 'brain-maintenance' });
    f.store.state.coordination!.checkpoints = [{ id: 'old-checkpoint', runId: run.id, status: 'blocked', detail: 'Original failure' }] as any;
    const intent = (): HistoryRetirementIntent => ({ acceptIncompleteHistory: true, reason: 'Joe accepts these exact records as incomplete historical evidence.', targets: [
        { kind: 'maintenance', id: run.id, sha256: historicalRecordDigest(run) },
        { kind: 'investigation', id: entry.id, sha256: historicalRecordDigest(entry) },
    ] });
    const enqueue = () => enqueueHistoryRetirement(f.store, intent(), () => false);
    return { ...f, entry, run, intent, enqueue };
}
test('retirement closes only selected active alerts and retains failures, counters, checkpoints and unknown outcomes', () => {
    const f = fixture(), before = structuredClone({ run: f.run, entry: f.entry, checkpoints: f.store.state.coordination!.checkpoints });
    expect(projectOutbox(f.store.state).some(item => item.id === 'maintenance:old-run' && item.status === 'open')).toBe(true);
    expect(investigationFollowUps(f.store).some(item => item.id === f.entry.id)).toBe(true);
    const request = f.enqueue(); request.status = 'working';
    retireIncompleteHistory(f.store, request, () => false);
    const { retirement: runDisposition, ...run } = f.run, { retirement: caseDisposition, ...entry } = f.entry;
    expect({ run, entry, checkpoints: f.store.state.coordination!.checkpoints }).toEqual(before);
    expect(runDisposition).toMatchObject({ kind: 'incomplete-history', requestId: request.id });
    expect(caseDisposition?.recordSha256).toBe(historicalRecordDigest(entry));
    expect(projectOutbox(f.store.state).filter(item => item.status === 'open').map(item => item.id)).not.toContain('maintenance:old-run');
    expect(projectOutbox(f.store.state).filter(item => item.status === 'open').map(item => item.id)).not.toContain('checkpoint:old-checkpoint');
    expect(investigationFollowUps(f.store).some(item => item.id === f.entry.id)).toBe(false);
    expect(scheduledInvestigations(f.store, async () => { throw Error('No model dispatch'); }).some(item => item.work.id === f.entry.id)).toBe(false);
    syncInvestigations(f.store); expect(f.entry.status).toBe('blocked'); expect(f.entry.attempts).toBe(3);
    request.status = 'completed'; expect(f.enqueue().id).toBe(request.id);
    expect(supersedablePriorRuns(f.store, [f.run], false)).toEqual(['old-run']);
    f.store.state.maintenance!.runs.push({ ...run, id: 'new-failure', retirement: undefined } as any);
    expect(projectOutbox(f.store.state).some(item => item.id === 'maintenance:new-failure' && item.status === 'open')).toBe(true);
    expect(supersedablePriorRuns(f.store, f.store.state.maintenance!.runs, false)).toBeNull();
});
test('a changed record after enqueue refuses the entire batch without partially retiring another target', () => {
    const f = fixture(), request = f.enqueue(); request.status = 'working'; f.entry.attempts++;
    expect(() => retireIncompleteHistory(f.store, request, () => false)).toThrow('changed');
    expect(f.run.retirement).toBeUndefined(); expect(f.entry.retirement).toBeUndefined();
});
test.each(['active-worker', 'live-group', 'missing-pid', 'claim', 'uncertain-effect', 'draining', 'handoff', 'wrong-project'])(
    '%s prevents administrative retirement', scenario => {
        const f = fixture();
        if (scenario === 'active-worker') f.worker.status = 'running';
        if (scenario === 'missing-pid') f.worker.processId = undefined;
        if (scenario === 'claim') f.store.claimWork({ projectId: 'brain', kind: 'notice', id: f.worker.requestId! }, 'owner', 'send');
        if (scenario === 'uncertain-effect') f.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('unsettled', `brain:notice:${f.worker.requestId}`, 'uncertain', '{}');
        if (scenario === 'draining') f.store.state.draining = true;
        if (scenario === 'handoff') f.run.blockerFollowup = { status: 'blocked', detail: 'Still owed' };
        if (scenario === 'wrong-project') f.store.project.id = 'cms-field-vocabulary';
        expect(() => enqueueHistoryRetirement(f.store, f.intent(), () => scenario === 'live-group')).toThrow();
        expect(f.run.retirement).toBeUndefined(); expect(f.entry.retirement).toBeUndefined();
    });
test('no implicit consent, duplicate targets or modified request can bypass the explicit disposition', () => {
    const f = fixture();
    expect(() => enqueueHistoryRetirement(f.store, { ...f.intent(), acceptIncompleteHistory: false }, () => false)).toThrow();
    expect(() => enqueueHistoryRetirement(f.store, { ...f.intent(), targets: [f.intent().targets[0], f.intent().targets[0]] }, () => false)).toThrow();
    const request = f.enqueue(); request.status = 'working'; request.historyRetirement!.reason = 'Changed after intent';
    expect(() => retireIncompleteHistory(f.store, request, () => false)).toThrow('Bound');
});
test('the supported HTTP intent runs through the normal deterministic request lane without a model or provider dispatch', async () => {
    const f = fixture(), url = new URL('http://localhost/api/commands?project=brain');
    const response = await commandRoute(new Request(url, { method: 'POST', body: JSON.stringify({ action: 'retire-incomplete-history', historyRetirement: f.intent() }) }), url, { store: f.store } as any);
    expect(response?.status).toBe(202);
    const { id } = await response!.json();
    const request = f.store.state.coordination!.requests!.find(request => request.id === id)!;
    expect(request.lane).toBe('operations');
    await executeRequest(f.store, {} as any, {} as any, request);
    expect(request.status).toBe('completed');
    expect(f.run.retirement?.requestId).toBe(id);
    expect(f.entry.status).toBe('blocked');
});
