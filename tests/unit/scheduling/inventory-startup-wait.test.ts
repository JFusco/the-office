import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { officeCapacity, projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { scheduledWork, type OfficeEntry } from '../../../server/scheduling/scheduled-work';
import { Scheduler, selectWork } from '../../../server/scheduling/scheduler';
import { enqueueRequest } from '../../../server/scheduling/requests';
import { STARTUP_WAIT_REASON } from '../../../server/scheduling/inventory-startup-wait';
import * as boardPreflight from '../../../server/delivery/recovery/board-preflight';
import { stoppedWork } from '../../../server/incidents/sources/stopped-work';
import { SessionBridge } from '../../../server/workers/session-bridge';
import { SessionContextDeadline } from '../../../server/workers/session-context-deadline';
import { observe } from '../incidents/incident-fixture';
import { cleanupFixtures, fixture, head, oldHead } from '../delivery/recovery/implementation/saved-prerequisite-fixture';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { cleanupFixtures(); stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
const WAIT = { state: 'waiting', reason: STARTUP_WAIT_REASON, owner: 'Office', nextCheckAt: null };
const COMMIT = '4'.repeat(40);
const ALWAYS = ['resume-discovery', 'reconcile-implementation', 'reconcile-validation', 'adopt-candidate', 'reconcile-scope-repair', 'cleanup-merged-candidate'];

/** An isolated project whose scheduler reads the given bridge, as the Office's coordinator does. */
function world(sessionBridge?: { firstCompleteAt: string }) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-inventory-wait-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store); store.state.coordination = coordination();
    const entry = { store, engine: {}, conversations: {}, coordinator: sessionBridge ? { sessionBridge } : {} } as unknown as OfficeEntry;
    const items = () => scheduledWork(entry, new Map([[store.project.id, store]]), new Date(), 'delivery');
    const item = (id: string) => items().find(work => work.work.id === id)!;
    return { store, items, item };
}
/** A stopped base update whose head is the job's own commit, as a board-preflight read-back names it. */
const baseJob = (key: string) => ({ id: `job-${key}`, key, status: 'blocked', stage: 'update-base', head: COMMIT, branch: 'codex/300-fixture', worktree: '/tmp/fixture-300', pr: 300, prUrl: '',
    detail: 'Error: Board transition needs read-back: In progress', requestedAt: '2026-11-26T04:00:00.000Z', updatedAt: '2026-11-26T04:00:00.000Z', steps: [], existingPR: true }) as any;

test.each(ALWAYS)('a queued %s waits, unclaimed, until the inventory has been complete once since start', action => {
    const bridge = { firstCompleteAt: '' }, w = world(bridge), request = enqueueRequest(w.store, action, 'GH-100', action === 'adopt-candidate' ? '' : 'head-1');
    expect(w.item(request.id).eligibility).toEqual(WAIT);
    expect(selectWork(w.items(), 0)).toBeUndefined();
    bridge.firstCompleteAt = '2026-11-26T05:00:00.000Z';
    expect(w.item(request.id).eligibility).toMatchObject({ state: 'runnable' });
    expect(selectWork(w.items(), 0)?.work.id).toBe(request.id);
});

test.each(['reconcile-preparation', 'reconcile-closeout'])('a headed %s waits while cold; its saved-result form without a head runs', action => {
    const w = world({ firstCompleteAt: '' });
    const headed = enqueueRequest(w.store, action, 'GH-100', 'worker-1'), saved = enqueueRequest(w.store, action, 'GH-101', '');
    expect(w.item(headed.id).eligibility).toEqual(WAIT);
    expect(w.item(saved.id).eligibility).toMatchObject({ state: 'runnable' });
});

