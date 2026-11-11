import type { Feature, FeaturePublicationItem } from '../../../src/contracts/features';
import type { Store } from '../../store/store';
import { HOLDS } from '../../office/config';
import { eligibility } from '../../cec/workflow';
import { featureGate, currentApproval } from '../enrollment-gate';
import { readHandoff, handoffBinding, sameBinding } from './handoff-readback';
import { dependencyEligibility, validatePrerequisites, type DependencyStores } from '../../delivery/pipeline/dependencies';
export type DeliveryPreflight = {kind: 'ready' | 'accepted' | 'wait' | 'conflict'; reason: string};
/** Pure projection only. Enqueue and provider read-back remain authoritative. */
export function deliveryPreflight(store: Store, feature: Feature, item: FeaturePublicationItem, stores: DependencyStores = new Map([[store.project.id, store]])): DeliveryPreflight {
    const wait = (reason: string): DeliveryPreflight => ({kind: 'wait', reason});
    if (store.state.paused || store.state.draining || feature.paused) return wait('Waiting for the project and feature to resume');
    if (!currentApproval(feature) || !item.verified) return wait('Waiting for current approval and verified publication');
    if (readHandoff(store, feature, item)) return {kind: 'accepted', reason: 'Exact authorized handoff is retained'};
    const gate = featureGate(store, item.key); if (!gate.allowed) return wait(gate.reason);
    if (HOLDS[item.key]) return wait(HOLDS[item.key]);
    const binding = handoffBinding(feature, item), state = store.state;
    if (state.coordination?.jobs?.some(j => j.key === item.key && j.status !== 'cancelled') || state.tickets.some(t => t.key === item.key && t.pilot) || state.deliveryQueue?.some(r => r.key === item.key && ['queued','working','interrupted'].includes(r.status) && !sameBinding(r.featureBinding, binding))) return {kind: 'conflict', reason: 'Another delivery owns this ticket; reconcile ownership'};
    const review = state.coordination?.listener.reviews.slice().reverse().find(r => r.key === item.key);
    if (review && ['queued', 'working'].includes(review.status) && !sameBinding(review.featureBinding, binding)) return {kind: 'conflict', reason: 'Another intake request owns this ticket'};
    if (review && ['blocked', 'interrupted'].includes(review.status)) return wait('Waiting for blocked intake read-back');
    if (review?.prerequisiteError) return {kind:'conflict',reason:review.prerequisiteError};
    const prerequisites = review?.prerequisites || [];
    const invalid = validatePrerequisites(prerequisites, {projectId: store.project.id, kind: 'issue', id: item.key.replace(/^GH-/, '')}, stores);
    const dependency = dependencyEligibility(prerequisites, stores, store.clock.now());
    if (invalid) return {kind:'conflict',reason:invalid};
    if (dependency) return wait(dependency.reason);
    if (store.project.provider === 'github') {
        if (!state.coordination?.listener.assigned.some(i => i.key === item.key)) return wait('Waiting for the current open assignment feed');
        if (state.coordination.adoptions?.some(a => 'GH-' + a.issue === item.key)) return {kind: 'conflict', reason: 'An adopted PR owns this ticket'};
    } else {
        const ticket = state.tickets.find(t => t.key === item.key);
        if (!ticket) return wait('Waiting for the source ticket in the mailbox');
        if (ticket.type === 'Epic' || ticket.subtask) return {kind: 'conflict', reason: 'This issue type requires supported decomposition before implementation'};
        const reason = eligibility(ticket) || ticket.blocker;
        if (reason) return wait(reason);
        if (ticket.stage !== 'mailbox') return wait('Existing delivery requires its resume path');
    }
    return {kind: 'ready', reason: 'Ready for the existing guarded intake path'};
}
