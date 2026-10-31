import { Effects } from '../../store/effects';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

export interface HarnessEffect<R> {
    /** Stable per job and candidate, e.g. `push:<head>`. */
    key: string;
    operation: string;
    target: string;
    payload: Record<string, unknown>;
    guard: () => void | Promise<void>;
    /** Performs the single write, then returns the canonical read-back. */
    dispatch: () => Promise<R>;
    /** Read-only: the canonical receipt when the write is observable, otherwise null. */
    readBack: () => Promise<R | null>;
}

/** A rejected preflight never dispatched, so a later attempt may use a fresh intent id. */
function activeEffectId(store: Store, base: string): string {
    for (let attempt = 0; ; attempt++) {
        const id = attempt ? `${base}:retry-${attempt}` : base;
        const intent = store.getEffect(id);
        if (!intent || intent.status !== 'rejected' || intent.dispatchedAt)
            return id;
    }
}

/** One durable write with read-back. Uncertain attempts are reconciled by reading, never resent. */
export async function harnessEffect<R>(store: Store, job: TicketJob, effect: HarnessEffect<R>): Promise<R> {
    const id = activeEffectId(store, `harness:${job.id}:${effect.key}`);
    const effects = new Effects(store);
    const prior = store.getEffect<R>(id);
    if (prior && ['dispatching', 'uncertain'].includes(prior.status)) {
        const verified = await effects.reconcile<R | null>(id, async () => {
            const receipt = await effect.readBack();
            return { verified: receipt !== null, receipt };
        });
        if (!verified)
            throw new Error(`${effect.operation} for ${effect.target} is unverified after read-back; it will not be resent`);
        return store.getEffect<R>(id)!.receipt as R;
    }
    await effect.guard();
    return effects.execute<Record<string, unknown>, R>({
        id, work: { projectId: store.project.id, kind: 'delivery', id: job.id }, attemptId: job.id,
        operation: effect.operation, target: effect.target, authorization: 'office-harness',
        payload: effect.payload, expectedState: { key: effect.key },
        preflight: async () => { await effect.guard(); },
        dispatch: () => effect.dispatch(),
        verify: async receipt => receipt !== null && receipt !== undefined,
    });
}
