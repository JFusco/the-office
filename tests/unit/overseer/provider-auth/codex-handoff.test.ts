import { createHash } from 'node:crypto';
import { closeSync, existsSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import {
    codexGeneration, finishCodex, markCodexPhase, readCodexEnvelope, recoverCodexHandoff, retireStaged, runAuthPath, stageCodex,
    type RotationEvidence, type StagedCodex,
} from '../../../../server/overseer/provider-auth/codex-handoff';
import { readStatus, stopGeneration, type PassProof } from '../../../../server/overseer/provider-auth/profile-status';
import type { ReadFiles } from '../../../../server/overseer/provider-auth/sign-in-paths';
import { acquirePassLock, readPassOwner } from '../../../../server/overseer/single-flight';
import { codexAuth, enrolledRunner } from './provider-world';

const sha = (text: string | Uint8Array) => createHash('sha256').update(text).digest('hex');
const identity = { loginOwner: 'login-synthetic-1', account: 'ws-synthetic-1', user: 'user-synthetic-1', workspace: 'ws-synthetic-1' };
const staged = (world: ReturnType<typeof enrolledRunner>, run = world.allocate()) => {
    const result = stageCodex(world.paths, world.proof, run);
    if (!result.ok) throw new Error(result.reason);
    return { run, staged: result.staged };
};
const evidenceFor = (staging: StagedCodex, bytes: string): RotationEvidence => ({ provider: 'codex', run: staging.run, generation: staging.generation, credentialDigest: sha(bytes) });

test('the managed ChatGPT envelope is read with its login, user and workspace, and the user_id claim is a fallback', () => {
    expect(readCodexEnvelope(Buffer.from(codexAuth()))).toEqual({ ok: true, identity, generation: codexGeneration(identity) });
    const fallback = codexAuth({ claims: { 'https://api.openai.com/auth': { user_id: 'user-synthetic-1', chatgpt_account_id: 'ws-synthetic-1' } } });
    expect(readCodexEnvelope(Buffer.from(fallback))).toMatchObject({ ok: true, identity });
    const rotated = codexAuth({ refresh: 'refresh-synthetic-2', access: 'access-synthetic-2' });
    expect(readCodexEnvelope(Buffer.from(rotated))).toMatchObject({ ok: true, generation: codexGeneration(identity) });
});

test('every other credential kind or inconsistent identity is refused', () => {
    const refusals: [string, string][] = [
        ['api key mode', codexAuth({ extra: { auth_mode: 'apikey' } })],
        ['an API key', codexAuth({ extra: { OPENAI_API_KEY: 'sk-synthetic' } })],
        ['an agent identity', codexAuth({ extra: { agent_identity: 'jwt' } })],
        ['a personal access token', codexAuth({ extra: { personal_access_token: 'pat' } })],
        ['a Bedrock key', codexAuth({ extra: { bedrock_api_key: { key: 'x' } } })],
        ['an unknown token field', codexAuth({ tokensExtra: { extra: 'x' } })],
        ['no login owner', codexAuth({ tokensExtra: { login_owner_id: undefined } })],
        ['a null account', codexAuth({ tokensExtra: { account_id: null } })],
        ['extra provenance', codexAuth({ tokensExtra: { oauth_provenance: { issuer: 'i', client_id: 'c', more: 1 } } })],
        ['a malformed ID token', codexAuth({ tokensExtra: { id_token: 'not-a-jwt' } })],
        ['no user claim', codexAuth({ claims: { 'https://api.openai.com/auth': { chatgpt_account_id: 'ws-synthetic-1' } } })],
        ['another workspace in the claims', codexAuth({ workspace: 'ws-synthetic-2' })],
        ['not JSON', '{'],
    ];
    for (const [name, text] of refusals) expect(readCodexEnvelope(Buffer.from(text)).ok, name).toBe(false);
    expect(readCodexEnvelope(Buffer.from(codexAuth({ tokensExtra: { oauth_provenance: { issuer: 'https://auth.example.invalid', client_id: 'client' } } }))).ok).toBe(true);
});

test('the hand-off is claimed before the copy, excludes a second copy, and refuses without the lock or for a stopped generation', () => {
    const world = enrolledRunner();
    try {
        const { run, staged: first } = staged(world);
        expect(readFileSync(runAuthPath(run.root), 'utf8')).toBe(readFileSync(world.where.codexAuth, 'utf8'));
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: { run: run.id, phase: 'staged', generation: first.generation, group: null } } });
        const second = world.allocate();
        expect(stageCodex(world.paths, world.proof, second)).toMatchObject({ ok: false, refusal: 'handoff-active' });
        expect(existsSync(runAuthPath(second.root))).toBe(false);
        retireStaged(world.paths, world.proof, run);
        expect(existsSync(runAuthPath(run.root))).toBe(false);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: null } });
        const foreign: PassProof = { ...world.proof, owner: { ...world.proof.owner, pass: 'another-pass' } };
        const third = world.allocate();
        expect(stageCodex(world.paths, foreign, third)).toMatchObject({ ok: false, refusal: 'ownership-unproven' });
        stopGeneration(world.paths, world.proof, 'codex', first.generation, 'refresh-rejected');
        expect(stageCodex(world.paths, world.proof, third)).toMatchObject({ ok: false, refusal: 'profile-stopped' });
        expect(existsSync(runAuthPath(third.root))).toBe(false);
    } finally { world.lock.release(); }
});

