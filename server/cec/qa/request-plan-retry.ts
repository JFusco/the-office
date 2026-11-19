import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import type { Store } from '../../store/store';
import type { DeliveryRequest } from '../../../src/shared';
import { assertOwnership, type OwnershipRead } from '../implementation-continuation/intent';
import { inspectClosedQAPlan } from './inspect-closed-plan';
import { recordAdmission } from '../../store/admission-journal';
const Decision = z.object({ workerId: z.string().uuid(), fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    acknowledgeIncompleteHistory: z.literal(true) }).strict();

/** One explicit request per original worker, including after failure/interruption. Never auto-retry. */
export async function requestQAPlanRetry(store: Store, key: string, raw: unknown, dataRoot: string, ownership: OwnershipRead,
    inspect = inspectClosedQAPlan) {
    const input = Decision.parse(raw);
    const prior = store.state.deliveryQueue?.find(r => r.key === key && r.qaPlanRetry?.proof.workerId === input.workerId);
    if (prior) {
        if (prior.qaPlanRetry!.proof.fingerprint !== input.fingerprint) throw new Error('This QA decision already belongs to another proof');
        return { accepted: true, request: prior };
    }
    const proof = await inspect(store, key, dataRoot);
    if (proof.workerId !== input.workerId || proof.fingerprint !== input.fingerprint) throw new Error('Review the current incomplete QA proof before deciding');
    await assertOwnership(key, ownership);
    const verified = await inspect(store, key, dataRoot);
    if (!isDeepStrictEqual(proof, verified)) throw new Error('Incomplete QA history changed during its decision');
    return store.transaction(() => {
        if (store.state.deliveryQueue?.some(r => r.key === key && (['queued', 'working'].includes(r.status) || r.qaPlanRetry?.proof.workerId === input.workerId)))
            throw new Error('Another request already owns this QA decision');
        const at = store.clock.now().toISOString();
        const request: DeliveryRequest = { id: randomUUID(), key, action: 'resume-ticket', requestedAt: at, status: 'queued', error: '',
            qaPlanRetry: { proof, acknowledgeIncompleteHistory: true, approvedAt: at } };
        (store.state.deliveryQueue ??= []).push(request);
        recordAdmission(store.db, 'delivery', request.id, request.requestedAt);
        store.emit('qa-plan-retry-queued', 'Joe approved one corrected QA plan; original incomplete work and every failure/counter remain in history.', 'qa', key);
        return { accepted: true, request };
    });
}

