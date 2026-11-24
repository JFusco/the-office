import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../../../../../server/store/store';
import { coordination } from '../../../../../server/scheduling/coordination';
import { projectById } from '../../../../../server/office/projects';
import { HOLDS } from '../../../../../server/office/config';
import { APPROACH_GUARD_REJECTION, requeueImplement, requeueWaitedImplement } from '../../../../../server/delivery/recovery/implementation/requeue-waited-implement';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { delete HOLDS['GH-112']; stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
const result = (p: any = {}): any => ({ outcome: 'passed', summary: 'Fixture', commit: 'a'.repeat(40), evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '/wt', branch: 'codex/112', prId: 0, qaRunDir: '', paidRuns: 0, blocker: '', ...p });
const wait = { kind: 'provider-wait', findingIds: [], evidenceIds: [] };
const small = { plan: 'brief', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Data-only profile.' };
const waited = () => ({ stage: 'implement', result: result({ outcome: 'blocked', resolution: wait }) });
const rejected = (p: any = {}) => ({ stage: 'implement', result: result({ approach: small, ...p }) });
function fixture(steps: any[] = [waited(), rejected()], job: any = {}) {
    const root = mkdtempSync(resolve(tmpdir(), 'requeue-implement-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store);
    const j: any = { id: 'job112', key: 'GH-112', stage: 'implement', status: 'blocked', detail: `Error: ${APPROACH_GUARD_REJECTION}`, head: '', worktree: '/wt', branch: 'codex/112', pr: 0, steps, ...job };
    store.state.coordination = { ...coordination(), jobs: [j] };
    return { store, job: j };
}

const DETAIL = 'Implement requeued on the same candidate after the provider-wait result; the earlier and rejected results are retained.';

test('requeues a guard-rejected implement that followed a structured wait, keeping both results', () => {
    const { store, job } = fixture(), before = store.state.events.length;
    expect(requeueWaitedImplement(store, 'GH-112')).toBe(job);
    expect(job.status).toBe('queued');
    expect(job.stage).toBe('implement');
    expect(job.steps.map((s: any) => s.result.outcome)).toEqual(['blocked', 'passed']);
    expect(job.detail).toBe(DETAIL);
    // The operator's own event, once.
    expect(store.state.events.slice(0, store.state.events.length - before).map(e => [e.kind, e.message, e.role, e.ticket])).toEqual([['implement-requeued', `GH-112: ${DETAIL}`, 'pm', 'GH-112']]);
    // A key with no job that is not cancelled has nothing to requeue.
    expect(() => requeueWaitedImplement(store, 'GH-999')).toThrow('Only an implement blocked by the approach guard can be requeued');
});

test('the transition requeues the job it is given and returns the detail it set, emitting nothing', () => {
    const { store, job } = fixture(), events = [...store.state.events];
    expect(requeueImplement(store, job)).toBe(DETAIL);
    expect(job).toMatchObject({ stage: 'implement', status: 'queued', detail: DETAIL });
    expect(job.steps.map((s: any) => s.result.outcome)).toEqual(['blocked', 'passed']);
    expect(store.state.events).toEqual(events);
});

test('only a scheduler claim on this delivery job blocks the requeue', () => {
    const busy = fixture(), events = busy.store.state.events.length;
    expect(busy.store.claimWork({ projectId: busy.store.project.id, kind: 'delivery', id: 'job112' }, 'scheduler', 'implement')).not.toBeNull();
    expect(() => requeueWaitedImplement(busy.store, 'GH-112')).toThrow('A worker is still active for this delivery');
    expect(() => requeueImplement(busy.store, busy.job)).toThrow('A worker is still active for this delivery');
    expect(busy.job).toMatchObject({ status: 'blocked', detail: `Error: ${APPROACH_GUARD_REJECTION}` });
    expect(busy.store.state.events).toHaveLength(events);
    // The same ID under another kind of work, or another delivery job, is not this job's worker.
    for (const work of [{ kind: 'checkpoint' as const, id: 'job112' }, { kind: 'delivery' as const, id: 'job113' }]) {
        const free = fixture();
        expect(free.store.claimWork({ projectId: free.store.project.id, ...work }, 'scheduler', 'implement'), work.kind).not.toBeNull();
        expect(requeueWaitedImplement(free.store, 'GH-112'), work.kind).toBe(free.job);
        expect(free.job.status, work.kind).toBe('queued');
    }
});

test('refuses every other blocked implement', () => {
    const cases: [any[] | undefined, any][] = [
        [undefined, { detail: 'Error: Stage did not pass' }],
        [undefined, { stage: 'review' }],
        [undefined, { status: 'queued' }],
        [undefined, { pr: 7 }],
        [undefined, { parked: { stage: 'implement' } }],
        [undefined, { implementationRecovery: { kind: 'candidate', workId: 'w', at: '' } }],
        [[{ stage: 'implement', result: result({ outcome: 'blocked', resolution: { kind: 'source-repair', findingIds: [], evidenceIds: [] } }) }, rejected()], {}],
        [[{ stage: 'implement', result: result({ outcome: 'blocked' }) }, rejected()], {}],
        [[waited(), rejected({ outcome: 'failed' })], {}],
        [[waited(), rejected({ approach: null })], {}],
        [[waited(), rejected(), { stage: 'review', result: result() }], {}],
        [[{ stage: 'review', result: result({ outcome: 'failed' }) }, waited(), rejected()], {}],
        [[waited(), rejected({ receipts: [{ id: 'push', action: 'git push', target: 'origin', verified: false, uncertain: true, detail: 'Fixture' }] })], {}],
    ];
    for (const [steps, job] of cases) {
        const f = fixture(steps, job);
        expect(() => requeueWaitedImplement(f.store, 'GH-112')).toThrow();
        expect(f.job.status).toBe(job.status || 'blocked');
    }
});

test('refuses a held ticket or one with an active worker', () => {
    HOLDS['GH-112'] = 'Held for review';
    const held = fixture();
    expect(() => requeueWaitedImplement(held.store, 'GH-112')).toThrow(/hold/);
    delete HOLDS['GH-112'];
    const busy = fixture();
    busy.store.state.workLog = [{ id: 'w', requestId: 'job112', status: 'running' } as any];
    expect(() => requeueWaitedImplement(busy.store, 'GH-112')).toThrow(/active/);
    expect(busy.job.status).toBe('blocked');
});

test('refuses when the current guard would still reject the result, so no paid run is wasted', () => {
    const failed = fixture();
    failed.store.state.workLog = [{ id: 'w1', requestId: 'job112', stage: 'github-implement', status: 'failed', startedAt: '2026-11-01T00:00:00Z' } as any];
    expect(() => requeueWaitedImplement(failed.store, 'GH-112')).toThrow(/Reconcile failed/);
    expect(failed.job.status).toBe('blocked');
    const recovered = fixture();
    recovered.store.state.workLog = [
        { id: 'w1', requestId: 'job112', stage: 'github-implement', status: 'blocked', startedAt: '2026-10-31T00:00:00Z' } as any,
        { id: 'w2', requestId: 'job112', stage: 'github-implement', status: 'completed', startedAt: '2026-11-07T00:00:00Z' } as any];
    requeueWaitedImplement(recovered.store, 'GH-112');
    expect(recovered.job.status).toBe('queued');
    expect(recovered.job.approach).toBeUndefined();
});
