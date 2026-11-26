import { Effects } from '../../store/effects';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';
import { settleNotLanded } from './resend-not-landed';

export interface HarnessEffect<R> {
    /** Stable per job and candidate, e.g. `push:<head>`. */
    key: string;
    operation: string;
    target: string;
    payload: Record<string, unknown>;
    /** Runs before admission and again at the end of preflight; receives the exact Effect id it guards. */
    guard: (activeEffectId?: string) => void | Promise<void>;
    /** Performs the single write and returns its receipt or, by default, the canonical read-back. */
    dispatch: () => Promise<R>;
    /** When supplied, verifies the provider receipt after Effects has persisted it. */
    verify?: (receipt: R) => Promise<boolean>;
    /** Read-only: the canonical receipt when the write is observable, otherwise null. */
    readBack: () => Promise<R | null>;
    /**
     * Only for an absolute write, which cannot apply twice: read-only, true when the target still shows the
     * state from before the attempt, so the attempt did not land. The write is then sent once more under a
     * fresh intent (`resend-not-landed.ts`). Every other effect is reconciled by read-back and never resent.
     */
    notLanded?: () => Promise<boolean>;
}

/** A rejected preflight never dispatched, and an attempt read back as never landed is settled: a later attempt may use a fresh intent id. */
export function activeEffectId(store: Store, base: string): string {
    for (let attempt = 0; ; attempt++) {
        const id = attempt ? `${base}:retry-${attempt}` : base;
        const intent = store.getEffect(id);
        if (!intent || intent.status !== 'rejected' || intent.dispatchedAt && !intent.notLandedAt)
            return id;
    }
}

/**
 * One durable write with read-back. Uncertain attempts are reconciled by reading, never resent. The one
 * exception is an effect that declares `notLanded`: an absolute write shown not to have landed is sent once more.
 */
export async function harnessEffect<R>(store: Store, job: Pick<TicketJob, 'id'>, effect: HarnessEffect<R>): Promise<R> {
    const base = `harness:${job.id}:${effect.key}`;
    let id = activeEffectId(store, base);
    const effects = new Effects(store);
    const prior = store.getEffect<R>(id);
    if (prior && ['dispatching', 'uncertain'].includes(prior.status)) {
        const verified = await effects.reconcile<R | null>(id, async () => {
            const receipt = await effect.readBack();
            return { verified: receipt !== null, receipt };
        });
        if (verified)
            return store.getEffect<R>(id)!.receipt as R;
        if (!effect.notLanded || !await settleNotLanded(store, base, id, effect.notLanded))
            throw new Error(`${effect.operation} for ${effect.target} is unverified after read-back; it will not be resent`);
        id = activeEffectId(store, base);
    }
    await effect.guard(id);
    return effects.execute<Record<string, unknown>, R>({
        id, work: { projectId: store.project.id, kind: 'delivery', id: job.id }, attemptId: job.id,
        operation: effect.operation, target: effect.target, authorization: 'office-harness',
        payload: effect.payload, expectedState: { key: effect.key },
        preflight: async () => { await effect.guard(id); },
        dispatch: () => effect.dispatch(),
        verify: effect.verify ?? (async receipt => receipt !== null && receipt !== undefined),
    });
}
