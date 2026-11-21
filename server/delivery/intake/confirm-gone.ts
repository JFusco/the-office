import type { AssignmentReview } from '../../../src/shared';

// A project key as the binding configuration allows it, and a ticket key in such a project.
const PROJECT = /^[A-Z][A-Z0-9_]*$/, KEY = /^[A-Z][A-Z0-9_]*-\d{1,9}$/;
const STOPPED = ['owned', 'blocked', 'held'];

/**
 * The tickets whose latest review is stopped and could be settled: the ones an empty assignment read leaves
 * unexplained. A ticket the Office is delivering or holds is never settled, so it is not asked about. At most
 * ninety, one read.
 */
export function stoppedReviewKeys(reviews: readonly AssignmentReview[], kept: (key: string) => boolean = () => false): string[] {
    return [...new Map(reviews.map(review => [review.key, review])).values()].filter(review => STOPPED.includes(review.status) && KEY.test(review.key) && !kept(review.key)).map(review => review.key).slice(0, 90);
}

/**
 * The Jira search that asks, for exactly these tickets, which are resolved or no longer assigned to the
 * Office. Every ticket it returns has left the Office's work for a reason Jira itself states, which an
 * empty assignment list alone does not show. Empty when there is nothing to ask.
 */
export function goneQuery(projectKey: string, account: string, keys: readonly string[]): string {
    const asked = keys.filter(key => KEY.test(key) && key.startsWith(`${projectKey}-`));
    if (!asked.length || !PROJECT.test(projectKey) || !/^[A-Za-z0-9:_-]+$/.test(account)) return '';
    return `project = ${projectKey} AND key in (${asked.join(', ')}) AND (resolution is not EMPTY OR assignee is EMPTY OR assignee != "${account}") ORDER BY key ASC`;
}

/** The asked-for tickets that the search returned. Anything else in the answer is ignored. */
export function confirmedGone(issues: unknown, keys: readonly string[]): Set<string> {
    const asked = new Set(keys);
    return new Set((Array.isArray(issues) ? issues : []).map(issue => String(issue?.key || '')).filter(key => asked.has(key)));
}
