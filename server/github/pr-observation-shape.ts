import type { GitHubPR } from '../../src/shared';
import { githubPRDescription } from './pr-evidence';
import { closingDirectives } from './pr-links';
import { isOid } from './pr-observation-pages';
import type { ObservedPR } from './pr-observation-graphql';

const fail = (what: string): never => { throw new Error(`GitHub PR inventory ${what}`); };
const PR_STATES: Record<string, string> = { OPEN: 'open', CLOSED: 'closed', MERGED: 'closed' };
const MERGEABLE: Record<string, boolean | null> = { MERGEABLE: true, CONFLICTING: false, UNKNOWN: null };
/** A GraphQL enum value: REST passes check and review values through as strings, so a new one passes here too, in REST casing. */
const ENUM = /^[A-Z][A-Z_]*$/;
/** REST never lists `EXPECTED`, a required context nothing has reported, so it is dropped. */
const STATUS_STATES = new Set(['ERROR', 'FAILURE', 'PENDING', 'SUCCESS', 'EXPECTED']);

function mapped<T>(table: Record<string, T>, value: unknown, what: string): T {
    if (typeof value !== 'string' || !Object.hasOwn(table, value)) fail(`${what} is not a known value`);
    return table[value as string];
}
function enumValue(value: unknown, what: string): string {
    if (typeof value !== 'string' || !ENUM.test(value)) fail(`${what} is not a GraphQL enum value`);
    return value as string;
}
function member(set: Set<string>, value: unknown, what: string): string {
    if (typeof value !== 'string' || !set.has(value)) fail(`${what} is not a known value`);
    return value as string;
}
const text = (value: unknown, what: string): string => typeof value === 'string' ? value : fail(`${what} is missing`);
const time = (value: unknown, what: string): number => { const at = Date.parse(text(value, what)); return Number.isFinite(at) ? at : fail(`${what} is not a time`); };

/** An actor's REST login: a bot account carries `[bot]` exactly once; anyone else keeps the login GraphQL gives. A missing actor fails. */
export function restLogin(actor: any, what: string): string {
    const login = typeof actor?.login === 'string' && actor.login ? actor.login : fail(`${what} has no author`);
    return actor.__typename === 'Bot' && !login.endsWith('[bot]') ? `${login}[bot]` : login;
}

/** Statuses as REST keeps them: the newest per exact context, newest first; ties keep the rollup's order. */
function statusRows(contexts: any[], sha: string): GitHubPR['checks'] {
    const newest = new Map<string, { node: any; at: number }>();
    for (const node of contexts) {
        if (node.__typename !== 'StatusContext') continue;
        const context = text(node.context, 'status context'), state = member(STATUS_STATES, node.state, 'status state'), at = time(node.createdAt, 'status time');
        if (node.targetUrl !== null && typeof node.targetUrl !== 'string') fail('status link is malformed');
        if (state === 'EXPECTED') continue;
        const kept = newest.get(context);
        if (!kept || at > kept.at) newest.set(context, { node, at });
    }
    return [...newest.values()].sort((a, b) => b.at - a.at).map(({ node }) => ({ name: node.context, status: node.state === 'PENDING' ? 'pending' : 'completed', conclusion: node.state.toLowerCase(), url: node.targetUrl || '', sha }));
}

/**
 * One open PR from the GraphQL inventory in the monitor's REST-built shape (`src/shared.ts` `GitHubPR`): REST
 * casing and logins, three-valued mergeability, links from closing directives in the full body before it is bounded,
 * each review's own commit, check runs in the rollup's order, then statuses. Query-only IDs and times are not kept.
 * A value that is not a GraphQL enum, an unknown PR state, mergeability or status state, a missing actor or a
 * review without its commit fails the read.
 */
export function graphqlPR({ node, reviews, contexts, commit }: ObservedPR): GitHubPR {
    const body = text(node.body, 'PR body');
    if (typeof node.isDraft !== 'boolean' || node.mergedAt !== null && typeof node.mergedAt !== 'string' || !isOid(commit)) fail(`#${node.number} fields are malformed`);
    const checks: GitHubPR['checks'] = [];
    for (const run of contexts) {
        if (run.__typename === 'StatusContext') continue;
        if (run.__typename !== 'CheckRun') fail('check context is of an unknown kind');
        const status = enumValue(run.status, 'check status'), conclusion = run.conclusion === null ? '' : enumValue(run.conclusion, 'check conclusion').toLowerCase();
        checks.push({ name: text(run.name, 'check name'), status: status.toLowerCase(), conclusion, url: text(run.url, 'check link'), sha: commit });
    }
    return { linkedIssues: closingDirectives(body), number: node.number, title: text(node.title, 'PR title'), state: mapped(PR_STATES, node.state, 'PR state'), draft: node.isDraft, author: restLogin(node.author, `#${node.number}`),
        head: node.headRefOid, base: text(node.baseRefName, 'PR base'), url: text(node.url, 'PR link'), mergedAt: node.mergedAt || '', mergeable: mapped(MERGEABLE, node.mergeable, 'PR mergeability'),
        ...githubPRDescription(body),
        reviews: reviews.map(review => ({ author: restLogin(review.author, `#${node.number} review`), state: enumValue(review.state, 'review state'), commit: isOid(review.commit?.oid) ? review.commit.oid : fail(`#${node.number} review commit is unavailable`) })),
        checks: [...checks, ...statusRows(contexts, commit)] };
}
