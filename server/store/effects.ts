import { randomUUID } from 'node:crypto';
import { workKey } from '../../src/shared';
import type { EffectIntent, WorkRef } from '../../src/shared';
import type { Store } from './store';
import { sanitize } from '../office/security';
export class EffectUncertainError extends Error {
    constructor(public intentId: string, detail: string) { super(detail); }
}
export interface EffectOperation<T, R> {
    id: string;
    work: WorkRef;
    attemptId: string;
    operation: string;
    target: string;
    authorization: string;
    payload: T;
    expectedState: unknown;
    preflight: () => Promise<void>;
    dispatch: (payload: T) => Promise<R>;
    verify: (receipt: R, payload: T) => Promise<boolean>;
}
/** Owns persistence and verification; adapters own a single fixed operation. */
export class Effects {
    constructor(private store: Store) { }
    async execute<T, R>(operation: EffectOperation<T, R>): Promise<R> {
        let intent = this.store.getEffect<T>(operation.id);
        if (intent) {
            if (workKey(intent.work) !== workKey(operation.work) || intent.attemptId !== operation.attemptId || intent.operation !== operation.operation || intent.target !== operation.target || intent.authorization !== operation.authorization || JSON.stringify(intent.payload) !== JSON.stringify(operation.payload) || JSON.stringify(intent.expectedState) !== JSON.stringify(operation.expectedState))
                throw new Error('Effect identity already belongs to a different operation');
            if (intent.status === 'verified')
                return intent.receipt as R;
            if (intent.status === 'dispatching' || intent.status === 'uncertain')
                throw new EffectUncertainError(intent.id, 'Independent read-back required; the original operation cannot be resent');
            if (intent.status === 'rejected')
                throw new Error(intent.error || 'Effect preflight was rejected');
        }
        else {
            intent = {
                id: operation.id || randomUUID(), work: operation.work, attemptId: operation.attemptId,
                operation: operation.operation, target: operation.target, authorization: operation.authorization,
                payload: structuredClone(operation.payload), expectedState: structuredClone(operation.expectedState),
                status: 'prepared', createdAt: this.store.clock.now().toISOString(), dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null,
            };
            this.store.transaction(() => this.store.putEffect(intent!));
        }
        try {
            await operation.preflight();
            if (this.store.state.paused)
                throw new Error('Office paused before dispatch');
        }
        catch (error) {
            this.store.updateEffect(intent.id, 'prepared', current => { current.status = 'rejected'; current.error = sanitize(String(error)); });
            throw error;
        }
        const claimed = this.store.updateEffect<T>(intent.id, 'prepared', current => {
            current.status = 'dispatching';
            current.dispatchedAt = this.store.clock.now().toISOString();
        });
        if (!claimed) {
            const current = this.store.getEffect<T>(intent.id)!;
            if (current.status === 'verified')
                return current.receipt as R;
            throw new EffectUncertainError(intent.id, 'Another executor already owns this effect; read back its outcome');
        }
        intent = claimed;
        const started = this.store.clock.monotonic();
        try {
            const receipt = await operation.dispatch(structuredClone(intent.payload));
            intent.receipt = structuredClone(receipt);
            this.store.putEffect(intent);
            if (!await operation.verify(receipt, intent.payload))
                throw new Error('Independent read-back did not verify the saved operation');
            intent.status = 'verified';
            intent.verifiedAt = this.store.clock.now().toISOString();
            intent.elapsedMs = Math.max(0, this.store.clock.monotonic() - started);
            this.store.transition('effect-verified', `${intent.operation} verified for ${intent.target}.`, () => this.store.putEffect(intent!), undefined, this.store.state.tickets.find(ticket => ticket.key === intent!.target)?.key);
            return receipt;
        }
        catch (error) {
            intent.status = 'uncertain';
            intent.error = sanitize(String(error));
            intent.elapsedMs = Math.max(0, this.store.clock.monotonic() - started);
            this.store.transition('effect-uncertain', `${intent.operation} needs independent read-back; no automatic resend.`, () => this.store.putEffect(intent!));
            throw new EffectUncertainError(intent.id, intent.error);
        }
    }
    async reconcile<R>(id: string, readBack: (intent: Readonly<EffectIntent>) => Promise<{
        verified: boolean;
        receipt: R;
    }>): Promise<boolean> {
        const intent = this.store.getEffect(id);
        if (!intent)
            throw new Error('Effect intent not found');
        if (intent.status === 'verified')
            return true;
        if (!['dispatching', 'uncertain'].includes(intent.status))
            throw new Error('Only an attempted effect requires reconciliation');
        const result = await readBack(structuredClone(intent));
        if (!result.verified)
            return false;
        intent.receipt = result.receipt;
        intent.status = 'verified';
        intent.verifiedAt = this.store.clock.now().toISOString();
        intent.error = '';
        this.store.transition('effect-reconciled', `${intent.operation} verified by read-back; no operation repeated.`, () => this.store.putEffect(intent));
        return true;
    }
}
