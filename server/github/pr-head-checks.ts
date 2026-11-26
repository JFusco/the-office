import { commitOf, ConnectionPages, suiteOf, suiteOnHead, withinSuiteCoverage } from './pr-observation-pages';
import { MAX_SUITES, RUNS_QUERY, SUITES_QUERY } from './pr-observation-query';

/** One child request of the inventory (`pr-child`), quota-checked by its caller. */
export type ChildRequest = (query: string, variables: Record<string, string | number>) => Promise<any>;

/**
 * Every LATEST check run on a verified head, from its first suite page on. Suites continue on the head by OID; each
 * suite's runs continue by its node ID, LATEST on every page. Each suite must be on the head, and each run page from
 * that suite, head and repository; every connection keeps its counts, distinct nodes, cursor progress and final
 * coverage. A head with more suites than REST covers fails before any further check page is requested.
 */
export async function headCheckRuns(child: ChildRequest, repository: string, number: number, head: string, firstPage: unknown): Promise<any[]> {
    const [owner, name] = repository.split('/'), suites = new ConnectionPages(`#${number} check suites`), runs: any[] = [];
    let page = firstPage;
    for (let first = true; ; first = false) {
        const seen = suites.nodes.length, cursor = suites.add(page);
        if (first) withinSuiteCoverage(suites, number, head, MAX_SUITES);
        for (const suite of suites.nodes.slice(seen)) {
            suiteOnHead(suite, head);
            const suiteRuns = new ConnectionPages(`suite ${suite.id} runs`);
            for (let after = suiteRuns.add(suite.checkRuns); after;)
                after = suiteRuns.add(suiteOf(await child(RUNS_QUERY, { id: suite.id, runAfter: after }), repository, suite.id, head).checkRuns);
            runs.push(...suiteRuns.complete());
        }
        if (!cursor) break;
        page = commitOf(await child(SUITES_QUERY, { owner, name, oid: head, suiteAfter: cursor }), repository, head).checkSuites;
    }
    suites.complete();
    return runs;
}
