import { isDeepStrictEqual } from 'node:util';
import type { EffectIntent } from '../../../src/shared';
import type { RouteBinding, WriteActivation } from '../../../src/contracts/write-identity';
import type { Store } from '../../store/store';
import { projectPolicy } from '../../office/project-policy';
import type { ActiveEntry, GitHubAppConfig, RollbackEntry } from './app-config';
import { normalizedProofs, rollbackDigest } from './route-entry';
import { routeOf, sharedPublishers } from './write-inventory';
import { MUTATIONS, routeMutations, type WriteOperation } from './write-operations';

/**
 * The durable state of one write route in its project store. The route table holds only the current activation
 * reference; the proof, full binding and rollback audit stay on the qualifying Effect. Anything that does not
 * add up to one of the three valid histories holds every fresh write on the route.
 */
export type RouteState =
    | { kind: 'never-activated' }
    | { kind: 'active'; activationId: string; effect: EffectIntent }
    | { kind: 'revoked'; activationId: string; effect: EffectIntent }
    | { kind: 'held'; reason: string };
export type RouteChange = { ok: true; activationId: string } | { ok: false; reason: string };

type RouteRow = { activation_effect_id: string; state: 'active' | 'revoked' };
const held = (reason: string): RouteState => ({ kind: 'held', reason });

function routeRow(store: Store, operation: WriteOperation): RouteRow | undefined {
    return store.db.prepare('SELECT activation_effect_id,state FROM github_write_routes WHERE project_id=? AND operation=?')
        .get(store.project.id, operation) as RouteRow | undefined;
}
/** Every saved App intent on the route: a bounded scan through the partial index of App writers. */
function appHistory(store: Store, operation: WriteOperation): EffectIntent[] {
    return (store.db.prepare("SELECT body FROM effects WHERE json_extract(body,'$.writer.principal')='app' AND json_extract(body,'$.writer.operation')=?")
        .all(operation) as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent).filter(intent => intent.writer?.projectId === store.project.id);
}

/** The route's history, read from the project store. Never reconstructs a lost marker from configuration. */
export function routeState(store: Store, operation: WriteOperation): RouteState {
    const row = routeRow(store, operation), history = appHistory(store, operation), markers = history.filter(intent => intent.activation);
    if (!row) {
        if (markers.length) return held('an activation marker exists without the route reference');
        if (history.some(intent => intent.writer!.grant.kind === 'activation')) return held('ordinary App writes exist without an activation history');
        if (history.some(intent => intent.writer!.grant.kind === 'trial' && intent.writer!.grant.revokes)) return held('a trial names a revocation the route never recorded');
        return { kind: 'never-activated' };
    }
    const effect = store.getEffect(row.activation_effect_id);
    if (!effect) return held('the current activation Effect is missing');
    if (effect.status !== 'verified' || effect.writer?.principal !== 'app') return held('the current activation Effect is not a verified App write');
    const marker = effect.activation;
    if (!marker) return held('the current activation marker is missing');
    if (marker.projectId !== store.project.id || marker.operation !== operation || marker.proofEffectIds[0] !== effect.id)
        return held('the activation marker belongs to another route');
    if ((row.state === 'revoked') !== !!marker.revocation) return held('the route reference and its activation Effect disagree');
    if (markers.some(other => other.activation!.predecessor === effect.id)) return held('the route reference names a superseded activation');
    if (markers.some(other => other.id !== effect.id && !other.activation!.revocation)) return held('conflicting unrevoked activation markers');
    const known = new Set(markers.map(intent => intent.id));
    if (history.some(intent => intent.writer!.grant.kind === 'activation' && !known.has((intent.writer!.grant as { activationEffectId: string }).activationEffectId)))
        return held('ordinary App writes name an unknown activation');
    return { kind: row.state, activationId: effect.id, effect };
}

/** When the route first moved to the App: the earliest activation saved on it, or undefined for a never-activated route. */
export function routeCutover(store: Store, operation: WriteOperation): string | undefined {
    return appHistory(store, operation).flatMap(intent => intent.activation ? [intent.activation.activatedAt] : []).sort()[0];
}

/** The route binding the configuration names now, for comparison with a saved activation. */
export function configuredBinding(store: Store, config: GitHubAppConfig | undefined, operation: WriteOperation): Omit<RouteBinding, 'adapters' | 'board' | 'field'> | undefined {
    const repository = config?.repositories[store.project.id];
    return repository && { projectId: store.project.id, operation, repository: repository.repository, repositoryId: repository.repositoryId, appId: config!.appId, installationId: config!.installationId };
}
/** An edited repository, repository id, App or installation reaches the saved route and fails here. */
export function bindingMatches(saved: RouteBinding, store: Store, config: GitHubAppConfig | undefined, operation: WriteOperation): boolean {
    const current = configuredBinding(store, config, operation);
    return !!current && (Object.keys(current) as (keyof typeof current)[]).every(key => saved[key] === current[key]);
}

/** Why one proof cannot serve the activation, or undefined when it can. */
function proofRefusal(store: Store, config: GitHubAppConfig, operation: WriteOperation, proof: EffectIntent | undefined, predecessor: string | null, earlier: Set<string>): string | undefined {
    const writer = proof?.writer, repository = config.repositories[store.project.id];
    if (!proof || proof.status !== 'verified') return 'a proof Effect is missing or unverified';
    if (proof.activation || earlier.has(proof.id)) return 'a proof Effect already belongs to an activation';
    if (writer?.principal !== 'app' || writer.grant.kind !== 'trial' || writer.projectId !== store.project.id || writer.operation !== operation)
        return 'a proof Effect is not a designated App trial of this route';
    if ((writer.grant.revokes ?? null) !== predecessor) return 'a proof Effect was not qualified after the current revocation';
    if (writer.appId !== config.appId || writer.installationId !== config.installationId || writer.repositoryId !== repository?.repositoryId || writer.repository !== repository?.repository)
        return 'a proof Effect was qualified for another App, installation or repository';
    const evidence = proof.qualification;
    if (!evidence || evidence.actor.login !== writer.login || writer.login !== config.botLogin || config.botId !== undefined && evidence.actor.id !== config.botId || evidence.target !== writer.binding.target)
        return 'a proof Effect has no actor-bearing read-back for the App on its bound target';
}

