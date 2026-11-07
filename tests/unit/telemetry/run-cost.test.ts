import { expect, test } from 'vitest';
import { parseCodexRollout } from '../../../server/telemetry/codex-rollout';
import { claudeCost, codexCost, toMicroUsd } from '../../../server/telemetry/run-cost';
import { claudeUsage, codexUsage } from '../../../server/telemetry/run-usage';
import { rollout } from './support/rollout';

const T = '01a1b7a7-5cc0-7162-b396-290c5af105ba';
const claudeResult = (extra: Record<string, unknown> = {}) => ({
    type: 'result', subtype: 'success', is_error: false, session_id: 's', total_cost_usd: 0.7750866,
    modelUsage: { 'claude-opus-5-5': { inputTokens: 24, outputTokens: 11616, cacheReadInputTokens: 484913, cacheCreationInputTokens: 55711, costUSD: 0.7750866, costBasis: 'list' } },
    ...extra,
});

test('micro-USD conversion is integer and rejects non-finite or negative amounts', () => {
    expect(toMicroUsd(0.7750866)).toBe(775087);
    expect(toMicroUsd(0)).toBe(0);
    expect([toMicroUsd(-1), toMicroUsd(Number.NaN), toMicroUsd('1')]).toEqual([null, null, null]);
});

test('Claude is valued from the CLI estimate; per-model costs decompose it and are never added', () => {
    const multi = claudeResult({ total_cost_usd: 1.5, modelUsage: { 'claude-opus-5-5': { inputTokens: 1, outputTokens: 1, costUSD: 1.2, costBasis: 'list' }, 'claude-haiku-5-5': { inputTokens: 1, outputTokens: 1, costUSD: 0.3, costBasis: 'list' } } });
    expect(claudeCost(multi)).toMatchObject({ microUsd: 1_500_000, completeness: 'complete', valuation: 'provider-estimate', providerBasis: 'list' });
    expect(claudeCost(multi).components.map(c => c.microUsd)).toEqual([1_200_000, 300_000]);
    expect(claudeUsage(claudeResult())).toMatchObject({ uncachedInputTokens: 24, cacheReadInputTokens: 484913, cacheWriteInputTokens: 55711, outputTokens: 11616, completeness: 'complete' });
});

test('a crash result with zeroed totals is unpriced, unlike a confirmed complete zero', () => {
    const crash = claudeResult({ subtype: 'error_during_execution', is_error: true, total_cost_usd: 0, modelUsage: {} });
    expect(claudeCost(crash)).toMatchObject({ completeness: 'unpriced', microUsd: null, reasons: ['crash-result-zeroed'] });
    expect(claudeUsage(crash).completeness).toBe('unknown');
    const errorWithCost = claudeResult({ subtype: 'error_max_turns', is_error: true });
    expect(claudeCost(errorWithCost)).toMatchObject({ completeness: 'complete', microUsd: 775087 });
});

test('an unknown or missing Claude cost basis keeps the raw amount but does not price it', () => {
    const unknown = claudeCost(claudeResult({ modelUsage: { 'claude-new': { costUSD: 0.5, costBasis: 'unknown' } }, total_cost_usd: 0.5 }));
    expect(unknown).toMatchObject({ completeness: 'unpriced', microUsd: null, reportedTotalUsd: 0.5, reasons: ['unpriced-model:claude-new'] });
    const mixed = claudeCost(claudeResult({ total_cost_usd: 0.8, modelUsage: { 'claude-opus-5-5': { costUSD: 0.6, costBasis: 'list' }, 'claude-x': { costUSD: 0.2 } } }));
    expect(mixed).toMatchObject({ completeness: 'partial', microUsd: null, partialMicroUsd: 600_000 });
});

test('Codex responses are priced one by one, banding each by its own input size', () => {
    // short: 1,000 uncached×$10 + 9,000 cached×$1 + 100 out×$50 = 24,000 µ$
    // long:  300,000 input (>272K) → 50,000 uncached×$20 + 250,000 cached×$2 + 1,000 out×$75 = 1,575,000 µ$
    const parsed = parseCodexRollout(rollout(T, [{ input: 10_000, cached: 9_000, output: 100 }, { input: 300_000, cached: 250_000, output: 1_000 }]), T);
    const cost = codexCost(parsed);
    expect(cost).toMatchObject({ completeness: 'complete', microUsd: 1_599_000, valuation: 'price-table' });
    expect(cost.priceRefs.map(ref => ref.contextBand).sort()).toEqual(['long', 'short']);
    expect(cost.priceRefs[0]).toMatchObject({ sourceUrl: 'https://developers.openai.com/api/docs/pricing', asOf: '2026-11-07', tier: 'standard' });
    expect(codexUsage(parsed)).toMatchObject({ uncachedInputTokens: 51_000, cacheReadInputTokens: 259_000, outputTokens: 1_100, requests: 2, completeness: 'complete' });
});

test('an unknown model or unestablished cache-write rate is never priced from another row', () => {
    expect(codexCost(parseCodexRollout(rollout(T, [{ input: 10, output: 1 }], { model: 'codex-auto-review' }), T))).toMatchObject({ completeness: 'unpriced', reasons: ['no-price-row:codex-auto-review'] });
    const write = codexCost(parseCodexRollout(rollout(T, [{ input: 1_000, output: 10 }, { input: 1_000, write: 500, output: 10 }]), T));
    expect(write).toMatchObject({ completeness: 'partial', microUsd: null, partialMicroUsd: 10_500, reasons: ['cache-write-unpriceable'] });
});

test('an incomplete rollout yields a partial amount, never a complete total', () => {
    const cost = codexCost(parseCodexRollout(rollout(T, [{ input: 1_000, output: 10 }], { complete: false }), T));
    expect(cost).toMatchObject({ completeness: 'partial', microUsd: null, partialMicroUsd: 10_500 });
    expect(codexCost(null)).toMatchObject({ completeness: 'unpriced', microUsd: null });
});
