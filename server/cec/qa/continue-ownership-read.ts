import type { DeliveryRequest } from '../../../src/shared';
import type { Store } from '../../store/store';
import { digest } from '../../store/readback-evidence';
import { currentAssignment } from '../../workers/assignment-context';
import { command, processGroupAlive } from '../../workers/process';
import { ownershipReadHistory } from './ownership-read-history';
import { ownershipReadGate, ownershipReadState } from './ownership-read-gate';
import { ownershipReadSource } from './ownership-read-source';
import { expiredOwnershipRead } from './expired-ownership-read';
import type { ReadOwnershipView } from './read-ownership-candidate';

/** One internal continuation of an already approved decision. Never consumes QA approval itself. */
export async function continueOwnershipRead(store: Store, request: DeliveryRequest, view: () => ReadOwnershipView | undefined,
    refresh: (after: string) => Promise<ReadOwnershipView | undefined>, execute = command, alive = processGroupAlive, repair = false) {
    const assignment = currentAssignment(), claim = assignment?.claim;
    const field = repair ? 'qaReadContinuationRepair' : 'qaReadContinuation';
    const predecessor = repair ? expiredOwnershipRead(store, request) : undefined;
    if (!claim || assignment.lane !== 'delivery' || claim.stage !== (repair ? 'check-qa-ownership-fresh' : 'check-qa-ownership') || claim.work.kind !== 'delivery' ||
        claim.work.projectId !== store.project.id || claim.work.id !== request.id || request[field] || repair && !predecessor ||
        !repair && request.qaReadContinuationRepair ||
        !store.activeClaims().some(c => c.id === claim.id)) throw new Error('One current scheduler claim of the original QA decision is required');
    const { qaReadContinuation: _, qaReadContinuationRepair: __, ...core } = request;
    const originalRequest = structuredClone(core), originalTicket = digest(store.ticket(request.key));
    const record = request[field] = { version: 2, predecessor, phase: 'checking' as const, startedAt: store.clock.now().toISOString(),
        claimId: claim.id, originalRequest, originalRequestSha256: digest(originalRequest) } as NonNullable<DeliveryRequest['qaReadContinuation']>;
    // Durable consumption precedes every native artifact/Git check. Failed guards never loop.
    store.save();
    const current = () => {
        const { qaReadContinuation: _, qaReadContinuationRepair: __, ...retained } = request;
        if (request[field] !== record || record.phase !== 'checking' || digest(retained) !== record.originalRequestSha256 ||
            predecessor && digest(request.qaReadContinuation) !== predecessor.sha256 ||
            digest(store.ticket(request.key)) !== originalTicket || !store.activeClaims().some(c => c.id === claim.id))
            throw new Error('The original QA decision or candidate changed during its read check');
        const ticket = ownershipReadState(store, request, claim.id);
        if (!ticket) throw new Error('Settled work and unchanged QA approval are required for a new read');
        return ticket;
    };
    const owned = () => {
        current();
        const gate = ownershipReadGate(store, request, view(), claim.id);
        if (!gate) throw new Error('Complete fresh ownership, settled work and unchanged QA approval are required for a new read');
        return gate;
    };
    try {
        let gate = owned();
        const history = ownershipReadHistory(store, request, alive);
        if (predecessor && history.fingerprint !== request.qaReadContinuation!.originalReader?.fingerprint)
            throw new Error('The original reader changed since the retained expired check');
        if (Date.parse(gate.candidate.observedAt) <= Date.parse(history.endedAt)) throw new Error('A newer authoritative ownership observation is required');
        record.originalReader = history; record.ownership = gate.candidate; store.save();
        await ownershipReadSource(store, gate.ticket, execute);
        current(); record.sourceVerifiedAt = store.clock.now().toISOString();
        record.ownershipRefreshStartedAt = store.clock.now().toISOString(); store.save();
        const fresh = await refresh(record.sourceVerifiedAt);
        record.ownershipRefreshCompletedAt = store.clock.now().toISOString();
        if (!ownershipReadGate(store, request, fresh, claim.id) || Date.parse(fresh!.observedAt!) < Date.parse(record.sourceVerifiedAt))
            throw new Error('Fresh native ownership could not be verified after the source read');
        gate = owned();
        const after = ownershipReadHistory(store, request, alive);
        if (digest(after) !== digest(history) || Date.parse(gate.candidate.observedAt) <= Date.parse(history.endedAt))
            throw new Error('The original reader or fresh ownership observation changed during verification');
        store.transaction(() => {
            const final = owned(); record.ownership = final.candidate; record.phase = 'queued'; record.finishedAt = store.clock.now().toISOString();
            request.status = 'queued'; request.error = '';
            store.emit('qa-ownership-read-queued', 'One fresh ownership read queued for the same approved QA handoff. Original blocked read, QA result and counters retained; QA is not yet authorized to execute.', 'pm', request.key);
        });
    } catch (error) {
        const retained = store.state.deliveryQueue?.find(r => r.id === request.id)?.[field];
        if (retained?.claimId === record.claimId && retained.startedAt === record.startedAt &&
            retained.originalRequestSha256 === record.originalRequestSha256 && retained.phase === 'checking') {
            retained.phase = 'blocked'; retained.finishedAt = store.clock.now().toISOString();
            const reason = error instanceof Error ? error.message.replace(/[\x00-\x1f]/g, ' ').slice(0, 300) : 'Verification could not finish';
            retained.error = `Ownership read check blocked: ${reason}. Original decision, failure and counters remain; no read was queued.`;
            store.emit('qa-ownership-read-blocked', retained.error, 'pm', request.key);
        }
    }
}
