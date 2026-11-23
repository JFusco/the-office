import type { DatabaseSync } from 'node:sqlite';
import { compareMemory, recordDeployedFixes } from '../../../../server/incidents/deployed-fixes';
import type { ResumeIntent } from '../../../../server/incidents/repair/dispatch-resume';
import { recordIncidentEvent } from '../../../../server/incidents/record-event';
import type { ReleaseIdentity } from '../../../../server/office/release-identity';
import type { Store } from '../../../../server/store/store';
import type { RepairRoute, ResumeSwitch, SubjectFix } from '../../../../src/contracts/incidents';
import { fakeGitHub, historyCall, SHA } from '../github-fake';
import { later, world } from './repair-wait-fixture';

export const FIX = SHA('f'), RELEASE = SHA('e'), OPERATION = 'deploy-20261121t030000z-0a0b0c0d';
export const VERIFIED: Extract<ReleaseIdentity, { status: 'verified' }> = { status: 'verified', commit: RELEASE, hash: '1'.repeat(64), manifestDigest: '2'.repeat(64), operation: OPERATION, activatedAt: '2026-11-21T03:00:09.000Z' };
export const ENABLED: ResumeSwitch = { enabled: true, revision: 1, reason: 'go', at: '2026-11-21T02:00:00.000Z' }, PAUSED: ResumeSwitch = { enabled: false, revision: 2, reason: 'two rollbacks in a row', at: '2026-11-21T02:00:00.000Z' };
/** The saved-review route for one of the fixture's jobs: its key is `GH-<id>` and it stopped at `review`. */
export const reviewRoute = (jobId: string, over: Partial<RepairRoute> = {}): RepairRoute => ({ action: 'reconcile-review', payload: { key: `GH-${jobId}` }, expectedStage: 'review', ...over });

/**
 * A project with stopped jobs whose incident has a repair, a fix bound with a route for every
 * job, the repair-wait markers in place (minute 3) and the fix found in the running release
 * (minute 4): the state in which a resume is due.
 */
export async function deployedWorld(stores: Store[], dbs: DatabaseSync[], ids = ['1', '2'], route: (jobId: string) => RepairRoute = jobId => reviewRoute(jobId), { fixEvent = 'cli-bind-1', bindMinute = 2, declare = (bound: SubjectFix): SubjectFix => bound } = {}) {
    const w = world(stores, dbs, ids);
    w.start('cli-start-1', 1);
    // `declare` replaces what the fix states for a subject: by default a route whose boundary is leaving `review`.
    const bindings: SubjectFix[] = w.ledger.get(w.id)!.repair!.subjects.map(subject => declare({ ...subject, disposition: 'route', route: route(subject.subject.split('/').at(-1)!), boundary: { kind: 'stage-left', stage: 'review' } }));
    recordIncidentEvent(w.ledger, w.id, fixEvent, w.ledger.get(w.id)!.revision, { kind: 'fix-bound', request: { kind: 'fix-bound', reference: FIX, bindings }, fix: { commit: FIX, pullRequest: null, onMain: true } }, later(bindMinute));
    w.pass(3);
    const arrive = (identity: ReleaseIdentity = VERIFIED, minutes = 4) => recordDeployedFixes({ ledger: w.ledger, identity: () => identity, loadedHash: VERIFIED.hash, execute: fakeGitHub({ [historyCall(FIX, RELEASE)]: { status: 'ahead' } }).execute, now: later(minutes), memory: compareMemory() });
    await arrive();
    const binding = (jobId: string) => w.ledger.get(w.id)!.fixes!.at(-1)!.bindings.find(binding => binding.subject.endsWith(`/delivery/${jobId}`))! as ResumeIntent['binding'];
    const intent = (jobId: string, over: Partial<ResumeIntent> = {}): ResumeIntent => ({ incident: w.id, fix: { event: fixEvent, commit: FIX }, release: { commit: RELEASE, operation: OPERATION }, binding: binding(jobId), ...over });
    const requests = () => w.store.state.coordination!.requests ?? [];
    const admissions = () => (w.store.db.prepare('SELECT kind, ref FROM admissions ORDER BY seq').all() as { kind: string; ref: string }[]).filter(row => row.kind === 'request').map(row => row.ref);
    /** Replaces the state in memory with what is saved, as a restarted service reads it: through the redaction every saved string gets. */
    const reload = () => { w.store.save(); Object.assign(w.store.state, w.savedState()); };
    return { ...w, arrive, binding, intent, requests, admissions, reload, subject: (jobId: string) => `cms-field-vocabulary/delivery/${jobId}` };
}
