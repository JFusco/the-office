import { isDeepStrictEqual } from 'node:util';
import type { WriteBinding, WriterGrant } from '../../../src/contracts/write-identity';
import type { Store } from '../../store/store';
import type { GitHubAppConfig, QualifyEntry, RouteEntry } from './app-config';
import { activationIdOf, entryDigest, normalizedProofs } from './route-entry';
import { bindingMatches, promoteRoute, revokeRoute, routeState, type RouteState } from './route-activation';
import type { WriteOperation } from './write-operations';

/** One write the resolver is asked about: its stable Effect id, its route and its concrete binding. */
export interface WriteRequest {
    effectId: string;
    operation: WriteOperation;
    binding: WriteBinding;
}
/**
 * Who may send the write. `inherit` leaves the child environment exactly as today (a never-activated route);
 * `rollback` sends through the operator's stored login with ambient tokens removed (a revoked route).
 */
export type WriteDecision =
    | { kind: 'operator'; mode: 'inherit' | 'rollback'; grant: Extract<WriterGrant, { kind: 'operator' }> }
    | { kind: 'app'; grant: Exclude<WriterGrant, { kind: 'operator' }>; entry?: QualifyEntry }
    | { kind: 'hold'; reason: string };

const hold = (reason: string): WriteDecision => ({ kind: 'hold', reason });
const operator = (revokes?: string): WriteDecision => revokes
    ? { kind: 'operator', mode: 'rollback', grant: { kind: 'operator', revokes } }
    : { kind: 'operator', mode: 'inherit', grant: { kind: 'operator' } };

/** The route entry the configuration gives this project and operation. */
export const routeEntry = (store: Store, config: GitHubAppConfig | undefined, operation: WriteOperation): RouteEntry | undefined =>
    config?.writes[store.project.id]?.[operation];

/** A pending entry grants only its designated Effect, bound to the same concrete write; anything else on the route is independent traffic. */
function trial(store: Store, config: GitHubAppConfig, entry: QualifyEntry, request: WriteRequest, revokes: string | undefined): WriteDecision {
    if (request.effectId !== entry.effectId) return operator(revokes);
    const { binding } = request;
    if (binding.adapter !== entry.adapter || binding.target !== entry.target || binding.expectedDigest !== entry.expectedDigest ||
        binding.board !== entry.board || binding.field !== entry.field || config.repositories[store.project.id]?.repositoryId !== entry.repositoryId)
        return hold('the designated trial names a different target or change; the reserved Effect id is a conflict');
    return { kind: 'app', grant: { kind: 'trial', entryDigest: entryDigest(entry), ...(revokes ? { revokes } : {}) }, entry };
}

/**
 * Resolves `githubApp.writes[projectId][operation]` against the route's durable history (`route-activation.ts`).
 * With `apply`, an explicit promotion or rollback the entry asks for is committed first and its outcome used; without
 * it (the dispatch claim) a transition that has not committed holds. An unreadable store holds.
 */
export function resolveWrite(store: Store, config: GitHubAppConfig | undefined, request: WriteRequest, { apply }: { apply: boolean }): WriteDecision {
    let state: RouteState;
    try { state = routeState(store, request.operation); }
    catch { return hold('the project store could not be read'); }
    const entry = routeEntry(store, config, request.operation);
    switch (state.kind) {
        case 'held': return hold(state.reason);
        case 'never-activated': {
            if (!config || !entry || entry === 'operator') return operator();
            if (entry.mode === 'qualify') return entry.revokes ? hold('the trial names a revocation this route never recorded') : trial(store, config, entry, request, undefined);
            if (entry.mode === 'operator') return hold('the rollback names an activation this route never had');
            if (!apply) return hold('the promotion has not committed');
            const promoted = promoteRoute(store, config, request.operation, entry);
            return promoted.ok ? { kind: 'app', grant: { kind: 'activation', activationEffectId: promoted.activationId } } : hold(promoted.reason);
        }
        case 'active': {
            if (!config || !entry || entry === 'operator' || entry.mode === 'qualify') return hold('the route was activated; only its active entry or an explicit rollback may send');
            if (!bindingMatches(state.effect.activation!.binding, store, config, request.operation)) return hold('the configured repository, App or installation no longer matches the activation');
            if (entry.mode === 'office-app')
                return activationIdOf(entry) === state.activationId && isDeepStrictEqual(normalizedProofs(entry), state.effect.activation!.proofEffectIds)
                    ? { kind: 'app', grant: { kind: 'activation', activationEffectId: state.activationId } } : hold('the active entry does not name the current activation');
            if (entry.revokes !== state.activationId) return hold('the rollback does not name the current activation');
            if (!apply) return hold('the rollback has not committed');
            const revoked = revokeRoute(store, config, request.operation, entry);
            return revoked.ok ? operator(revoked.activationId) : hold(revoked.reason);
        }
        case 'revoked': {
            if (!config || !entry || entry === 'operator') return hold('the route was activated; only an entry naming its revocation may send');
            if (!bindingMatches(state.effect.activation!.binding, store, config, request.operation)) return hold('the configured repository, App or installation no longer matches the revoked activation');
            if (entry.mode === 'operator') return entry.revokes === state.activationId ? operator(state.activationId) : hold('the rollback does not name the revoked activation');
            if (entry.mode === 'qualify') return entry.revokes === state.activationId ? trial(store, config, entry, request, state.activationId) : hold('a trial after a rollback must name that revocation');
            if (!apply) return hold('the promotion has not committed');
            const promoted = promoteRoute(store, config, request.operation, entry);
            return promoted.ok ? { kind: 'app', grant: { kind: 'activation', activationEffectId: promoted.activationId } } : hold(promoted.reason);
        }
    }
}

/** True when a decision still authorizes a saved writer grant: the same principal and the same activation or trial. */
export function decisionAllows(decision: WriteDecision, grant: WriterGrant): boolean {
    if (decision.kind === 'hold') return false;
    if (grant.kind === 'operator') return decision.kind === 'operator';
    return decision.kind === 'app' && isDeepStrictEqual(decision.grant, grant);
}
