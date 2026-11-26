import { refusedByRateLimit } from './call-outcome';
import type { QuotaRefusal } from './quota-governor';
import type { ResourceReading } from './rate-limit-samples';

/** Retry-After from an included header block: seconds, or an HTTP date. */
function retryAfterMs(headers: string | undefined, now: number): number | undefined {
    const line = headers?.split(/\r?\n/).find(field => /^retry-after\s*:/i.test(field));
    const value = line?.slice(line.indexOf(':') + 1).trim();
    if (!value) return;
    if (/^\d+$/.test(value)) return Number(value) * 1000;
    const at = Date.parse(value);
    return Number.isFinite(at) ? Math.max(0, at - now) : undefined;
}

/**
 * GitHub's stated rate-limit refusal in a failed call, by the rule the login check uses with a credential failure
 * taking precedence. Anything else, a bare permission 403 included, is not one and keeps its own error path. A
 * secondary limit is GitHub's statement of one, or a 429. `headers` and `reading` exist only for an `--include` call.
 */
export function quotaRefusal(text: string, headers?: string, reading?: ResourceReading, now = Date.now()): QuotaRefusal | undefined {
    if (!refusedByRateLimit(text)) return;
    const secondary = /secondary rate limit/i.test(text) || /\bHTTP 429\b/.test(text) || /^HTTP\/\S+ 429\b/.test(headers ?? '');
    const retryAfter = retryAfterMs(headers, now);
    return { secondary, ...(retryAfter === undefined ? {} : { retryAfterMs: retryAfter }), ...(reading ? { reading } : {}) };
}
