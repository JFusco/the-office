import { DatabaseSync } from 'node:sqlite';
import { admitRepairWaits } from '../../../../server/incidents/repair/admit-repair-waits';
import { IncidentLedger } from '../../../../server/incidents/incident-ledger';
import { recordIncidentEvent } from '../../../../server/incidents/record-event';
import { syncIncidents } from '../../../../server/incidents/sync-incidents';
import type { Store } from '../../../../server/store/store';
import type { OfficeSnapshot } from '../../../../src/shared';
import { savedFingerprint } from '../../store/saved-fingerprint-fixture';
import { savedState as readSavedState } from '../../store/saved-state-fixture';
import { AT, item, later, observe, office, projectStore } from '../incident-fixture';
import { REPO, SHA } from '../github-fake';

export const HOUR = 60;
/** A delivery job the harness stopped; `stop.at` marks the episode. */
export const job = (id: string, over: Record<string, unknown> = {}) => ({ id, key: `GH-${id}`, status: 'blocked', stage: 'review', detail: `Error: Worktree /tmp/w/${id} is missing`, head: 'abc1234', requestedAt: 'r', updatedAt: 'u', steps: [{ stage: 'review', result: { outcome: 'passed', blocker: '', summary: 'ok', evidence: [], findings: [], receipts: [] } }], stop: { kind: 'unclassified', at: 't1' }, ...over }) as any;
export const blocked = (id: string, projectId = 'cms-field-vocabulary', cause: 'unclassified' | 'failed' | 'interrupted' | 'needs-decision' = 'unclassified', stage = 'review') => item('delivery', id, stage, 'blocked', 'Blocked', cause, projectId);

/**
 * One project with stopped delivery jobs, observed into a ledger. `observed` syncs the ledger with
 * the jobs as they stand; `start` records a repair for the incident; `pass` runs the marker pass.
 */
export function world(stores: Store[], dbs: DatabaseSync[], ids = ['1', '2'], over: Record<string, unknown> = {}) {
    const store = projectStore(); stores.push(store);
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db);
    store.state.coordination!.jobs = ids.map(id => job(id, over));
    const jobs = () => store.state.coordination!.jobs!;
    const observed = (minutes = 0) => syncIncidents(ledger, office(observe(store, jobs().filter(j => ['blocked', 'interrupted'].includes(j.status)).map(j => blocked(j.id, undefined, undefined, j.stage)))), later(minutes), undefined, message => { throw new Error(message); });
    observed();
    const id = ledger.list()[0].id;
    const start = (event = 'cli-start-1', minutes = 1, revision = ledger.get(id)!.revision) => recordIncidentEvent(ledger, id, event, revision, { kind: 'repair-started', request: { kind: 'repair-started', issue: 387 }, issue: { repository: REPO, number: 387, url: `https://github.com/${REPO}/issues/387` } }, later(minutes));
    const bind = (minutes: number, onMain = true, event = 'cli-bind-1') => {
        const bindings = ledger.get(id)!.repair!.subjects.map(subject => ({ ...subject, disposition: 'no-route' as const, reason: 'nothing to resume' }));
        return recordIncidentEvent(ledger, id, event, ledger.get(id)!.revision, { kind: 'fix-bound', request: { kind: 'fix-bound', reference: SHA('f'), bindings }, fix: { commit: SHA('f'), pullRequest: null, onMain } }, later(minutes));
    };
    const pass = (minutes: number, fenced = false) => admitRepairWaits(ledger, [{ store }], later(minutes), () => fenced, message => { throw new Error(message); });
    /** Everything saved for the project, as one digest: equal before and after means the project was not written. */
    const saved = () => savedFingerprint(store);
    /** The project's state as a restarted service reads it: what is saved, through the redaction every saved string gets. */
    const savedState = () => readSavedState<OfficeSnapshot>(store);
    return { store, db, ledger, id, jobs, observed, start, bind, pass, saved, savedState, waits: () => store.state.coordination!.repairWaits ?? {}, work: (jobId: string) => ({ projectId: store.project.id, kind: 'delivery' as const, id: jobId }) };
}
export { AT, later };
