import type { ServiceHealth, WorkTime } from '../../src/shared';
import { signInFailure } from './sign-in-failure';

/**
 * Claude's complete words when it refuses a run for its login, recorded with Claude Code 2.1.328 (#552). Only exact
 * matches count: a refresh that cannot reach the network, a server error and any other wording are not a refusal.
 */
const RECORDED_REFUSALS: readonly string[] = [
    'Not logged in · Please run /login',
    'Invalid API key · Fix external API key',
    'Failed to authenticate. API Error: 401 OAuth access token is invalid.',
    'Failed to authenticate: OAuth session expired and could not be refreshed',
];
/** The envelope `workerFailure` puts around an ordinary non-zero exit. */
const ENVELOPE = /^claude exited [1-9]\d*: /;

export type ClaudeLoginRefusal = { at: string; words: string };

/** Claude's words when a run's failure is its login refusal. */
export function claudeRefusalWords(detail: string | undefined): string | undefined {
    const envelope = detail === undefined ? undefined : ENVELOPE.exec(detail)?.[0];
    const words = envelope && detail!.slice(envelope.length).trimEnd();
    return words && RECORDED_REFUSALS.includes(words) ? words : undefined;
}

/**
 * The latest Claude refusal, when it is strictly later than the latest Claude run whose execution completed (the login
 * worked then), than `since` (this process started: an environment credential changes only with a restart) and than
 * `signedOutAt` (the status check's own latest signed-out reading: the CLI cleared a stored login, which was then signed
 * in again). Other failures, unfinished or interrupted runs, other providers and unreadable end times settle nothing.
 */
export function claudeLoginRefusal(workLog: readonly WorkTime[], since: number, signedOutAt: number): ClaudeLoginRefusal | undefined {
    let refusal: { at: number; endedAt: string; words: string } | undefined, completedAt = -Infinity;
    for (const work of workLog) {
        const at = Date.parse(work.endedAt);
        if (work.provider !== 'claude' || !Number.isFinite(at)) continue;
        if (work.executionStatus === 'completed' || work.status === 'completed') { completedAt = Math.max(completedAt, at); continue; }
        const words = work.status === 'failed' ? claudeRefusalWords(work.failure?.detail) : undefined;
        if (words && (!refusal || at > refusal.at)) refusal = { at, endedAt: work.endedAt, words };
    }
    return refusal && refusal.at > completedAt && refusal.at > since && refusal.at > signedOutAt ? { at: refusal.endedAt, words: refusal.words } : undefined;
}

/** The Claude row when Claude refused its login during a worker run while its status command still reports a login. */
export function refusedClaudeRow(row: ServiceHealth, refusal: ClaudeLoginRefusal): ServiceHealth {
    const failure = signInFailure(refusal.words);
    return { ...row, status: 'disconnected', detail: 'Claude refused the Office’s login during a worker run. Its status command still reports a configured login.', ...(failure && { failure }) };
}
