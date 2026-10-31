import { afterEach, expect, test, vi } from 'vitest';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { coordination } from '../../../server/scheduling/coordination';
import { projectById } from '../../../server/office/projects';
import { captureTime, timeLedger } from '../../../server/time/time-ledger';
import { correctRecoveryClassification, timeClassificationDigest } from '../../../server/time/time-classification';
import { executeRequest } from '../../../server/scheduling/requests';
import type { HarnessRequest, WorkTime } from '../../../src/shared';
const roots: string[] = [], stores: Store[] = [];
afterEach(() => { vi.restoreAllMocks(); stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-effort-correction-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store); store.state.coordination = coordination();
    const work: WorkTime = { id: randomUUID(), role: 'lead', task: 'Provider reconciliation', ticket: 'GH-113', stage: 'implementation-readback', requestId: 'original-job', sessionId: randomUUID(), provider: 'codex', model: '', effort: '', status: 'completed', startedAt: '2026-10-29T14:02:00Z', lastHeartbeatAt: '2026-10-29T14:02:30Z', endedAt: '2026-10-29T14:02:30Z', elapsedMs: 30000, queuedMs: 0, inputTokens: 10, outputTokens: 10, durationUncertain: false, reportedAt: '', effortKind: 'substantive', segments: [{ startedAt: '2026-10-29T14:02:00Z', endedAt: '2026-10-29T14:02:30Z', durationMs: 30000 }], gaps: [] };
    const developer = { ...structuredClone(work), id: randomUUID(), role: 'developer' as const, stage: 'github-implement', startedAt: '2026-10-29T14:00:00Z', endedAt: '2026-10-29T14:01:00Z', lastHeartbeatAt: '2026-10-29T14:01:00Z', segments: [{ startedAt: '2026-10-29T14:00:00Z', endedAt: '2026-10-29T14:01:00Z', durationMs: 60000 }], elapsedMs: 60000 };
    store.state.workLog = [work, developer]; timeLedger(store).activatedAt = '2026-10-29T00:00:00Z'; timeLedger(store).enabled = true; captureTime(store);
    const ledger = timeLedger(store); ledger.publications = [{ id: 'old-publication', provider: 'github', key: work.ticket, status: 'verified', intendedValue: 1.25, baseline: 1, covered: [{ id: ledger.entries[0].id, revision: 1, seconds: 90 }] } as any];
    const save = (name: string, value: unknown) => { const dir = resolve(root, 'sessions', work.id); mkdirSync(dir, { recursive: true }); writeFileSync(resolve(dir, name), JSON.stringify(value)); };
    save('provider.json', { project: store.project.id, repository: store.project.repository, role: work.role, provider: work.provider, readOnly: true });
    save('assignment.json', { id: work.id, role: work.role, stage: work.stage, work: { projectId: store.project.id } });
    save('capabilities.json', { name: 'reader', readOnly: true });
    const request: HarnessRequest = { id: randomUUID(), action: 'correct-recovery-time', key: '', head: '', lane: 'operations', status: 'queued', requestedAt: '', detail: '', timeClassification: { workIds: [work.id], expectedSha256: timeClassificationDigest([work]), reason: 'recovery-work-is-administrative' } };
    store.state.coordination!.requests = [request]; store.save();
    return { root, store, work, developer, request, save, ledger };
}
test('corrects confirmed effort once with a durable prior record and unchanged raw measurements/publications', () => {
    const f = fixture(), prior = structuredClone(f.work), publications = JSON.stringify(f.ledger.publications);
    expect(f.ledger.entries[0].seconds).toBe(90);
    correctRecoveryClassification(f.store, f.request);
    expect(f.ledger.entries[0].seconds).toBe(60); expect(f.ledger.entries[0].status).toBe('pending');
    expect(f.work.effortKind).toBe('administrative'); expect(f.work.segments).toEqual(prior.segments); expect(f.work.elapsedMs).toBe(prior.elapsedMs); expect(f.work.inputTokens).toBe(prior.inputTokens);
    expect(JSON.stringify(f.ledger.publications)).toBe(publications); expect(f.developer.effortKind).toBe('substantive');
    const audit = JSON.parse(readFileSync(f.work.effortCorrection!.auditPath, 'utf8')); expect(audit.prior[0]).toEqual(prior); expect(audit.proofs).toHaveLength(3);
    correctRecoveryClassification(f.store, f.request);
    expect(f.store.state.events.filter(event => event.kind === 'time-classification-corrected')).toHaveLength(1);
});
test.each(['source-work', 'active', 'provider', 'uncertain-publication', 'uncertain-entry', 'changed-measurement'] as const)('blocks %s without changing effort or prior publications', kind => {
    const f = fixture();
    if (kind === 'source-work') { f.work.stage = 'github-review'; f.save('assignment.json', { id: f.work.id, role: f.work.role, stage: f.work.stage, work: { projectId: f.store.project.id } }); f.request.timeClassification!.expectedSha256 = timeClassificationDigest([f.work]); }
    if (kind === 'active') { f.work.status = 'running'; f.request.timeClassification!.expectedSha256 = timeClassificationDigest([f.work]); }
    if (kind === 'provider') f.save('provider.json', { project: f.store.project.id, repository: f.store.project.repository, role: 'lead', provider: 'codex', readOnly: false });
    if (kind === 'uncertain-publication') f.ledger.publications![0].status = 'uncertain';
    if (kind === 'uncertain-entry') f.ledger.entries[0].status = 'uncertain';
    if (kind === 'changed-measurement') f.work.elapsedMs++;
    const prior = JSON.stringify(f.store.state.workLog), publications = JSON.stringify(f.ledger.publications);
    expect(() => correctRecoveryClassification(f.store, f.request)).toThrow(); expect(JSON.stringify(f.store.state.workLog)).toBe(prior); expect(JSON.stringify(f.ledger.publications)).toBe(publications);
});
test('a changed ticket invalidates the correction before classification, ledger, audit or event changes', () => {
    const f = fixture(), expected = f.request.timeClassification!.expectedSha256;
    f.work.ticket = 'GH-114';
    const work = JSON.stringify(f.store.state.workLog), ledger = JSON.stringify(f.ledger), events = JSON.stringify(f.store.state.events);
    expect(timeClassificationDigest([f.work])).not.toBe(expected);
    expect(() => correctRecoveryClassification(f.store, f.request)).toThrow('Recovery measurements changed');
    expect(JSON.stringify(f.store.state.workLog)).toBe(work); expect(JSON.stringify(f.ledger)).toBe(ledger); expect(JSON.stringify(f.store.state.events)).toBe(events);
    expect(existsSync(resolve(f.root, 'accounting-corrections'))).toBe(false);
});
test('disabled accounting blocks a posted mixed correction until a fresh enabled retry', async () => {
    const f = fixture(); f.ledger.entries[0].status = 'posted'; f.ledger.enabled = false;
    const work = JSON.stringify(f.store.state.workLog), ledger = JSON.stringify(f.ledger), publications = JSON.stringify(f.ledger.publications);
    await executeRequest(f.store, new Engine(f.store), {} as any, f.request);
    expect(f.request.status).toBe('blocked'); expect(f.request.detail).toContain('Enable time accounting');
    expect(JSON.stringify(f.store.state.workLog)).toBe(work); expect(JSON.stringify(f.ledger)).toBe(ledger);
    expect(existsSync(resolve(f.root, 'accounting-corrections'))).toBe(false);
    expect(f.store.state.events.some(event => event.kind === 'time-classification-corrected')).toBe(false);
    f.ledger.enabled = true;
    const retry: HarnessRequest = { ...structuredClone(f.request), id: randomUUID(), status: 'queued' };
    f.store.state.coordination!.requests!.push(retry);
    await executeRequest(f.store, new Engine(f.store), {} as any, retry);
    expect(retry.status).toBe('completed'); expect(f.request.status).toBe('blocked');
    expect(f.ledger.entries[0]).toMatchObject({ seconds: 60, status: 'pending' });
    expect(f.work.effortKind).toBe('administrative'); expect(JSON.stringify(f.ledger.publications)).toBe(publications);
});
test('a failed atomic correction retains the original classification and a blocked durable request', async () => {
    const f = fixture(), save = f.store.save.bind(f.store); let calls = 0;
    vi.spyOn(f.store, 'save').mockImplementation(() => { calls++; if (calls === 2) throw new Error('Simulated pre-COMMIT failure'); return save(); });
    await executeRequest(f.store, new Engine(f.store), {} as any, f.request);
    expect(f.store.state.workLog![0].effortKind).toBe('substantive');
    expect(f.store.state.coordination!.requests![0].status).toBe('blocked');
    expect(f.store.state.workLog![0].segments).toEqual(f.work.segments);
    const retry: HarnessRequest = { ...structuredClone(f.store.state.coordination!.requests![0]), id: randomUUID(), status: 'queued', head: f.request.timeClassification!.expectedSha256 };
    f.store.state.coordination!.requests![0].head = retry.head;
    f.store.state.coordination!.requests!.push(retry);
    await executeRequest(f.store, new Engine(f.store), {} as any, retry); expect(retry.status).toBe('completed');
    const { scheduledWork } = await import('../../../server/scheduling/scheduled-work');
    const rows = scheduledWork({ store: f.store, engine: new Engine(f.store), conversations: {} as any, coordinator: {} as any }, new Map([[f.store.project.id, f.store]]), new Date(), 'operations');
    expect(rows.find(row => row.work.id === f.request.id)!.eligibility.state).toBe('terminal'); expect(f.store.state.coordination!.requests![0].status).toBe('blocked');
});