/**
 * Explicit promotion, in one project transaction: re-reads the route, its history and every proof Effect, then saves
 * the marker on the first proof in sorted order and sets the route reference. Reloading the identical current
 * activation is idempotent. Ordinary App writes are admitted only after this commits.
 */
export function promoteRoute(store: Store, config: GitHubAppConfig, operation: WriteOperation, entry: ActiveEntry): RouteChange {
    return store.transaction((): RouteChange => {
        const state = routeState(store, operation), proofs = normalizedProofs(entry), activationId = proofs[0];
        if (state.kind === 'held') return { ok: false, reason: state.reason };
        if (state.kind === 'active') {
            const marker = state.effect.activation!;
            return state.activationId === activationId && isDeepStrictEqual(marker.proofEffectIds, proofs) && bindingMatches(marker.binding, store, config, operation)
                ? { ok: true, activationId } : { ok: false, reason: 'another activation is current on this route' };
        }
        const predecessor = state.kind === 'revoked' ? state.activationId : null;
        const earlier = new Set(appHistory(store, operation).flatMap(intent => intent.activation?.proofEffectIds ?? []));
        const intents = proofs.map(id => store.getEffect(id));
        for (const proof of intents) {
            const refusal = proofRefusal(store, config, operation, proof, predecessor, earlier);
            if (refusal) return { ok: false, reason: refusal };
        }
        const adapters = [...new Set(intents.map(proof => proof!.writer!.binding.adapter))].sort();
        const proved = new Set(adapters.map(adapter => routeOf(store.project, adapter, { operation: { payload: { action: operation === 'board-add' ? 'add' : 'status' } } })?.mutation));
        const missing = routeMutations(operation).filter(mutation => !proved.has(mutation));
        if (missing.length) return { ok: false, reason: `no verified trial proves ${missing.join(', ')}` };
        if (routeMutations(operation).some(mutation => MUTATIONS[mutation].permissions === null)) return { ok: false, reason: 'no installation grant is established for this route' };
        const shared = sharedPublishers(store.project, projectPolicy(store.project).handsOff, operation);
        if (shared.length) return { ok: false, reason: `${shared[0].module} can still publish this route without the checked claim` };
        const boards = new Set(intents.map(proof => proof!.writer!.binding.board)), fields = new Set(intents.map(proof => proof!.writer!.binding.field));
        if (boards.size !== 1 || fields.size !== 1) return { ok: false, reason: 'the proofs bind different boards or fields' };
        const binding: RouteBinding = { ...configuredBinding(store, config, operation)!, adapters };
        const board = [...boards][0], field = [...fields][0];
        if (board) binding.board = board;
        if (field) binding.field = field;
        const activation: WriteActivation = { projectId: store.project.id, operation, predecessor, proofEffectIds: proofs, binding, activatedAt: store.clock.now().toISOString() };
        if (!store.updateEffect(activationId, 'verified', intent => { intent.activation = activation; })) return { ok: false, reason: 'the activation Effect changed during promotion' };
        store.db.prepare("INSERT INTO github_write_routes VALUES(?,?,?,'active') ON CONFLICT(project_id,operation) DO UPDATE SET activation_effect_id=excluded.activation_effect_id,state='active'")
            .run(store.project.id, operation, activationId);
        store.emit('github-route-activated', `GitHub ${operation} writes for ${store.project.name} now use the Office App under activation ${activationId}.`);
        return { ok: true, activationId };
    });
}

/**
 * Deliberate rollback of active(X), recorded on X before any operator write: inside one project transaction it
 * re-reads and matches the reference, the verified Effect, its marker and the full binding, saves the digest of the
 * canonical rollback entry with the project clock time, and sets the reference to revoked(X). Reloading the same
 * entry for revoked(X) reuses the first record. `tentative` runs after the tentative update, before commit.
 */
export function revokeRoute(store: Store, config: GitHubAppConfig, operation: WriteOperation, entry: RollbackEntry, tentative?: () => void): RouteChange {
    return store.transaction((): RouteChange => {
        const state = routeState(store, operation);
        if (state.kind === 'held') return { ok: false, reason: state.reason };
        if (state.kind === 'never-activated' || state.activationId !== entry.revokes) return { ok: false, reason: 'the rollback does not name the current activation of this route' };
        if (state.kind === 'revoked') return { ok: true, activationId: state.activationId };
        const marker = state.effect.activation!;
        if (!bindingMatches(marker.binding, store, config, operation)) return { ok: false, reason: 'the configured binding no longer matches the activation' };
        const revocation = { entryDigest: rollbackDigest(entry, marker.binding), at: store.clock.now().toISOString() };
        if (!store.updateEffect(state.activationId, 'verified', intent => { intent.activation!.revocation = revocation; })) return { ok: false, reason: 'the activation Effect changed during rollback' };
        store.db.prepare("UPDATE github_write_routes SET state='revoked' WHERE project_id=? AND operation=? AND activation_effect_id=? AND state='active'")
            .run(store.project.id, operation, state.activationId);
        tentative?.();
        store.emit('github-route-revoked', `GitHub ${operation} writes for ${store.project.name} returned to the operator; activation ${state.activationId} is revoked.`);
        return { ok: true, activationId: state.activationId };
    });
}
