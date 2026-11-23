import { DatabaseSync } from 'node:sqlite';
import { requestDelivery } from '../../../../server/cec/pilot-delivery';
import { compareMemory, recordDeployedFixes } from '../../../../server/incidents/deployed-fixes';
import { IncidentLedger } from '../../../../server/incidents/incident-ledger';
import { admitRepairWaits } from '../../../../server/incidents/repair/admit-repair-waits';
import type { ResumeIntent } from '../../../../server/incidents/repair/dispatch-resume';
import type { QueueTicketResume } from '../../../../server/incidents/repair/dispatch-ticket-resume';
import { recordIncidentEvent } from '../../../../server/incidents/record-event';
import { syncIncidents } from '../../../../server/incidents/sync-incidents';
import type { Store } from '../../../../server/store/store';
import type { SubjectFix } from '../../../../src/contracts/incidents';
import type { DeliveryRequest, Ticket } from '../../../../src/shared';
import { savedFingerprint } from '../../store/saved-fingerprint-fixture';
import { fakeGitHub, historyCall, REPO } from '../github-fake';
import { item, later, observe, office, projectStore } from '../incident-fixture';
import { FIX, OPERATION, RELEASE, VERIFIED } from './resume-fixture';

const loud = (message: string) => { throw new Error(message); };
/** When the project dated the tickets' stop: before anything the ledger did. */
export const STOPPED_AT = later(-1).toISOString();
/** A Jira/Azure pilot ticket the harness stopped at QA; `stop.at` marks the episode. */
export const ticket = (key: string, over: Record<string, unknown> = {}) => ({ key, summary: 'Synthetic', stage: 'qa', activity: 'blocked', blocker: 'Error: the preview host never answered', pilot: true, commit: 'abc1234', runId: 'run-1', attempt: 1,
    results: {}, stop: { kind: 'unclassified', at: STOPPED_AT }, ...over }) as unknown as Ticket;
export const ticketSubject = (key: string) => `cec/delivery/ticket:${key}`;

/**
 * The CEC project with stopped pilot tickets whose incident has a repair, a fix bound with the
 * `resume-ticket` route for every ticket, the repair-wait markers in place (minute 3) and the fix
 * found in the running release (minute 4): the state in which a ticket's resume is due.
 */
export async function ticketWorld(stores: Store[], dbs: DatabaseSync[], keys = ['CEC-1', 'CEC-2'], fixEvent = 'cli-bind-1', over: Record<string, unknown> = {}) {
    const store = projectStore('cec'); stores.push(store);
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db);
    store.state.tickets = keys.map(key => ticket(key, over));
    const tickets = () => store.state.tickets;
    /** As the scheduler presents tickets: one with a delivery request queued or working has no entry of its own (server/scheduling/scheduled-work.ts). */
    const pending = (key: string) => (store.state.deliveryQueue ?? []).some(request => request.key === key && ['queued', 'working'].includes(request.status));
    const observed = (minutes = 0) => syncIncidents(ledger, office(observe(store, tickets().filter(held => held.activity === 'blocked' && !pending(held.key)).map(held => item('delivery', `ticket:${held.key}`, held.stage, 'blocked', 'Blocked', 'unclassified', 'cec')))), later(minutes), undefined, loud);
    observed();
    const id = ledger.list()[0].id;
    recordIncidentEvent(ledger, id, 'cli-start-1', ledger.get(id)!.revision, { kind: 'repair-started', request: { kind: 'repair-started', issue: 387 }, issue: { repository: REPO, number: 387, url: `https://github.com/${REPO}/issues/387` } }, later(1));
    const bindings: SubjectFix[] = ledger.get(id)!.repair!.subjects.map(subject => ({ ...subject, disposition: 'route', route: { action: 'resume-ticket', payload: { key: subject.subject.split('ticket:')[1] }, expectedStage: 'qa' }, boundary: { kind: 'stage-left', stage: 'qa' } }));
    recordIncidentEvent(ledger, id, fixEvent, ledger.get(id)!.revision, { kind: 'fix-bound', request: { kind: 'fix-bound', reference: FIX, bindings }, fix: { commit: FIX, pullRequest: null, onMain: true } }, later(2));
    admitRepairWaits(ledger, [{ store }], later(3), () => false, loud);
    await recordDeployedFixes({ ledger, identity: () => VERIFIED, loadedHash: VERIFIED.hash, execute: fakeGitHub({ [historyCall(FIX, RELEASE)]: { status: 'ahead' } }).execute, now: later(4), memory: compareMemory() });
    const binding = (key: string) => ledger.get(id)!.fixes!.at(-1)!.bindings.find(bound => bound.subject === ticketSubject(key))! as ResumeIntent['binding'];
    const intent = (key: string, over: Partial<ResumeIntent> = {}): ResumeIntent => ({ incident: id, fix: { event: fixEvent, commit: FIX }, release: { commit: RELEASE, operation: OPERATION }, binding: binding(key), ...over });
    /** The project's own delivery queue, as its engine calls it. */
    const queue: QueueTicketResume = (key, bound) => requestDelivery.call({ store } as never, key, 'resume-ticket', undefined, { repairResume: bound }) as DeliveryRequest;
    const admissions = () => (store.db.prepare("SELECT ref FROM admissions WHERE kind='delivery' ORDER BY seq").all() as { ref: string }[]).map(row => row.ref);
    const mark = (minutes: number) => admitRepairWaits(ledger, [{ store }], later(minutes), () => false, loud);
    return { store, db, ledger, id, tickets, observed, mark, binding, intent, queue, admissions, requests: () => store.state.deliveryQueue ?? [], waits: () => store.state.coordination!.repairWaits ?? {},
        /** Everything saved for the project, as one digest: equal before and after means the project was not written. */
        saved: () => savedFingerprint(store) };
}
