import { PACKED165 } from './packed165-policy';
import { digest, terminationObservation } from '../../store/readback-evidence';
import { assertPacked165Original, packed165Original } from './packed165-intent';
import type { HarnessRequest } from '../../../src/shared';
import type { Store } from '../../store/store';

/** The actual failed setup, not a general request retry policy. */
export const PACKED165_SETUP = Object.freeze({
    request: '8978d20b-821a-416c-8f35-58883f7bc728',
    worker: '4d491ce9-cb8d-477e-9292-e43900a570f6',
    claim: 'b219173f-da5f-47ba-ad93-239ce6f6bf49',
    processId: 97374,
    endedAt: '2026-11-11T21:29:43.226Z',
    intentSha256: 'dab0db9504b7c6663209cdeed8c8bda58b13ed2e4ecb68486ed5124d74373bbd',
    error: 'Error: pnpm exited 1: $ husky',
});
export type Packed165SetupScope = { [K in keyof typeof PACKED165_SETUP]: (typeof PACKED165_SETUP)[K] extends number ? number : string };

export function packed165SetupReady(store: Store, request: HarnessRequest, scope: Packed165SetupScope = PACKED165_SETUP) {
    const work = store.state.workLog?.filter(w => w.id === scope.worker) || [];
    const exact = store.project.id === PACKED165.project && store.project.repository === PACKED165.repository &&
        request.id === scope.request && request.action === PACKED165.action && request.key === PACKED165.key &&
        request.head === PACKED165.head && request.lane === 'delivery' && request.status === 'blocked' &&
        request.detail === scope.error && !request.packed165SetupContinuation && work.length === 1 &&
        work[0].requestId === PACKED165.job && work[0].claimId === scope.claim && work[0].status === 'failed' &&
        work[0].provider === 'harness' && work[0].stage === 'harness-packed165-forward-source' &&
        work[0].processId === scope.processId && work[0].endedAt === scope.endedAt;
    if (!exact || store.state.draining) return false;
    try { assertPacked165Original(store, packed165Original(store)); return true; }
    catch { return false; }
}

/** Consumes one continuation on the SAME request before any read or write can fail. No budgets are reset. */
export function beginPacked165Setup(store: Store, request: HarnessRequest, scope: Packed165SetupScope = PACKED165_SETUP) {
    if (!packed165SetupReady(store, request, scope)) throw new Error('The exact retained #165 setup failure is required');
    const work = store.state.workLog!.find(w => w.id === scope.worker)!;
    store.transition('packed165-setup-continuation-started', 'Continuing the same approved revision after repository workspace setup repair; prior failure retained.', () => {
        request.packed165SetupContinuation = { attemptedAt: store.clock.now().toISOString(), originalFailure: request.detail,
            workerId: work.id, workSha256: digest(work), intentSha256: scope.intentSha256 };
    }, 'pm', request.key);
}

export function checkPacked165SetupWork(store: Store, request: HarnessRequest, scope: Packed165SetupScope = PACKED165_SETUP) {
    const continuation = request.packed165SetupContinuation;
    const work = store.state.workLog?.filter(w => w.id === scope.worker) || [];
    if (request.id !== scope.request || !continuation || continuation.workerId !== scope.worker ||
        continuation.originalFailure !== scope.error || continuation.intentSha256 !== scope.intentSha256 ||
        work.length !== 1 || digest(work[0]) !== continuation.workSha256)
        throw new Error('Retained #165 setup work or continuation changed');
    return terminationObservation(store, work[0]);
}
