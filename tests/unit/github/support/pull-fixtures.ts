import { CHILD_PAGE, CONTEXT_PAGE, CONTEXTS_QUERY, PR_PAGE, REVIEW_PAGE, REVIEWS_QUERY, ROOT_QUERY } from '../../../../server/github/pr-observation-query';

export const REPOSITORY = 'JFusco/brain';
const url = (number: number) => `https://github.com/${REPOSITORY}/pull/${number}`;
const job = (run: number, id: number) => `https://github.com/${REPOSITORY}/actions/runs/${run}/job/${id}`;
export const H22 = 'a2'.repeat(20), O22 = '0a'.repeat(20), H21 = 'b1'.repeat(20), H20 = 'c0'.repeat(20), H30 = 'd3'.repeat(20);
/** A stacked PR's directive past the 8,192-byte stored description. */
export const LONG_BODY = `${'Parent work. '.repeat(700)}\n\nCloses #11`;

/** One open PR as GitHub's GraphQL API would send it, with every review and head context it has. */
export type GraphqlPR = { node: Record<string, any>; reviews: any[]; rollup: any[] | null; commit?: string | null };
/** The same PR as GitHub's REST API sends it: detail, reviews, check-run pages and statuses (newest first). */
export type RestPR = { detail: any; reviews: any[]; checks: any[]; statuses: any[] };

const prNode = (number: number, fields: Record<string, any>): Record<string, any> => ({ id: `PR_${number}`, number, url: url(number), state: 'OPEN', isDraft: false, mergedAt: null, baseRefName: 'main',
    baseRepository: { nameWithOwner: REPOSITORY }, author: { __typename: 'User', login: 'JFusco' }, ...fields });
const detail = (number: number, fields: Record<string, any>): any => ({ number, html_url: url(number), state: 'open', draft: false, merged_at: null, base: { ref: 'main' }, user: { login: 'JFusco' }, ...fields });

/** #22: a bot's PR with a bot and an older-commit review, unknown mergeability, a run link that is not its details link and a status without a URL. */
export const pr22 = {
    graphql: { node: prNode(22, { title: 'chore(deps): bump eslint', body: 'Closes #11\n\nBumps eslint. Bearer private-token', mergeable: 'UNKNOWN', headRefOid: H22, author: { __typename: 'Bot', login: 'dependabot' } }),
        reviews: [{ id: 'PRR_221', state: 'COMMENTED', author: { __typename: 'Bot', login: 'copilot-pull-request-reviewer' }, commit: { oid: O22 } }, { id: 'PRR_222', state: 'APPROVED', author: { __typename: 'User', login: 'JFusco' }, commit: { oid: H22 } }],
        rollup: [{ __typename: 'CheckRun', id: 'CR_2201', name: 'build', status: 'COMPLETED', conclusion: 'SUCCESS', url: job(220, 2201) },
            { __typename: 'StatusContext', id: 'SC_221', context: 'deploy/preview', state: 'SUCCESS', targetUrl: null, createdAt: '2026-11-26T09:10:00Z' }] } satisfies GraphqlPR,
    rest: { detail: detail(22, { title: 'chore(deps): bump eslint', body: 'Closes #11\n\nBumps eslint. Bearer private-token', mergeable: null, head: { sha: H22 }, user: { login: 'dependabot[bot]', type: 'Bot' } }),
        reviews: [{ user: { login: 'copilot-pull-request-reviewer[bot]' }, state: 'COMMENTED', commit_id: O22 }, { user: { login: 'JFusco' }, state: 'APPROVED', commit_id: H22 }],
        checks: [{ total_count: 1, check_runs: [{ name: 'build', status: 'completed', conclusion: 'success', html_url: job(220, 2201), details_url: 'https://ci.example.test/build/2201', head_sha: H22 }] }],
        statuses: [{ context: 'deploy/preview', state: 'success', target_url: null, created_at: '2026-11-26T09:10:00Z' }] } satisfies RestPR,
};
/** #21: a conflicting draft with a queued check and no review. */
export const pr21 = {
    graphql: { node: prNode(21, { title: 'Draft parser rewrite', body: 'Fixes #11', isDraft: true, mergeable: 'CONFLICTING', headRefOid: H21 }), reviews: [],
        rollup: [{ __typename: 'CheckRun', id: 'CR_2101', name: 'test', status: 'QUEUED', conclusion: null, url: job(210, 2101) }] } satisfies GraphqlPR,
    rest: { detail: detail(21, { title: 'Draft parser rewrite', body: 'Fixes #11', draft: true, mergeable: false, head: { sha: H21 } }), reviews: [],
        checks: [{ total_count: 1, check_runs: [{ name: 'test', status: 'queued', conclusion: null, html_url: job(210, 2101), head_sha: H21 }] }], statuses: [] } satisfies RestPR,
};
/** #20: a stacked, mergeable PR whose directive is past the stored description, on a head with no rollup. */
export const pr20 = {
    graphql: { node: prNode(20, { title: 'Child of #19', body: LONG_BODY, mergeable: 'MERGEABLE', headRefOid: H20, baseRefName: 'codex/19-parent' }), reviews: [], rollup: null } satisfies GraphqlPR,
    rest: { detail: detail(20, { title: 'Child of #19', body: LONG_BODY, mergeable: true, head: { sha: H20 }, base: { ref: 'codex/19-parent' } }), reviews: [], checks: [{ total_count: 0, check_runs: [] }], statuses: [] } satisfies RestPR,
};