test('a base update waits only for the board-preflight head its job admits', () => {
    const lookup = vi.spyOn(boardPreflight, 'boardPreflightCandidate');
    const w = world({ firstCompleteAt: '' });
    w.store.state.coordination!.jobs = [baseJob('GH-300'), baseJob('GH-301')];
    const empty = enqueueRequest(w.store, 'reconcile-base-update', 'GH-300', '');
    const worker = enqueueRequest(w.store, 'reconcile-base-update', 'GH-300', 'stopped-worker-1');
    const unadmitted = enqueueRequest(w.store, 'reconcile-base-update', 'GH-300', COMMIT);
    expect(w.item(empty.id).eligibility).toMatchObject({ state: 'runnable' });
    expect(w.item(worker.id).eligibility).toMatchObject({ state: 'runnable' });
    // The real rule finds no candidate for this job: the commit form is the stopped-base reassessment, which reads no inventory.
    expect(w.item(unadmitted.id).eligibility).toMatchObject({ state: 'runnable' });
    lookup.mockImplementation((_store, job) => job.key === 'GH-301' ? { id: 'board-preflight:job-GH-301:x', head: COMMIT } : undefined);
    const admitted = enqueueRequest(w.store, 'reconcile-base-update', 'GH-301', COMMIT);
    expect(w.item(admitted.id).eligibility).toEqual(WAIT);
    expect(lookup).toHaveBeenCalledWith(w.store, w.store.state.coordination!.jobs!.find(job => job.key === 'GH-301'));
});

test('the candidate lookup runs only for a cold matching base update, and a failed lookup holds just that request', () => {
    const lookup = vi.spyOn(boardPreflight, 'boardPreflightCandidate');
    const warm = world({ firstCompleteAt: '2026-11-26T05:00:00.000Z' });
    warm.store.state.coordination!.jobs = [baseJob('GH-300')];
    const warmBase = enqueueRequest(warm.store, 'reconcile-base-update', 'GH-300', COMMIT);
    expect(warm.item(warmBase.id).eligibility).toMatchObject({ state: 'runnable' });
    const cold = world({ firstCompleteAt: '' }), unrelated = enqueueRequest(cold.store, 'reconcile-pr-link', 'GH-100', 'head-1');
    expect(cold.item(unrelated.id).eligibility).toMatchObject({ state: 'runnable' });
    expect(lookup).not.toHaveBeenCalled();
    cold.store.state.coordination!.jobs = [baseJob('GH-300')];
    lookup.mockImplementation(() => { throw new Error('effects table unreadable'); });
    const failing = enqueueRequest(cold.store, 'reconcile-base-update', 'GH-300', COMMIT);
    expect(cold.item(failing.id).eligibility).toEqual(WAIT);
    expect(selectWork(cold.items(), 0)?.work.id).toBe(unrelated.id);
});

test('other requests, stopped, terminal, paused, draining, claimed and bridgeless requests read as before', () => {
    const cold = world({ firstCompleteAt: '' });
    const stopped = enqueueRequest(cold.store, 'reconcile-implementation', 'GH-101', 'head-2');
    stopped.status = 'blocked'; stopped.detail = 'Error: an earlier refusal';
    expect(cold.item(stopped.id).eligibility).toMatchObject({ state: 'blocked' });
    cold.store.state.tickets.push({ key: 'GH-101', status: 'closed' } as any);
    expect(cold.item(stopped.id).eligibility).toMatchObject({ state: 'terminal' });
    const claimed = enqueueRequest(cold.store, 'reconcile-implementation', 'GH-102', 'head-3');
    cold.store.claimWork({ projectId: cold.store.project.id, kind: 'reconciliation', id: claimed.id }, 'fixture', 'reconcile-implementation');
    expect(cold.item(claimed.id).eligibility).toMatchObject({ state: 'running' });
    for (const control of ['paused', 'draining'] as const) {
        const w = world({ firstCompleteAt: '' }), held = enqueueRequest(w.store, 'reconcile-implementation', 'GH-103', 'head-4');
        w.store.state[control] = true;
        expect(w.item(held.id).eligibility).toMatchObject({ state: 'blocked', cause: 'paused', reason: control === 'paused' ? 'Project is paused' : 'Office is draining' });
    }
    const bare = world(), unbridged = enqueueRequest(bare.store, 'reconcile-implementation', 'GH-104', 'head-5');
    expect(bare.item(unbridged.id).eligibility).toMatchObject({ state: 'runnable' });
});

