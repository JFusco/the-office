import { activeGitHubAccount, credentialFailure, rateLimitRefusal } from '../office/service-health';
import type { GitHubOperation } from './call-scope';
import type { GitHubCall } from './endpoint-family';
import type { GraphqlAnswer } from './graphql-answer';

/**
 * What one `gh` process showed of its traffic. `attempts` are observed HTTP requests and `pages` the successful
 * ones; `responses` are full responses plus authorized 304s (`revalidations`). `opaque` is a high-level command
 * and `unknown` an invocation whose HTTP traffic is partly or wholly hidden. A direct GraphQL query adds the
 * `points` its response reported, or one `unknownCost`: a positive `unknownCost` marks `points` as partial.
 * `prChildInvocations` and `prChildPages` are the PR inventory's review and check continuations.
 */
export type CallCounts = { invocations: number; attempts: number; pages: number; responses: number; fullResponses: number; revalidations: number; refusals: number; failures: number; opaque: number; unknown: number;
    points: number; unknownCost: number; prChildInvocations: number; prChildPages: number };
export const noCalls = (): CallCounts => ({ invocations: 0, attempts: 0, pages: 0, responses: 0, fullResponses: 0, revalidations: 0, refusals: 0, failures: 0, opaque: 0, unknown: 0, points: 0, unknownCost: 0, prChildInvocations: 0, prChildPages: 0 });
const statedHttpStatus = /(?:\bHTTP |status code:\s*)[1-5]\d\d\b/i;
/** gh's other error format for a 401. Kept local: the login health check's own classification is unchanged here. */
const statedCredential401 = /status code:\s*401\b/i;
export const refusedByRateLimit = (text: string) => rateLimitRefusal.test(text) && !credentialFailure.test(text) && !statedCredential401.test(text);
const revalidated = { attempts: 1, responses: 1, revalidations: 1 };

function githubAuthError(stdout: string): string | undefined {
    try {
        const account = activeGitHubAccount(stdout);
        if (account?.state !== 'success' && typeof account?.error === 'string' && account.error.trim()) return account.error;
    } catch { /* Opaque output without a usable login document. */ }
}

/** Pages in `--paginate --slurp` output: the outer array, counted before callers flatten it. */
function slurpedPages(stdout: string): number | undefined {
    try { const pages = JSON.parse(stdout); return Array.isArray(pages) ? pages.length : undefined; } catch { return undefined; }
}
/** A process that exited 0. */
export function succeeded(call: GitHubCall, stdout: string, status?: number): CallCounts {
    const counts = { ...noCalls(), invocations: 1 };
    if (!call.api) {
        const diagnostic = call.family === 'gh-auth' ? githubAuthError(stdout) : undefined;
        if (diagnostic) {
            const refused = refusedByRateLimit(diagnostic);
            return { ...counts, opaque: 1, unknown: 1, attempts: Number(statedHttpStatus.test(diagnostic)), refusals: Number(refused), failures: Number(!refused) };
        }
        return { ...counts, opaque: 1, unknown: 1 };
    }
    if (!call.paginate && status === 304) return { ...counts, ...revalidated };
    const pages = !call.paginate ? 1 : call.slurp ? slurpedPages(stdout) : undefined;
    if (pages === undefined) return { ...counts, unknown: 1 };
    return { ...counts, attempts: pages, pages, responses: pages, fullResponses: pages };
}
/** A spawned process that failed. A rate-limit refusal is GitHub's stated one, unless the text is also a credential failure. */
export function failed(call: GitHubCall, error: unknown, status?: number): CallCounts {
    const text = error instanceof Error ? error.message : String(error), counts = { ...noCalls(), invocations: 1 };
    const refused = refusedByRateLimit(text), outcome = refused ? { refusals: 1 } : { failures: 1 };
    if (!call.api) return { ...counts, ...outcome, attempts: Number(statedHttpStatus.test(text)), opaque: 1, unknown: 1 };
    if (!call.paginate && (status === 304 || status === undefined && /\bHTTP 304\b/.test(text))) return { ...counts, ...revalidated };
    // Without a stated answer the request may never have been sent; a paginated read may have read pages first.
    const answered = status !== undefined || refused || statedHttpStatus.test(text) || /\bGraphQL: /.test(text);
    return { ...counts, ...outcome, attempts: answered ? 1 : 0, unknown: !answered || call.paginate ? 1 : 0 };
}
/**
 * A direct GraphQL query's counts: the points its body reported or one unknown cost, and a body carrying `errors`
 * is no successful page but a refusal (`refused`) or a failure. A PR continuation (`pr-child`) also counts as one.
 */
export function graphqlCounts(counts: CallCounts, answer: GraphqlAnswer | undefined, operation?: GitHubOperation, refused = false): CallCounts {
    const out = { ...counts };
    if (answer) {
        if (answer.cost === undefined) out.unknownCost += 1; else out.points += answer.cost;
        if (answer.errors !== undefined && out.pages) { out.pages = 0; if (refused) out.refusals += 1; else out.failures += 1; }
        else if (refused && out.failures) { out.failures -= 1; out.refusals += 1; }
    }
    if (answer && operation === 'pr-child') { out.prChildInvocations = out.invocations; out.prChildPages = out.pages; }
    return out;
}
