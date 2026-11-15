import { isDeepStrictEqual } from 'node:util';
import type { Store } from '../../store/store';
import type { DeliveryRequest } from '../../../src/shared';
import { assertOwnership, type OwnershipRead } from '../implementation-continuation/intent';
import { inspectClosedQAPlan } from './inspect-closed-plan';
import { currentAssignment } from '../../workers/assignment-context';
/** Called only after resume's fresh Jira/PR/feature gates under the scheduler's request claim. */
export async function consumeQAPlanRetry(store: Store, request: DeliveryRequest, dataRoot: string, ownership: OwnershipRead,
    inspect = inspectClosedQAPlan) {
    const binding = request.qaPlanRetry, assignment = currentAssignment();
    if (!binding || binding.consumedAt || binding.acknowledgeIncompleteHistory !== true || request.action !== 'resume-ticket' ||
        request.status !== 'working' || !store.state.deliveryQueue?.includes(request) ||
        !assignment || assignment.lane !== 'delivery' || assignment.claim.work.projectId !== store.project.id ||
        assignment.claim.work.kind !== 'delivery' || assignment.claim.work.id !== request.id || assignment.claim.stage !== request.action ||
        !store.activeClaims().some(c => c.id === assignment.claim.id)) throw new Error('One unconsumed scheduler-owned QA decision is required');
    const approved = structuredClone(binding);
    await assertOwnership(request.key, ownership);
    const proof = await inspect(store, request.key, dataRoot, undefined, undefined, request.id);
    if (!isDeepStrictEqual(proof, approved.proof)) throw new Error('Approved QA history, head or reviewed guide changed');
    await assertOwnership(request.key, ownership);
    // The inspector checks artifacts after its public reducer and candidate reads. Repeat after ownership awaits.
    const final = await inspect(store, request.key, dataRoot, undefined, undefined, request.id);
    if (!isDeepStrictEqual(final, approved.proof)) throw new Error('QA history changed before admission');
    store.transaction(() => {
        const ticket = store.ticket(request.key);
        if (!isDeepStrictEqual(binding, approved) || request.qaPlanRetry !== binding || request.status !== 'working' ||
            ticket.attempt !== proof.attempt || ticket.commit !== proof.commit || ticket.stage !== proof.stage ||
            ticket.qaPlanRetries?.some(item => item.workerId === proof.workerId)) throw new Error('QA decision already consumed or changed');
        const at = store.clock.now().toISOString();
        binding.consumedAt = at;
        (ticket.qaPlanRetries ??= []).push({ ...proof, requestId: request.id, at, originalResult: structuredClone(ticket.results[ticket.stage]!) });
        ticket.attempt += 1;
        store.emit('qa-plan-retry-consumed', 'One fresh QA attempt reserved before execution. The old pending report, closed error, unrun cases and original budgets remain incomplete history.', 'qa', request.key);
    });
}
