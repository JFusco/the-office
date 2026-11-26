import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';
import type { WriteQualification } from '../../../src/contracts/write-identity';
import { executeGitHubWrite, reconcileGitHubWrite } from '../../github/identity/write-boundary';
import { settleNotLanded } from './resend-not-landed';

export interface HarnessEffect<R> {
    /** Stable per job and candidate, e.g. `push:<head>`. */
    key: string;
    operation: string;
    target: string;
    payload: Record<string, unknown>;
    /** Runs before admission and again at the end of preflight, with no arguments unless marked by `effectIdGuard`. */
    guard: () => void | Promise<void>;
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
    /**
     * Read-only: the actor-bearing evidence a verified receipt shows on its bound target, or undefined. Never for an
     * adopted object or a state-only read-back; the default verification supplies none.
     */
    qualify?: (receipt: R) => Promise<WriteQualification | undefined>;
    /** Read-only pre-state a designated App trial binds; the canonical read-back by default. Read only for that trial. */
    preState?: () => Promise<unknown>;
    /** The board and field a board write binds. */
    board?: string;
    field?: string;
    /** Read-only checks an App or rollback credential must pass in preflight, such as a push's destination (`write-boundary.ts`). */
    credentialCheck?: () => Promise<void>;
}

const NEEDS_EFFECT_ID = Symbol('effect-id-guard');

/**
 * Marks a guard that must know the exact Effect id it guards, such as one that exempts its own unsent preparation from
 * the automation Effect gate. The mark travels with the function through callers that forward a guard unchanged (a lane
 * move, a proof comment). Only a marked guard receives the id; every other guard is called with no arguments.
 */
export function effectIdGuard(guard: (activeEffectId?: string) => void | Promise<void>): () => void | Promise<void> {
    return Object.assign((activeEffectId?: string) => guard(activeEffectId), { [NEEDS_EFFECT_ID]: true });
}

const runGuard = (guard: () => void | Promise<void>, id: string) =>
    NEEDS_EFFECT_ID in guard ? (guard as (activeEffectId?: string) => void | Promise<void>)(id) : guard();

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
    const evidence = async (receipt: R | null) => receipt !== null && receipt !== undefined && effect.qualify ? effect.qualify(receipt) : undefined;
    const prior = store.getEffect<R>(id);
    if (prior && ['dispatching', 'uncertain'].includes(prior.status)) {
        // Read back under the intent's own saved writer (`server/github/identity/write-boundary.ts`).
        const verified = await reconcileGitHubWrite<R | null>(store, id, async () => {
            const receipt = await effect.readBack();
            return { verified: receipt !== null, receipt, qualification: await evidence(receipt) };
        });
        if (verified)
            return store.getEffect<R>(id)!.receipt as R;
        if (!effect.notLanded || !await settleNotLanded(store, base, id, effect.notLanded))
            throw new Error(`${effect.operation} for ${effect.target} is unverified after read-back; it will not be resent`);
        id = activeEffectId(store, base);
    }
    await runGuard(effect.guard, id);
    // The writer is selected, and its credential acquired, before the intent exists (`write-boundary.ts`).
    return executeGitHubWrite<Record<string, unknown>, R>(store, {
        id, work: { projectId: store.project.id, kind: 'delivery', id: job.id }, attemptId: job.id,
        operation: effect.operation, target: effect.target, authorization: 'office-harness',
        payload: effect.payload, expectedState: { key: effect.key },
        preflight: async () => { await runGuard(effect.guard, id); },
        dispatch: () => effect.dispatch(),
        verify: async receipt => {
            const verified = effect.verify ? await effect.verify(receipt) : receipt !== null && receipt !== undefined;
            return verified && effect.qualify ? { verified, qualification: await evidence(receipt) } : verified;
        },
    }, { preState: effect.preState ?? effect.readBack, board: effect.board, field: effect.field, credentialCheck: effect.credentialCheck });
}
