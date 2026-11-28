import { currentAssignment } from '../../workers/assignment-context';
import type { Store } from '../../store/store';

/**
 * Why the current scheduler assignment does not own the read-back of this maintenance run, or undefined (#612). The
 * persisted claim must be running for this project and bound to this run through one of its existing entry points:
 * the scheduled recovery (`recovery:<run>`), a `reconcile-maintenance` request for the run, or the PM outbox recheck
 * whose action names the run (`maintenance:<run>`). Synchronous, so it can be rechecked right before a settlement
 * is saved.
 */
export function reconcileAuthority(store: Store, runId: string): string | undefined {
    const claim = currentAssignment()?.claim;
    if (!claim || claim.status !== 'running' || claim.work.projectId !== store.project.id)
        return 'No running scheduler claim of this project owns the maintenance read-back';
    if (!store.activeClaims().some(active => active.id === claim.id && active.status === 'running'))
        return 'The maintenance read-back claim is no longer running';
    const { kind, id } = claim.work;
    if (kind === 'reconciliation' && id === `recovery:${runId}`) return undefined;
    if (kind === 'reconciliation') {
        const request = store.state.coordination?.requests?.find(item => item.id === id);
        if (request?.action === 'reconcile-maintenance' && request.key === runId) return undefined;
    }
    if (kind === 'conversation') {
        const message = store.state.messages.find(item => item.id === id);
        if (message?.to === 'pm' && message.recheck && message.actionId === `maintenance:${runId}`) return undefined;
    }
    return `The running claim is not bound to the read-back of maintenance run ${runId}`;
}

/** The same check, as a refusal. */
export function assertReconcileAuthority(store: Store, runId: string): void {
    const refusal = reconcileAuthority(store, runId);
    if (refusal) throw new Error(refusal);
}

/**
 * Why the current assignment does not own the read-back of this run's Brain repair follow-up, or undefined: only its
 * own running `reconcile-maintenance` request for this project and run, whose persisted claim is still running.
 * Rechecked on entry, after each provider read before its settlement is saved, and before the follow-up is updated.
 */
export function followupReadbackAuthority(store: Store, runId: string): string | undefined {
    const claim = currentAssignment()?.claim, request = claim && store.state.coordination?.requests?.find(item => item.id === claim.work.id);
    if (!claim || claim.status !== 'running' || claim.work.projectId !== store.project.id || claim.work.kind !== 'reconciliation' || request?.action !== 'reconcile-maintenance' || request.key !== runId)
        return 'The follow-up read-back needs its own running reconcile-maintenance request for this run';
    if (!store.activeClaims().some(active => active.id === claim.id && active.status === 'running'))
        return 'The follow-up read-back claim is no longer running';
}

export function assertFollowupReadbackAuthority(store: Store, runId: string): void {
    const refusal = followupReadbackAuthority(store, runId);
    if (refusal) throw new Error(refusal);
}
