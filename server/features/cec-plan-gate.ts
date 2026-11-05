import type { Ticket, StageResult } from '../../src/shared';
import type { Store } from '../store/store';
import { approvedDelivery } from './delivery-binding';
import { JiraFeaturePublisher } from './jira-publication';
import { command } from '../workers/process';
/** A stored external-plan reference replaces no model verdicts or provider receipts. */
export function externalPlanGap(ticket: Ticket): string {
    const binding = ticket.featureBinding, plan = ticket.externalPlan;
    if (!binding) return '';
    if (!plan || plan.featureId !== binding.featureId || plan.approvalId !== binding.approvalId || !/^[a-f0-9]{64}$/.test(plan.digest))
        return 'Authenticated feature plan reference is missing';
    if (ticket.approach && (ticket.approach.plan !== 'none' || ticket.approach.review === 'none'))
        return 'Feature delivery must retain its external plan and independent implementation review';
    return '';
}
export async function verifyFeatureEnhance(store: Store, ticket: Ticket, result: StageResult, execute: typeof command = command) {
    if (!ticket.featureBinding) return;
    const { feature, approval, item, plan } = approvedDelivery(store, ticket.featureBinding);
    if (externalPlanGap(ticket) || ticket.externalPlan?.digest !== plan.digest) throw new Error('Feature plan binding changed');
    const publication = feature.publication.find(p => p.id === item.id);
    if (!publication?.verified || publication.startedApprovalId !== approval.id || publication.ownerId !== ticket.runId)
        throw new Error('Feature publication is not owned and verified');
    if (result.receipts.length) throw new Error('Feature enhance is read-only; proposed ticket changes need feature review');
    const content = item.operations.filter(o => ['create', 'update'].includes(o.kind)).at(-1);
    if (!content || !await new JiraFeaturePublisher(store, feature, execute).verify({ key: ticket.key, url: publication.url }, content))
        throw new Error('Approved feature ticket content changed before enhance acceptance');
}
