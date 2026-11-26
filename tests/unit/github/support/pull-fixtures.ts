import { CHILD_PAGE, HEAD_QUERY, PR_PAGE, REVIEW_PAGE, REVIEWS_QUERY, ROOT_QUERY, RUN_PAGE, RUNS_QUERY, SUITE_PAGE, SUITES_QUERY } from '../../../../server/github/pr-observation-query';

export const REPOSITORY = 'JFusco/brain';
const url = (number: number) => `https://github.com/${REPOSITORY}/pull/${number}`;
export const job = (run: number, id: number) => `https://github.com/${REPOSITORY}/actions/runs/${run}/job/${id}`;
export const H22 = 'a2'.repeat(20), O22 = '0a'.repeat(20), H21 = 'b1'.repeat(20), H20 = 'c0'.repeat(20), H30 = 'd3'.repeat(20);
/** A stacked PR's directive past the 8,192-byte stored description. */
export const LONG_BODY = `${'Parent work. '.repeat(700)}\n\nCloses #11`;

/** A LATEST check run as GraphQL sends it; `latest: false` marks a superseded run only an unfiltered selection returns. */
export type GraphqlRun = { id: string; databaseId: number; name: string; status: string; conclusion: string | null; permalink: string; latest?: false };
/** A check suite on the head (or on `commit`, to model a suite on another commit) with every run it holds. */
export type GraphqlSuite = { id: string; commit?: string; runs: GraphqlRun[] };
/**
 * One open PR as GitHub's GraphQL API would send it: its fields, every review, the head's suites and its statuses (the
 * latest per context; `null` for no status). `commit` is the commit the root page lists: the head by default, `null`
 * for none, or another OID, whose `decoy` data the reader must never use.
 */
export type GraphqlPR = { node: Record<string, any>; reviews: any[]; suites: GraphqlSuite[]; statuses: any[] | null; commit?: string | null; decoy?: { status: any; checkSuites: any } };
/** The same PR as GitHub's REST API sends it: detail, reviews, check-run pages (`filter=latest`, REST order) and status history (newest first). */
export type RestPR = { detail: any; reviews: any[]; checks: any[]; statuses: any[] };

const prNode = (number: number, fields: Record<string, any>): Record<string, any> => ({ id: `PR_${number}`, number, url: url(number), state: 'OPEN', isDraft: false, mergedAt: null, baseRefName: 'main',
    baseRepository: { nameWithOwner: REPOSITORY }, author: { __typename: 'User', login: 'JFusco' }, ...fields });
const detail = (number: number, fields: Record<string, any>): any => ({ number, html_url: url(number), state: 'open', draft: false, merged_at: null, base: { ref: 'main' }, user: { login: 'JFusco' }, ...fields });
export const run = (databaseId: number, name: string, status: string, conclusion: string | null, permalink: string, extra: Partial<GraphqlRun> = {}): GraphqlRun => ({ id: `CR_${databaseId}`, databaseId, name, status, conclusion, permalink, ...extra });
/** A REST check run from the same values, for an oracle that never passes through the GraphQL adapter. */
export const restRun = (r: GraphqlRun, sha: string, extra: object = {}) => ({ id: r.databaseId, name: r.name, status: r.status.toLowerCase(), conclusion: r.conclusion && r.conclusion.toLowerCase(), html_url: r.permalink, head_sha: sha, ...extra });
export const status = (id: string, context: string, state: string, targetUrl: string | null, createdAt: string) => ({ id, context, state, targetUrl, createdAt });

