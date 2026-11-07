/**
 * Model usage and estimated cost for one provider invocation.
 *
 * Token fields follow the OpenTelemetry GenAI usage categories, normalized so
 * they are disjoint: uncached + cache-read + cache-write is the whole input, and
 * reasoning output is a subset of output (never added on top).
 *
 * Cost is an estimate at API list price, not a bill or a CLI subscription charge.
 * Money is integer micro-USD; rounding to cents happens only at publication.
 */
export type UsageCompleteness = 'complete' | 'partial' | 'unknown';
export type CostCompleteness = 'complete' | 'partial' | 'unpriced';
export type UsageSource = 'claude-result' | 'codex-rollout';
export type ValuationSource = 'provider-estimate' | 'price-table';
export type ProviderBasis = 'list' | 'managed' | 'unknown';
export type ImportProvenance = 'live' | 'historical-import' | 'helper-import';

export interface RunUsage {
    uncachedInputTokens: number | null;
    cacheReadInputTokens: number | null;
    cacheWriteInputTokens: number | null;
    outputTokens: number | null;
    /** Subset of outputTokens. */
    reasoningOutputTokens: number | null;
    completeness: UsageCompleteness;
    reasons: string[];
    source: UsageSource;
    /** Provider requests counted, when the evidence exposes them. */
    requests: number | null;
    /** Models and efforts that actually ran, as the provider reported them (not the requested route). */
    observedModels: string[];
    observedEfforts: string[];
    producerVersion: string | null;
}

/** Immutable snapshot of the rate row a run was valued with. */
export interface PriceRef {
    id: string;
    provider: 'claude' | 'codex';
    model: string;
    tier: 'standard';
    contextBand: 'short' | 'long';
    cacheWriteDuration: string | null;
    region: 'global';
    /** USD per million tokens. */
    rates: { input: number; cachedInput: number; cacheWrite: number | null; output: number };
    sourceUrl: string;
    asOf: string;
}

export interface CostComponent {
    model: string;
    microUsd: number | null;
    providerBasis: ProviderBasis | null;
}

export interface RunCost {
    /** Complete total; null unless completeness is 'complete'. */
    microUsd: number | null;
    /** Independently supported amount when coverage is partial. */
    partialMicroUsd: number | null;
    completeness: CostCompleteness;
    valuation: ValuationSource | null;
    providerBasis: ProviderBasis | null;
    /** Raw provider-reported total, preserved even when it cannot support valuation. */
    reportedTotalUsd: number | null;
    priceRefs: PriceRef[];
    components: CostComponent[];
    reasons: string[];
}

/** Final accounting evidence attached to a WorkTime record. Immutable once accepted. */
export interface RunAccounting {
    usage: RunUsage;
    cost: RunCost;
    provenance: ImportProvenance;
    /** Stable identity of the evidence: provider session or artifact digest. */
    evidenceId: string;
    sourcePath: string | null;
    sourceSha256: string | null;
    acceptedAt: string;
}
