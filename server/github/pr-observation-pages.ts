/**
 * Structure checks for the open-PR inventory's GraphQL pages, before anything is projected. A page that is malformed,
 * repeats a node, names another repository, PR or head, or does not advance fails the whole read.
 */
const OID = /^[0-9a-f]{40}$/;
const fail = (what: string): never => { throw new Error(`GitHub PR inventory ${what}`); };
export const isOid = (value: unknown): value is string => typeof value === 'string' && OID.test(value);

/**
 * One connection across its pages: distinct node IDs, constant counts (`totalCount` and any `counted` field), and
 * cursors that are fresh and nonempty.
 */
export class ConnectionPages {
    private cursors = new Set<string>();
    private ids = new Set<string>();
    private counts = new Map<string, number>();
    readonly nodes: any[] = [];
    constructor(private what: string, private counted: string[] = []) { }
    /** Add one page; returns the cursor to continue from, or undefined after the last page. */
    add(page: any): string | undefined {
        if (!Array.isArray(page?.nodes) || typeof page.pageInfo?.hasNextPage !== 'boolean') fail(`${this.what} page is incomplete`);
        for (const key of ['totalCount', ...this.counted]) {
            const value = page[key], kept = this.counts.get(key);
            if (!Number.isInteger(value) || value < 0 || kept !== undefined && value !== kept) fail(`${this.what} count changed or is missing`);
            this.counts.set(key, value);
        }
        for (const node of page.nodes) {
            if (typeof node?.id !== 'string' || !node.id || this.ids.has(node.id)) fail(`${this.what} has a missing or repeated node`);
            this.ids.add(node.id);
            this.nodes.push(node);
        }
        if (!page.pageInfo.hasNextPage) return undefined;
        const cursor = page.pageInfo.endCursor;
        if (typeof cursor !== 'string' || !cursor || this.cursors.has(cursor) || !page.nodes.length) fail(`${this.what} pagination did not advance`);
        this.cursors.add(cursor);
        return cursor;
    }
    /** After the last page: every node the connection counted was read. */
    complete(): any[] {
        if (this.counts.get('totalCount') !== this.ids.size) fail(`${this.what} coverage is incomplete`);
        return this.nodes;
    }
    count(key: string): number | undefined { return this.counts.get(key); }
}

/** The repository a page answered for: exactly the configured one. */
export function repositoryOf(data: any, repository: string) {
    const found = data?.repository;
    if (!found || found.nameWithOwner !== repository) fail('answered for another repository');
    return found;
}

/** A root page's PR: its identity in this repository and a 40-hex head. */
export function prIdentity(node: any, repository: string): { number: number; head: string } {
    if (!Number.isInteger(node?.number) || node.number <= 0 || node.baseRepository?.nameWithOwner !== repository || !isOid(node.headRefOid))
        fail('has a PR without its identity or head');
    return { number: node.number, head: node.headRefOid };
}

/** A review continuation: the same PR, still at the captured head. */
export function reviewsOf(data: any, repository: string, number: number, head: string) {
    const pr = repositoryOf(data, repository).pullRequest;
    if (pr?.number !== number || pr.headRefOid !== head) fail(`review page for #${number} is for another PR or head`);
    return pr.reviews;
}

/** A context continuation: the captured commit itself, found by OID. A missing or inaccessible commit fails. */
export function rollupOf(data: any, repository: string, head: string) {
    const commit = repositoryOf(data, repository).object;
    if (commit?.__typename !== 'Commit' || commit.oid !== head) fail(`commit ${head} is missing or inaccessible`);
    return commit.statusCheckRollup;
}

/** The first rollup page embedded in a root page, when its one commit is the captured head; undefined when no commit is listed. */
export function embeddedRollup(node: any, head: string): { rollup: any } | undefined {
    const commits = node?.commits?.nodes;
    if (!Array.isArray(commits) || commits.length > 1) fail(`#${node?.number} commit page is malformed`);
    if (!commits.length) return undefined;
    if (commits[0]?.commit?.oid !== head) fail(`#${node.number} last commit is not its head`);
    return { rollup: commits[0].commit.statusCheckRollup };
}

/** A rollup's contexts connection, counting check runs and statuses apart. */
export const contextPages = (number: number) => new ConnectionPages(`#${number} checks`, ['checkRunCount', 'statusContextCount']);
/** Context counts against the distinct nodes read: check runs and statuses each as the connection said. */
export function reconcileContexts(contexts: ConnectionPages): any[] {
    const nodes = contexts.complete();
    const runs = nodes.filter(node => node.__typename === 'CheckRun').length, statuses = nodes.filter(node => node.__typename === 'StatusContext').length;
    if (runs + statuses !== nodes.length || contexts.count('checkRunCount') !== runs || contexts.count('statusContextCount') !== statuses) fail('check counts do not match the contexts read');
    return nodes;
}