/** #22: a bot's PR with a bot and an older-commit review, unknown mergeability, a run link that is not its details link and a status without a URL. */
const B2201 = run(2201, 'build', 'COMPLETED', 'SUCCESS', job(220, 2201));
export const pr22 = {
    graphql: { node: prNode(22, { title: 'chore(deps): bump eslint', body: 'Closes #11\n\nBumps eslint. Bearer private-token', mergeable: 'UNKNOWN', headRefOid: H22, author: { __typename: 'Bot', login: 'dependabot' } }),
        reviews: [{ id: 'PRR_221', state: 'COMMENTED', author: { __typename: 'Bot', login: 'copilot-pull-request-reviewer' }, commit: { oid: O22 } }, { id: 'PRR_222', state: 'APPROVED', author: { __typename: 'User', login: 'JFusco' }, commit: { oid: H22 } }],
        suites: [{ id: 'CS_220', runs: [B2201] }], statuses: [status('SC_221', 'deploy/preview', 'SUCCESS', null, '2026-11-26T09:10:00Z')] } satisfies GraphqlPR,
    rest: { detail: detail(22, { title: 'chore(deps): bump eslint', body: 'Closes #11\n\nBumps eslint. Bearer private-token', mergeable: null, head: { sha: H22 }, user: { login: 'dependabot[bot]', type: 'Bot' } }),
        reviews: [{ user: { login: 'copilot-pull-request-reviewer[bot]' }, state: 'COMMENTED', commit_id: O22 }, { user: { login: 'JFusco' }, state: 'APPROVED', commit_id: H22 }],
        checks: [{ total_count: 1, check_runs: [restRun(B2201, H22, { details_url: 'https://ci.example.test/build/2201' })] }],
        statuses: [{ context: 'deploy/preview', state: 'success', target_url: null, created_at: '2026-11-26T09:10:00Z' }] } satisfies RestPR,
};
/** #21: a conflicting draft with a queued check and no review. */
const T2101 = run(2101, 'test', 'QUEUED', null, job(210, 2101));
export const pr21 = {
    graphql: { node: prNode(21, { title: 'Draft parser rewrite', body: 'Fixes #11', isDraft: true, mergeable: 'CONFLICTING', headRefOid: H21 }), reviews: [], suites: [{ id: 'CS_210', runs: [T2101] }], statuses: [] } satisfies GraphqlPR,
    rest: { detail: detail(21, { title: 'Draft parser rewrite', body: 'Fixes #11', draft: true, mergeable: false, head: { sha: H21 } }), reviews: [],
        checks: [{ total_count: 1, check_runs: [restRun(T2101, H21)] }], statuses: [] } satisfies RestPR,
};
/** #20: a stacked, mergeable PR whose directive is past the stored description, on a head with no suites and no status. */
export const pr20 = {
    graphql: { node: prNode(20, { title: 'Child of #19', body: LONG_BODY, mergeable: 'MERGEABLE', headRefOid: H20, baseRefName: 'codex/19-parent' }), reviews: [], suites: [], statuses: null } satisfies GraphqlPR,
    rest: { detail: detail(20, { title: 'Child of #19', body: LONG_BODY, mergeable: true, head: { sha: H20 }, base: { ref: 'codex/19-parent' } }), reviews: [], checks: [{ total_count: 0, check_runs: [] }], statuses: [] } satisfies RestPR,
};

const A1 = run(3001, 'test', 'COMPLETED', 'FAILURE', job(300, 3001)), A2 = run(3003, 'test', 'COMPLETED', 'SUCCESS', job(300, 3003)), B = run(3002, 'test', 'COMPLETED', 'SUCCESS', job(301, 3002));
const older = status('SC_1', 'test', 'PENDING', 'https://ci.example.test/s/1', '2026-11-26T10:01:00Z'), newer = status('SC_2', 'test', 'SUCCESS', 'https://ci.example.test/s/2', '2026-11-26T10:05:00Z');
const restStatus = (s: any) => ({ context: s.context, state: s.state.toLowerCase(), target_url: s.targetUrl, created_at: s.createdAt });
/** Nine passing suites of one run each, so the interesting suites need a suite continuation. */
const filler = Array.from({ length: SUITE_PAGE - 1 }, (_, i) => ({ id: `CS_F${i}`, runs: [run(2900 + i, `lint-${i}`, 'COMPLETED', 'SUCCESS', job(399, 2900 + i))] }));
/**
 * #30 on one unchanged head across refreshes: failed run A1 beside same-name run B from another suite, then A1 rerun as
 * A2 in its suite with a newer same-name status; then a base move makes it conflict. B's suite is on the first suite
 * page, A's on the second. GraphQL lists the latest status per context; REST keeps the history.
 */
