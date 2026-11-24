import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { scheduledWork, type OfficeEntry } from '../../../server/scheduling/scheduled-work';
import { projectReadiness } from '../../../server/office/readiness';
import { BLOCKED_CAUSES } from '../../../server/office/blocked-causes';
import type { ExecutionLane, WorkKind } from '../../../src/shared';

type Mode = 'running' | 'paused' | 'draining';
const MODES: Mode[] = ['running', 'paused', 'draining'];
const HOLD_REASON = { paused: 'Project is paused', draining: 'Office is draining' } as const;
const at = '2026-10-29T20:00:00Z';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });

/** An isolated project in one mode: no provider, no claims, both flags set explicitly. */
function fixture(mode: Mode) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-paused-finished-')); roots.push(root);
    const clock = { now: () => new Date('2026-10-29T22:00:00Z'), monotonic: () => 0 };
    const store = new Store(':memory:', projectById('brain'), root, clock); stores.push(store);
    store.state.coordination = coordination();
    store.state.paused = mode === 'paused'; store.state.draining = mode === 'draining';
    const entry = { store, engine: {}, conversations: {}, coordinator: {} } as OfficeEntry;
    const project = (lane: ExecutionLane = 'delivery') => scheduledWork(entry, new Map([[store.project.id, store]]), clock.now(), lane);
    const row = (items: ReturnType<typeof project>, kind: WorkKind, id: string) => {
        const item = items.find(item => item.work.kind === kind && item.work.id === id);
        expect(item, `${kind}/${id} is projected`).toBeDefined();
        return item!;
    };
    return { store, entry, project, row };
}
const noCauses = Object.fromEntries(BLOCKED_CAUSES.map(cause => [cause, 0]));

test.each(MODES)('finished work stays terminal and adds nothing to readiness while %s', mode => {
    const { store, entry, project, row } = fixture(mode), c = store.state.coordination!;
    c.jobs = [{ id: 'cancelled-job', key: 'GH-40', stage: 'implement', status: 'cancelled', requestedAt: at, steps: [] } as any];
    store.state.messages.push({ id: 'asked', requestId: 'asked', from: 'human', to: 'pm', ticket: '', actionId: '', body: 'Status?', status: 'answered', createdAt: at, sessionId: '', recheck: false, error: '', recipients: [], receipts: [] } as any);
    // The earlier attempt keeps its saved `blocked` status; the later exact success makes it terminal history.
    const failed: any = { id: 'failed-refresh', action: 'reconcile-native-refresh', key: 'GH-254', head: 'native-run', lane: 'delivery', requestedAt: at, status: 'blocked', detail: 'Prior failed attempt' };
    c.requests = [failed, { ...failed, id: 'completed-refresh', status: 'completed', requestedAt: '2026-10-29T21:00:00Z', detail: '' }];
    const items = project();
    for (const [kind, id] of [['delivery', 'cancelled-job'], ['conversation', 'asked'], ['reconciliation', 'failed-refresh'], ['reconciliation', 'completed-refresh']] as [WorkKind, string][])
        expect(row(items, kind, id).eligibility.state, `${kind}/${id}`).toBe('terminal');
    expect(row(items, 'reconciliation', 'failed-refresh').eligibility.reason).toBe('Same durable reconciliation completed; prior failure retained');
    expect(failed.status).toBe('blocked');
    const readiness = projectReadiness(entry, items);
    expect(readiness.blocked).toBe(0);
    expect(readiness.blockedCauses).toEqual(noCauses);
});

test.each(MODES)('unfinished work is still held by a pause or drain while %s', mode => {
    const { store, entry, project, row } = fixture(mode);
    store.state.coordination!.requests = [{ id: 'queued-implementation', action: 'reconcile-implementation', key: 'GH-50', head: '', lane: 'delivery', requestedAt: at, status: 'queued', detail: '' } as any];
    const items = project(), readiness = projectReadiness(entry, items), queued = row(items, 'reconciliation', 'queued-implementation');
    if (mode === 'running') {
        expect(queued.eligibility.state).toBe('runnable');
        expect(readiness.blocked).toBe(0);
        expect(readiness.blockedCauses).toEqual(noCauses);
    } else {
        expect(queued.eligibility).toMatchObject({ state: 'blocked', owner: 'Morgan', cause: 'paused', reason: HOLD_REASON[mode] });
        expect(readiness.blocked).toBe(1);
        expect(readiness.blockedCauses).toEqual({ ...noCauses, paused: 1 });
    }
});

test.each(MODES)('a blocked dependency reads as the pause while %s, and as itself otherwise', mode => {
    const { store, entry, project, row } = fixture(mode);
    store.state.coordination!.listener.reviews = [{ id: 'intake', key: 'GH-31', status: 'queued', queuedAt: '', prerequisiteError: 'Referenced prerequisite does not exist' } as any];
    const items = project(), intake = row(items, 'intake', 'intake');
    if (mode === 'running') {
        expect(intake.eligibility).toMatchObject({ state: 'blocked', cause: 'dependency', reason: 'Referenced prerequisite does not exist' });
        expect(projectReadiness(entry, items).blockedCauses).toEqual({ ...noCauses, dependency: 1 });
    } else {
        expect(intake.eligibility).toMatchObject({ state: 'blocked', cause: 'paused', reason: HOLD_REASON[mode] });
        expect(projectReadiness(entry, items).blockedCauses).toEqual({ ...noCauses, paused: 1 });
    }
});

test.each(['paused', 'draining'] as Mode[])('the ledger-only scope correction stays runnable while %s', mode => {
    const { store, project, row } = fixture(mode);
    store.state.coordination!.requests = [{ id: 'scope', action: 'apply-time-scope', lane: 'operations', key: '', requestedAt: at, status: 'queued', head: 'a'.repeat(64), detail: '', timeScope: { policy: 'model-work-v1', expectedSha256: 'a'.repeat(64) } } as any];
    expect(row(project('operations'), 'reconciliation', 'scope')).toMatchObject({ allowPaused: true, eligibility: { state: 'runnable' } });
});
