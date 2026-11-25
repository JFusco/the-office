import { DatabaseSync } from 'node:sqlite';
import { compareMemory, recordDeployedFixes } from '../../../../server/incidents/deployed-fixes';
import { IncidentLedger } from '../../../../server/incidents/incident-ledger';
import { admitRepairWaits } from '../../../../server/incidents/repair/admit-repair-waits';
import type { ResumeIntent } from '../../../../server/incidents/repair/dispatch-resume';
import { recordIncidentEvent } from '../../../../server/incidents/record-event';
import { syncIncidents } from '../../../../server/incidents/sync-incidents';
import { scheduledWork, type OfficeEntry } from '../../../../server/scheduling/scheduled-work';
import type { Store } from '../../../../server/store/store';
import type { RepairBoundary, RepairRoute, SubjectFix } from '../../../../src/contracts/incidents';
import type { AssignmentReview, OfficeSnapshot } from '../../../../src/shared';
import { savedFingerprint } from '../../store/saved-fingerprint-fixture';
import { savedState as readSavedState } from '../../store/saved-state-fixture';
import { fakeGitHub, historyCall, REPO } from '../github-fake';
import { item, later, observe, office, projectStore } from '../incident-fixture';
import { FIX, OPERATION, RELEASE, VERIFIED } from './resume-fixture';

const loud = (message: string) => { throw new Error(message); };
export const STAGE = 'assignment-review';
export const assignmentRoute = (key: string): RepairRoute => ({ action: 'review-assignment', payload: { key }, expectedStage: STAGE });
/** An assignment review the harness stopped: its read of ownership timed out. `endedAt` marks the episode. */
export const review = (id: string, key: string, over: Partial<AssignmentReview> = {}): AssignmentReview => ({
    id, key, summary: 'Synthetic', url: '', queuedAt: later(-30).toISOString(), startedAt: later(-29).toISOString(), endedAt: later(-14).toISOString(), status: 'blocked', owner: '',
    detail: 'Error: the ownership read timed out', failure: { category: 'timeout', dispatched: true, detail: 'The ownership read timed out' }, ...over,
});

/**
 * A project with stopped assignment reviews whose incident has a repair, a fix bound with
 * `review-assignment` for every review observed (`stage-left` for `assignment-review` unless
 * `boundary` says otherwise), the repair-wait markers in place (minute 3) and the fix found in the
 * running release (minute 4): the state in which a review's resume is due. As the scheduler does,
 * only the last review stored for a ticket is observed, and none whose ticket a delivery job holds.
 */
export async function assignmentWorld(stores: Store[], dbs: DatabaseSync[], reviews: AssignmentReview[] = [review('review-1', 'GH-1'), review('review-2', 'GH-2')], { project = 'cms-field-vocabulary', fixEvent = 'cli-bind-1', boundary = { kind: 'stage-left', stage: STAGE } as RepairBoundary, declare = (bound: SubjectFix): SubjectFix => bound } = {}) {
    const store = projectStore(project); stores.push(store);
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db);
    store.state.coordination!.listener.reviews = reviews;
    const listed = () => store.state.coordination!.listener.reviews;
    const latest = () => [...new Map(listed().map(held => [held.key, held])).values()].filter(held => !(store.state.coordination!.jobs ?? []).some(job => job.key === held.key && job.status !== 'cancelled'));
    const observed = (minutes = 0) => syncIncidents(ledger, office(observe(store, latest().filter(held => ['blocked', 'interrupted'].includes(held.status)).map(held => item('intake', held.id, STAGE, 'blocked', 'Blocked', 'unclassified', project)))), later(minutes), undefined, loud);
    observed();
    const id = ledger.list()[0].id;
    recordIncidentEvent(ledger, id, 'cli-start-1', ledger.get(id)!.revision, { kind: 'repair-started', request: { kind: 'repair-started', issue: 524 }, issue: { repository: REPO, number: 524, url: `https://github.com/${REPO}/issues/524` } }, later(1));
    const keyOf = (subject: string) => listed().find(held => held.id === subject.split('/').slice(2).join('/'))!.key;
    const bindings: SubjectFix[] = ledger.get(id)!.repair!.subjects.map(subject => declare({ ...subject, disposition: 'route', route: assignmentRoute(keyOf(subject.subject)), boundary }));
    recordIncidentEvent(ledger, id, fixEvent, ledger.get(id)!.revision, { kind: 'fix-bound', request: { kind: 'fix-bound', reference: FIX, bindings }, fix: { commit: FIX, pullRequest: null, onMain: true } }, later(2));
    const mark = (minutes: number) => admitRepairWaits(ledger, [{ store }], later(minutes), () => false, loud);
    mark(3);
    await recordDeployedFixes({ ledger, identity: () => VERIFIED, loadedHash: VERIFIED.hash, execute: fakeGitHub({ [historyCall(FIX, RELEASE)]: { status: 'ahead' } }).execute, now: later(4), memory: compareMemory() });
    const subject = (reviewId: string) => `${project}/intake/${reviewId}`;
    const binding = (reviewId: string) => ledger.get(id)!.fixes!.at(-1)!.bindings.find(bound => bound.subject === subject(reviewId))! as ResumeIntent['binding'];
    const intent = (reviewId: string, over: Partial<ResumeIntent> = {}): ResumeIntent => ({ incident: id, fix: { event: fixEvent, commit: FIX }, release: { commit: RELEASE, operation: OPERATION }, binding: binding(reviewId), ...over });
    const requests = () => store.state.coordination!.requests ?? [];
    const admissions = () => (store.db.prepare('SELECT kind, ref FROM admissions ORDER BY seq').all() as { kind: string; ref: string }[]).map(row => `${row.kind}:${row.ref}`);
    /** The project's state as a restarted service reads it: what is saved, through the redaction every saved string gets. */
    const savedState = () => readSavedState<OfficeSnapshot>(store);
    const reload = () => { store.save(); Object.assign(store.state, savedState()); };
    /** The scheduler's projection of every lane, as it would claim work now. */
    const scheduled = (minutes: number) => { const entry = { store, engine: {}, conversations: {}, coordinator: {} } as OfficeEntry; return ['delivery', 'operations', 'it'].flatMap(lane => scheduledWork(entry, new Map([[store.project.id, store]]), later(minutes), lane)); };
    const find = (reviewId: string) => listed().find(held => held.id === reviewId)!;
    return { store, db, ledger, id, reviews: listed, review: find, observed, mark, subject, binding, intent, requests, admissions, savedState, reload, scheduled,
        waits: () => store.state.coordination!.repairWaits ?? {},
        /** Everything saved for the project, as one digest: equal before and after means the project was not written. */
        saved: () => savedFingerprint(store) };
}
