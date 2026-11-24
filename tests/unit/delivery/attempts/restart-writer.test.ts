import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { writerRestartCandidate, writerRestartPending } from '../../../../server/delivery/attempts/restart-writer';
import { writerRestartInstruction } from '../../../../server/delivery/attempts/restart-instruction';
import { assessDeliveryEligibility } from '../../../../server/delivery/harness/delivery-authority';
import { HOLDS } from '../../../../server/office/config';
import { stoppedBaseUpdateCandidate } from '../../../../server/delivery/recovery/stopped-base-update';
import { markAwaitingRepair, unmark } from '../../incidents/repair/mark-fixture';
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
    expect(writerRestartCandidate(f.store, job, LATER, gone)).toMatchObject({ work: { id: 'run-1' }, accepted: HEAD, attempt: 1, released: false });
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

test('a job awaiting a harness repair is still the harness\'s to restart: the candidate and the pending answer do not change, so no other recovery takes it', () => {
    const { f, job } = stopped();
    const before = [JSON.stringify(writerRestartCandidate(f.store, job, LATER, gone)), writerRestartPending(f.store, job, gone), !!stoppedBaseUpdateCandidate(f.store, job)];
    markAwaitingRepair(f.store.state, f.store.project.id, { kind: 'delivery', id: job.id }, 'update-base', { since: STOPPED, progressAt: STOPPED });
    expect([JSON.stringify(writerRestartCandidate(f.store, job, LATER, gone)), writerRestartPending(f.store, job, gone), !!stoppedBaseUpdateCandidate(f.store, job)]).toEqual(before);
    expect(before).toEqual([expect.stringContaining('"attempt":1'), true, false]);
    unmark(f.store.state);
});

/** Three restarts already spent from the accepted head, as a repair release finds them. */
const spent = (accepted = HEAD) => [1, 2, 3].map(n => ({ workId: `old-${n}`, stage: 'update-base', at: STOPPED, accepted, abandoned: accepted, ref: `refs/office/salvage/x/old-${n}` }));
/** A repair release bound to this job's run-1 at its stage and accepted head. */
const grant = (x: ReturnType<typeof stopped>, over: Record<string, unknown> = {}) => ({ id: 'g'.repeat(64), incident: 'inc-1', subject: `${x.f.store.project.id}/delivery/${x.job.id}`, fix: 'cli-bind-1', commit: 'f'.repeat(40), workId: 'run-1', stage: x.job.stage, accepted: HEAD, grantedAt: STOPPED, ...over });
const at = (ms: number) => new Date(Date.parse(STOPPED) + ms);

test('a spent count releases one attempt only with a matching release, after the last ordinary wait from the same stop', () => {
    const x = stopped();
    x.job.writerRestarts = spent();
    expect(writerRestartCandidate(x.f.store, x.job, LATER, gone)).toBeNull();
    expect(writerRestartPending(x.f.store, x.job, gone)).toBe(false);
    x.job.repairRelease = grant(x);
    expect(writerRestartCandidate(x.f.store, x.job, at(299_999), gone)).toBeNull();
    expect(writerRestartCandidate(x.f.store, x.job, at(300_000), gone)).toEqual({ work: x.work, accepted: HEAD, attempt: 4, released: true });
    // Neither the count nor the earlier restarts change.
    expect(x.job.writerRestarts).toEqual(spent());
    // The harness owns the run while the release stands, so no stopped-base recovery takes it.
    expect(writerRestartPending(x.f.store, x.job, gone)).toBe(true);
    expect(stoppedBaseUpdateCandidate(x.f.store, x.job)).toBeUndefined();
    x.job.repairRelease.consumedAt = LATER.toISOString();
    expect(writerRestartCandidate(x.f.store, x.job, LATER, gone)).toBeNull();
    expect(writerRestartPending(x.f.store, x.job, gone)).toBe(false);
});

test('a release for another subject, run, stage or accepted head grants nothing', () => {
    for (const [field, value] of [['subject', 'cms-field-vocabulary/delivery/other'], ['workId', 'run-2'], ['stage', 'implement'], ['accepted', 'c'.repeat(40)]] as const) {
        const x = stopped();
        x.job.writerRestarts = spent();
        x.job.repairRelease = grant(x, { [field]: value });
        expect(writerRestartCandidate(x.f.store, x.job, LATER, gone), field).toBeNull();
        x.job.repairRelease = grant(x);
        expect(writerRestartCandidate(x.f.store, x.job, LATER, gone), field).toMatchObject({ released: true });
    }
});

