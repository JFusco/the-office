import { boardOperation, fieldOperation, isWriteOperation, type WriteOperation } from './write-operations';
import { routeOf } from './write-inventory';

/**
 * The public `githubApp` block of office-config.json: the Office GitHub App's identifiers, its repository bindings,
 * the approved key-source selector and one route entry per project and write operation. Never a key or a token.
 */
export interface KeychainKeySource { kind: 'keychain'; service: string; account: string }
/** A pending trial: grants the one designated Effect an App write, bound to its concrete target and change. */
export interface QualifyEntry {
    mode: 'qualify'; effectId: string; installationId: number; repositoryId: number; adapter: string; target: string;
    beforeDigest: string; expectedDigest: string;
    /** Required after a committed rollback: the activation that rollback revoked. An initial trial omits it. */
    revokes?: string;
    board?: string; field?: string;
}
/** Explicit promotion over verified, actor-bearing trials. */
export interface ActiveEntry { mode: 'office-app'; proofEffectIds: string[] }
/** Deliberate rollback of the route's current activation. */
export interface RollbackEntry { mode: 'operator'; revokes: string }
export type RouteEntry = 'operator' | QualifyEntry | ActiveEntry | RollbackEntry;
export interface RepositoryBinding {
    repository: string; repositoryId: number;
    /** Digests of the push hook chains qualified to run with an App push's credential (`push-destination.ts`). */
    pushHooks?: string[];
}
export interface GitHubAppConfig {
    appId: number;
    installationId: number;
    /** The App's bot login, `<slug>[bot]`. */
    botLogin: string;
    botId?: number;
    keySource: KeychainKeySource;
    repositories: Record<string, RepositoryBinding>;
    writes: Record<string, Partial<Record<WriteOperation, RouteEntry>>>;
}
/** What the parser checks a project against: its id, provider and repository. */
export type KnownProject = { id: string; provider: string; repository: string };