const A1 = { __typename: 'CheckRun', id: 'CR_A1', name: 'test', status: 'COMPLETED', conclusion: 'FAILURE', url: job(300, 1) };
const A2 = { __typename: 'CheckRun', id: 'CR_A2', name: 'test', status: 'COMPLETED', conclusion: 'SUCCESS', url: job(300, 2) };
const B = { __typename: 'CheckRun', id: 'CR_B', name: 'test', status: 'COMPLETED', conclusion: 'SUCCESS', url: job(301, 1) };
const olderStatus = { __typename: 'StatusContext', id: 'SC_1', context: 'test', state: 'PENDING', targetUrl: 'https://ci.example.test/s/1', createdAt: '2026-11-26T10:01:00Z' };
const newerStatus = { __typename: 'StatusContext', id: 'SC_2', context: 'test', state: 'SUCCESS', targetUrl: 'https://ci.example.test/s/2', createdAt: '2026-11-26T10:05:00Z' };
const restRun = (run: any) => ({ name: run.name, status: run.status.toLowerCase(), conclusion: run.conclusion.toLowerCase(), html_url: run.url, head_sha: H30 });
const restStatus = (status: any) => ({ context: status.context, state: status.state.toLowerCase(), target_url: status.targetUrl, created_at: status.createdAt });
/**
 * #30 on one unchanged head across refreshes: failed run A1 beside same-name run B from another suite, then A1
 * rerun as A2 with a newer same-name status; then a base move makes it conflict. REST lists B before A2.
 */
export const pr30 = (refresh: 1 | 2 | 3) => ({
    graphql: { node: prNode(30, { title: 'Rerun fixture', body: '', mergeable: refresh === 3 ? 'CONFLICTING' : 'MERGEABLE', headRefOid: H30 }), reviews: [],
        // Past the first page of contexts, so B and A2 arrive on different pages.
        rollup: refresh === 1 ? [...filler(CONTEXT_PAGE - 1), A1, B, olderStatus] : [...filler(CONTEXT_PAGE - 1), B, A2, newerStatus, olderStatus] } satisfies GraphqlPR,
    rest: { detail: detail(30, { title: 'Rerun fixture', body: '', mergeable: refresh !== 3, head: { sha: H30 } }), reviews: [],
        checks: [{ total_count: CONTEXT_PAGE + 1, check_runs: [...filler(CONTEXT_PAGE - 1).map(restRun), ...(refresh === 1 ? [A1, B] : [B, A2]).map(restRun)] }],
        statuses: (refresh === 1 ? [olderStatus] : [newerStatus, olderStatus]).map(restStatus) } satisfies RestPR,
});
/** Distinctly named passing runs that push the interesting contexts onto a continuation. */
function filler(count: number) { return Array.from({ length: count }, (_, i) => ({ __typename: 'CheckRun', id: `CR_F${i}`, name: `lint-${i}`, status: 'COMPLETED', conclusion: 'SUCCESS', url: job(399, i) })); }

/** gh's `--include` output: a header block, then the body. */
export const included = (body: unknown, status = '200 OK') => `HTTP/2.0 ${status}\r\nContent-Type: application/json; charset=utf-8\r\nX-Ratelimit-Resource: graphql\r\n\r\n${JSON.stringify(body)}`;
export const rate = (remaining = 4990, cost = 1, resetAt = '2026-11-26T14:00:00Z') => ({ cost, limit: 5000, used: 5000 - remaining, remaining, resetAt });

