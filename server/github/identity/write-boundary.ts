import type { EffectIntent } from '../../../src/shared';
import type { EffectWriter, WriteBinding, WriteQualification } from '../../../src/contracts/write-identity';
import { Effects, type EffectOperation } from '../../store/effects';
import type { Store } from '../../store/store';
import type { GitHubAppConfig } from './app-config';
import { appCredential, operatorRollbackCredential, type WriteCredential } from './child-credentials';
import { githubIdentity, type GitHubIdentityRuntime } from './identity-runtime';
import { OPERATOR_LOGIN } from './office-authors';
import { canonicalDigest } from './route-entry';
import { decisionAllows, resolveWrite, type WriteDecision, type WriteRequest } from './write-identity';
import { withWriteCredential } from './write-credential-scope';
import { routeOf } from './write-inventory';
import { mutationPermissions, type WriteMutation, type WriteOperation } from './write-operations';
import { CredentialUnavailable, WriteHeld } from './write-refusals';

/** What a fixed adapter adds to its Effect operation for the write boundary. */
export interface GitHubWriteOptions {
    /** Read-only pre-state the designated trial binds; read only for that trial, again in its preflight. */
    preState?: () => Promise<unknown>;
    board?: string;
    field?: string;
    /**
     * Read-only checks the selected credential must pass before the claim, run under that credential: a refusal
     * rejects the write unsent. Not run for the operator on a never-activated route, so nothing changes there.
     */
    credentialCheck?: () => Promise<void>;
}
type Route = { operation: WriteOperation; mutation: WriteMutation };
/** The writer selected for one Effect id before its intent exists, or the writer a saved intent already carries. */
export interface SelectedWriter {
    route: Route;
    /** Undefined only for a saved intent from before writers were recorded: it is treated as the operator. */
    writer?: EffectWriter;
    /** Undefined: the operator exactly as today, with the child environment unchanged. */
    credential?: WriteCredential;
}
type Identified = Pick<EffectOperation<unknown, unknown>, 'id' | 'operation' | 'target' | 'payload'>;

/** The intended change, derived from the authorized operation and its payload: the binding a trial and a claim compare. */
export const changeDigest = (operation: Identified) => canonicalDigest({ operation: operation.operation, target: operation.target, payload: operation.payload });
const bindingOf = (operation: Identified, options: GitHubWriteOptions): WriteBinding => ({
    adapter: operation.operation, target: operation.target, expectedDigest: changeDigest(operation),
    ...(options.board ? { board: options.board } : {}), ...(options.field ? { field: options.field } : {}),
});

async function appToken(runtime: GitHubIdentityRuntime, route: Route, installationId: number, repositoryId: number): Promise<WriteCredential> {
    const permissions = mutationPermissions(route.mutation), tokens = runtime.tokens();
    if (!permissions) throw new WriteHeld(route.operation, 'no installation grant is established for this route');
    if (!tokens) throw new CredentialUnavailable('no App issuer is configured');
    try { return appCredential(installationId, (await tokens.token({ installationId, repositoryId, permissions })).token); }
    catch (error) { throw error instanceof CredentialUnavailable ? error : new CredentialUnavailable('the installation token could not be issued'); }
}
async function verifiedOperator(runtime: GitHubIdentityRuntime, operation: string): Promise<void> {
    let login = '';
    try { login = await runtime.operatorLogin(); } catch { throw new CredentialUnavailable('the operator login could not be read'); }
    if (login !== OPERATOR_LOGIN) throw new WriteHeld(operation, 'the stored gh login is not the expected operator');
}
/** The credential a saved writer needs again: its own App token, or the operator with ambient tokens removed after a rollback. */
async function savedCredential(runtime: GitHubIdentityRuntime, route: Route, writer: EffectWriter | undefined): Promise<WriteCredential | undefined> {
    if (writer?.principal === 'app') return appToken(runtime, route, writer.installationId!, writer.repositoryId!);
    return writer?.grant.kind === 'operator' && writer.grant.revokes ? operatorRollbackCredential() : undefined;
}
function newWriter(store: Store, config: GitHubAppConfig | undefined, route: Route, decision: Exclude<WriteDecision, { kind: 'hold' }>, binding: WriteBinding): EffectWriter {
    const repository = config?.repositories[store.project.id];
    if (decision.kind === 'operator')
        return { principal: 'operator', projectId: store.project.id, repository: store.project.repository, operation: route.operation, login: OPERATOR_LOGIN, grant: decision.grant, binding };
    return { principal: 'app', projectId: store.project.id, repository: repository!.repository, operation: route.operation, login: config!.botLogin,
        appId: config!.appId, installationId: config!.installationId, ...(config!.botId ? { botId: config!.botId } : {}), repositoryId: repository!.repositoryId,
        grant: decision.grant, binding };
}

