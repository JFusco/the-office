import type { DeliveryRequest } from '../../../src/shared';
import type { Store } from '../../store/store';
import { digest } from '../../store/readback-evidence';
import { currentAssignment } from '../../workers/assignment-context';
import { command, processGroupAlive } from '../../workers/process';
import { ownershipReadHistory } from './ownership-read-history';
import { ownershipReadGate } from './ownership-read-gate';
import { ownershipReadSource } from './ownership-read-source';
import type { ReadOwnershipView } from './read-ownership-candidate';

/** One internal continuation of an already approved decision. Never consumes QA approval itself. */
export async function continueOwnershipRead(store: Store, request: DeliveryRequest, view: () => ReadOwnershipView | undefined,
    execute = command, alive = processGroupAlive) {
    const assignment = currentAssignment(), claim = assignment?.claim;
    if (!claim || assignment.lane !== 'delivery' || claim.stage !== 'check-qa-ownership' || claim.work.kind !== 'delivery' ||
        claim.work.projectId !== store.project.id || claim.work.id !== request.id || request.qaReadContinuation ||
        !store.activeClaims().some(c => c.id === claim.id)) throw new Error('One current scheduler claim of the original QA decision is required');
    const originalRequest = structuredClone(request), originalTicket = digest(store.ticket(request.key));
    const record = request.qaReadContinuation = { phase: 'checking' as const, startedAt: store.clock.now().toISOString(),
        claimId: claim.id, originalRequest, originalRequestSha256: digest(originalRequest) } as NonNullable<DeliveryRequest['qaReadContinuation']>;
    // Durable consumption precedes every native artifact/Git check. Failed guards never loop.
    store.save();
    const current = () => {
        const { qaReadContinuation: _, ...retained } = request;
        if (request.qaReadContinuation !== record || record.phase !== 'checking' || digest(retained) !== record.originalRequestSha256 ||
            digest(store.ticket(request.key)) !== originalTicket || !store.activeClaims().some(c => c.id === claim.id))
            throw new Error('The original QA decision or candidate changed during its read check');
        const gate = ownershipReadGate(store, request, view(), claim.id);
        if (!gate) throw new Error('Complete fresh ownership, settled work and unchanged QA approval are required for a new read');
        return gate;
    };
    try {
        let gate = current();
        const history = ownershipReadHistory(store, request, alive);
        if (Date.parse(gate.candidate.observedAt) <= Date.parse(history.endedAt)) throw new Error('A newer authoritative ownership observation is required');
        record.originalReader = history; record.ownership = gate.candidate; store.save();
        await ownershipReadSource(store, gate.ticket, execute);
        gate = current();
        const after = ownershipReadHistory(store, request, alive);
        if (digest(after) !== digest(history) || Date.parse(gate.candidate.observedAt) <= Date.parse(history.endedAt))
            throw new Error('The original reader or fresh ownership observation changed during verification');
        store.transaction(() => {
            current(); record.ownership = gate.candidate; record.phase = 'queued'; record.finishedAt = store.clock.now().toISOString();
            request.status = 'queued'; request.error = '';
            store.emit('qa-ownership-read-queued', 'One fresh ownership read queued for the same approved QA handoff. Original blocked read, QA result and counters retained; QA is not yet authorized to execute.', 'pm', request.key);
        });
    } catch (error) {
        const retained = store.state.deliveryQueue?.find(r => r.id === request.id)?.qaReadContinuation;
        if (retained?.claimId === record.claimId && retained.startedAt === record.startedAt &&
            retained.originalRequestSha256 === record.originalRequestSha256 && retained.phase === 'checking') {
            retained.phase = 'blocked'; retained.finishedAt = store.clock.now().toISOString();
            const reason = error instanceof Error ? error.message.replace(/[\x00-\x1f]/g, ' ').slice(0, 300) : 'Verification could not finish';
            retained.error = `Ownership read check blocked: ${reason}. Original decision, failure and counters remain; no read was queued.`;
            store.emit('qa-ownership-read-blocked', retained.error, 'pm', request.key);
        }
    }
}
