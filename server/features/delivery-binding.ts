import type { FeatureBinding } from '../../src/contracts/features';
import type { Store } from '../store/store';
import type { Ticket, TicketJob, WorkApproach } from '../../src/shared';
import { bindFeature, enrolled, assertFeatureGate } from './enrollment-gate';
import { digest } from './documents';

export function approvedDelivery(store: Store, binding: FeatureBinding) {
    const feature = store.state.features?.find(f => f.id === binding.featureId);
    const approval = feature?.approvals.find(a => a.id === binding.approvalId);
    const item = approval?.manifest.items.find(i => i.id === binding.itemId);
    const plan = feature?.plans.find(p => p.digest === approval?.planDigest);
    if (!feature || !approval || !item || !plan || approval.digest !== binding.approvalDigest) throw new Error('Feature approval binding is invalid');
    const { digest: saved, ...record } = approval;
    if (digest(record) !== saved || digest(plan.markdown) !== approval.planDigest) throw new Error('Approved feature content changed');
    return { feature, approval, item, plan };
}
export function bindDelivery(store: Store, record: Ticket | TicketJob, ownerId: string) {
    store.transaction(() => {
        const binding = bindFeature(store, record.key, ownerId);
        if (!binding) return;
        if (record.featureBinding && digest(record.featureBinding) !== digest(binding)) throw new Error('Started delivery cannot change approval');
        record.featureBinding = binding;
        const item = approvedDelivery(store, binding).item;
        record.featureFloor = { review: item.review || 'focused', validation: item.validation, checks: item.checks };
        if ('runId' in record) {
            record.externalPlan = { featureId: binding.featureId, approvalId: binding.approvalId, digest: approvedDelivery(store, binding).plan.digest };
            if (record.approach) record.approach.plan = 'none';
        }
    });
}
export function featureDeliveryContext(store: Store, binding?: FeatureBinding): string {
    if (!binding) return '';
    const { approval, item, plan } = approvedDelivery(store, binding);
    return '\nAPPROVED FEATURE: ' + JSON.stringify({ approval: approval.id, revision: approval.featureRevision, item: item.id, acceptanceCriteria: item.criteria, plan: plan.markdown }) +
        '\nUse this externally reviewed plan. Retain understand/enhance; feature enhance only reads back the approved ticket, never rewrites its scope. Return a blocker for scope changes. Set plan=none; do not fabricate plan or plan-review results. Ordinary implementation requires independent Lead review. Existing verified conflict-only repair policy remains applicable.';
}
export function assertFeatureApproach(record: Pick<Ticket, 'featureBinding' | 'featureFloor'>, approach: WorkApproach) {
    if (record.featureBinding && ['none', 'focused', 'full'].indexOf(approach.review) < ['none', 'focused', 'full'].indexOf(record.featureFloor?.review || 'focused'))
        throw new Error('Feature implementation requires its approved independent review level');
    if (record.featureBinding && record.featureFloor?.validation && ['developer-checks', 'independent-checks', 'browser'].indexOf(approach.validation) < ['developer-checks', 'independent-checks', 'browser'].indexOf(record.featureFloor.validation))
        throw new Error('Feature validation cannot be downgraded below the approved plan');
    if (record.featureBinding && record.featureFloor?.checks?.some(check => !approach.checks.includes(check)))
        throw new Error('Retain every approved feature check');
}
export function featureEffectGate(store: Store, work: { kind: string; id: string }, target: string) {
    if (work.kind !== 'delivery') return;
    const job = store.state.coordination?.jobs?.find(j => j.id === work.id);
    const key = job?.key || store.state.tickets.find(t => t.key === work.id || t.key === target)?.key;
    if (!key) return;
    assertFeatureGate(store, key);
    const binding = job?.featureBinding || store.state.tickets.find(t => t.key === key)?.featureBinding;
    if (enrolled(store, key) && !binding) throw new Error('Feature delivery must bind approval before any effect');
    if (binding) approvedDelivery(store, binding);
}
