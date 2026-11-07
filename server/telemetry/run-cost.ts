import type { CostComponent, PriceRef, ProviderBasis, RunCost } from '../../src/contracts/telemetry';
import type { CodexRollout } from './codex-rollout';
import { claudeCrashZero } from './run-usage';
import { codexPriceRef, OPENAI_LONG_CONTEXT_INPUT_TOKENS } from './price-table';

/** USD → integer micro-USD, half away from zero. Rejects anything that is not a finite, non-negative amount. */
export function toMicroUsd(usd: unknown): number | null {
    if (typeof usd !== 'number' || !Number.isFinite(usd) || usd < 0) return null;
    const micro = Math.round(usd * 1_000_000);
    return Number.isSafeInteger(micro) ? micro : null;
}

const unpriced = (reasons: string[], extra: Partial<RunCost> = {}): RunCost => ({ microUsd: null, partialMicroUsd: null, completeness: 'unpriced', valuation: null, providerBasis: null, reportedTotalUsd: null, priceRefs: [], components: [], reasons, ...extra });

const basisOf = (value: unknown): ProviderBasis => value === 'list' || value === 'managed' ? value : 'unknown';

/**
 * Values a Claude run from the CLI's own estimate. The CLI prices each request from a bundled
 * list-price table and states which table it used per model (`costBasis`). `modelUsage[].costUSD`
 * decomposes `total_cost_usd`; it is never added on top.
 */
export function claudeCost(result: Record<string, any> | null): RunCost {
    if (!result) return unpriced(['no-provider-result']);
    const reportedTotalUsd = typeof result.total_cost_usd === 'number' && Number.isFinite(result.total_cost_usd) ? result.total_cost_usd : null;
    if (claudeCrashZero(result)) return unpriced(['crash-result-zeroed'], { reportedTotalUsd });
    const components: CostComponent[] = Object.entries(result.modelUsage || {}).map(([model, usage]: [string, any]) => ({ model, microUsd: toMicroUsd(usage?.costUSD), providerBasis: basisOf(usage?.costBasis) }));
    const total = toMicroUsd(reportedTotalUsd);
    if (total === null) return unpriced(['total-cost-not-reported'], { reportedTotalUsd, components });
    if (!components.length) return unpriced(['model-usage-not-reported'], { reportedTotalUsd });
    const unsupported = components.filter(component => component.providerBasis === 'unknown' || component.microUsd === null);
    if (unsupported.length) {
        // Components the CLI did price from a known table remain an independently supported subtotal.
        const supported = components.filter(component => !unsupported.includes(component));
        return unpriced(unsupported.map(component => `unpriced-model:${component.model}`), {
            reportedTotalUsd, components,
            completeness: supported.length ? 'partial' : 'unpriced',
            partialMicroUsd: supported.length ? supported.reduce((acc, component) => acc + component.microUsd!, 0) : null,
            valuation: supported.length ? 'provider-estimate' : null,
        });
    }
    return { microUsd: total, partialMicroUsd: null, completeness: 'complete', valuation: 'provider-estimate', providerBasis: components.every(component => component.providerBasis === 'list') ? 'list' : 'managed', reportedTotalUsd, priceRefs: [], components, reasons: [] };
}

/**
 * Values a Codex run response by response at standard list price. Each response is banded by its
 * own input size; the band is never inferred from session totals. Missing evidence for any
 * rate-sensitive dimension leaves the run unpriced (or partial, if the rest is supported).
 */
export function codexCost(rollout: CodexRollout | null): RunCost {
    if (!rollout) return unpriced(['no-rollout']);
    if (!rollout.requests.length) return unpriced(rollout.gaps);
    const refs = new Map<string, PriceRef>(), byModel = new Map<string, number>(), reasons = new Set(rollout.gaps);
    let priced = 0;
    for (const request of rollout.requests) {
        const band = request.input > OPENAI_LONG_CONTEXT_INPUT_TOKENS ? 'long' : 'short';
        const ref = request.model ? codexPriceRef(request.model, band, null) : null;
        if (!ref) { reasons.add(request.model ? `no-price-row:${request.model}` : 'model-unknown'); continue; }
        // Neither the cache-write duration (30m vs 12h rates) nor whether writes are part of input
        // is established for this emitter, so a response with cache writes is not priced.
        if (request.cacheWrite) { reasons.add('cache-write-unpriceable'); continue; }
        refs.set(ref.id, ref);
        const value = (request.input - request.cachedInput) * ref.rates.input + request.cachedInput * ref.rates.cachedInput + request.output * ref.rates.output;
        byModel.set(ref.model, (byModel.get(ref.model) ?? 0) + value);
        priced++;
    }
    // Each model's exact sum is rounded once (half up); the run total is the sum of those, so
    // components always add up to the total.
    const components: CostComponent[] = [...byModel].map(([model, value]) => ({ model, microUsd: Math.round(value), providerBasis: 'list' }));
    const amount = components.reduce((total, component) => total + component.microUsd!, 0);
    if (!Number.isSafeInteger(amount)) return unpriced(['amount-out-of-range']);
    const base = { reportedTotalUsd: null, priceRefs: [...refs.values()], components, providerBasis: 'list' as const, valuation: 'price-table' as const };
    if (priced === rollout.requests.length && !reasons.size) return { ...base, microUsd: amount, partialMicroUsd: null, completeness: 'complete', reasons: [] };
    if (!priced) return unpriced([...reasons]);
    return { ...base, microUsd: null, partialMicroUsd: amount, completeness: 'partial', reasons: [...reasons] };
}
