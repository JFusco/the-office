import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { savedImplementation } from './candidate';
import { assertCandidateIdle } from './process-fence';
import { interruptedImplementation } from './original';
import type { Store } from '../../store/store';
import type { DeliveryRequest } from '../../../src/shared';
import type { SavedImplementationProof } from '../../../src/contracts/cec-implementation-continuation';

export const ImplementationDecision = z.object({ workerId: z.string().uuid(), fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    decision: z.enum(['continue', 'hold']), acknowledgeUncertainHistory: z.boolean(), note: z.string().max(1000) }).strict();
export type OwnershipRead = (key: string) => Promise<{ complete: boolean; fresh: boolean; ownership?: { status: string } }>;
export async function assertOwnership(key: string, read: OwnershipRead) {
    const result = await read(key);
    if (!result.complete || !result.fresh || result.ownership?.status !== 'clear') throw new Error('Fresh complete ownership must be clear before continuing saved work');
}
export async function implementationPreview(store: Store, key: string) {
    const saved = await savedImplementation(store, key);
    await assertCandidateIdle(saved.proof.worktree);
    return saved.proof;
}
/** Explicit decision, not an ordinary resume or a claim that the old writer succeeded. */
export async function decideImplementation(store: Store, key: string, raw: unknown, ownership: OwnershipRead,
    inspect: (store: Store, key: string) => Promise<SavedImplementationProof> = implementationPreview) {
    const input = ImplementationDecision.parse(raw);
    if (input.decision === 'continue' && !input.acknowledgeUncertainHistory) throw new Error('Continuing must explicitly preserve the original uncertain history');
    const prior = store.state.deliveryQueue?.find(r => r.key === key && r.action === 'continue-saved-implementation' && r.implementationContinuation?.proof.workerId === input.workerId);
    if (prior) {
        if (input.decision !== 'continue' || prior.implementationContinuation?.proof.fingerprint !== input.fingerprint || prior.implementationContinuation.note !== input.note)
            throw new Error('The original continuation decision already belongs to another request');
        return { accepted: true, request: prior };
    }
    const proof = await inspect(store, key);
    if (proof.workerId !== input.workerId || proof.fingerprint !== input.fingerprint) throw new Error('Saved work changed; review its current state before deciding');
    if (input.decision === 'continue') await assertOwnership(key, ownership);
    return store.transaction(() => {
        const ticket = store.ticket(key), at = store.clock.now().toISOString();
        if (interruptedImplementation(store, key).originalDigest !== proof.originalDigest) throw new Error('Original implementation changed while its decision was being checked');
        if (store.state.deliveryQueue?.some(r => r.key === key && ['queued', 'working'].includes(r.status))) throw new Error('A request already owns this ticket');
        if (input.decision === 'hold') {
            ticket.implementationContinuationHold = { workerId: input.workerId, note: input.note, at };
            store.emit('implementation-left-paused', 'Joe kept the saved implementation paused. Original work and uncertainty remain.', 'pm', key);
            return { accepted: true, held: true };
        }
        const request: DeliveryRequest = { id: randomUUID(), key, action: 'continue-saved-implementation', requestedAt: at, status: 'queued', error: '',
            implementationContinuation: { proof, note: input.note, approvedAt: at, acknowledgeUncertainHistory: true } };
        (store.state.deliveryQueue ||= []).push(request);
        store.emit('implementation-continuation-queued', 'Joe approved one forward continuation from a saved copy; the original timeout and uncertainty remain in history.', 'pm', key);
        return { accepted: true, request };
    });
}
