import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { writerRestartCandidate, writerRestartPending } from '../../../../server/delivery/attempts/restart-writer';
import { writerRestartInstruction } from '../../../../server/delivery/attempts/restart-instruction';
import { assessDeliveryEligibility } from '../../../../server/delivery/harness/delivery-authority';
import { HOLDS } from '../../../../server/office/config';
import { stoppedBaseUpdateCandidate } from '../../../../server/delivery/recovery/stopped-base-update';
afterEach(cleanupFakes);

const STOPPED = '2026-11-16T12:00:00.000Z', LATER = new Date('2026-11-16T12:10:00Z'), gone = () => false;
/** A hands-off job whose update-base run was interrupted and whose process group has exited. */
function stopped() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'update-base', status: 'blocked' });
    const work: any = { id: 'run-1', requestId: job.id, stage: 'github-update-base', status: 'interrupted', processId: 4242, startedAt: '2026-11-16T11:50:00.000Z', endedAt: STOPPED, failure: { category: 'uncertain-effect', dispatched: true, detail: 'timed out' } };
    f.store.state.workLog = [work];
    return { f, job, work };
}

test('a dead writer run on a hands-off job is a restart candidate from the accepted head once its wait has passed', () => {
    const { f, job, work } = stopped();
    expect(writerRestartCandidate(f.store, job, new Date('2026-11-16T12:00:20Z'), gone)).toBeNull();
    expect(writerRestartPending(f.store, job, gone)).toBe(true);
    expect(writerRestartCandidate(f.store, job, LATER, gone)).toMatchObject({ work: { id: 'run-1' }, accepted: HEAD, attempt: 1 });
    // The old readback blocker stands until the harness records the restart.
    expect(assessDeliveryEligibility(f.store, job).blockers).toContain('Original incomplete worker needs readback');
    job.writerRestarts = [{ workId: work.id, stage: 'update-base', at: STOPPED, accepted: HEAD, abandoned: 'b'.repeat(40), ref: 'refs/office/salvage/x/run-1' }];
    expect(assessDeliveryEligibility(f.store, job).blockers).not.toContain('Original incomplete worker needs readback');
    expect(writerRestartCandidate(f.store, job, LATER, gone)).toBeNull();
    expect(writerRestartInstruction(job)).toContain('refs/office/salvage/x/run-1');
});

test('three restarts from the same accepted head use up the allowance', () => {
    const { f, job } = stopped();
    job.writerRestarts = [1, 2].map(n => ({ workId: `old-${n}`, stage: 'update-base', at: STOPPED, accepted: HEAD, abandoned: HEAD, ref: '' }));
    expect(writerRestartCandidate(f.store, job, LATER, gone)).toMatchObject({ attempt: 3 });
    job.writerRestarts.push({ workId: 'old-3', stage: 'update-base', at: STOPPED, accepted: HEAD, abandoned: HEAD, ref: '' });
    expect(writerRestartCandidate(f.store, job, LATER, gone)).toBeNull();
    expect(writerRestartPending(f.store, job, gone)).toBe(false);
});

