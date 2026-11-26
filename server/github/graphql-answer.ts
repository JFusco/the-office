import { resourceReading, type ResourceReading } from './rate-limit-samples';

/** What a direct GraphQL response said of itself: the points it reported, the balance after it, and its errors. */
export type GraphqlAnswer = { cost?: number; reading?: ResourceReading; errors?: string };

/** The JSON body of `gh api` output: what follows the header block when `--include` was given. */
export function responseBody(stdout: string, include: boolean): string {
    if (!include || !stdout.startsWith('HTTP/')) return stdout;
    const end = /\r?\n\r?\n/.exec(stdout);
    return end ? stdout.slice(end.index + end[0].length) : '';
}

/**
 * Read a GraphQL body's `rateLimit { cost limit used remaining resetAt }` and `errors`. The ISO reset becomes integer
 * UTC epoch seconds; a value that is missing or invalid is left out, so its cost counts as unknown. Error messages
 * are returned for the refusal rule only and are never kept.
 */
export function graphqlAnswer(stdout: string, include: boolean): GraphqlAnswer {
    let body: any;
    try { body = JSON.parse(responseBody(stdout, include)); } catch { return {}; }
    const rate = body?.data?.rateLimit, answer: GraphqlAnswer = {};
    if (Number.isInteger(rate?.cost) && rate.cost >= 0) answer.cost = rate.cost;
    const resetAt = typeof rate?.resetAt === 'string' ? Date.parse(rate.resetAt) : NaN;
    const reading = Number.isFinite(resetAt) ? resourceReading('graphql', { limit: rate.limit, used: rate.used, remaining: rate.remaining, reset: Math.floor(resetAt / 1000) }) : undefined;
    if (reading) answer.reading = reading;
    if (Array.isArray(body?.errors) && body.errors.length)
        answer.errors = body.errors.map((error: any) => typeof error?.message === 'string' ? error.message : 'GraphQL error').join('; ');
    return answer;
}
