import { createHash } from 'node:crypto';
import { closeSync, constants, fsyncSync, openSync, unlinkSync, writeSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import { writeDurable } from '../../release/durable-file';
import { assertOwnedDirectory, preflightRoot, runnerUid, type DirectoryFacts, type RunDirectories } from '../run-directories';
import type { ValidatedRunnerPaths } from '../runner-root';
import { isStopped, provesOwnership, readStatus, stopGeneration, updateStatus, type ActiveHandoff, type PassProof, type StopReason } from './profile-status';
import { AUTH_MAX_BYTES, readOwnedFile, readRunFile, readSignIn, signInPaths, type ReadFiles } from './sign-in-paths';

/**
 * The Codex reader's sign-in: Joe's own `codex login --device-auth` under the runner's `providers/codex`,
 * a login separate from his interactive one. A run gets a byte-for-byte copy in its own `CODEX_HOME`.
 * The refresh family is exclusive from that copy until the copy is retired: the hand-off is claimed in
 * `state/providers.json` before the copy is made and cleared only once the copy is gone. A refreshed
 * copy is published back only for the same login, user and workspace, only with trusted evidence that
 * this run was issued exactly those credentials, and only while the canonical file is still the one
 * copied. Every other change stops that generation; nothing ever falls back to another login.
 *
 * The envelope is the managed-ChatGPT form of Codex 0.167.0-alpha.4.1's `AuthDotJson` and `TokenData`
 * (`codex-rs/login/src/auth/storage.rs`, `token_data.rs`). Agent identities, personal access tokens,
 * Bedrock keys and an API key are refused. `auth_mode` is serialized as `chatgpt`: the storage types it
 * `Option<AuthMode>`, and the protocol names that variant in lowercase (verified at commit d2c03563 of
 * rust-v0.167.0-alpha.4.1: https://github.com/openai/codex/blob/d2c035639366e0bf2c316aa2065c24aabc12bcdc/codex-rs/login/src/auth/storage.rs#L43-L55
 * and https://github.com/openai/codex/blob/d2c035639366e0bf2c316aa2065c24aabc12bcdc/codex-rs/protocol/src/auth.rs#L6-L17).
 */

const sha256 = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');
const text = z.string().min(1).max(16384);
const Jwt = z.string().max(16384).regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
const Envelope = z.strictObject({
    auth_mode: z.literal('chatgpt'),
    OPENAI_API_KEY: z.null().optional(),
    tokens: z.strictObject({
        id_token: Jwt, access_token: text, refresh_token: text, account_id: text, login_owner_id: text,
        oauth_provenance: z.strictObject({ issuer: text, client_id: text }).optional(),
    }),
    last_refresh: z.iso.datetime({ offset: true }).optional(),
});

export interface CodexIdentity { loginOwner: string; account: string; user: string; workspace: string }
export type CodexEnvelope = { ok: true; identity: CodexIdentity; generation: string } | { ok: false; reason: string };

/** The generation a stop is keyed to: one completed login for one user in one workspace. Rotation keeps it. */
export const codexGeneration = (identity: CodexIdentity) =>
    createHash('sha256').update('overseer-codex-login\0').update(identity.loginOwner).update('\0').update(identity.user).update('\0').update(identity.account).digest('hex');

type Tokens = z.infer<typeof Envelope>['tokens'];

function hasDuplicateMembers(json: string): boolean {
    // JSON.parse has already verified the grammar. Scan strings as single tokens, decoding keys
    // so escaped spellings of the same key are treated as duplicates.
    const objects: Set<string>[] = [];
    for (const [token] of json.matchAll(/"(?:\\[\s\S]|[^"\\])*"\s*:|"(?:\\[\s\S]|[^"\\])*"|[{}]/g)) {
        if (token === '{') objects.push(new Set());
        else if (token === '}') objects.pop();
        else if (token.endsWith(':')) {
            const key: string = JSON.parse(token.slice(0, -1)), keys = objects.at(-1)!;
            if (keys.has(key)) return true;
            keys.add(key);
        }
    }
    return false;
}

const claimText = (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 1024 ? value : null;

/** Checks the closed envelope and the identity it names, the ID token's user and workspace consistent with its account. */
function parseEnvelope(bytes: Uint8Array): (Extract<CodexEnvelope, { ok: true }> & { tokens: Tokens }) | Extract<CodexEnvelope, { ok: false }> {
    let value: unknown, json: string;
    try { json = new TextDecoder('utf-8', { fatal: true }).decode(bytes); value = JSON.parse(json); }
    catch { return { ok: false, reason: 'The Codex sign-in is not JSON' }; }
    const parsed = Envelope.safeParse(value);
    if (!parsed.success) return { ok: false, reason: `The Codex sign-in is not a managed ChatGPT login (${parsed.error.issues[0].path.join('.') || 'envelope'})` };
    if (hasDuplicateMembers(json)) return { ok: false, reason: 'The Codex sign-in has duplicate fields' };
    const { tokens } = parsed.data;
    let claims: Record<string, unknown>;
    try {
        claims = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString('utf8'));
        if (!claims || typeof claims !== 'object' || Array.isArray(claims)) throw new Error('not an object');
    } catch { return { ok: false, reason: 'The Codex ID token cannot be read' }; }
    const auth = claims['https://api.openai.com/auth'];
    const authClaims = auth && typeof auth === 'object' && !Array.isArray(auth) ? auth as Record<string, unknown> : {};
    const user = claimText(authClaims.chatgpt_user_id) ?? claimText(authClaims.user_id), workspace = claimText(authClaims.chatgpt_account_id);
    if (!user || !workspace) return { ok: false, reason: 'The Codex ID token names no user or workspace' };
    if (workspace !== tokens.account_id) return { ok: false, reason: 'The Codex ID token names another workspace than its account' };
    const identity = { loginOwner: tokens.login_owner_id, account: tokens.account_id, user, workspace };
    return { ok: true, identity, generation: codexGeneration(identity), tokens };
}

export function readCodexEnvelope(bytes: Uint8Array): CodexEnvelope {
    const enrolled = parseEnvelope(bytes);
    if (!enrolled.ok) return enrolled;
    return { ok: true, identity: enrolled.identity, generation: enrolled.generation };
}

const sameIdentity = (a: CodexIdentity, b: CodexIdentity) => a.loginOwner === b.loginOwner && a.account === b.account && a.user === b.user && a.workspace === b.workspace;
export const runAuthPath = (runRoot: string) => resolve(runRoot, 'provider', 'auth.json');

export interface StagedCodex {
    run: string;
    identity: CodexIdentity;
    generation: string;
    sourceDigest: string;
    tokens: Tokens;
    secrets: Set<string>;
}

const tokenValues = (tokens: Tokens) => [tokens.access_token, tokens.refresh_token, tokens.id_token];
export type CodexRefusal = 'handoff-active' | 'handoff-unrecoverable' | 'profile-stopped' | 'sign-in-invalid' | 'ownership-unproven';
export type StageResult = { ok: true; staged: StagedCodex } | { ok: false; refusal: CodexRefusal; reason: string };

function writeExclusive(file: string, bytes: Uint8Array): void {
    const fd = openSync(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    try {
        let written = 0;
        while (written < bytes.length) {
            const count = writeSync(fd, bytes, written, bytes.length - written);
            if (!count) throw new Error('The Codex sign-in copy was cut short');
            written += count;
        }
        fsyncSync(fd);
    } finally { closeSync(fd); }
}

function removeIfPresent(file: string): void {
    try { unlinkSync(file); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
}

/** The canonical sign-in as it is now: its bytes, identity and generation, or why it cannot be used. */
export function readCanonicalCodex(paths: ValidatedRunnerPaths, facts: DirectoryFacts & { files?: ReadFiles } = {}) {
    const read = readSignIn(paths, 'codex', facts);
    if (!read.ok) return { ok: false as const, reason: read.reason };
    const envelope = parseEnvelope(read.bytes);
    if (!envelope.ok) return envelope;
    return { ...envelope, bytes: read.bytes, digest: sha256(read.bytes) };
}

/** Claims the hand-off durably, then copies the canonical sign-in into the run's own `CODEX_HOME`. */
export function stageCodex(paths: ValidatedRunnerPaths, proof: PassProof, run: RunDirectories, facts: DirectoryFacts & { files?: ReadFiles } = {}): StageResult {
    if (!provesOwnership(paths, proof)) return { ok: false, refusal: 'ownership-unproven', reason: 'The caller does not hold the pass lock' };
    const status = readStatus(paths);
    if (!status.ok) return { ok: false, refusal: 'handoff-unrecoverable', reason: status.reason };
    if (status.status.active) return { ok: false, refusal: 'handoff-active', reason: `Run ${status.status.active.run} holds the Codex sign-in` };
    let canonical: ReturnType<typeof readCanonicalCodex>;
    try { canonical = readCanonicalCodex(paths, facts); }
    catch { return { ok: false, refusal: 'sign-in-invalid', reason: 'The canonical Codex sign-in could not be read' }; }
    if (!canonical.ok) return { ok: false, refusal: 'sign-in-invalid', reason: canonical.reason };
    if (isStopped(status.status, 'codex', canonical.generation)) return { ok: false, refusal: 'profile-stopped', reason: 'This Codex sign-in is stopped until Joe enrolls a new one' };
    const digest = canonical.digest;
    const staged: StagedCodex = { run: run.id, identity: canonical.identity, generation: canonical.generation, sourceDigest: digest, tokens: canonical.tokens, secrets: new Set(tokenValues(canonical.tokens)) };
    updateStatus(paths, proof, record => {
        if (record.active) throw new Error(`Run ${record.active.run} claimed the Codex sign-in first`);
        record.active = { provider: 'codex', owner: proof.owner, run: run.id, generation: staged.generation, sourceDigest: digest, copiedDigest: digest, phase: 'staged', group: null };
    });
    try { writeExclusive(runAuthPath(run.root), canonical.bytes); }
    catch {
        retireStaged(paths, proof, run);
        return { ok: false, refusal: 'handoff-unrecoverable', reason: 'The Codex sign-in could not be staged' };
    }
    return { ok: true, staged };
}

/** Records the launch intent, and then the detached group, so a later owner knows what it may have to wait for. */
export function markCodexPhase(paths: ValidatedRunnerPaths, proof: PassProof, run: string, phase: 'launching' | 'launched', group: number | null = null): void {
    updateStatus(paths, proof, record => {
        if (!record.active || record.active.run !== run || !sameOwner(record.active.owner, proof.owner)) throw new Error(`Run ${run} does not hold the Codex sign-in`);
        record.active = { ...record.active, phase, group: phase === 'launched' ? group : record.active.group };
    });
}

const sameOwner = (a: ActiveHandoff['owner'], b: ActiveHandoff['owner']) => a.pid === b.pid && a.pass === b.pass && a.at === b.at;

/** Trusted evidence, from the provider's side, that this run was issued exactly this credential set. */
export interface RotationEvidence { provider: 'codex'; run: string; generation: string; credentialDigest: string }

type FinishStop = Extract<StopReason, 'refresh-rejected' | 'sign-in-unreadable' | 'sign-in-account-changed' | 'rotation-unverified' | 'rotation-uncertain'>;
export type FinishOutcome =
    | { outcome: 'unchanged' | 'published' | 'superseded' }
    | { outcome: 'stopped'; reason: FinishStop }
    | { outcome: 'ownership-lost' | 'cleanup-pending' };

type HandoffFacts = DirectoryFacts & { files?: ReadFiles };
const stopped = (reason: FinishStop): FinishOutcome => ({ outcome: 'stopped', reason });
const matches = (seen: ActiveHandoff | null, expected: ActiveHandoff) =>
    !!seen && seen.run === expected.run && seen.generation === expected.generation && seen.sourceDigest === expected.sourceDigest
    && seen.copiedDigest === expected.copiedDigest && seen.phase === expected.phase && seen.group === expected.group && sameOwner(seen.owner, expected.owner);

export function codexCanDispatch(paths: ValidatedRunnerPaths, proof: PassProof, staged: StagedCodex): boolean {
    const read = readStatus(paths);
    if (!read.ok || isStopped(read.status, 'codex', staged.generation)) return false;
    const active = read.status.active;
    if (!active || active.run !== staged.run || active.phase !== 'staged' || active.group !== null || !sameOwner(active.owner, proof.owner)
        || active.generation !== staged.generation || active.sourceDigest !== staged.sourceDigest || active.copiedDigest !== staged.sourceDigest) return false;
    const canonical = readCanonicalCodex(paths);
    return canonical.ok && canonical.generation === staged.generation && canonical.digest === staged.sourceDigest;
}

/** After confirmed group exit, resolve refresh or rejection before durably retiring the copy. */
export function finishCodex(paths: ValidatedRunnerPaths, proof: PassProof, run: RunDirectories, staged: StagedCodex, evidence: RotationEvidence | null,
    facts: HandoffFacts & { authenticationRejected?: boolean; directoriesValid?: boolean } = {}): FinishOutcome {
    const read = readStatus(paths);
    const active = read.ok ? read.status.active : null;
    if (!provesOwnership(paths, proof) || !active || active.run !== run.id || active.run !== staged.run || !sameOwner(active.owner, proof.owner)
        || active.generation !== staged.generation || active.sourceDigest !== staged.sourceDigest || active.copiedDigest !== staged.sourceDigest)
        return { outcome: 'ownership-lost' };
    try {
        const result = facts.authenticationRejected ? stopped('refresh-rejected')
            : facts.directoriesValid === false ? stopped('rotation-uncertain')
            : finishRotation(paths, proof, run, staged, active, evidence, facts);
        if (result.outcome === 'ownership-lost') return result;
        if (result.outcome === 'stopped') stopGeneration(paths, proof, 'codex', staged.generation, result.reason);
        retire(paths, proof, active, facts);
        return result;
    } catch {
        return { outcome: 'cleanup-pending' };
    }
}

function finishRotation(paths: ValidatedRunnerPaths, proof: PassProof, run: RunDirectories, staged: StagedCodex, active: ActiveHandoff,
    evidence: RotationEvidence | null, facts: HandoffFacts): FinishOutcome {
    const left = readRunFile(runAuthPath(run.root), run.root, AUTH_MAX_BYTES, facts);
    if (!left.ok) return stopped('sign-in-unreadable');
    const digest = sha256(left.bytes);
    if (digest === staged.sourceDigest) return { outcome: 'unchanged' };

    const envelope = parseEnvelope(left.bytes);
    if (!envelope.ok) return stopped('sign-in-unreadable');
    const newTokens = tokenValues(envelope.tokens);
    for (const token of newTokens) staged.secrets.add(token);
    if (!sameIdentity(envelope.identity, staged.identity)) return stopped('sign-in-account-changed');
    const { oauth_provenance: before } = staged.tokens, { oauth_provenance: after } = envelope.tokens;
    if (before?.issuer !== after?.issuer || before?.client_id !== after?.client_id) return stopped('rotation-unverified');
    if (tokenValues(staged.tokens).every((token, index) => token === newTokens[index])) return { outcome: 'unchanged' };
    if (!evidence || evidence.provider !== 'codex' || evidence.run !== run.id || evidence.generation !== staged.generation || evidence.credentialDigest !== digest)
        return stopped('rotation-unverified');
    return publish(paths, proof, staged, active, left.bytes, facts);
}

function publish(paths: ValidatedRunnerPaths, proof: PassProof, staged: StagedCodex, active: ActiveHandoff, bytes: Uint8Array, facts: HandoffFacts): FinishOutcome {
    try {
        const status = readStatus(paths);
        if (!provesOwnership(paths, proof) || !status.ok || !matches(status.status.active, active)) return { outcome: 'ownership-lost' };
        const canonical = readCanonicalCodex(paths, facts);
        if (!canonical.ok) return stopped('sign-in-unreadable');
        if (canonical.generation !== staged.generation) return { outcome: 'superseded' };
        if (canonical.digest !== staged.sourceDigest) return stopped('rotation-uncertain');
        const target = signInPaths(paths).codexAuth;
        writeDurable(target, bytes, 0o600);
        const back = readOwnedFile(target, AUTH_MAX_BYTES, { uid: runnerUid(facts), mode: 0o600, files: facts.files });
        if (!back.ok || !back.bytes.equals(Buffer.from(bytes))) return stopped('rotation-uncertain');
        return { outcome: 'published' };
    } catch { return stopped('rotation-uncertain'); }
}

/** Keep the claim until removal has been synced in the credential's own parent directory. */
function retire(paths: ValidatedRunnerPaths, proof: PassProof, active: ActiveHandoff, facts: DirectoryFacts = {}): void {
    const uid = runnerUid(facts), root = resolve(paths.runs, active.run), file = runAuthPath(root), parent = dirname(file);
    preflightRoot(paths);
    for (const folder of [paths.runs, root, parent]) assertOwnedDirectory(folder, uid, 'not-writable');

    const retiring = { ...active, phase: 'retiring' as const };
    updateStatus(paths, proof, record => {
        if (!matches(record.active, active)) throw new Error('The Codex hand-off changed before retirement');
        record.active = retiring;
    });
    const directory = openSync(parent, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    try {
        removeIfPresent(file);
        fsyncSync(directory);
    } finally { closeSync(directory); }
    updateStatus(paths, proof, record => {
        if (!matches(record.active, retiring)) throw new Error('The Codex hand-off changed during retirement');
        record.active = null;
    });
}

/** Used only when dispatch was ruled out. An interrupted removal stays fenced by the claim. */
export function retireStaged(paths: ValidatedRunnerPaths, proof: PassProof, run: RunDirectories): void {
    try {
        const read = readStatus(paths);
        const active = read.ok ? read.status.active : null;
        if (active?.run === run.id && sameOwner(active.owner, proof.owner) && active.group === null
            && (active.phase === 'staged' || active.phase === 'launching'))
            retire(paths, proof, active);
    } catch { /* the next lock holder can recover the unfinished retirement */ }
}

export type GroupState = 'absent' | 'alive' | 'uncertain';
/** Whether a detached process group still exists: no member answers a signal 0. */
export function groupState(group: number): GroupState {
    try { process.kill(-group, 0); return 'alive'; }
    catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        return code === 'ESRCH' ? 'absent' : code === 'EPERM' ? 'alive' : 'uncertain';
    }
}

export type Recovery = { ok: true; recovered: boolean } | { ok: false; refusal: 'handoff-active' | 'handoff-unrecoverable' | 'ownership-unproven'; reason: string };

/**
 * A hand-off left by an earlier pass, inspected by the current lock holder. One that never launched is
 * retired. One whose group is confirmed gone is retired too, and its generation stopped if its copy
 * changed, since an unpublished rotation may have spent the canonical refresh token. A live or
 * uncertain group, or a launch with no recorded group, waits for an operator.
 */
export function recoverCodexHandoff(paths: ValidatedRunnerPaths, proof: PassProof, state: (group: number) => GroupState = groupState, facts: DirectoryFacts & { files?: ReadFiles } = {}): Recovery {
    if (!provesOwnership(paths, proof)) return { ok: false, refusal: 'ownership-unproven', reason: 'The caller does not hold the pass lock' };
    const read = readStatus(paths);
    if (!read.ok) return { ok: false, refusal: 'handoff-unrecoverable', reason: read.reason };
    const active = read.status.active;
    if (!active) return { ok: true, recovered: false };
    if (sameOwner(active.owner, proof.owner)) return { ok: false, refusal: 'handoff-active', reason: `Run ${active.run} of this pass still holds the Codex sign-in` };
    if ((active.phase === 'launching' || active.phase === 'launched') && active.group === null)
        return { ok: false, refusal: 'handoff-unrecoverable', reason: 'The previous hand-off may have launched without a recorded group' };
    if (active.group !== null && state(active.group) !== 'absent')
        return { ok: false, refusal: 'handoff-unrecoverable', reason: 'The previous hand-off group has not been confirmed absent' };
    try {
        if (active.phase === 'launching' || active.phase === 'launched' || active.group !== null && active.phase === 'staged') {
            const runRoot = resolve(paths.runs, active.run), left = readRunFile(runAuthPath(runRoot), runRoot, AUTH_MAX_BYTES, facts);
            if (!left.ok || sha256(left.bytes) !== active.copiedDigest)
                stopGeneration(paths, proof, 'codex', active.generation, 'rotation-uncertain');
        }
        retire(paths, proof, active, facts);
        return { ok: true, recovered: true };
    } catch {
        return { ok: false, refusal: 'handoff-unrecoverable', reason: 'The previous hand-off could not be retired' };
    }
}