/**
 * Selects the writer for one GitHub write before `Effects.execute` creates its intent or a caller records a dispatch
 * or create fence. A saved intent keeps its own writer. For a fresh write the route is resolved (committing an
 * explicit promotion or rollback first), the selected credential is acquired, and the route is checked again after
 * that wait. A held route throws `WriteHeld`; an unavailable credential throws `CredentialUnavailable`. Neither
 * creates an intent. Returns undefined for anything that is not a GitHub write of a GitHub project.
 */
export async function selectGitHubWriter(store: Store, operation: Identified, options: GitHubWriteOptions = {}): Promise<SelectedWriter | undefined> {
    const route = routeOf(store.project, operation.operation, operation.payload);
    if (!route) return;
    const runtime = githubIdentity(store), saved = store.getEffect(operation.id);
    if (saved) return { route, writer: saved.writer, credential: saved.status === 'prepared' ? await savedCredential(runtime, route, saved.writer) : undefined };
    const binding = bindingOf(operation, options), request: WriteRequest = { effectId: operation.id, operation: route.operation, binding };
    const decision = resolveWrite(store, runtime.config(), request, { apply: true });
    if (decision.kind === 'hold') throw new WriteHeld(route.operation, decision.reason);
    if (decision.kind === 'app' && decision.grant.kind === 'trial') {
        if (!options.preState) throw new WriteHeld(route.operation, 'this adapter cannot bind the pre-state a trial needs');
        const before = canonicalDigest(await options.preState());
        if (before !== decision.entry!.beforeDigest) throw new WriteHeld(route.operation, 'the bound pre-state does not match the designated trial');
        binding.beforeDigest = before;
    }
    const config = runtime.config();
    let credential: WriteCredential | undefined;
    if (decision.kind === 'app') credential = await appToken(runtime, route, config!.installationId, config!.repositories[store.project.id].repositoryId);
    else if (decision.mode === 'rollback') { await verifiedOperator(runtime, route.operation); credential = operatorRollbackCredential(); }
    const writer = newWriter(store, config, route, decision, binding);
    // The credential wait is asynchronous: the route must still select this writer.
    const again = resolveWrite(store, runtime.config(), request, { apply: false });
    if (!decisionAllows(again, writer.grant) || again.kind === 'operator' && decision.kind === 'operator' && again.mode !== decision.mode)
        throw new WriteHeld(route.operation, 'the route changed while its credential was acquired');
    return { route, writer, credential };
}

