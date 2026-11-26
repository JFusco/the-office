import type { Store } from '../store/store';
import { projectGraphql, type Execute } from '../delivery/board/project-graphql';
import { withGitHubOperation, type GitHubOperation } from './call-scope';
import { responseBody } from './graphql-answer';
import { headCheckRuns } from './pr-head-checks';
import { commitOf, ConnectionPages, embeddedHead, prIdentity, repositoryOf, reviewsOf, statusContexts } from './pr-observation-pages';
import { HEAD_QUERY, REVIEWS_QUERY, ROOT_QUERY } from './pr-observation-query';
import type { QuotaCheck } from './quota-hold';

/** One open PR as the inventory read it: its fields, every review, and the LATEST runs and statuses of the commit verified as its head. */
export interface ObservedPR { node: any; reviews: any[]; commit: string; checkRuns: any[]; statuses: any[] }

/** The PR page executor: `--include`, so the metered runner reads the call's balance; the helper gets the JSON body. */
const includeBody = (execute: Execute): Execute => async (program, args, options) => responseBody(await execute(program, [...args, '--include'], options), true);

/**
 * The configured repository's complete open-PR inventory, newest created first. Each root page is a `pr-root`
 * request; each review continuation, head read by OID, suite continuation and run continuation is a `pr-child`
 * request (`./pr-head-checks.ts`). `check` is asked before every request; a hold it raises discards everything read
 * so far. Reviews continue on the same PR at the captured head. A root page's commit is used only when it is that
 * head; otherwise the head is read by its OID. Only a complete, consistent inventory is returned.
 */
export async function readOpenPRs(store: Store, execute: Execute, check: QuotaCheck = () => { }): Promise<ObservedPR[]> {
    const repository = store.project.repository, [owner, name] = repository.split('/'), page = includeBody(execute);
    const request = async (operation: GitHubOperation, query: string, variables: Record<string, string | number>) => {
        check();
        return withGitHubOperation(operation, () => projectGraphql(store, page, query, variables));
    };
    const child = (query: string, variables: Record<string, string | number>) => request('pr-child', query, variables);
    const complete = async (node: any): Promise<ObservedPR> => {
        const { number, head } = prIdentity(node, repository);
        const reviews = new ConnectionPages(`#${number} reviews`);
        for (let cursor = reviews.add(node.reviews); cursor;)
            cursor = reviews.add(reviewsOf(await child(REVIEWS_QUERY, { owner, name, number, after: cursor }), repository, number, head));
        const commit = embeddedHead(node, head) ?? commitOf(await child(HEAD_QUERY, { owner, name, oid: head }), repository, head);
        const statuses = statusContexts(commit, number);
        const checkRuns = await headCheckRuns(child, repository, number, head, commit.checkSuites);
        return { node, reviews: reviews.complete(), commit: head, checkRuns, statuses };
    };
    const roots = new ConnectionPages('open PRs'), observed: ObservedPR[] = [];
    let after: string | undefined;
    do {
        const data = await request('pr-root', ROOT_QUERY, { owner, name, ...(after ? { after } : {}) }), first = roots.nodes.length;
        after = roots.add(repositoryOf(data, repository).pullRequests);
        for (const node of roots.nodes.slice(first)) observed.push(await complete(node));
    } while (after);
    roots.complete();
    return observed;
}
