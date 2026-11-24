import { DatabaseSync } from 'node:sqlite';
import { vi } from 'vitest';
import { compareMemory, recordDeployedFixes } from '../../../../server/incidents/deployed-fixes';
import { IncidentLedger } from '../../../../server/incidents/incident-ledger';
import { admitRepairWaits } from '../../../../server/incidents/repair/admit-repair-waits';
import type { ResumeIntent } from '../../../../server/incidents/repair/dispatch-resume';
import { recordIncidentEvent } from '../../../../server/incidents/record-event';
import { syncIncidents } from '../../../../server/incidents/sync-incidents';
import { Coordinator } from '../../../../server/scheduling/coordination';
import { Engine } from '../../../../server/scheduling/engine';
import type { Store } from '../../../../server/store/store';
import type { RepairBoundary, RepairRoute, SubjectFix } from '../../../../src/contracts/incidents';
import type { DailyCheckpoint, MaintenanceRun, OfficeSnapshot } from '../../../../src/shared';
import { savedFingerprint } from '../../store/saved-fingerprint-fixture';
import { savedState as readSavedState } from '../../store/saved-state-fixture';
import { fakeGitHub, historyCall, REPO } from '../github-fake';
import { item, later, observe, office, projectStore } from '../incident-fixture';
import { FIX, OPERATION, RELEASE, VERIFIED } from './resume-fixture';

const loud = (message: string) => { throw new Error(message); };
export const DATE = '2026-11-19', NATIVE_RUN = 'b3dca6de-3de6-4a6c-96c8-4c21ac9747c2';
/** The original run of each fixture checkpoint: `cp-1` was linked to `original-1`. */
export const runOf = (checkpoint: string) => `original-${checkpoint.split('-').at(-1)}`;
export const checkpointSubject = (checkpoint: string) => `brain/checkpoint/${checkpoint}`;
export const nativeRoute = (checkpoint: string): RepairRoute => ({ action: 'reconcile-native-checkpoint', payload: { key: checkpoint }, expectedStage: 'checkpoint' });

/** A Brain nightly checkpoint its maintenance left blocked; `endedAt` marks the episode. */
export const checkpoint = (id: string, over: Partial<DailyCheckpoint> = {}): DailyCheckpoint =>
    ({ id, date: DATE, dueAt: `${DATE}T21:00:00Z`, requestedAt: '', startedAt: '', endedAt: 'old-end', status: 'blocked', runId: runOf(id), detail: 'Original worker exited with surviving subprocesses', ...over });
/** Its original run: reconciled, its read-back passed with every receipt verified and certain. */
export const original = (checkpointId: string, over: Partial<MaintenanceRun> = {}): MaintenanceRun => ({
    id: runOf(checkpointId), checkpointId, requestedAt: '', startedAt: '', endedAt: '', status: 'reconciled', weekly: false, stage: 'brain-maintenance', error: '',
    steps: [{ role: 'pm', stage: 'maintenance-readback', at: '', result: { outcome: 'passed', summary: 'No uncertain effects remain', ledger: 'Keep older failures', blocker: '', candidates: [], receipts: [{ id: 'readback', action: 'read', target: runOf(checkpointId), verified: true, uncertain: false, detail: 'Native claim refused completed; no write dispatched' }] } }], ...over,
});
/** Brain's native gate as its status read returns it: that date already completed by the native run. */
export const gate = () => ({ slotDate: DATE, attempts: 1, retryAfter: null, active: null, completed: { id: NATIVE_RUN, authorId: 'c2453dce-7399-4e8b-9dd6-1090cd798c52', slotDate: DATE, phase: 'completed' as const, completedAt: `${DATE}T14:01:47Z`, reportSha256: 'a'.repeat(64) } });

/**
 * Brain with blocked nightly checkpoints whose incident has a repair, a fix bound with the
 * native read-back route for every checkpoint (`record-settled` unless `boundary` says otherwise),
 * the repair-wait markers in place (minute 3) and the fix found in the running release (minute
 * 4): the state in which a checkpoint's resume is due. A completed wrapper run of the native date
 * is saved too, as the native handler requires.
 */