/** Why the dispatch claim refuses a saved writer now, or undefined. Synchronous: it runs inside the claim transaction. */
export function claimRefusal(store: Store, config: GitHubAppConfig | undefined, intent: Readonly<EffectIntent>, route: Route): { refusal?: string; decision?: WriteDecision } {
    const writer = intent.writer, grant = writer?.grant ?? { kind: 'operator' as const };
    const request: WriteRequest = { effectId: intent.id, operation: route.operation, binding: writer?.binding ?? { adapter: intent.operation, target: intent.target } };
    const decision = resolveWrite(store, config, request, { apply: false });
    if (decision.kind === 'hold') return { refusal: `The writer was refused at dispatch: ${decision.reason}` };
    if (!decisionAllows(decision, grant)) return { refusal: `The writer was refused at dispatch: the route now selects ${decision.kind === 'app' ? 'the Office App' : 'the operator'}` };
    if (writer?.principal === 'app' && (writer.installationId !== config?.installationId || writer.repositoryId !== config?.repositories[store.project.id]?.repositoryId))
        return { refusal: 'The writer was refused at dispatch: the configured installation or repository changed' };
    return { decision };
}

/**
 * One GitHub write through Effects with its writer pinned and checked. The selected writer is saved on the fresh intent;
 * the prepared claim re-reads the durable route and the current entry and refuses the writer unsent when they no
 * longer authorize it; dispatch and verification run with that writer's credential. Anything that is not a GitHub
 * write goes to `Effects.execute` unchanged.
 */
export async function executeGitHubWrite<T, R>(store: Store, operation: EffectOperation<T, R>, options: GitHubWriteOptions = {}, selected?: SelectedWriter): Promise<R> {
    const chosen = selected ?? await selectGitHubWriter(store, operation, options);
    if (!chosen) return new Effects(store).execute(operation);
    const runtime = githubIdentity(store), trial = chosen.writer?.grant.kind === 'trial' ? chosen.writer.binding.beforeDigest : undefined;
    let credential = chosen.credential, operatorChecked = false;
    const scoped = <V>(work: () => Promise<V>) => credential ? withWriteCredential(credential, work) : work();
    return new Effects(store).execute<T, R>({
        ...operation,
        writer: chosen.writer,
        preflight: async () => {
            await operation.preflight();
            if (trial !== undefined && (!options.preState || canonicalDigest(await options.preState()) !== trial))
                throw new Error('The designated trial pre-state changed before dispatch');
            // A rollback that committed while this intent waited sends through the operator with ambient tokens removed.
            const current = store.getEffect(operation.id);
            const now = current && claimRefusal(store, runtime.config(), current, chosen.route).decision;
            if (now?.kind === 'operator' && now.mode === 'rollback') {
                await verifiedOperator(runtime, chosen.route.operation);
                operatorChecked = true;
                credential = operatorRollbackCredential();
            }
            if (options.credentialCheck) {
                const checkCredential = credential;
                if (checkCredential) await withWriteCredential(checkCredential, options.credentialCheck);
            }
        },
        claim: intent => {
            const { refusal, decision } = claimRefusal(store, runtime.config(), intent, chosen.route);
            if (refusal) return refusal;
            if (decision?.kind === 'operator' && decision.mode === 'rollback') {
                if (!operatorChecked) return 'The writer was refused at dispatch: the operator was not verified for the committed rollback';
            }
        },
        dispatch: payload => scoped(() => operation.dispatch(payload)),
        verify: (receipt, payload) => scoped(() => operation.verify(receipt, payload)),
    });
}

/**
 * Reconciles an attempted GitHub write under its original id and saved writer, never the current configuration. An
 * App writer's read-back uses that writer's own token; when it cannot be issued, the intent stays as it is for a later
 * read-back (`CredentialUnavailable`).
 */
export async function reconcileGitHubWrite<R>(store: Store, id: string, readBack: (intent: Readonly<EffectIntent>) => Promise<{ verified: boolean; receipt: R; qualification?: WriteQualification }>): Promise<boolean> {
    const intent = store.getEffect(id), route = intent && routeOf(store.project, intent.operation, intent.payload);
    const credential = route && intent?.writer && ['dispatching', 'uncertain'].includes(intent.status) ? await savedCredential(githubIdentity(store), route, intent.writer) : undefined;
    return new Effects(store).reconcile<R>(id, credential ? saved => withWriteCredential(credential, () => readBack(saved)) : readBack);
}