test('a recovery-only date queues a zero correction instead of retaining previously counted effort', () => {
    const f = fixture(); f.store.state.workLog = [f.work]; f.ledger.entries = []; captureTime(f.store);
    f.ledger.publications![0].covered = [{ id: f.ledger.entries[0].id, revision: 1, seconds: 30 }];
    const publications = JSON.stringify(f.ledger.publications);
    expect(f.ledger.entries[0].seconds).toBe(30);
    correctRecoveryClassification(f.store, f.request);
    expect(f.ledger.entries[0]).toMatchObject({ seconds: 0, sourceIds: [], status: 'pending', revision: 2 });
    expect(JSON.stringify(f.ledger.publications)).toBe(publications);
});
test('overlapping substantive effort survives correction when cached contributor IDs omit it', () => {
    const f = fixture();
    Object.assign(f.work, { startedAt: f.developer.startedAt, endedAt: f.developer.endedAt, lastHeartbeatAt: f.developer.lastHeartbeatAt,
        elapsedMs: 60000, segments: structuredClone(f.developer.segments) });
    f.request.timeClassification!.expectedSha256 = timeClassificationDigest([f.work]);
    f.store.state.workLog = [f.work]; f.ledger.entries = []; captureTime(f.store);
    const entry = f.ledger.entries[0]; entry.status = 'posted';
    f.ledger.publications![0].covered = [{ id: entry.id, revision: entry.revision!, seconds: 60 }];
    f.ledger.baselines = { [f.work.ticket]: { baseline: 1, lastWritten: 1.0167, itemId: 'existing-board-item' } };
    f.store.state.workLog.push(f.developer); captureTime(f.store);
    expect(entry).toMatchObject({ seconds: 60, sourceIds: [f.work.id], status: 'posted', revision: 1 });
    const raw = structuredClone(f.store.state.workLog), publications = JSON.stringify(f.ledger.publications), baselines = JSON.stringify(f.ledger.baselines);
    const save = f.store.save.bind(f.store), totals: number[] = [];
    vi.spyOn(f.store, 'save').mockImplementation(() => { totals.push(entry.seconds); save(); });
    correctRecoveryClassification(f.store, f.request);
    expect(entry).toMatchObject({ seconds: 60, sourceIds: [f.developer.id], status: 'posted', revision: 1 });
    expect(totals.length).toBeGreaterThan(0); expect(totals.every(seconds => seconds === 60)).toBe(true);
    expect(f.work).toEqual({ ...raw[0], effortKind: 'administrative', effortCorrection: expect.any(Object) });
    expect(f.developer).toEqual(raw[1]);
    expect(JSON.stringify(f.ledger.publications)).toBe(publications); expect(JSON.stringify(f.ledger.baselines)).toBe(baselines);
});