test('past the six hours, with the count unspent, a release grants the attempt the count would have', () => {
    const x = stopped(), old = at(6 * 60 * 60 * 1000 + 1);
    expect(writerRestartCandidate(x.f.store, x.job, at(6 * 60 * 60 * 1000), gone)).toMatchObject({ attempt: 1, released: false });
    expect(writerRestartCandidate(x.f.store, x.job, old, gone)).toBeNull();
    x.job.repairRelease = grant(x);
    expect(writerRestartCandidate(x.f.store, x.job, old, gone)).toEqual({ work: x.work, accepted: HEAD, attempt: 1, released: true });
});

test('within the ordinary allowance a matching release is not spent: the ordinary attempt is taken, and its wait is waited out', () => {
    const x = stopped();
    x.job.writerRestarts = spent().slice(0, 2);
    x.job.repairRelease = grant(x);
    expect(writerRestartCandidate(x.f.store, x.job, at(299_999), gone)).toBeNull();
    expect(writerRestartCandidate(x.f.store, x.job, at(300_000), gone)).toEqual({ work: x.work, accepted: HEAD, attempt: 3, released: false });
});

test('an unpublished implement job is restarted from its candidate base, and its release is bound to that commit', () => {
    const x = stopped();
    Object.assign(x.job, { stage: 'implement', head: '', candidateBase: 'c'.repeat(40) });
    x.work.stage = 'github-implement';
    x.job.writerRestarts = spent('c'.repeat(40)).map(restart => ({ ...restart, stage: 'implement' }));
    x.job.repairRelease = grant(x, { accepted: HEAD });
    expect(writerRestartCandidate(x.f.store, x.job, LATER, gone)).toBeNull();
    x.job.repairRelease = grant(x, { accepted: 'c'.repeat(40) });
    expect(writerRestartCandidate(x.f.store, x.job, LATER, gone)).toMatchObject({ accepted: 'c'.repeat(40), attempt: 4, released: true });
});

test('a release changes none of the termination, ownership, hold, candidate or Effects checks', () => {
    const cases: [string, (x: ReturnType<typeof stopped>) => void][] = [
        ['process group still alive', () => {}],
        ['returned verdict', x => { x.work.status = 'failed'; x.work.executionStatus = 'completed'; delete x.work.failure; }],
        ['result already accepted', x => { x.job.steps.push({ stage: 'update-base', workerId: 'run-1', result: {} as any }); }],
        ['missing login', x => { x.work.failure.category = 'authentication'; }],
        ['held', x => { HOLDS[x.job.key] = 'Synthetic hold'; }],
        ['paused', x => { x.f.store.state.paused = true; }],
        ['legacy recovery record', x => { x.job.candidateRecovery = {} as any; }],
        ['stopped-base record', x => { x.job.stoppedBaseUpdate = {} as any; }],
        ['declined', x => { x.job.writerRestartDeclined = { workId: 'run-1', reason: 'moved', at: STOPPED }; }],
        ['already restarted', x => { x.job.writerRestarts!.push({ workId: 'run-1', stage: 'update-base', at: STOPPED, accepted: HEAD, abandoned: HEAD, ref: '' }); }],
        ['recovery request queued', x => { x.f.store.state.coordination!.requests = [{ id: 'r', key: x.job.key, action: 'reconcile-base-update', status: 'queued' } as any]; }],
        ['claimed', x => { x.f.store.claimWork({ projectId: x.f.store.project.id, kind: 'delivery', id: x.job.id }, 'scheduler', 'update-base', 'delivery'); }],
        ['unsettled effect', x => { x.f.store.putEffect({ id: 'e', work: { projectId: x.f.store.project.id, kind: 'delivery', id: x.job.id }, status: 'dispatching', dispatchedAt: STOPPED } as any); }],
    ];
    for (const [name, arrange] of cases) {
        const x = stopped();
        x.job.writerRestarts = spent();
        x.job.repairRelease = grant(x);
        expect(writerRestartCandidate(x.f.store, x.job, LATER, gone), `${name}: the release alone`).toMatchObject({ released: true });
        arrange(x);
        try { expect(writerRestartCandidate(x.f.store, x.job, LATER, name === 'process group still alive' ? () => true : gone), name).toBeNull(); }
        finally { delete HOLDS[x.job.key]; }
    }
});
