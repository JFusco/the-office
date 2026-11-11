import { assessDeliveryEligibility, resolveDeliveryWork } from './delivery-authority';
import { handsOff, harnessDelivers } from './scope';
import type { Store } from '../../store/store';
import type { ScheduledWork } from '../../scheduling/scheduler';

/** Project the same synchronous gate that is repeated inside the scheduler transaction. */
export function gateRegisteredDelivery(store: Store, items: ScheduledWork[]): ScheduledWork[] {
    if (!handsOff(store)) return items;
    return items.map(item => {
        const subject = resolveDeliveryWork(store, item.work);
        if (subject.kind !== 'job' || !harnessDelivers(store, subject.job) || subject.request && subject.request.action !== 'reconcile-pr-metadata') return item;
        const prior = item.claimEligible;
        const assess = () => assessDeliveryEligibility(store, subject.job, { request: subject.request });
        const assessment = assess();
        return { ...item, claimEligible: () => (!prior || prior()) && assess().eligible,
            eligibility: item.eligibility.state === 'runnable' && !assessment.eligible
                ? { state: 'blocked', reason: assessment.blockers.join('; '), owner: 'Morgan', nextCheckAt: null } : item.eligibility };
    });
}

export function deliveryIntakeBlocker(store: Store, key: string): string | undefined {
    for (const claim of store.activeClaims()) {
        const subject = resolveDeliveryWork(store, claim.work);
        if (subject.kind === 'unresolved') return subject.reason;
        if (subject.kind === 'job' && subject.job.key === key) return `Existing Office claim ${claim.id} owns this delivery`;
    }
    if (store.state.workLog?.some(w => w.ticket === key && ['running', 'stopping'].includes(w.status))) return 'An original Office worker still owns this ticket';
}
