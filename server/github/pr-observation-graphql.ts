import type { Store } from '../store/store';
import { projectGraphql, type Execute } from '../delivery/board/project-graphql';
import { withGitHubOperation, type GitHubOperation } from './call-scope';
import { responseBody } from './graphql-answer';
import { ConnectionPages, contextPages, embeddedRollup, prIdentity, reconcileContexts, repositoryOf, reviewsOf, rollupOf } from './pr-observation-pages';
import { CONTEXTS_QUERY, REVIEWS_QUERY, ROOT_QUERY } from './pr-observation-query';
import type { QuotaCheck } from './quota-hold';

/** One open PR as the inventory read it: its fields, every review, and every context of the commit verified as its head. */
export interface ObservedPR { node: any; reviews: any[]; contexts: any[]; commit: string }

/** The PR page executor: `--include`, so the metered runner reads the call's balance; the helper gets the JSON body. */
const includeBody = (execute: Execute): Execute => async (program, args, options) => responseBody(await execute(program, [...args, '--include'], options), true);

/**
 * The configured repository's complete open-PR inventory, newest created first. Each root page, and each review or
 * context continuation a PR needs, is one request (`pr-root`, `pr-child`). `check` is asked before every request; a
 * hold it raises discards everything read so far. Reviews continue on the same PR at the captured head; contexts
 * continue on the captured commit by OID. Only a complete, consistent inventory is returned.
 */
export async function readOpenPRs(store: Store, execute: Execute, check: QuotaCheck = () => { }): Promise<ObservedPR[]> {
    const repository = store.project.repository, [owner, name] = repository.split('/'), page = includeBody(execute);
    const request = async (operation: GitHubOperation, query: string, variables: Record<string, string | number>) => {
        check();
        return withGitHubOperation(operation, () => projectGraphql(store, page, query, { owner, name, ...variables }));
    };
    const complete = async (node: any): Promise<ObservedPR> => {
        const { number, head } = prIdentity(node, repository);
        const reviews = new ConnectionPages(`#${number} reviews`);
        for (let cursor = reviews.add(node.reviews); cursor;)
            cursor = reviews.add(reviewsOf(await request('pr-child', REVIEWS_QUERY, { number, after: cursor }), repository, number, head));
        // A head with no listed commit (a deleted ref) is read by OID from its first context page.
        const embedded = embeddedRollup(node, head);
        const rollup = embedded ? embedded.rollup : rollupOf(await request('pr-child', CONTEXTS_QUERY, { oid: head }), repository, head);
        if (rollup === null) return { node, reviews: reviews.complete(), contexts: [], commit: head };
        const contexts = contextPages(number);
        for (let cursor = contexts.add(rollup?.contexts); cursor;)
            cursor = contexts.add(rollupOf(await request('pr-child', CONTEXTS_QUERY, { oid: head, after: cursor }), repository, head)?.contexts);
        return { node, reviews: reviews.complete(), contexts: reconcileContexts(contexts), commit: head };
    };
    const roots = new ConnectionPages('open PRs'), observed: ObservedPR[] = [];
    let after: string | undefined;
    do {
        const data = await request('pr-root', ROOT_QUERY, after ? { after } : {}), first = roots.nodes.length;
        after = roots.add(repositoryOf(data, repository).pullRequests);
        for (const node of roots.nodes.slice(first)) observed.push(await complete(node));
    } while (after);
    roots.complete();
    return observed;
}