test('a startup wait alone is not stopped work; a hold on its key is', () => {
    const w = world({ firstCompleteAt: '' }), request = enqueueRequest(w.store, 'reconcile-implementation', 'GH-100', 'head-1');
    const progression = w.items().map(({ work, stage, eligibility }) => ({ work, stage, eligibility }));
    expect(progression.find(item => item.work.id === request.id)!.eligibility).toEqual(WAIT);
    expect(stoppedWork(observe(w.store, progression))).toEqual([]);
    expect(stoppedWork(observe(w.store, progression, undefined, { 'GH-100': 'Joe is holding GH-100' })).map(candidate => candidate.subject.id)).toEqual([request.id]);
});

/** A completed saved-prerequisite writer and its stopped job, as `prepareRecovery()` leaves them before a reader claims the request. */
function stoppedRecovery() {
    const f = fixture();
    f.saveWriter(); f.job.steps.push({ stage: f.job.stage, result: structuredClone(f.result) }); f.job.status = 'blocked'; f.store.finishClaim(f.claim.id, 'completed');
    const recovery = enqueueRequest(f.store, 'reconcile-implementation', f.job.key, f.original.id);
    return { f, recovery };
}
/** The shared bridge with synthetic sources; `reads` decides what each inventory read sees. */
function sharedBridge(f: ReturnType<typeof fixture>, reads: { cold: boolean; native?: any[]; claude?: any[]; scopes?: any[] }) {
    const execute: any = async (program: string) => program === 'claude' ? JSON.stringify(reads.claude || []) : resolve(f.root, 'repo/.git');
    return new SessionBridge(() => [f.store], execute, async () => reads.native || [], async () => Object.assign([], { unaccounted: [] as number[] }), async sessions => sessions,
        async sessions => {
            if (reads.cold) throw new SessionContextDeadline('5bf24b85-6be0-48bd-a72b-b3aead054354', 'fold', 5002, 50389828);
            return sessions.map(session => ({ ...session, context: { activity: 'active', scopes: reads.scopes || [], userMessages: [], conversation: { projects: [], messages: [], omittedMessages: 0 } } }));
        });
}
function office(f: ReturnType<typeof fixture>, bridge: SessionBridge, deferNonReady = vi.fn(async () => undefined)) {
    const coordinator: any = { sessionBridge: bridge, execute: f.execute, deferNonReady };
    const entry = { store: f.store, engine: f.engine, conversations: {}, coordinator } as OfficeEntry;
    return { deferNonReady, project: () => scheduledWork(entry, new Map([[f.store.project.id, f.store]]), new Date(), 'delivery'), scheduler: new Scheduler(officeCapacity(), f.store.clock) };
}
const recoveryClaims = (f: ReturnType<typeof fixture>, id: string) => (f.store.db.prepare('SELECT body FROM work_claims').all() as { body: string }[]).filter(row => JSON.parse(row.body).work.id === id);

