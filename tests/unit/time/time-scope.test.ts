import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../../../server/store/store';
import { coordination } from '../../../server/scheduling/coordination';
import { captureTime, timeLedger } from '../../../server/time/time-ledger';
import { applyTimeScope, previewTimeScope } from '../../../server/time/time-scope';
import { publishableEntry } from '../../../server/time/publishable';
import { migrateSnapshot } from '../../../server/store/migrations';
import { projectById } from '../../../server/office/projects';
import type { HarnessRequest, WorkTime } from '../../../src/shared';

const stores: Store[] = [], paths: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); paths.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });
function setup() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-scope-')); paths.push(root);
    const store = new Store(':memory:', projectById('brain'), root); stores.push(store);
    store.state.coordination = coordination();
    Object.assign(timeLedger(store), { activatedAt: '2026-10-28T00:00:00Z', scopePolicy: 'legacy' });
    return store;
}
const work = (id: string, startedAt: string, ms: number, extra: Partial<WorkTime> = {}): WorkTime => ({ id, role: 'lead', task: 't', ticket: 'GH-1', stage: 'implement', requestId: '', sessionId: '', provider: 'codex', model: '', effort: '', status: 'completed', startedAt, lastHeartbeatAt: startedAt, endedAt: new Date(Date.parse(startedAt) + ms).toISOString(), elapsedMs: ms, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '', ...extra });
const request = (expectedSha256: string): HarnessRequest => ({ id: crypto.randomUUID(), action: 'apply-time-scope', key: '', head: expectedSha256, lane: 'operations', requestedAt: '', status: 'working', detail: '', timeScope: { policy: 'model-work-v1', expectedSha256 } } as HarnessRequest);

function history(store: Store) {
    store.state.workLog = [
        work('impl', '2026-10-28T14:00:00Z', 60_000),
        work('readback', '2026-10-28T15:00:00Z', 30_000, { stage: 'readback' }),                       // model work legacy skipped
        work('recovery', '2026-10-29T15:00:00Z', 45_000, { effortKind: 'administrative' }),             // a newly eligible day
        work('harness', '2026-10-28T16:00:00Z', 20_000, { provider: 'harness', stage: 'publish' }),     // legacy counted, no model ran
        work('other', '2026-10-28T14:00:00Z', 10_000, { ticket: 'GH-2' }),
        work('maintenance', '2026-10-28T17:00:00Z', 15_000, { ticket: 'CMS maintenance (weekly)', stage: 'maintenance-readback' }), // a label, not a board item
    ];
    captureTime(store);
}

test('existing ledgers stay on the legacy scope; deploying the selector queues no historical correction', () => {
    const store = setup(); history(store);
    const before = structuredClone(timeLedger(store).entries);
    captureTime(store);
    expect(timeLedger(store).entries).toEqual(before);
    expect(before.map(e => [e.id, e.seconds])).toEqual([['GH-1:2026-10-28', 80], ['GH-2:2026-10-28', 10]]);
    const snapshot: any = structuredClone(store.state); delete snapshot.coordination.time.scopePolicy;
    migrateSnapshot(snapshot, projectById('brain'));
    expect(snapshot.coordination.time.scopePolicy).toBe('legacy');
    const fresh = new Store(':memory:', projectById('brain')); stores.push(fresh); fresh.state.coordination = coordination();
    expect(timeLedger(fresh).scopePolicy).toBe('model-work-v1');
});

test('the preview names every changed ticket-day, including new days and harness removal, and binds a digest', () => {
    const store = setup(); history(store);
    const preview = previewTimeScope(store);
    expect(preview).toMatchObject({ from: 'legacy', to: 'model-work-v1', applicable: true, blockers: { disabled: false, liveWork: [], publications: [], manual: [] } });
    expect(preview.rows.map(r => [r.id, r.status, r.oldSeconds, r.newSeconds])).toEqual([['GH-1:2026-10-28', 'pending', 80, 90], ['GH-1:2026-10-29', 'new', 0, 45]]);
    expect(preview.tickets).toEqual([{ key: 'GH-1', oldSeconds: 80, newSeconds: 135 }]);
    expect(preview.expectedSha256).toMatch(/^[a-f0-9]{64}$/);
});

test('apply changes exactly the previewed entries, keeps worklog identity, records a receipt, and repeats as a no-op', () => {
    const store = setup(); history(store);
    const ledger = timeLedger(store);
    Object.assign(ledger.entries[0], { status: 'posted', worklogId: '10', revision: 3 });
    const preview = previewTimeScope(store), req = request(preview.expectedSha256!);
    applyTimeScope(store, req);
    expect(ledger.scopePolicy).toBe('model-work-v1');
    expect(ledger.scopeCorrection).toMatchObject({ requestId: req.id, expectedSha256: preview.expectedSha256, changedEntries: 2 });
    expect(ledger.entries.find(e => e.id === 'GH-1:2026-10-28')).toMatchObject({ seconds: 90, worklogId: '10', revision: 4, status: 'pending' });
    expect(ledger.entries.find(e => e.id === 'GH-1:2026-10-29')).toMatchObject({ seconds: 45, revision: 1, status: 'pending' });
    expect(ledger.entries.find(e => e.id === 'GH-2:2026-10-28')).toMatchObject({ seconds: 10 });
    const after = structuredClone(ledger);
    applyTimeScope(store, req);
    expect(ledger).toEqual(after);
    // Later capture follows the new scope without touching the receipt.
    store.state.workLog!.push(work('slack', '2026-10-30T15:00:00Z', 5_000, { stage: 'slack-send' }));
    captureTime(store);
    expect(ledger.entries.find(e => e.id === 'GH-1:2026-10-30')?.seconds).toBe(5);
    expect(ledger.scopeCorrection).toEqual(after.scopeCorrection);
});

