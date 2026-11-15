import type { WorkTime } from '../../src/shared';

/**
 * Input tokens for one run, as a lower bound. The legacy field keeps provider-native meaning
 * (Claude excludes cached input; Codex includes it), so normalized usage is preferred when it is
 * larger. A Claude run with no accepted accounting reports only its uncached input.
 */
export function runInputTokens(work: Pick<WorkTime, 'inputTokens' | 'accounting'>): number {
    const usage = work.accounting?.usage;
    const normalized = (usage?.uncachedInputTokens ?? 0) + (usage?.cacheReadInputTokens ?? 0) + (usage?.cacheWriteInputTokens ?? 0);
    return Math.max(work.inputTokens ?? 0, normalized);
}
