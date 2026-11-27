import { randomUUID } from 'node:crypto';
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PassProof } from '../../../../server/overseer/provider-auth/profile-status';
import { signInPaths } from '../../../../server/overseer/provider-auth/sign-in-paths';
import { createRunDirectories } from '../../../../server/overseer/run-directories';
import { validateRunnerRoot, type ValidatedRunnerPaths } from '../../../../server/overseer/runner-root';
import { acquirePassLock, readPassOwner } from '../../../../server/overseer/single-flight';
import { tempDir } from '../runner-world';

/** Test support for runner-owned sign-ins: synthetic material only, never a real token, login or endpoint. */

export const CLAUDE_TOKEN = 'sk-ant-oat01-synthetic-fixture-token';

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
export interface CodexFixture { loginOwner?: string; account?: string; user?: string; workspace?: string; refresh?: string; access?: string; extra?: Record<string, unknown>; tokensExtra?: Record<string, unknown>; claims?: Record<string, unknown> }
/** A synthetic managed-ChatGPT `auth.json` in Codex 0.167.0-alpha.4.1's shape. */
export function codexAuth(fixture: CodexFixture = {}): string {
    const account = fixture.account ?? 'ws-synthetic-1';
    const claims = fixture.claims ?? { email: 'synthetic@example.invalid', 'https://api.openai.com/auth': { chatgpt_user_id: fixture.user ?? 'user-synthetic-1', chatgpt_account_id: fixture.workspace ?? account } };
    return JSON.stringify({
        auth_mode: 'chatgpt', OPENAI_API_KEY: null,
        tokens: {
            id_token: `${b64({ alg: 'none' })}.${b64(claims)}.c2ln`, access_token: fixture.access ?? 'access-synthetic-1', refresh_token: fixture.refresh ?? 'refresh-synthetic-1',
            account_id: account, login_owner_id: fixture.loginOwner ?? 'login-synthetic-1', ...fixture.tokensExtra,
        },
        last_refresh: '2026-11-27T00:00:00Z', ...fixture.extra,
    }, null, 2);
}

/** A runner root with both sign-ins enrolled as the runner requires them, and the caller's pass lock. */
export function enrolledRunner(options: { token?: string; auth?: string; pass?: string } = {}) {
    const paths: ValidatedRunnerPaths = validateRunnerRoot(join(tempDir(), 'runner'), {}), where = signInPaths(paths);
    mkdirSync(paths.root, { mode: 0o700, recursive: true });
    mkdirSync(paths.state, { mode: 0o700 });
    for (const folder of [where.providers, where.claude, where.codex]) { mkdirSync(folder, { mode: 0o700 }); chmodSync(folder, 0o700); }
    writeFileSync(where.claudeToken, options.token ?? `${CLAUDE_TOKEN}\n`, { mode: 0o600 });
    writeFileSync(where.codexAuth, options.auth ?? codexAuth(), { mode: 0o600 });
    chmodSync(where.claudeToken, 0o600);
    chmodSync(where.codexAuth, 0o600);
    const lock = acquirePassLock(paths, options.pass ?? 'pass-1');
    const seen = readPassOwner(paths);
    if (!('owner' in seen)) throw new Error('the fixture pass lock was not recorded');
    const proof: PassProof = { owner: seen.owner, root: paths.root };
    return { paths, where, lock, proof, allocate: () => createRunDirectories(paths, randomUUID()) };
}
