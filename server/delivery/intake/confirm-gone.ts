import type { AssignmentReview } from '../../../src/shared';

const KEY = /^[A-Z][A-Z0-9]{1,9}-\d{1,7}$/;
const STOPPED = ['owned', 'blocked', 'held'];

/** The tickets whose latest review is stopped: the ones an empty assignment read leaves unexplained. At most ninety, one read. */
export function stoppedReviewKeys(reviews: readonly AssignmentReview[]): string[] {
    return [...new Map(reviews.map(review => [review.key, review])).values()].filter(review => STOPPED.includes(review.status) && KEY.test(review.key)).map(review => review.key).slice(0, 90);
}

/**
 * The Jira search that asks, for exactly these tickets, which are resolved or no longer assigned to the
 * Office. Every ticket it returns has left the Office's work for a reason Jira itself states, which an
 * empty assignment list alone does not show. Empty when there is nothing to ask.
 */
export function goneQuery(projectKey: string, account: string, keys: readonly string[]): string {
    const asked = keys.filter(key => KEY.test(key) && key.startsWith(`${projectKey}-`));
    if (!asked.length || !/^[A-Z][A-Z0-9]{1,9}$/.test(projectKey) || !/^[A-Za-z0-9:_-]+$/.test(account)) return '';
    return `project = ${projectKey} AND key in (${asked.join(', ')}) AND (resolution is not EMPTY OR assignee is EMPTY OR assignee != "${account}") ORDER BY key ASC`;
}

/** The asked-for tickets that the search returned. Anything else in the answer is ignored. */
export function confirmedGone(issues: unknown, keys: readonly string[]): Set<string> {
    const asked = new Set(keys);
    return new Set((Array.isArray(issues) ? issues : []).map(issue => String(issue?.key || '')).filter(key => asked.has(key)));
}