test('a cold read after start leaves the recovery queued while other work runs; the first complete read lets the same request finish', async () => {
    const { f, recovery } = stoppedRecovery(), reads = { cold: true }, bridge = sharedBridge(f, reads), o = office(f, bridge);
    const other = enqueueRequest(f.store, 'defer-non-ready', 'GH-200');
    await bridge.refresh();
    expect(bridge.current.complete).toBe(false);
    let items = o.project();
    const chosen = selectWork(items, 0)?.work.id;
    await o.scheduler.pump([{ store: f.store, items }]);
    // Without the wait the older recovery is chosen and the cold read spends it (blocked); with it, the other request runs.
    expect(recovery.status).toBe('queued');
    expect(recoveryClaims(f, recovery.id)).toEqual([]);
    expect(chosen).toBe(other.id);
    expect(o.deferNonReady).toHaveBeenCalledWith('GH-200');
    expect(other.status).toBe('completed');
    expect(o.project().find(item => item.work.id === recovery.id)!.eligibility).toEqual(WAIT);
    // The next ordinary refresh is the first complete read: the same request is claimed and finishes.
    reads.cold = false; await bridge.refresh();
    expect(bridge.firstCompleteAt).not.toBe('');
    items = o.project();
    expect(selectWork(items, 0)?.work.id).toBe(recovery.id);
    await o.scheduler.pump([{ store: f.store, items }]);
    expect(f.store.state.coordination!.requests!.filter(request => request.id === recovery.id)).toEqual([expect.objectContaining({ status: 'completed' })]);
    expect(recoveryClaims(f, recovery.id)).toHaveLength(1);
    expect(f.job).toMatchObject({ stage: 'review', status: 'queued', head, savedPrerequisiteHandoff: { originalWorkId: f.original.id, head } });
    expect(f.run).not.toHaveBeenCalled();
});

test.each(['incomplete', 'expired', 'owned', 'uncertain'] as const)('once the wait has opened, an %s execution read still refuses exactly as before', async reading => {
    const { f, recovery } = stoppedRecovery(), reads: Parameters<typeof sharedBridge>[1] = { cold: false }, bridge = sharedBridge(f, reads), o = office(f, bridge);
    await bridge.refresh();
    expect(bridge.firstCompleteAt).not.toBe('');
    // A later incomplete publication does not bring the startup wait back.
    reads.cold = true; await bridge.refresh(); expect(bridge.current.complete).toBe(false);
    const items = o.project();
    expect(items.find(item => item.work.id === recovery.id)!.eligibility).toMatchObject({ state: 'runnable' });
    reads.cold = reading === 'incomplete';
    const real = Date.now.bind(Date); let offset = 0;
    if (reading === 'expired') vi.spyOn(Date, 'now').mockImplementation(() => real() + offset);
    if (reading === 'expired') (bridge as any).context = async (sessions: unknown) => { offset += 46000; return sessions; };
    if (reading === 'owned') reads.native = [{ id: 'owner-1', provider: 'codex', cwd: f.store.project.repo, title: `Fix ${f.job.key}`, branch: '', status: 'active', source: 'test' }];
    if (reading === 'uncertain') {
        reads.claude = [{ sessionId: 'chat-1', cwd: '/elsewhere', status: 'working', name: 'Chat' }];
        reads.scopes = [{ project: f.store.project.id, issues: [100], prs: [], evidence: [{ at: '', reference: `https://github.com/${f.store.project.repository}/issues/100`, kind: 'reference', issue: 100 }] }];
    }
    const view = vi.spyOn(bridge, 'forProject');
    await o.scheduler.pump([{ store: f.store, items }]);
    expect(view).toHaveBeenCalledWith(f.store, f.job.key, recovery.id);
    expect(view.mock.results.at(-1)!.value).toMatchObject({ ownership: { status: { incomplete: 'unavailable', expired: 'unavailable', owned: 'owned', uncertain: 'uncertain' }[reading] } });
    expect(f.store.state.coordination!.requests!.filter(request => request.id === recovery.id)).toEqual([
        expect.objectContaining({ status: 'blocked', detail: 'Error: Saved prerequisite ownership, claim, inputs or effects changed' })]);
    expect(f.job).toMatchObject({ stage: 'scope-repair', status: 'blocked', head: oldHead });
    expect(f.job.savedPrerequisiteHandoff).toBeUndefined();
    expect(f.run).not.toHaveBeenCalled();
});
