/** GitHub reports the same run's created_at up to a second apart across endpoints (attempts vs workflow runs). */
export const PROVIDER_CLOCK_SKEW_MS = 2000;

export function sameProviderInstant(a: unknown, b: unknown): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const left = Date.parse(a), right = Date.parse(b);
    return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= PROVIDER_CLOCK_SKEW_MS;
}
