import { DEPLOY_PROJECT, type ControllerEffects } from './controller-effects';
import { SERVICE_LABEL } from './service-plist';

export type Settled =
    | { status: 'verified'; receipt: Record<string, unknown> }
    /** Refused before anything was dispatched: nothing changed. */
    | { status: 'rejected'; reason: string }
    /** Dispatched, and read-back cannot confirm it. Never resent. */
    | { status: 'uncertain'; reason: string };

export interface Mutation {
    effects: ControllerEffects; operation: string; step: string;
    /** Fixed for the operation: a resumed controller must present the same payload. No secrets, no clock. */
    payload: Record<string, unknown>;
    preflight?: () => Promise<void>;
    dispatch: () => Promise<void>;
    /** Independent read-back: the receipt when the world shows this mutation's outcome, otherwise null. */
    confirm: () => Promise<Record<string, unknown> | null>;
}

/**
 * One deployment mutation through Effects under a stable identity. Read-back comes first, so a step
 * whose outcome is already visible is not dispatched again; a dispatched step that read-back cannot
 * confirm is uncertain and stays that way.
 */
export async function settle(mutation: Mutation): Promise<Settled> {
    const { effects, operation, step, payload, confirm } = mutation;
    const id = `${operation}:${step}`;
    const intent = effects.readIntent(id);
    if (intent && JSON.stringify(intent.payload) !== JSON.stringify(payload))
        return { status: 'rejected', reason: 'Effect identity already belongs to a different operation' };

    const already = await confirm();
    const reconcile = async (reason: string): Promise<Settled> => {
        let receipt = already;
        try {
            const verified = await effects.reconcile(id, async () => {
                receipt ??= await confirm();
                return { verified: !!receipt, receipt: receipt ?? {} };
            });
            if (verified) {
                receipt ??= await confirm();
                if (receipt) return { status: 'verified', receipt };
            }
        } catch (error) {
            return { status: 'uncertain', reason: `${reason}; reconciliation failed: ${String(error)}`.slice(0, 500) };
        }
        return { status: 'uncertain', reason };
    };
    if (intent?.status === 'dispatching' || intent?.status === 'uncertain')
        return reconcile('Independent read-back required; the original operation cannot be resent');
    if (already) return { status: 'verified', receipt: already };

    let dispatched = false;
    try {
        await effects.execute({
            id, work: { projectId: DEPLOY_PROJECT.id, kind: 'maintenance', id: operation }, attemptId: operation,
            operation: `deploy-${step}`, target: SERVICE_LABEL, authorization: 'pnpm office deploy', payload, expectedState: null,
            preflight: mutation.preflight ?? (async () => {}),
            dispatch: async () => { dispatched = true; await mutation.dispatch(); return {}; },
            verify: async () => !!(await confirm()),
        });
    } catch (error) {
        const reason = String(error).slice(0, 500);
        if (dispatched) return reconcile(reason);
        try {
            const current = effects.readIntent(id);
            if (!current || current.status === 'prepared' || current.status === 'rejected')
                return { status: 'rejected', reason };
        } catch {
            return { status: 'uncertain', reason };
        }
        return reconcile(reason);
    }
    // An intent verified by an earlier run returns without a read-back; the world must still show it.
    const receipt = await confirm();
    return receipt ? { status: 'verified', receipt } : { status: 'uncertain', reason: `step ${step} is recorded as done but read-back no longer shows its outcome` };
}
