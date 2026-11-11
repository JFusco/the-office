import { isDeepStrictEqual } from 'node:util';
import { currentAssignment } from '../../workers/assignment-context';
import { assessDeliveryEligibility, resolveDeliveryWork } from '../harness/delivery-authority';
import type { Store } from '../../store/store';
import type { HarnessRequest, TicketJob } from '../../../src/shared';

/** The existing reconciliation claim authorizes bounded original readback only.
 * Native identity, effects and source acceptance remain separate requirements. */
export function stoppedBaseClaim(store: Store, job: TicketJob, request: HarnessRequest) {
    const assignment = currentAssignment(), claim = assignment?.claim;
    const subject = claim && resolveDeliveryWork(store, claim.work);
    const eligibility = assessDeliveryEligibility(store, job, { request });
    const blockers = eligibility.blockers.filter(reason => reason !== 'Office is draining');
    if (store.project.id !== 'cms-field-vocabulary' || !job.existingPR || job.prerequisites?.length ||
        !claim || assignment.lane !== 'delivery' || claim.lane !== 'delivery' || claim.status !== 'running' ||
        claim.stage !== 'reconcile-base-update' || claim.work.projectId !== store.project.id ||
        claim.work.kind !== 'reconciliation' || claim.work.id !== request.id ||
        !store.activeClaims().some(saved => isDeepStrictEqual(saved, claim)) ||
        store.state.coordination?.requests?.find(saved => saved.id === request.id) !== request ||
        request.status !== 'working' || request.lane !== 'delivery' || request.action !== claim.stage || request.key !== job.key ||
        subject?.kind !== 'job' || subject.job !== job || subject.request !== request || blockers.length)
        throw new Error(`Exact stopped-base readback claim and current holds are required${blockers.length ? ': ' + blockers.join('; ') : ''}`);
    return claim;
}
