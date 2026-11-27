import { createHash } from 'node:crypto';
import type { DirectoryFacts } from '../run-directories';
import type { ValidatedRunnerPaths } from '../runner-root';
import { readSignIn, type ReadFiles } from './sign-in-paths';

/**
 * The Claude reader's sign-in: the token Joe made with `claude setup-token`, read from the runner's
 * own 0600 file and handed to one executor call as `CLAUDE_CODE_OAUTH_TOKEN`
 * (`worker-sandbox-run.ts#runSandboxed`). The run's `CLAUDE_CONFIG_DIR` is its own empty folder.
 * Nothing refreshes the token: when it expires or is revoked the profile stops until Joe makes another.
 * Its generation is a fingerprint, never the token.
 */

const TOKEN = /^[\x21-\x7e]+$/;

export type ClaudeSignIn = { ok: true; token: string; generation: string } | { ok: false; reason: string };

/** The fingerprint a stop is keyed to; formatting (a final line ending) does not change it. */
export const claudeGeneration = (token: string) => createHash('sha256').update('overseer-claude-token\0').update(token).digest('hex');

/** One nonempty printable-ASCII token without spaces, and at most one final line ending. */
export function normalizeClaudeToken(bytes: Uint8Array): string | null {
    const text = Buffer.from(bytes).toString('latin1');
    const token = text.endsWith('\r\n') ? text.slice(0, -2) : text.endsWith('\n') ? text.slice(0, -1) : text;
    return TOKEN.test(token) ? token : null;
}

export function readClaudeSignIn(paths: ValidatedRunnerPaths, facts: DirectoryFacts & { files?: ReadFiles } = {}): ClaudeSignIn {
    const read = readSignIn(paths, 'claude', facts);
    if (!read.ok) return { ok: false, reason: read.reason };
    const token = normalizeClaudeToken(read.bytes);
    if (token === null) return { ok: false, reason: 'The Claude sign-in is not one line of printable ASCII without spaces' };
    return { ok: true, token, generation: claudeGeneration(token) };
}