test('an unchanged copy publishes nothing; a verified same-login rotation is published; the copy is always retired', () => {
    const world = enrolledRunner();
    try {
        const canonical = readFileSync(world.where.codexAuth, 'utf8');
        const a = staged(world);
        expect(finishCodex(world.paths, world.proof, a.run, a.staged, null)).toEqual({ outcome: 'unchanged' });
        expect(readFileSync(world.where.codexAuth, 'utf8')).toBe(canonical);
        expect(existsSync(runAuthPath(a.run.root))).toBe(false);
        const b = staged(world), rotated = codexAuth({ refresh: 'refresh-synthetic-2', access: 'access-synthetic-2' });
        writeFileSync(runAuthPath(b.run.root), rotated);
        expect(finishCodex(world.paths, world.proof, b.run, b.staged, evidenceFor(b.staged, rotated))).toEqual({ outcome: 'published' });
        expect(readFileSync(world.where.codexAuth, 'utf8')).toBe(rotated);
        expect(existsSync(runAuthPath(b.run.root))).toBe(false);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: null, stops: { codex: [] } } });
    } finally { world.lock.release(); }
});

test('a change without trusted evidence, another user or workspace, or an unreadable copy stops the generation and publishes nothing', () => {
    const cases: [string, (run: string) => string | null, (s: StagedCodex, bytes: string) => RotationEvidence | null, string][] = [
        ['substituted refresh material, claims unchanged', () => codexAuth({ refresh: 'refresh-attacker' }), () => null, 'rotation-unverified'],
        ['evidence for other bytes', () => codexAuth({ refresh: 'refresh-synthetic-2' }), s => evidenceFor(s, codexAuth({ refresh: 'refresh-synthetic-3' })), 'rotation-unverified'],
        ['evidence for another run', () => codexAuth({ refresh: 'refresh-synthetic-2' }), (s, bytes) => ({ ...evidenceFor(s, bytes), run: 'other' }), 'rotation-unverified'],
        ['another user in the same workspace', () => codexAuth({ user: 'user-synthetic-2' }), (s, bytes) => evidenceFor(s, bytes), 'sign-in-account-changed'],
        ['another workspace and account', () => codexAuth({ account: 'ws-synthetic-2' }), (s, bytes) => evidenceFor(s, bytes), 'sign-in-account-changed'],
        ['another login', () => codexAuth({ loginOwner: 'login-synthetic-2' }), (s, bytes) => evidenceFor(s, bytes), 'sign-in-account-changed'],
        ['malformed', () => '{"auth_mode":"chatgpt"}', () => null, 'sign-in-unreadable'],
        ['removed', () => null, () => null, 'sign-in-unreadable'],
    ];
    for (const [name, leave, evidence, reason] of cases) {
        const world = enrolledRunner();
        try {
            const canonical = readFileSync(world.where.codexAuth, 'utf8'), { run, staged: staging } = staged(world), left = leave(run.id);
            if (left === null) unlinkSync(runAuthPath(run.root));
            else writeFileSync(runAuthPath(run.root), left);
            expect(finishCodex(world.paths, world.proof, run, staging, evidence(staging, left ?? '')), name).toEqual({ outcome: 'stopped', reason });
            expect(readFileSync(world.where.codexAuth, 'utf8'), name).toBe(canonical);
            expect(existsSync(runAuthPath(run.root)), name).toBe(false);
            expect(readStatus(world.paths), name).toMatchObject({ ok: true, status: { active: null, stops: { codex: [{ generation: staging.generation, reason }] } } });
        } finally { world.lock.release(); }
    }
});

