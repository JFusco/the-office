import type { PriceRef } from '../../src/contracts/telemetry';

/**
 * Standard-tier API list prices (USD per million tokens) for the Codex models the
 * Office routes to. USD per million tokens equals micro-USD per token.
 *
 * Claude runs are valued from the CLI's own list-price estimate, so no Claude rows
 * live here. Rows are exact-model: an unknown model or alias never borrows another
 * model's row.
 */
export const OPENAI_PRICING_URL = 'https://developers.openai.com/api/docs/pricing';
export const OPENAI_PRICING_AS_OF = '2026-11-07';
/** A request above this many input tokens is billed at the long-context rates. */
export const OPENAI_LONG_CONTEXT_INPUT_TOKENS = 272_000;

type Rates = { input: number; cachedInput: number; output: number; write30m: number; write12h: number };
interface ModelRow { short: Rates; long: Rates }

const CODEX_ROWS: Readonly<Record<string, ModelRow>> = {
    'gpt-6-astra': { short: { input: 10, cachedInput: 1, output: 50, write30m: 12.5, write12h: 25 }, long: { input: 20, cachedInput: 2, output: 75, write30m: 25, write12h: 50 } },
    'gpt-6.1-sol': { short: { input: 2, cachedInput: 0.1, output: 10, write30m: 2.5, write12h: 5 }, long: { input: 4, cachedInput: 0.2, output: 15, write30m: 5, write12h: 10 } },
    'gpt-6-sol': { short: { input: 2, cachedInput: 0.2, output: 10, write30m: 2.5, write12h: 5 }, long: { input: 4, cachedInput: 0.4, output: 15, write30m: 5, write12h: 10 } },
    'gpt-6-luna': { short: { input: 0.1, cachedInput: 0.01, output: 0.5, write30m: 0.125, write12h: 0.25 }, long: { input: 0.2, cachedInput: 0.02, output: 0.75, write30m: 0.25, write12h: 0.5 } },
};

export type CacheWriteDuration = '30m' | '12h';

export function codexPricedModels(): string[] { return Object.keys(CODEX_ROWS); }

/** The rate snapshot for one Codex request, or null when the model has no exact row. */
export function codexPriceRef(model: string, contextBand: 'short' | 'long', cacheWriteDuration: CacheWriteDuration | null): PriceRef | null {
    const row = Object.hasOwn(CODEX_ROWS, model) ? CODEX_ROWS[model] : undefined;
    if (!row) return null;
    const rates = row[contextBand];
    const cacheWrite = cacheWriteDuration === '30m' ? rates.write30m : cacheWriteDuration === '12h' ? rates.write12h : null;
    return {
        id: `openai:${model}:standard:${contextBand}:${cacheWriteDuration ?? 'no-write-duration'}:global:${OPENAI_PRICING_AS_OF}`,
        provider: 'codex', model, tier: 'standard', contextBand, cacheWriteDuration, region: 'global',
        rates: { input: rates.input, cachedInput: rates.cachedInput, cacheWrite, output: rates.output },
        sourceUrl: OPENAI_PRICING_URL, asOf: OPENAI_PRICING_AS_OF,
    };
}
