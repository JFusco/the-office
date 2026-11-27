import { createHash } from 'node:crypto';
import { closeSync, constants, fsyncSync, openSync, unlinkSync, writeSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { writeDurable } from '../../release/durable-file';
import { runnerUid, type DirectoryFacts, type RunDirectories } from '../run-directories';
import type { ValidatedRunnerPaths } from '../runner-root';
import { isStopped, provesOwnership, readStatus, stopGeneration, updateStatus, type ActiveHandoff, type PassProof } from './profile-status';
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

const claimText = (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 1024 ? value : null;

/** Checks the closed envelope and the identity it names, the ID token's user and workspace consistent with its account. */
export function readCodexEnvelope(bytes: Uint8Array): CodexEnvelope {
    let value: unknown;
    try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { return { ok: false, reason: 'The Codex sign-in is not JSON' }; }
    const parsed = Envelope.safeParse(value);
    if (!parsed.success) return { ok: false, reason: `The Codex sign-in is not a managed ChatGPT login (${parsed.error.issues[0].path.join('.') || 'envelope'})` };
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
    return { ok: true, identity, generation: codexGeneration(identity) };
}

const sameIdentity = (a: CodexIdentity, b: CodexIdentity) => a.loginOwner === b.loginOwner && a.account === b.account && a.user === b.user && a.workspace === b.workspace;
export const runAuthPath = (runRoot: string) => resolve(runRoot, 'provider', 'auth.json');

export interface StagedCodex { run: string; identity: CodexIdentity; generation: string; sourceDigest: string; copiedDigest: string }
export type CodexRefusal = 'handoff-active' | 'handoff-unrecoverable' | 'profile-stopped' | 'sign-in-invalid' | 'ownership-unproven';
export type StageResult = { ok: true; staged: StagedCodex } | { ok: false; refusal: CodexRefusal; reason: string };

function writeExclusive(file: string, bytes: Uint8Array): void {
    const fd = openSync(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    try {
        let written = 0;
        while (written < bytes.length) written += writeSync(fd, bytes, written, bytes.length - written);
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
    const envelope = readCodexEnvelope(read.bytes);
    if (!envelope.ok) return envelope;
    return { ok: true as const, bytes: read.bytes, identity: envelope.identity, generation: envelope.generation };
}

/** Claims the hand-off durably, then copies the canonical sign-in into the run's own `CODEX_HOME`. */
export function stageCodex(paths: ValidatedRunnerPaths, proof: PassProof, run: RunDirectories, facts: DirectoryFacts & { files?: ReadFiles } = {}): StageResult {
    if (!provesOwnership(paths, proof)) return { ok: false, refusal: 'ownership-unproven', reason: 'The caller does not hold the pass lock' };
    const status = readStatus(paths);
    if (!status.ok) return { ok: false, refusal: 'handoff-unrecoverable', reason: status.reason };
    if (status.status.active) return { ok: false, refusal: 'handoff-active', reason: `Run ${status.status.active.run} holds the Codex sign-in` };
    const canonical = readCanonicalCodex(paths, facts);
    if (!canonical.ok) return { ok: false, refusal: 'sign-in-invalid', reason: canonical.reason };
    if (isStopped(status.status, 'codex', canonical.generation)) return { ok: false, refusal: 'profile-stopped', reason: 'This Codex sign-in is stopped until Joe enrolls a new one' };
    const digest = sha256(canonical.bytes);
    const staged: StagedCodex = { run: run.id, identity: canonical.identity, generation: canonical.generation, sourceDigest: digest, copiedDigest: digest };
    updateStatus(paths, proof, record => {
        if (record.active) throw new Error(`Run ${record.active.run} claimed the Codex sign-in first`);
        record.active = { provider: 'codex', owner: proof.owner, run: run.id, generation: staged.generation, sourceDigest: digest, copiedDigest: digest, phase: 'staged', group: null };
    });
    writeExclusive(runAuthPath(run.root), canonical.bytes);
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

export type FinishOutcome =
    | { outcome: 'unchanged' | 'published' | 'superseded' }
    | { outcome: 'stopped'; reason: 'sign-in-unreadable' | 'sign-in-account-changed' | 'rotation-unverified' }
    | { outcome: 'ownership-lost' };

/**
 * After the run's process group has exited: takes back a verified refresh, or stops the generation,
 * then retires the run's copy and only then clears the hand-off. A caller that lost the pass lock
 * changes nothing and leaves the hand-off to the next owner.
 */
export function finishCodex(paths: ValidatedRunnerPaths, proof: PassProof, run: RunDirectories, staged: StagedCodex, evidence: RotationEvidence | null, facts: DirectoryFacts & { files?: ReadFiles } = {}): FinishOutcome {
    const active = readStatus(paths);
    if (!provesOwnership(paths, proof) || !active.ok || !active.status.active || active.status.active.run !== run.id || !sameOwner(active.status.active.owner, proof.owner))
        return { outcome: 'ownership-lost' };
    const file = runAuthPath(run.root);
    const left = readRunFile(file, run.root, AUTH_MAX_BYTES, facts);
    let result: FinishOutcome;
    if (!left.ok) result = { outcome: 'stopped', reason: 'sign-in-unreadable' };
    else if (sha256(left.bytes) === staged.copiedDigest) result = { outcome: 'unchanged' };
    else {
        const envelope = readCodexEnvelope(left.bytes);
        if (!envelope.ok) result = { outcome: 'stopped', reason: 'sign-in-unreadable' };
        else if (!sameIdentity(envelope.identity, staged.identity)) result = { outcome: 'stopped', reason: 'sign-in-account-changed' };
        else if (!evidence || evidence.provider !== 'codex' || evidence.run !== run.id || evidence.generation !== staged.generation || evidence.credentialDigest !== sha256(left.bytes))
            result = { outcome: 'stopped', reason: 'rotation-unverified' };
        else result = publish(paths, proof, staged, left.bytes, facts);
    }
    if (result.outcome === 'stopped') stopGeneration(paths, proof, 'codex', staged.generation, result.reason);
    if (result.outcome === 'ownership-lost') return result;
    retire(paths, proof, run.root, run.id);
    return result;
}

function publish(paths: ValidatedRunnerPaths, proof: PassProof, staged: StagedCodex, bytes: Uint8Array, facts: DirectoryFacts & { files?: ReadFiles }): FinishOutcome {
    if (!provesOwnership(paths, proof)) return { outcome: 'ownership-lost' };
    const canonical = readSignIn(paths, 'codex', facts);
    // Joe enrolled again during the run: his newer sign-in stands, and this run's copy is discarded.
    if (!canonical.ok || sha256(canonical.bytes) !== staged.sourceDigest) return { outcome: 'superseded' };
    const target = signInPaths(paths).codexAuth;
    writeDurable(target, bytes, 0o600);
    const back = readOwnedFile(target, AUTH_MAX_BYTES, { uid: runnerUid(facts), mode: 0o600, files: facts.files });
    if (!back.ok || !Buffer.from(back.bytes).equals(Buffer.from(bytes))) throw new Error('The published Codex sign-in did not read back as written');
    return { outcome: 'published' };
}

/** Removes the run's copy, then clears the matching hand-off. */
function retire(paths: ValidatedRunnerPaths, proof: PassProof, runRoot: string, run: string): void {
    removeIfPresent(runAuthPath(runRoot));
    updateStatus(paths, proof, record => {
        if (record.active?.run === run) record.active = null;
    });
}

/** For a call refused or failed before launch: the copy is retired and the hand-off cleared. */
export function retireStaged(paths: ValidatedRunnerPaths, proof: PassProof, run: RunDirectories): void {
    if (!provesOwnership(paths, proof)) return;
    retire(paths, proof, run.root, run.id);
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
    if (active.phase === 'launching' && active.group === null)
        return { ok: false, refusal: 'handoff-unrecoverable', reason: `Run ${active.run} may have launched with no recorded group; confirm it has exited before the Codex sign-in is used again` };
    if (active.phase === 'launched') {
        const seen = active.group === null ? 'uncertain' : state(active.group);
        if (seen !== 'absent') return { ok: false, refusal: 'handoff-unrecoverable', reason: `Run ${active.run}'s process group ${active.group} is ${seen}; the Codex sign-in waits for it` };
    }
    const runRoot = resolve(paths.runs, active.run), left = readRunFile(runAuthPath(runRoot), runRoot, AUTH_MAX_BYTES, facts);
    if (active.phase !== 'staged' && (!left.ok ? left.fault !== 'missing' : sha256(left.bytes) !== active.copiedDigest))
        stopGeneration(paths, proof, 'codex', active.generation, 'rotation-uncertain');
    retire(paths, proof, runRoot, active.run);
    return { ok: true, recovered: true };
}