test('a sign-in Joe replaced during the run stands, and a finisher that lost the lock changes nothing', () => {
    const world = enrolledRunner();
    try {
        const { run, staged: staging } = staged(world), rotated = codexAuth({ refresh: 'refresh-synthetic-2' }), joes = codexAuth({ loginOwner: 'login-synthetic-9' });
        writeFileSync(runAuthPath(run.root), rotated);
        writeFileSync(world.where.codexAuth, joes);
        expect(finishCodex(world.paths, world.proof, run, staging, evidenceFor(staging, rotated))).toEqual({ outcome: 'superseded' });
        expect(readFileSync(world.where.codexAuth, 'utf8')).toBe(joes);
        expect(existsSync(runAuthPath(run.root))).toBe(false);
        const next = staged(world);
        writeFileSync(runAuthPath(next.run.root), codexAuth({ loginOwner: 'login-synthetic-9', refresh: 'r2' }));
        const lost: PassProof = { ...world.proof, owner: { ...world.proof.owner, at: '2026-01-01T00:00:00.000Z' } };
        expect(finishCodex(world.paths, lost, next.run, next.staged, null)).toEqual({ outcome: 'ownership-lost' });
        expect(existsSync(runAuthPath(next.run.root))).toBe(true);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: { run: next.run.id } } });
    } finally { world.lock.release(); }
});

test('a hand-off left by a dead pass is retired only once its group is gone, and an unpublished rotation stops its generation', () => {
    const before = enrolledRunner({ pass: 'pass-old' });
    const { run, staged: staging } = staged(before);
    markCodexPhase(before.paths, before.proof, run.id, 'launching');
    markCodexPhase(before.paths, before.proof, run.id, 'launched', 4242);
    writeFileSync(runAuthPath(run.root), codexAuth({ refresh: 'refresh-synthetic-2' }));
    before.lock.release();
    // The next pass on the same root holds the lock now.
    const lock = acquirePassLock(before.paths, 'pass-new');
    try {
        const seen = readPassOwner(before.paths) as { owner: PassProof['owner'] }, proof: PassProof = { owner: seen.owner, root: before.paths.root };
        expect(recoverCodexHandoff(before.paths, proof, () => 'alive')).toMatchObject({ ok: false, refusal: 'handoff-unrecoverable' });
        expect(recoverCodexHandoff(before.paths, proof, () => 'uncertain')).toMatchObject({ ok: false, refusal: 'handoff-unrecoverable' });
        expect(existsSync(runAuthPath(run.root))).toBe(true);
        expect(recoverCodexHandoff(before.paths, proof, () => 'absent')).toEqual({ ok: true, recovered: true });
        expect(existsSync(runAuthPath(run.root))).toBe(false);
        expect(readStatus(before.paths)).toMatchObject({ ok: true, status: { active: null, stops: { codex: [{ generation: staging.generation, reason: 'rotation-uncertain' }] } } });
        expect(recoverCodexHandoff(before.paths, proof, () => 'absent')).toEqual({ ok: true, recovered: false });
    } finally { lock.release(); }
});

test('a launch with no recorded group waits for an operator, and a staged copy that never launched is retired', () => {
    const world = enrolledRunner({ pass: 'pass-old' });
    const { run } = staged(world);
    markCodexPhase(world.paths, world.proof, run.id, 'launching');
    expect(recoverCodexHandoff(world.paths, world.proof, () => 'absent')).toMatchObject({ ok: false, refusal: 'handoff-active' });
    world.lock.release();
    const lock = acquirePassLock(world.paths, 'pass-new');
    try {
        const seen = readPassOwner(world.paths) as { owner: PassProof['owner'] }, proof: PassProof = { owner: seen.owner, root: world.paths.root };
        expect(recoverCodexHandoff(world.paths, proof, () => 'absent')).toMatchObject({ ok: false, refusal: 'handoff-unrecoverable' });
    } finally { lock.release(); }
    const fresh = enrolledRunner({ pass: 'pass-a' });
    const left = staged(fresh);
    fresh.lock.release();
    const again = acquirePassLock(fresh.paths, 'pass-b');
    try {
        const seen = readPassOwner(fresh.paths) as { owner: PassProof['owner'] }, proof: PassProof = { owner: seen.owner, root: fresh.paths.root };
        expect(recoverCodexHandoff(fresh.paths, proof, () => 'alive')).toEqual({ ok: true, recovered: true });
        expect(existsSync(runAuthPath(left.run.root))).toBe(false);
        expect(readStatus(fresh.paths)).toMatchObject({ ok: true, status: { active: null, stops: { codex: [] } } });
    } finally { again.release(); }
});

