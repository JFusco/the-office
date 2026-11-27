import { AsyncLocalStorage } from 'node:async_hooks';
import type { Resource } from './rate-limit-samples';

/**
 * GitHub's refusal of one metered `gh` call, as the metered runner observed it: who was refused, for which resource,
 * when, and the deadline the quota governor computed for it then. `late` settles after the shared probe with the
 * exhausted window's reset for the same principal and resource, when the probe found one.
 */
export interface GitHubRefusalEvidence {
    principal: string;
    resource: Resource;
    at: string;
    /** ISO; the governor's deadline for the principal when it observed the call. Absent without a governor. */
    deadline?: string;
    secondary: boolean;
    retryAfterMs?: number;
    /** The words that stated the refusal. */
    text: string;
    readOnly: boolean;
    late?: Promise<string | undefined>;
}

/** One failed metered `gh` call inside a capture: its fixed arguments, diagnostic, whether it was a read, and any refusal. */
export interface CapturedFailure {
    args: string;
    text: string;
    readOnly: boolean;
    at: string;
    refusal?: GitHubRefusalEvidence;
}

const captures = new AsyncLocalStorage<CapturedFailure[]>();

/** Keeps the failed GitHub calls `work` makes across its awaits, so the stop it ends in can be told which call caused it. */
export function captureGitHubFailures<T>(work: () => Promise<T>): Promise<T> {
    return captures.run([], work);
}

/** Records a failed metered call in the current capture; outside one this does nothing. */
export function noteGitHubFailure(failure: CapturedFailure): void {
    captures.getStore()?.push(failure);
}

/** A successful call of the same command supersedes its earlier failures: an inner retry answered it. */
export function noteGitHubAnswer(args: string): void {
    const captured = captures.getStore();
    if (!captured) return;
    for (let index = captured.length - 1; index >= 0; index--) if (captured[index].args === args) captured.splice(index, 1);
}

/** The latest captured failure whose diagnostic or refusal wording the stop's own text carries: the call that caused it. */
export function stopFailure(stopText: string): CapturedFailure | undefined {
    const captured = captures.getStore() ?? [];
    const carried = (words: string | undefined) => !!words && stopText.includes(words.trim().slice(0, 300));
    for (let index = captured.length - 1; index >= 0; index--)
        if (carried(captured[index].text) || carried(captured[index].refusal?.text)) return captured[index];
    return undefined;
}
