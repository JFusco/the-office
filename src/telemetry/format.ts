/** Estimated USD from integer micro-USD; sub-cent amounts stay visible rather than rounding to $0.00. */
export function usd(microUsd: number): string {
    if (microUsd > 0 && microUsd < 5_000) return '<$0.01';
    return `$${(microUsd / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function tokens(count: number): string {
    return count >= 1_000_000 ? `${(count / 1_000_000).toFixed(1)}M` : count >= 1_000 ? `${(count / 1_000).toFixed(1)}k` : String(count);
}

/** "2 partial · 1 unpriced", or "" when every run is fully priced. */
export function coverage(partial: number, unpriced: number): string {
    return [partial ? `${partial} partial` : '', unpriced ? `${unpriced} unpriced` : ''].filter(Boolean).join(' · ');
}

/** An amount that is zero only because nothing could be priced reads "Not priced", never "$0.00". */
export function pricedLabel(row: { microUsd: number; partialRuns: number; unpricedRuns: number }): string {
    return row.microUsd === 0 && (row.partialRuns || row.unpricedRuns) ? 'Not priced' : usd(row.microUsd);
}