test('an ID token whose payload is not an object is refused', () => {
    for (const payload of ['null', '[1]', '"text"']) {
        const text = codexAuth({ tokensExtra: { id_token: `eyJhbGciOiJub25lIn0.${Buffer.from(payload).toString('base64url')}.c2ln` } });
        expect(readCodexEnvelope(Buffer.from(text)), payload).toMatchObject({ ok: false, reason: 'The Codex ID token cannot be read' });
    }
});

test('staging refuses a missing, malformed or unreadable source and claims nothing for it', () => {
    const cases: [string, (world: ReturnType<typeof enrolledRunner>) => void, string, RegExp][] = [
        ['missing login', world => unlinkSync(world.where.codexAuth), 'sign-in-invalid', /does not exist/],
        ['another credential kind', world => writeFileSync(world.where.codexAuth, codexAuth({ extra: { auth_mode: 'apikey' } })), 'sign-in-invalid', /not a managed ChatGPT login/],
        ['unreadable status', world => writeFileSync(join(world.paths.state, 'providers.json'), '{'), 'handoff-unrecoverable', /not a provider status record/],
    ];
    for (const [name, damage, refusal, reason] of cases) {
        const world = enrolledRunner();
        try {
            damage(world);
            const run = world.allocate();
            expect(stageCodex(world.paths, world.proof, run), name).toMatchObject({ ok: false, refusal, reason: expect.stringMatching(reason) });
            expect(existsSync(runAuthPath(run.root)), name).toBe(false);
        } finally { world.lock.release(); }
    }
});

test('only the run holding the hand-off records its phase, only the lock holder retires or recovers, and a failed removal surfaces', () => {
    const world = enrolledRunner();
    try {
        const { run } = staged(world), other = world.allocate();
        expect(() => markCodexPhase(world.paths, world.proof, other.id, 'launching')).toThrow('does not hold the Codex sign-in');
        const forged: PassProof = { ...world.proof, owner: { ...world.proof.owner, pass: 'forged' } };
        expect(() => markCodexPhase(world.paths, forged, run.id, 'launching')).toThrow();
        retireStaged(world.paths, forged, run);
        expect(existsSync(runAuthPath(run.root))).toBe(true);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: { run: run.id } } });
        expect(recoverCodexHandoff(world.paths, forged, () => 'absent')).toMatchObject({ ok: false, refusal: 'ownership-unproven' });
        writeFileSync(join(world.paths.state, 'providers.json'), '{');
        expect(recoverCodexHandoff(world.paths, world.proof, () => 'absent')).toMatchObject({ ok: false, refusal: 'handoff-unrecoverable' });
    } finally { world.lock.release(); }
    const blocked = enrolledRunner();
    try {
        const { run } = staged(blocked);
        unlinkSync(runAuthPath(run.root));
        mkdirSync(runAuthPath(run.root));
        expect(() => retireStaged(blocked.paths, blocked.proof, run)).toThrow();
        expect(readStatus(blocked.paths)).toMatchObject({ ok: true, status: { active: { run: run.id } } });
    } finally { blocked.lock.release(); }
});

test('a published refresh that does not read back as written is reported, never taken as published', () => {
    const world = enrolledRunner();
    try {
        const { run, staged: staging } = staged(world), rotated = codexAuth({ refresh: 'refresh-synthetic-2' });
        writeFileSync(runAuthPath(run.root), rotated);
        const paths = new Map<number, string>();
        let canonicalReads = 0;
        const files: ReadFiles = {
            open: ((path: string, flags: number) => { const fd = openSync(path, flags); paths.set(fd, path); return fd; }) as typeof openSync,
            fstat: fstatSync, close: closeSync,
            read: ((fd: number, buffer: Buffer, offset: number, length: number, position: null) => {
                const count = readSync(fd, buffer, offset, length, position);
                if (paths.get(fd) === world.where.codexAuth && count > 0 && ++canonicalReads > 1) buffer[offset] ^= 0x20;
                return count;
            }) as typeof readSync,
        };
        expect(() => finishCodex(world.paths, world.proof, run, staging, evidenceFor(staging, rotated), { files })).toThrow('did not read back as written');
    } finally { world.lock.release(); }
});
