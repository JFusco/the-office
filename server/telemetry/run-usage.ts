import type { RunUsage } from '../../src/contracts/telemetry';
import type { CodexRollout } from './codex-rollout';

const count = (value: unknown): number | null => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : null;
const sum = (values: (number | null)[]): number | null => values.some(value => value === null) ? null : values.reduce<number>((total, value) => total + value!, 0);

/** Claude's crash result can carry zeroed totals; zero there means "not reported", not "free". */
export function claudeCrashZero(result: Record<string, any>): boolean {
    return result.subtype === 'error_during_execution' && !(Number(result.total_cost_usd) > 0);
}

/**
 * Normalizes a Claude `result` event. Claude's `input_tokens` already excludes cache reads and
 * writes. `modelUsage` covers the whole invocation, including inline helpers and subagents,
 * whereas `usage` covers only the top-level loop, so `usage` is used only for a single-model run.
 */
export function claudeUsage(result: Record<string, any> | null): RunUsage {
    const unknown = (reason: string): RunUsage => ({ uncachedInputTokens: null, cacheReadInputTokens: null, cacheWriteInputTokens: null, outputTokens: null, reasoningOutputTokens: null, completeness: 'unknown', reasons: [reason], source: 'claude-result', requests: null, observedModels: [], observedEfforts: [], producerVersion: null });
    if (!result) return unknown('no-provider-result');
    if (claudeCrashZero(result)) return unknown('crash-result-zeroed');
    const models = Object.values(result.modelUsage || {}) as Record<string, unknown>[];
    const field = (name: string, fallback: string) => {
        if (models.length) {
            const total = sum(models.map(usage => count(usage?.[name])));
            if (total !== null || models.length > 1) return total;
        }
        return count(result.usage?.[fallback]);
    };
    const usage: RunUsage = {
        uncachedInputTokens: field('inputTokens', 'input_tokens'),
        cacheReadInputTokens: field('cacheReadInputTokens', 'cache_read_input_tokens'),
        cacheWriteInputTokens: field('cacheCreationInputTokens', 'cache_creation_input_tokens'),
        outputTokens: field('outputTokens', 'output_tokens'),
        // Claude does not state whether thinking tokens are a subset of output; leave unknown.
        reasoningOutputTokens: null,
        completeness: 'complete', reasons: [], source: 'claude-result', requests: null,
        observedModels: Object.keys(result.modelUsage || {}), observedEfforts: [], producerVersion: null,
    };
    const missing = (['uncachedInputTokens', 'cacheReadInputTokens', 'cacheWriteInputTokens', 'outputTokens'] as const).filter(key => usage[key] === null);
    if (missing.length === 4) return unknown('usage-not-reported');
    if (missing.length) { usage.completeness = 'partial'; usage.reasons.push(`missing:${missing.join(',')}`); }
    return usage;
}

/** Normalizes Codex rollout responses. Codex input includes cached input, so uncached = input − cached. */
export function codexUsage(rollout: CodexRollout | null, reason = 'no-rollout'): RunUsage {
    if (!rollout || !rollout.requests.length) return { uncachedInputTokens: null, cacheReadInputTokens: null, cacheWriteInputTokens: null, outputTokens: null, reasoningOutputTokens: null, completeness: 'unknown', reasons: rollout ? rollout.gaps : [reason], source: 'codex-rollout', requests: rollout ? 0 : null, observedModels: rollout?.models ?? [], observedEfforts: rollout?.efforts ?? [], producerVersion: rollout?.cliVersion ?? null };
    const total = (pick: (r: CodexRollout['requests'][number]) => number) => rollout.requests.reduce((acc, request) => acc + pick(request), 0);
    const cacheWrite = total(r => r.cacheWrite);
    return {
        // Whether cache writes are a subset of input is not established for this emitter, so
        // uncached input is only derived when there were none.
        uncachedInputTokens: cacheWrite ? null : total(r => r.input - r.cachedInput),
        cacheReadInputTokens: total(r => r.cachedInput),
        cacheWriteInputTokens: cacheWrite,
        outputTokens: total(r => r.output),
        reasoningOutputTokens: total(r => r.reasoningOutput),
        completeness: rollout.gaps.length || cacheWrite ? 'partial' : 'complete',
        reasons: [...rollout.gaps, ...(cacheWrite ? ['cache-write-input-semantics-unestablished'] : [])],
        source: 'codex-rollout',
        requests: rollout.requests.length,
        observedModels: rollout.models, observedEfforts: rollout.efforts, producerVersion: rollout.cliVersion,
    };
}