export const pr30 = (refresh: 1 | 2 | 3) => {
    const a = refresh === 1 ? [A1] : [{ ...A1, latest: false as const }, A2], latestA = refresh === 1 ? [A1] : [A2];
    return {
        graphql: { node: prNode(30, { title: 'Rerun fixture', body: '', mergeable: refresh === 3 ? 'CONFLICTING' : 'MERGEABLE', headRefOid: H30 }), reviews: [],
            suites: [...filler, { id: 'CS_301', runs: [B] }, { id: 'CS_300', runs: a }], statuses: [refresh === 1 ? older : newer] } satisfies GraphqlPR,
        rest: { detail: detail(30, { title: 'Rerun fixture', body: '', mergeable: refresh !== 3, head: { sha: H30 } }), reviews: [],
            checks: [{ total_count: 11, check_runs: [...latestA, B, ...filler.map(s => s.runs[0])].sort((x, y) => y.databaseId - x.databaseId).map(r => restRun(r, H30)) }],
            statuses: (refresh === 1 ? [older] : [newer, older]).map(restStatus) } satisfies RestPR,
    };
};

/** gh's `--include` output: a header block, then the body. */
export const included = (body: unknown, status = '200 OK') => `HTTP/2.0 ${status}\r\nContent-Type: application/json; charset=utf-8\r\nX-Ratelimit-Resource: graphql\r\n\r\n${JSON.stringify(body)}`;
export const rate = (remaining = 4990, cost = 1, resetAt = '2026-11-26T14:00:00Z') => ({ cost, limit: 5000, used: 5000 - remaining, remaining, resetAt });

const cursor = (kind: string, parent: string, end: number) => `${kind}|${parent}|${end}`;
function connection(list: any[], start: number, size: number, kind: string, parent: string) {
    const nodes = list.slice(start, start + size), end = start + nodes.length;
    return { totalCount: list.length, pageInfo: { hasNextPage: end < list.length, endCursor: nodes.length ? cursor(kind, parent, end) : null }, nodes };
}
const strip = ({ latest: _latest, ...node }: GraphqlRun) => node;
export type Answer = (kind: 'root' | 'reviews' | 'head' | 'suites' | 'runs', body: any, variables: any) => any;
export type Kind = Parameters<Answer>[0];

/**
 * GitHub's GraphQL API over these open PRs, for the monitor's five queries: root pages newest first with first child
 * pages embedded, review continuations by PR number, the head by OID, suite continuations by OID and run continuations
 * by suite ID. Only a selection that asks for LATEST runs gets LATEST runs. A cursor is bound to its connection and
 * parent: one sent for another PR, head or suite is refused, as GitHub refuses a cursor that is not its own. `answer`
 * may change a response before it is sent; `cost` gives each response's rateLimit.
 */