test('a stale digest is rejected and nothing changes', () => {
    const store = setup(); history(store);
    const preview = previewTimeScope(store);
    store.state.workLog!.push(work('late', '2026-10-28T18:00:00Z', 7_000, { stage: 'transition' }));
    const before = structuredClone(timeLedger(store));
    expect(() => applyTimeScope(store, request(preview.expectedSha256!))).toThrow('stale');
    expect(timeLedger(store)).toEqual(before);
});

test('live work on an affected ticket blocks the correction; unrelated live work does not change the digest', () => {
    const store = setup(); history(store);
    const digest = previewTimeScope(store).expectedSha256!;
    store.state.workLog!.push(work('elsewhere', '2026-10-28T19:00:00Z', 0, { ticket: 'GH-9', status: 'running', endedAt: '' }));
    expect(previewTimeScope(store).expectedSha256).toBe(digest);
    store.state.workLog!.push(work('live', '2026-10-28T19:00:00Z', 0, { status: 'running', endedAt: '' }));
    const blocked = previewTimeScope(store);
    expect(blocked).toMatchObject({ applicable: false, expectedSha256: null, blockers: { liveWork: [{ ticket: 'GH-1', workId: 'live', status: 'running' }] } });
    expect(() => applyTimeScope(store, request(digest))).toThrow('blocked-by-live-work');
    expect(timeLedger(store).scopePolicy).toBe('legacy');
    // A newly admitted stage still running counts as live work for its ticket even before any segment.
    store.state.workLog = store.state.workLog!.filter(w => w.id !== 'live');
    store.state.workLog.push(work('slack-live', '2026-10-28T19:00:00Z', 0, { ticket: 'GH-2', stage: 'slack-send', status: 'stopping', endedAt: '' }));
    expect(previewTimeScope(store).blockers.liveWork).toEqual([{ ticket: 'GH-2', workId: 'slack-live', status: 'stopping' }]);
});

test('unresolved publications block the correction and never let another day publish around them', () => {
    const store = setup(); history(store);
    const ledger = timeLedger(store);
    ledger.entries.push({ id: 'GH-1:2026-10-27', revision: 1, key: 'GH-1', date: '2026-10-27', seconds: 9, sourceIds: [], status: 'uncertain', detail: '', url: '' });
    // A day stuck uncertain before dispatch blocks the correction (manual reconciliation) but not later publication.
    expect(previewTimeScope(store)).toMatchObject({ applicable: false, blockers: { publications: ['GH-1'] } });
    expect(publishableEntry(ledger, 'github')?.key).toBe('GH-1');
    // An attempted write awaiting read-back is a settlement risk: GitHub waits; Jira days are independent.
    ledger.publications = [{ id: 'p', key: 'GH-1', status: 'uncertain' } as any];
    expect(publishableEntry(ledger, 'github')?.key).toBe('GH-2');
    expect(publishableEntry(ledger, 'azure')?.key).toBe('GH-1');
    // A later verified write of the ticket total supersedes the earlier uncertain attempt.
    ledger.entries.find(e => e.id === 'GH-1:2026-10-27')!.status = 'posted';
    ledger.publications = [{ id: 'old', provider: 'github', key: 'GH-1', status: 'uncertain', createdAt: '2026-11-02T14:52:00Z', covered: [] } as any, { id: 'new', provider: 'github', key: 'GH-1', status: 'verified', createdAt: '2026-11-02T16:14:00Z', covered: [] } as any];
    expect(publishableEntry(ledger, 'github')?.key).toBe('GH-1');
    expect(previewTimeScope(store).blockers.publications).toEqual([]);
});

test('a disabled ledger cannot be previewed or corrected', () => {
    const store = setup(); history(store);
    timeLedger(store).enabled = false;
    expect(previewTimeScope(store)).toMatchObject({ applicable: false, rows: [], blockers: { disabled: true } });
    expect(() => applyTimeScope(store, request('a'.repeat(64)))).toThrow('disabled');
});

test('Jira days already excluded are not phantom changes, and a worklog that would drop to zero needs manual correction', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-scope-jira-')); paths.push(root);
    const store = new Store(':memory:', projectById('cec'), root); stores.push(store);
    store.state.coordination = coordination();
    Object.assign(timeLedger(store), { activatedAt: '2026-10-28T00:00:00Z', scopePolicy: 'legacy' });
    store.state.workLog = [work('impl', '2026-10-28T14:00:00Z', 60_000, { ticket: 'CEC-1' }), work('h', '2026-10-29T14:00:00Z', 30_000, { ticket: 'CEC-2', provider: 'harness' })];
    captureTime(store);
    const ledger = timeLedger(store);
    ledger.entries.push({ id: 'CEC-3:2026-10-20', revision: 1, key: 'CEC-3', date: '2026-10-20', seconds: 50, sourceIds: [], status: 'excluded', detail: '', url: '' });
    Object.assign(ledger.entries.find(e => e.key === 'CEC-2')!, { status: 'posted', worklogId: '77' });
    const preview = previewTimeScope(store);
    expect(preview.rows.map(r => r.id)).toEqual(['CEC-2:2026-10-29']);
    expect(preview).toMatchObject({ applicable: false, blockers: { manual: ['CEC-2:2026-10-29'] } });
});