const fail = (path: string, reason: string): never => { throw new Error(`githubApp${path}: ${reason}`); };
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const positive = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;
const EFFECT_ID = /^[\w:.#@/+-]{1,300}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const SECRET_NAME = /key$|token|secret|password|pem|jwt|credential|private/i;
/** Text that can only be secret material: a PEM block, a GitHub token or a signed JWT. Never echoed in an error. */
const SECRET_TEXT = /-----BEGIN [A-Z ]*PRIVATE KEY-----|\bgh[opsur]_[A-Za-z0-9]|\bgithub_pat_|\beyJ[\w-]{4,}\.eyJ[\w-]{4,}\./;

function only(value: Record<string, unknown>, path: string, allowed: readonly string[]) {
    for (const field of Object.keys(value))
        if (!allowed.includes(field)) fail(`${path}.${field}`, SECRET_NAME.test(field) && field !== 'keySource'
            ? 'secret material never belongs in office-config.json; the key comes from the approved key source'
            : 'unknown field');
}
function secrets(value: unknown, path: string) {
    if (typeof value === 'string' && SECRET_TEXT.test(value)) fail(path, 'secret material never belongs in office-config.json');
    if (Array.isArray(value)) value.forEach((item, index) => secrets(item, `${path}[${index}]`));
    else if (record(value)) for (const [field, item] of Object.entries(value)) secrets(item, `${path}.${field}`);
}
const effectId = (value: unknown, path: string) => typeof value === 'string' && EFFECT_ID.test(value) ? value : fail(path, 'a saved Effect id is required');
const text = (value: unknown, path: string, pattern: RegExp) => typeof value === 'string' && pattern.test(value) ? value : fail(path, 'malformed value');

function entry(raw: unknown, path: string, operation: WriteOperation, config: Pick<GitHubAppConfig, 'installationId'>, binding: RepositoryBinding | undefined): RouteEntry {
    if (raw === 'operator') return raw;
    if (!record(raw)) return fail(path, "expected 'operator' or a route entry object");
    if (raw.mode !== 'operator' && !binding) fail(path, 'an App route needs the project in githubApp.repositories');
    if (raw.mode === 'operator') {
        only(raw, path, ['mode', 'revokes']);
        return { mode: 'operator', revokes: effectId(raw.revokes, `${path}.revokes`) };
    }
    if (raw.mode === 'office-app') {
        only(raw, path, ['mode', 'proofEffectIds']);
        const proofs = raw.proofEffectIds;
        if (!Array.isArray(proofs) || !proofs.length || proofs.length > 20) fail(`${path}.proofEffectIds`, 'one or more proof Effect ids are required');
        const ids = (proofs as unknown[]).map((id, index) => effectId(id, `${path}.proofEffectIds[${index}]`));
        if (new Set(ids).size !== ids.length) fail(`${path}.proofEffectIds`, 'proof Effect ids repeat');
        return { mode: 'office-app', proofEffectIds: ids };
    }
    if (raw.mode !== 'qualify') return fail(`${path}.mode`, "expected 'qualify', 'office-app' or 'operator'");
    const board = boardOperation(operation), field = fieldOperation(operation);
    only(raw, path, ['mode', 'effectId', 'installationId', 'repositoryId', 'adapter', 'target', 'beforeDigest', 'expectedDigest', 'revokes', ...(board ? ['board'] : []), ...(field ? ['field'] : [])]);
    if (raw.installationId !== config.installationId) fail(`${path}.installationId`, 'conflicts with githubApp.installationId');
    if (raw.repositoryId !== binding!.repositoryId) fail(`${path}.repositoryId`, "conflicts with the project's repository binding");
    const adapter = text(raw.adapter, `${path}.adapter`, /^[\w-]{1,80}$/);
    if (routeOf({ provider: 'github' }, adapter, { operation: { payload: { action: operation === 'board-add' ? 'add' : 'status' } } })?.operation !== operation)
        fail(`${path}.adapter`, `is not a ${operation} adapter in the write inventory`);
    const qualify: QualifyEntry = {
        mode: 'qualify', effectId: effectId(raw.effectId, `${path}.effectId`), installationId: raw.installationId as number, repositoryId: raw.repositoryId as number,
        adapter, target: text(raw.target, `${path}.target`, /^\S{1,500}$/),
        beforeDigest: text(raw.beforeDigest, `${path}.beforeDigest`, DIGEST), expectedDigest: text(raw.expectedDigest, `${path}.expectedDigest`, DIGEST),
    };
    if (raw.revokes !== undefined) qualify.revokes = effectId(raw.revokes, `${path}.revokes`);
    if (board) qualify.board = text(raw.board, `${path}.board`, /^\S{1,200}$/);
    if (field) qualify.field = text(raw.field, `${path}.field`, /^\S{1,200}$/);
    return qualify;
}

/**
 * Validates the `githubApp` block. Absent stays absent: every route then selects the operator, or holds where the
 * project store shows an earlier activation. Unknown fields, secret material, unknown projects, malformed references
 * and conflicting forms stop start-up; no error repeats a value. Proof and rollback references are checked against
 * the project store when a route is resolved (`route-activation.ts`), so a pending trial may name an Effect that does
 * not exist yet.
 */
export function parseGitHubApp(raw: unknown, projects: readonly KnownProject[] | undefined): GitHubAppConfig | undefined {
    if (raw === undefined) return;
    if (!record(raw)) return fail('', 'expected an object');
    secrets(raw, '');
    only(raw, '', ['appId', 'installationId', 'botLogin', 'botId', 'keySource', 'repositories', 'writes']);
    if (!projects) fail('', 'requires configured projects to bind its repositories');
    if (!positive(raw.appId)) fail('.appId', 'a positive App id is required');
    if (!positive(raw.installationId)) fail('.installationId', 'a positive installation id is required');
    const botLogin = text(raw.botLogin, '.botLogin', /^[A-Za-z0-9][A-Za-z0-9-]{0,38}\[bot\]$/);
    if (raw.botId !== undefined && !positive(raw.botId)) fail('.botId', 'a positive bot account id is required');
    const source = raw.keySource;
    if (!record(source)) return fail('.keySource', 'an approved key-source selector is required');
    only(source, '.keySource', ['kind', 'service', 'account']);
    if (source.kind !== 'keychain') fail('.keySource.kind', "only the 'keychain' selector is approved");
    const keySource: KeychainKeySource = { kind: 'keychain', service: text(source.service, '.keySource.service', /^[\w.-]{1,100}$/), account: text(source.account, '.keySource.account', /^[\w.@-]{1,100}$/) };
    const github = new Map(projects!.filter(project => project.provider === 'github').map(project => [project.id, project]));
    const repositories: Record<string, RepositoryBinding> = {};
    if (!record(raw.repositories)) return fail('.repositories', 'expected an object keyed by project id');
    for (const [id, value] of Object.entries(raw.repositories)) {
        const project = github.get(id);
        if (!project) fail(`.repositories.${id}`, 'unknown GitHub project');
        if (!record(value)) return fail(`.repositories.${id}`, 'expected { repository, repositoryId }');
        only(value, `.repositories.${id}`, ['repository', 'repositoryId', 'pushHooks']);
        if (value.repository !== project!.repository) fail(`.repositories.${id}.repository`, "conflicts with the project's repository");
        if (!positive(value.repositoryId)) fail(`.repositories.${id}.repositoryId`, 'a positive repository id is required');
        repositories[id] = { repository: value.repository as string, repositoryId: value.repositoryId as number };
        if (value.pushHooks !== undefined) {
            if (!Array.isArray(value.pushHooks) || value.pushHooks.some(hook => typeof hook !== 'string' || !DIGEST.test(hook))) fail(`.repositories.${id}.pushHooks`, 'expected hook-chain digests');
            repositories[id].pushHooks = [...value.pushHooks as string[]];
        }
    }
    const repositoryIds = Object.values(repositories).map(binding => binding.repositoryId);
    if (new Set(repositoryIds).size !== repositoryIds.length) fail('.repositories', 'two projects name the same repository id');
    const config: GitHubAppConfig = { appId: raw.appId as number, installationId: raw.installationId as number, botLogin, keySource, repositories, writes: {} };
    if (raw.botId !== undefined) config.botId = raw.botId as number;
    if (raw.writes === undefined) return config;
    if (!record(raw.writes)) return fail('.writes', 'expected an object keyed by project id');
    for (const [id, routes] of Object.entries(raw.writes)) {
        if (!github.has(id)) fail(`.writes.${id}`, 'unknown GitHub project');
        if (!record(routes)) return fail(`.writes.${id}`, 'expected an object keyed by write operation');
        const parsed: Partial<Record<WriteOperation, RouteEntry>> = {};
        for (const [operation, value] of Object.entries(routes)) {
            if (!isWriteOperation(operation)) fail(`.writes.${id}.${operation}`, 'unknown write operation');
            parsed[operation as WriteOperation] = entry(value, `.writes.${id}.${operation}`, operation as WriteOperation, config, repositories[id]);
        }
        config.writes[id] = parsed;
    }
    return config;
}