export function graphqlPulls(prs: () => GraphqlPR[], { answer = (_kind, body) => body, cost = () => rate() }: { answer?: Answer; cost?: (kind: Kind) => any } = {}) {
    const calls: { kind: Kind; variables: any }[] = [];
    const offset = (value: string | undefined, kind: string, parent: string) => {
        if (!value) return 0;
        const [k, p, end] = value.split('|');
        if (k !== kind || p !== parent) throw new Error(`cursor ${value} is not one of ${kind} ${parent}`);
        return Number(end);
    };
    const respond = (input: string) => {
        const { query, variables } = JSON.parse(input), latest = query.includes('filterBy:{checkType:LATEST}');
        const runs = (suite: GraphqlSuite, start: number, size: number) => {
            const list = (latest ? suite.runs.filter(r => r.latest !== false) : suite.runs).map(strip);
            return connection(list, start, size, 'run', suite.id);
        };
        const suites = (pr: GraphqlPR, start: number, size: number) => {
            const page = connection(pr.suites, start, size, 'suite', pr.node.headRefOid);
            return { ...page, nodes: page.nodes.map((s: GraphqlSuite) => ({ id: s.id, commit: { oid: s.commit ?? pr.node.headRefOid }, checkRuns: runs(s, 0, RUN_PAGE) })) };
        };
        const head = (pr: GraphqlPR, first: number) => ({ oid: pr.node.headRefOid, status: pr.statuses === null ? null : { contexts: pr.statuses }, checkSuites: suites(pr, 0, first) });
        const refuse = (kind: Kind, error: unknown) => answer(kind, { data: null, errors: [{ message: String(error instanceof Error ? error.message : error) }] }, variables);
        const send = (kind: Kind, build: () => any) => { calls.push({ kind, variables }); try { return answer(kind, { data: { rateLimit: cost(kind), ...build() } }, variables); } catch (error) { return refuse(kind, error); } };
        const all = prs(), byHead = (oid: string) => all.find(pr => pr.node.headRefOid === oid);
        if (query === ROOT_QUERY) return send('root', () => {
            const page = connection(all, offset(variables.after, 'pr', 'root'), PR_PAGE, 'pr', 'root');
            return { repository: { nameWithOwner: REPOSITORY, pullRequests: { ...page, nodes: page.nodes.map((pr: GraphqlPR) => ({ ...pr.node, reviews: connection(pr.reviews, 0, REVIEW_PAGE, 'review', String(pr.node.number)),
                commits: { nodes: pr.commit === null ? [] : [{ commit: pr.commit && pr.commit !== pr.node.headRefOid ? { oid: pr.commit, ...(pr.decoy ?? { status: null, checkSuites: { totalCount: 0, pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } }) } : head(pr, SUITE_PAGE) }] } })) } } };
        });
        if (query === REVIEWS_QUERY) return send('reviews', () => {
            const pr = all.find(pr => pr.node.number === variables.number);
            return { repository: { nameWithOwner: REPOSITORY, pullRequest: pr && { number: pr.node.number, headRefOid: pr.node.headRefOid, reviews: connection(pr.reviews, offset(variables.after, 'review', String(pr.node.number)), CHILD_PAGE, 'review', String(pr.node.number)) } } };
        });
        if (query === HEAD_QUERY) return send('head', () => {
            const pr = byHead(variables.oid);
            return { repository: { nameWithOwner: REPOSITORY, object: pr ? { __typename: 'Commit', ...head(pr, SUITE_PAGE) } : null } };
        });
        if (query === SUITES_QUERY) return send('suites', () => {
            const pr = byHead(variables.oid);
            return { repository: { nameWithOwner: REPOSITORY, object: pr ? { __typename: 'Commit', oid: variables.oid, checkSuites: suites(pr, offset(variables.suiteAfter, 'suite', variables.oid), SUITE_PAGE) } : null } };
        });
        if (query === RUNS_QUERY) return send('runs', () => {
            const owner = all.find(pr => pr.suites.some(s => s.id === variables.id)), suite = owner?.suites.find(s => s.id === variables.id);
            return { node: suite ? { __typename: 'CheckSuite', id: suite.id, commit: { oid: suite.commit ?? owner!.node.headRefOid }, repository: { nameWithOwner: REPOSITORY },
                checkRuns: runs(suite, offset(variables.runAfter, 'run', suite.id), CHILD_PAGE) } : null };
        });
    };
    return { calls, respond };
}

/** Whether a `gh api graphql --input -` call is the monitor's open-PR inventory (root or child). */
export const isInventoryQuery = (options: any) => typeof options?.input === 'string' && [ROOT_QUERY, REVIEWS_QUERY, HEAD_QUERY, SUITES_QUERY, RUNS_QUERY].includes(JSON.parse(options.input).query);
/** A repository with no open PR, as `gh api graphql --include` prints the inventory's one root page. */
export const noOpenPRs = (repository: string, cost = 1) => included({ data: { rateLimit: rate(4990, cost), repository: { nameWithOwner: repository, pullRequests: { totalCount: 0, pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } } } });
/** An open PR on its own head with `reviews` reviews and one suite per entry of `suites`, holding that many passing LATEST runs. */
export function generatedPR(number: number, { reviews = 0, suites = [] as number[], commit }: { reviews?: number; suites?: number[]; commit?: string | null } = {}): GraphqlPR {
    const head = number.toString(16).padStart(40, '0');
    return { node: prNode(number, { title: `PR ${number}`, body: '', mergeable: 'MERGEABLE', headRefOid: head }), commit,
        reviews: Array.from({ length: reviews }, (_, i) => ({ id: `PRR_${number}_${i}`, state: 'COMMENTED', author: { __typename: 'User', login: `reviewer-${i}` }, commit: { oid: head } })),
        suites: suites.map((count, s) => ({ id: `CS_${number}_${s}`, runs: Array.from({ length: count }, (_, i) => run(number * 1_000_000 + s * 10_000 + i + 1, `check-${s}-${i}`, 'COMPLETED', 'SUCCESS', job(number, s * 10_000 + i))) })),
        statuses: [] };
}
