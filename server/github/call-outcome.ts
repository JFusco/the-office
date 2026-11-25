import { credentialFailure, rateLimitRefusal } from '../office/service-health';
import type { GitHubCall } from './endpoint-family';

/**
 * What one `gh` process showed of its traffic. `attempts` are observed HTTP requests and `pages` the successful
 * ones; `responses` are full responses plus authorized 304s (`revalidations`). `opaque` is a high-level command
 * and `unknown` an invocation whose HTTP traffic is partly or wholly hidden.
 */
export type CallCounts = { invocations: number; attempts: number; pages: number; responses: number; fullResponses: number; revalidations: number; refusals: number; failures: number; opaque: number; unknown: number };
export const noCalls = (): CallCounts => ({ invocations: 0, attempts: 0, pages: 0, responses: 0, fullResponses: 0, revalidations: 0, refusals: 0, failures: 0, opaque: 0, unknown: 0 });
/** A failure in which gh states an HTTP status or a GraphQL answer: a request was sent and answered. */
const statedResponse = /\bHTTP [1-5]\d\d\b|\bGraphQL: /;

/** Pages in `--paginate --slurp` output: the outer array, counted before callers flatten it. */
function slurpedPages(stdout: string): number | undefined {
    try { const pages = JSON.parse(stdout); return Array.isArray(pages) ? pages.length : undefined; } catch { return undefined; }
}
/** A process that exited 0. */
export function succeeded(call: GitHubCall, stdout: string): CallCounts {
    const counts = { ...noCalls(), invocations: 1 };
    if (!call.api) return { ...counts, opaque: 1, unknown: 1 };
    const pages = !call.paginate ? 1 : call.slurp ? slurpedPages(stdout) : undefined;
    if (pages === undefined) return { ...counts, unknown: 1 };
    return { ...counts, attempts: pages, pages, responses: pages, fullResponses: pages };
}
/** A spawned process that failed. A rate-limit refusal is GitHub's stated one, unless the text is also a credential failure. */
export function failed(call: GitHubCall, error: unknown): CallCounts {
    const text = error instanceof Error ? error.message : String(error), counts = { ...noCalls(), invocations: 1 };
    const refused = rateLimitRefusal.test(text) && !credentialFailure.test(text), outcome = refused ? { refusals: 1 } : { failures: 1 };
    if (!call.api) return { ...counts, ...outcome, opaque: 1, unknown: 1 };
    if (!call.paginate && /\bHTTP 304\b/.test(text)) return { ...counts, attempts: 1, responses: 1, revalidations: 1 };
    // Without a stated answer the request may never have been sent; a paginated read may have read pages first.
    const answered = refused || statedResponse.test(text);
    return { ...counts, ...outcome, attempts: answered ? 1 : 0, unknown: !answered || call.paginate ? 1 : 0 };
}