export async function checkpointWorld(stores: Store[], dbs: DatabaseSync[], ids = ['cp-1', 'cp-2'], { fixEvent = 'cli-bind-1', boundary = { kind: 'record-settled' } as RepairBoundary, declare = (bound: SubjectFix): SubjectFix => bound } = {}) {
    const store = projectStore('brain'); stores.push(store);
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db);
    const wrapper: MaintenanceRun = { ...original('wrapper'), id: 'completed-wrapper', checkpointId: undefined, status: 'completed', nativeRunId: NATIVE_RUN, steps: [] };
    store.state.maintenance = { runs: [wrapper, ...ids.map(id => original(id))], lastDaily: DATE, lastWeekly: '', ledger: 'Keep historical failures' };
    store.state.coordination!.checkpoints.push(...ids.map(id => checkpoint(id)));
    const checkpoints = () => store.state.coordination!.checkpoints, runs = () => store.state.maintenance!.runs;
    const run = (checkpointId: string) => runs().find(saved => saved.id === runOf(checkpointId))!;
    const observed = (minutes = 0) => syncIncidents(ledger, office(observe(store, checkpoints().filter(held => ['blocked', 'interrupted'].includes(held.status)).map(held => item('checkpoint', held.id, 'checkpoint', 'blocked', 'Blocked', 'unclassified', 'brain')))), later(minutes), undefined, loud);
    observed();
    const id = ledger.list()[0].id;
    recordIncidentEvent(ledger, id, 'cli-start-1', ledger.get(id)!.revision, { kind: 'repair-started', request: { kind: 'repair-started', issue: 526 }, issue: { repository: REPO, number: 526, url: `https://github.com/${REPO}/issues/526` } }, later(1));
    const bindings: SubjectFix[] = ledger.get(id)!.repair!.subjects.map(subject => declare({ ...subject, disposition: 'route', route: nativeRoute(subject.subject.split('/').slice(2).join('/')), boundary }));
    recordIncidentEvent(ledger, id, fixEvent, ledger.get(id)!.revision, { kind: 'fix-bound', request: { kind: 'fix-bound', reference: FIX, bindings }, fix: { commit: FIX, pullRequest: null, onMain: true } }, later(2));
    const mark = (minutes: number) => admitRepairWaits(ledger, [{ store }], later(minutes), () => false, loud);
    mark(3);
    const arrive = (minutes = 4) => recordDeployedFixes({ ledger, identity: () => VERIFIED, loadedHash: VERIFIED.hash, execute: fakeGitHub({ [historyCall(FIX, RELEASE)]: { status: 'ahead' } }).execute, now: later(minutes), memory: compareMemory() });
    await arrive();
    const binding = (checkpointId: string) => ledger.get(id)!.fixes!.at(-1)!.bindings.find(bound => bound.subject === checkpointSubject(checkpointId))! as ResumeIntent['binding'];
    const intent = (checkpointId: string, over: Partial<ResumeIntent> = {}): ResumeIntent => ({ incident: id, fix: { event: fixEvent, commit: FIX }, release: { commit: RELEASE, operation: OPERATION }, binding: binding(checkpointId), ...over });
    const requests = () => store.state.coordination!.requests ?? [];
    const admissions = () => (store.db.prepare("SELECT ref FROM admissions WHERE kind='request' ORDER BY seq").all() as { ref: string }[]).map(row => row.ref);
    /** The project's state as a restarted service reads it: what is saved, through the redaction every saved string gets. */
    const savedState = () => readSavedState<OfficeSnapshot>(store);
    const reload = () => { store.save(); Object.assign(store.state, savedState()); };
    /** The scheduler's own collaborators, with Brain's native gate answering `status` and no worker ever started. */
    const scheduler = (status: () => unknown = gate) => {
        const engine = new Engine(store), coordinator = new Coordinator(store, engine);
        const read = vi.spyOn(engine.maintenance as never as { readStatus: () => Promise<unknown> }, 'readStatus').mockImplementation(async () => status());
        const maintenance = vi.spyOn(engine.maintenance, 'request'), worker = vi.spyOn(engine.agents, 'run');
        return { engine, coordinator, read, maintenance, worker };
    };
    return { store, db, ledger, id, checkpoints, runs, run, observed, mark, arrive, binding, intent, requests, admissions, savedState, reload, scheduler,
        waits: () => store.state.coordination!.repairWaits ?? {},
        /** Everything saved for the project, as one digest: equal before and after means the project was not written. */
        saved: () => savedFingerprint(store) };
}
