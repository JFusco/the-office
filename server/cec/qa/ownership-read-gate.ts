import type { DeliveryRequest, EffectIntent } from '../../../src/shared';
import type { Store } from '../../store/store';
import { HOLDS } from '../../office/config';
import { featureGate } from '../../features/enrollment-gate';
import { readOwnershipCandidate, type ReadOwnershipView } from './read-ownership-candidate';

/** Existing explicit, unconsumed QA handoffs only. Fresh metadata authorizes a reader, never QA. */
export function ownershipReadState(store: Store, request: DeliveryRequest, ownClaim = '') {
    const input = request.officeQAHandoff, t = store.state.tickets.find(t => t.key === request.key);
    if (store.project.provider !== 'azure' || !t || !input || input.consumedAt || input.acknowledgeIncompleteHistory !== true ||
        request.action !== 'resume-ticket' || request.status !== 'blocked' || !request.error || t.blocker !== request.error ||
        !store.state.deliveryQueue?.includes(request) || !t.pilot || t.activity !== 'blocked' || !['qa', 'retest'].includes(t.stage) ||
        t.approach?.validation !== 'browser' || input.commit !== t.commit || !/^[a-f0-9]{40}$/.test(t.commit) || t.prId ||
        store.state.paused || store.state.draining || HOLDS[t.key] || !featureGate(store, t.key).allowed ||
        t.parked && !t.parked.resumeRequestedAt || t.qaProtocol?.[t.stage] || t.officeQAHandoffs?.length ||
        store.state.deliveryQueue.some(r => r.key === t.key && r.id !== request.id && ['queued', 'working'].includes(r.status)) ||
        store.state.workLog?.some(w => w.ticket === t.key && ['running', 'stopping'].includes(w.status))) return;
    const ids = new Set([request.id, t.runId, `ticket:${t.key}`, ...(store.state.deliveryQueue || []).filter(r => r.key === t.key).map(r => r.id)]);
    if (store.activeClaims().some(c => c.id !== ownClaim && ids.has(c.work.id))) return;
    const result = t.results[t.stage], qa = store.state.workLog?.filter(w => w.ticket === t.key && w.role === 'qa' && w.stage === t.stage).at(-1);
    if (!result || result.qa || result.outcome !== 'blocked' || result.paidRuns !== 0 || result.commit !== t.commit ||
        result.worktree !== t.worktree || result.branch !== t.branch || !result.qaRunDir ||
        result.receipts.some(r => !r.verified || r.uncertain) || qa?.id !== input.workerId ||
        !['blocked', 'completed'].includes(qa.status) || qa.executionStatus !== 'completed' || qa.failure) return;
    const effects = (store.db.prepare('SELECT body FROM effects').all() as { body: string }[]).map(r => JSON.parse(r.body) as EffectIntent);
    if (effects.some(e => e.work.projectId === store.project.id &&
        ([request.id, t.runId, `ticket:${t.key}`].includes(e.work.id) || e.target === t.key || e.authorization === t.runId) &&
        !['verified', 'rejected'].includes(e.status))) return;
    return t;
}

export function ownershipReadGate(store: Store, request: DeliveryRequest, view?: ReadOwnershipView, ownClaim = '') {
    const t = ownershipReadState(store, request, ownClaim);
    if (!t) return;
    if (!view || view.project !== store.project.id || view.key !== t.key ||
        !Number.isFinite(Date.parse(view.observedAt || '')) || Date.parse(view.observedAt!) > store.clock.now().getTime() + 1000 ||
        store.clock.now().getTime() - Date.parse(view.observedAt!) > 150000) return;
    const candidate = readOwnershipCandidate(store.project, t.key, view, request.officeQAHandoff!.coordinatorSessionId);
    return candidate && { ticket: t, candidate };
}
