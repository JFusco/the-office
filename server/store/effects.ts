import { featureEffectGate } from '../features/delivery-binding';
import { randomUUID } from 'node:crypto';
import { workKey } from '../../src/shared';
import type { EffectIntent, WorkRef } from '../../src/shared';
import type { EffectWriter, WriteQualification } from '../../src/contracts/write-identity';
import type { Store } from './store';
import { sanitize } from '../office/security';
import { recordAdmission } from './admission-journal';
export class EffectUncertainError extends Error {
    constructor(public intentId: string, detail: string) { super(detail); }
}
/** The dispatch claim refused the pinned writer: the intent is rejected, never dispatched, and keeps its id and audit. */
export class WriterRefused extends Error {
    constructor(public intentId: string, detail: string) { super(detail); this.name = 'WriterRefused'; }
}
/** A successful verification may carry the adapter's actor-bearing evidence; a plain boolean carries none. */
export interface EffectVerification { verified: boolean; qualification?: WriteQualification }
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
    verify: (receipt: R, payload: T) => Promise<boolean | EffectVerification>;
    /** The GitHub writer pinned on a fresh intent. A saved intent keeps the writer it was created with. */
    writer?: EffectWriter;
    /**
     * Run synchronously inside the transaction that claims the prepared intent: a refusal rejects it unsent, with
     * `dispatchedAt` empty, and the provider is never called. Throwing rolls the claim back and dispatches nothing.
     */
    claim?: (intent: Readonly<EffectIntent>) => string | undefined;
}
const verification = (result: boolean | EffectVerification): EffectVerification => typeof result === 'boolean' ? { verified: result } : result;
/** Owns persistence and verification; adapters own a single fixed operation. */
export class Effects {
    constructor(private store: Store) { }
    async execute<T, R>(operation: EffectOperation<T, R>): Promise<R> {
        let intent = this.store.getEffect<T>(operation.id), created = false;
        // The read-or-create decision commits with the new row and its admission, so another executor reuses that row.
        if (!intent) intent = this.store.transaction(() => {
            const saved = this.store.getEffect<T>(operation.id);
            if (saved) return saved;
            created = true;
            const fresh: EffectIntent<T> = {
                id: operation.id || randomUUID(), work: operation.work, attemptId: operation.attemptId,
                operation: operation.operation, target: operation.target, authorization: operation.authorization,
                payload: structuredClone(operation.payload), expectedState: structuredClone(operation.expectedState),
                status: 'prepared', createdAt: this.store.clock.now().toISOString(), dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null,
                ...(operation.writer ? { writer: structuredClone(operation.writer) } : {}),
            };
            this.store.putEffect(fresh);
            recordAdmission(this.store.db, 'effect', fresh.id, fresh.createdAt);
            return fresh;
        });
        if (!created) {
            if (workKey(intent.work) !== workKey(operation.work) || intent.attemptId !== operation.attemptId || intent.operation !== operation.operation || intent.target !== operation.target || intent.authorization !== operation.authorization || JSON.stringify(intent.payload) !== JSON.stringify(operation.payload) || JSON.stringify(intent.expectedState) !== JSON.stringify(operation.expectedState))
                throw new Error('Effect identity already belongs to a different operation');
            if (intent.status === 'verified')
                return intent.receipt as R;
            if (intent.status === 'dispatching' || intent.status === 'uncertain')
                throw new EffectUncertainError(intent.id, 'Independent read-back required; the original operation cannot be resent');
            if (intent.status === 'rejected')
                throw new Error(intent.error || 'Effect preflight was rejected');
        }
        try {
            await operation.preflight();
            featureEffectGate(this.store, operation.work, operation.target);
            if (this.store.state.paused)
                throw new Error('Office paused before dispatch');
        }
        catch (error) {
            this.store.updateEffect(intent.id, 'prepared', current => { current.status = 'rejected'; current.error = sanitize(String(error)); });
            throw error;
        }
        const id = intent.id;
        const claim = this.store.transaction(() => {
            const current = this.store.getEffect<T>(id);
            if (!current || current.status !== 'prepared') return { claimed: null };
            const refusal = operation.claim?.(current);
            if (refusal) {
                current.status = 'rejected';
                current.error = sanitize(refusal);
                current.writerRefusedAt = this.store.clock.now().toISOString();
                this.store.putEffect(current);
                return { claimed: null, refusal: current.error };
            }
            current.status = 'dispatching';
            current.dispatchedAt = this.store.clock.now().toISOString();
            this.store.putEffect(current);
            return { claimed: current };
        });
        if (claim.refusal !== undefined) throw new WriterRefused(id, claim.refusal);
        if (!claim.claimed) {
            const current = this.store.getEffect<T>(id)!;
            if (current.status === 'verified')
                return current.receipt as R;
            throw new EffectUncertainError(id, 'Another executor already owns this effect; read back its outcome');
        }
        intent = claim.claimed;
        const started = this.store.clock.monotonic();
        let late = false;
        try {
            const receipt = await operation.dispatch(structuredClone(intent.payload));
            // Each transition changes only the fields it owns, and only on the row as it is now.
            if (!this.store.updateEffect(id, 'dispatching', current => { current.receipt = structuredClone(receipt); })) {
                late = true;
                return this.settled<R>(id);
            }
            const result = verification(await operation.verify(receipt, intent.payload));
            if (!result.verified)
                throw new Error('Independent read-back did not verify the saved operation');
            const verifiedAt = this.store.clock.now().toISOString(), elapsedMs = Math.max(0, this.store.clock.monotonic() - started);
            const verified = this.store.transaction(() => {
                const applied = this.store.updateEffect(id, 'dispatching', current => {
                    current.status = 'verified';
                    current.verifiedAt = verifiedAt;
                    current.elapsedMs = elapsedMs;
                    if (result.qualification) current.qualification = structuredClone(result.qualification);
                });
                if (applied) this.store.emit('effect-verified', `${applied.operation} verified for ${applied.target}.`, undefined, this.store.state.tickets.find(ticket => ticket.key === applied.target)?.key);
                return applied;
            });
            if (!verified) {
                late = true;
                return this.settled<R>(id);
            }
            return receipt;
        }
        catch (error) {
            if (late) throw error;
            const detail = sanitize(String(error)), elapsedMs = Math.max(0, this.store.clock.monotonic() - started);
            const failed = this.store.transaction(() => {
                const applied = this.store.updateEffect(id, 'dispatching', current => {
                    current.status = 'uncertain';
                    current.error = detail;
                    current.elapsedMs = elapsedMs;
                });
                if (applied) this.store.emit('effect-uncertain', `${applied.operation} needs independent read-back; no automatic resend.`);
                return applied;
            });
            // A late failure never undoes an outcome another executor already settled.
            if (!failed) return this.settled<R>(id);
            throw new EffectUncertainError(id, detail);
        }
    }
    /** The outcome another executor settled: a verified receipt, or the saved rejection. */
    private settled<R>(id: string): R {
        const current = this.store.getEffect(id);
        if (current?.status === 'verified') return current.receipt as R;
        if (current?.status === 'rejected') throw new Error(current.error || 'Effect was settled as rejected');
        throw new EffectUncertainError(id, 'Another executor already owns this effect; read back its outcome');
    }
    async reconcile<R>(id: string, readBack: (intent: Readonly<EffectIntent>) => Promise<{
        verified: boolean;
        receipt: R;
        qualification?: WriteQualification;
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
        const verifiedAt = this.store.clock.now().toISOString();
        const applied = this.store.transaction(() => {
            const updated = this.store.updateEffect(id, ['dispatching', 'uncertain'], current => {
                current.receipt = result.receipt;
                current.status = 'verified';
                current.verifiedAt = verifiedAt;
                current.error = '';
                if (result.qualification) current.qualification = structuredClone(result.qualification);
            });
            if (updated) this.store.emit('effect-reconciled', `${updated.operation} verified by read-back; no operation repeated.`);
            return updated;
        });
        // A second read-back that finishes after another settled the Effect leaves that outcome as it is.
        return !!applied || this.store.getEffect(id)?.status === 'verified';
    }
    /** Retain a conclusively rejected dispatch on its original intent, without admitting a resend. */
    rejectDispatched(id: string, detail: string, receipt: unknown, failure: string): void {
        this.store.transition('effect-rejected', detail, () => {
            const rejected = this.store.updateEffect(id, 'uncertain', intent => {
                if (!intent.dispatchedAt || intent.notLandedAt) throw new Error('Only an unsettled dispatch can be read back as rejected');
                intent.status = 'rejected';
                intent.receipt = receipt;
                intent.error ||= sanitize(failure);
            });
            if (!rejected) throw new Error('Only an unsettled dispatch can be read back as rejected');
        });
    }
    /**
     * Settles an attempted effect that an independent read-back showed never landed. Only its caller can
     * know that: the write must be absolute, so that the state read back excludes the write having applied.
     * The intent keeps its dispatch time and becomes `rejected` with `notLandedAt`; it is never dispatched
     * again, and a caller that may send once more does so under a fresh intent id.
     */
    notLanded(id: string, detail: string): void {
        const intent = this.store.getEffect(id);
        if (!intent || !['dispatching', 'uncertain'].includes(intent.status))
            throw new Error('Only an attempted effect can be read back as not landed');
        this.store.transition('effect-not-landed', `${intent.operation} for ${intent.target} was read back as never landed.`, () => {
            const settled = this.store.updateEffect(id, ['dispatching', 'uncertain'], current => {
                current.status = 'rejected';
                current.notLandedAt = this.store.clock.now().toISOString();
                current.error = sanitize(`Read back as never landed: ${detail}`);
            });
            if (!settled) throw new Error('Only an attempted effect can be read back as not landed');
        });
    }
}
