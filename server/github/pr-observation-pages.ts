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

/** A head read by OID, first page or suite continuation: the captured commit itself. A missing or inaccessible commit fails. */
export function commitOf(data: any, repository: string, head: string) {
    const commit = repositoryOf(data, repository).object;
    if (commit?.__typename !== 'Commit' || commit.oid !== head) fail(`commit ${head} is missing or inaccessible`);
    return commit;
}

/**
 * The commit a root page embeds, when it is the captured head. A well-formed empty list, or one valid commit with
 * another OID (a fork's or a deleted ref's head, a truncated list), gives undefined: the head is then read by OID and
 * the embedded data is discarded. Missing fields, a malformed OID, a null node or more than one commit fail.
 */
export function embeddedHead(node: any, head: string): any | undefined {
    const commits = node?.commits?.nodes;
    if (!Array.isArray(commits) || commits.length > 1) fail(`#${node?.number} commit page is malformed`);
    if (!commits.length) return undefined;
    const commit = commits[0]?.commit;
    if (!commit || !isOid(commit.oid)) fail(`#${node.number} commit page is malformed`);
    return commit.oid === head ? commit : undefined;
}

/** Every suite read belongs to the captured head. */
export function suiteOnHead(suite: any, head: string) {
    if (suite?.commit?.oid !== head) fail(`check suite ${String(suite?.id)} is on another commit`);
    return suite;
}

/** A run continuation: the same suite, on the captured head, in the configured repository. */
export function suiteOf(data: any, repository: string, id: string, head: string) {
    const suite = data?.node;
    if (suite?.__typename !== 'CheckSuite' || suite.id !== id || suite.commit?.oid !== head || suite.repository?.nameWithOwner !== repository)
        fail(`run page for suite ${id} is for another suite, commit or repository`);
    return suite;
}

/** A head with more suites than REST's ref-level checks cover cannot be read as REST reads it. Exactly 1,000 is read. */
export function withinSuiteCoverage(suites: ConnectionPages, number: number, head: string, limit: number) {
    const total = suites.count('totalCount') ?? 0;
    if (total > limit) fail(`#${number} head ${head} has ${total} check suites, more than the ${limit} REST covers`);
}

/**
 * The head's statuses: an explicit null `status` is none. Otherwise the raw list, every entry with a distinct
 * nonempty ID and context name; its values are checked by the projection, before `EXPECTED` is dropped.
 */
export function statusContexts(commit: any, number: number): any[] {
    if (commit.status === null) return [];
    const contexts = commit.status?.contexts;
    if (!Array.isArray(contexts)) fail(`#${number} statuses are missing`);
    const ids = new Set<string>(), names = new Set<string>();
    for (const entry of contexts) {
        if (typeof entry?.id !== 'string' || !entry.id || ids.has(entry.id) || typeof entry.context !== 'string' || !entry.context || names.has(entry.context))
            fail(`#${number} statuses have a missing or repeated entry`);
        ids.add(entry.id); names.add(entry.context);
    }
    return contexts;
}