function connection(list: any[], start: number, size: number, prefix: string, extra: Record<string, any> = {}) {
    const nodes = list.slice(start, start + size), end = start + nodes.length;
    return { totalCount: list.length, ...extra, pageInfo: { hasNextPage: end < list.length, endCursor: nodes.length ? `${prefix}:${end}` : null }, nodes };
}
const contexts = (list: any[], start: number, size: number, oid: string) => connection(list, start, size, `cx:${oid}`,
    { checkRunCount: list.filter(node => node.__typename === 'CheckRun').length, statusContextCount: list.filter(node => node.__typename === 'StatusContext').length });
const offset = (cursor: string | undefined) => cursor ? Number(cursor.split(':').at(-1)) : 0;

/**
 * GitHub's GraphQL API over these open PRs, for the monitor's three queries: root pages newest first with first child
 * pages embedded, review continuations by PR number and context continuations by commit OID. `answer` may change a
 * response before it is sent; `cost` gives each response's rateLimit.
 */
export type Answer = (kind: 'root' | 'reviews' | 'contexts', body: any, variables: any) => any;
export function graphqlPulls(prs: () => GraphqlPR[], { answer = (_kind: string, body: any) => body, cost = () => rate() }: { answer?: Answer; cost?: (kind: string) => any } = {}) {
    const calls: { kind: string; variables: any }[] = [];
    const respond = (input: string) => {
        const { query, variables } = JSON.parse(input);
        if (query === ROOT_QUERY) {
            calls.push({ kind: 'root', variables });
            const all = prs(), start = offset(variables.after), page = connection(all, start, PR_PAGE, 'pr');
            const nodes = page.nodes.map(pr => ({ ...pr.node, reviews: connection(pr.reviews, 0, REVIEW_PAGE, `rv:${pr.node.number}`),
                commits: { nodes: pr.commit === null ? [] : [{ commit: { oid: pr.commit ?? pr.node.headRefOid, statusCheckRollup: pr.rollup === null ? null : { contexts: contexts(pr.rollup, 0, CONTEXT_PAGE, pr.node.headRefOid) } } }] } }));
            return answer('root', { data: { rateLimit: cost('root'), repository: { nameWithOwner: REPOSITORY, pullRequests: { ...page, nodes } } } }, variables);
        }
        if (query === REVIEWS_QUERY) {
            calls.push({ kind: 'reviews', variables });
            const pr = prs().find(pr => pr.node.number === variables.number);
            return answer('reviews', { data: { rateLimit: cost('reviews'), repository: { nameWithOwner: REPOSITORY, pullRequest: pr && { number: pr.node.number, headRefOid: pr.node.headRefOid, reviews: connection(pr.reviews, offset(variables.after), CHILD_PAGE, `rv:${pr.node.number}`) } } } }, variables);
        }
        if (query === CONTEXTS_QUERY) {
            calls.push({ kind: 'contexts', variables });
            const pr = prs().find(pr => pr.node.headRefOid === variables.oid);
            const object = pr && { __typename: 'Commit', oid: variables.oid, statusCheckRollup: pr.rollup === null ? null : { contexts: contexts(pr.rollup, offset(variables.after), CHILD_PAGE, variables.oid) } };
            return answer('contexts', { data: { rateLimit: cost('contexts'), repository: { nameWithOwner: REPOSITORY, object: object ?? null } } }, variables);
        }
    };
    return { calls, respond };
}

/** Whether a `gh api graphql --input -` call is the monitor's open-PR inventory (root or continuation). */
export const isInventoryQuery = (options: any) => typeof options?.input === 'string' && [ROOT_QUERY, REVIEWS_QUERY, CONTEXTS_QUERY].includes(JSON.parse(options.input).query);
/** A repository with no open PR, as `gh api graphql --include` prints the inventory's one root page. */
export const noOpenPRs = (repository: string, cost = 1) => included({ data: { rateLimit: rate(4990, cost), repository: { nameWithOwner: repository, pullRequests: { totalCount: 0, pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } } } });
/** An open PR on its own head with `reviews` reviews and `contexts` passing check runs. */
export function generatedPR(number: number, { reviews = 0, contexts = 0 } = {}): GraphqlPR {
    const head = number.toString(16).padStart(40, '0');
    return { node: prNode(number, { title: `PR ${number}`, body: '', mergeable: 'MERGEABLE', headRefOid: head }),
        reviews: Array.from({ length: reviews }, (_, i) => ({ id: `PRR_${number}_${i}`, state: 'COMMENTED', author: { __typename: 'User', login: `reviewer-${i}` }, commit: { oid: head } })),
        rollup: Array.from({ length: contexts }, (_, i) => ({ __typename: 'CheckRun', id: `CR_${number}_${i}`, name: `check-${i}`, status: 'COMPLETED', conclusion: 'SUCCESS', url: job(number, i) })) };
}