test('anything short of a provably dead, unowned, settled writer run is left to its existing handling', () => {
    const cases: [string, (x: ReturnType<typeof stopped>) => void][] = [
        ['process group still alive', () => {}],
        ['no recorded process', x => { delete x.work.processId; }],
        ['returned verdict', x => { x.work.status = 'blocked'; }],
        ['returned failed verdict', x => { x.work.status = 'failed'; x.work.executionStatus = 'completed'; delete x.work.failure; }],
        ['held PR', x => { x.job.pr = 200; HOLDS['GH-200'] = 'Synthetic hold'; }],
        ['stalled recovery request for this run', x => { x.f.store.state.coordination!.requests = [{ id: 'r', key: x.job.key, action: 'reconcile-base-update', status: 'blocked', head: 'run-1' } as any]; }],
        ['scope repair', x => { x.job.stage = 'scope-repair'; x.work.stage = 'github-scope-repair'; }],
        ['completed run', x => { x.work.status = 'completed'; }],
        ['missing login', x => { x.work.failure.category = 'authentication'; }],
        ['reader stage', x => { x.job.stage = 'review'; x.work.stage = 'github-review'; }],
        ['queued job', x => { x.job.status = 'queued'; }],
        ['paused', x => { x.f.store.state.paused = true; }],
        ['draining', x => { x.f.store.state.draining = true; }],
        ['held', x => { HOLDS[x.job.key] = 'Synthetic hold'; }],
        ['no worktree', x => { x.job.worktree = ''; }],
        ['stopped-base record', x => { x.job.stoppedBaseUpdate = {} as any; }],
        ['repair cycle', x => { x.job.repairCycle = { phase: 'repair' } as any; }],
        ['legacy recovery record', x => { x.job.candidateRecovery = {} as any; }],
        ['merge attempt', x => { x.job.mergeAttempt = { head: HEAD, at: STOPPED } as any; }],
        ['legacy project', x => { (x.f.store.project as any).id = 'cec'; }],
        ['result already accepted', x => { x.job.steps.push({ stage: 'update-base', workerId: 'run-1', result: {} as any }); }],
        ['declined', x => { x.job.writerRestartDeclined = { workId: 'run-1', reason: 'moved', at: STOPPED }; }],
        ['another worker running', x => { x.f.store.state.workLog!.push({ id: 'run-2', requestId: x.job.id, stage: 'github-review', status: 'running' } as any); }],
        ['recovery request queued', x => { x.f.store.state.coordination!.requests = [{ id: 'r', key: x.job.key, action: 'reconcile-base-update', status: 'queued' } as any]; }],
        ['unsettled effect', x => { x.f.store.putEffect({ id: 'e', work: { projectId: x.f.store.project.id, kind: 'delivery', id: x.job.id }, status: 'uncertain', dispatchedAt: STOPPED } as any); }],
    ];
    for (const [name, arrange] of cases) {
        const x = stopped(); arrange(x);
        try { expect(writerRestartCandidate(x.f.store, x.job, LATER, name === 'process group still alive' ? () => true : gone), name).toBeNull(); }
        finally { delete HOLDS[x.job.key]; delete HOLDS['GH-200']; }
    }
    // A run that never started has no process to wait for.
    const never = stopped(); delete never.work.processId; never.work.failure.dispatched = false;
    expect(writerRestartCandidate(never.f.store, never.job, LATER, () => true)).toMatchObject({ attempt: 1 });
});

test('a run that stopped long ago is not restarted, so nothing old restarts on a deploy', () => {
    const { f, job } = stopped();
    expect(writerRestartCandidate(f.store, job, new Date('2026-11-16T17:59:00Z'), gone)).toMatchObject({ attempt: 1 });
    expect(writerRestartCandidate(f.store, job, new Date('2026-11-16T18:01:00Z'), gone)).toBeNull();
});

test('the stopped-base readback stays out while a restart is pending and after one has happened', () => {
    const { f, job, work } = stopped();
    Object.assign(job, { existingPR: true, pr: 200 });
    work.status = 'interrupted';
    expect(writerRestartPending(f.store, job, gone)).toBe(true);
    expect(stoppedBaseUpdateCandidate(f.store, job)).toBeUndefined();
    // Two runs after a restart used to throw "duplicate original workers"; the job is no longer its to read back.
    job.writerRestarts = [{ workId: work.id, stage: 'update-base', at: STOPPED, accepted: HEAD, abandoned: HEAD, ref: '' }];
    f.store.state.workLog!.push({ ...work, id: 'run-2' });
    job.writerRestartDeclined = { workId: 'run-2', reason: 'moved', at: STOPPED };
    expect(stoppedBaseUpdateCandidate(f.store, job)).toBeUndefined();
});
