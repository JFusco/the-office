import type { GitHubPR } from '../../src/shared';
import { withGitHubOperation } from './call-scope';
import { restPR } from './pr-rest-shape';
import type { QuotaCheck } from './quota-hold';

type Api = (path: string, paginate?: boolean) => Promise<any>;

/**
 * Rows for PRs the last observation had open and a complete inventory no longer lists, in their prior order. Each
 * is read by number once (`pr-terminal`). A close or merge reuses that detail and reads every review, check-run and
 * status page of the head it returned; a PR the detail still shows open keeps its last row for the next inventory.
 * A failed read fails the observation, so the open row stands and the transition is read again next time.
 * A hold before the detail or its follow-up reads defers the observation.
 */
export async function terminalPRs(prior: GitHubPR[], listed: ReadonlySet<number>, api: Api, check: QuotaCheck = () => { }): Promise<GitHubPR[]> {
    const rows: GitHubPR[] = [];
    for (const old of prior) {
        if (old.state !== 'open' || listed.has(old.number)) continue;
        check();
        rows.push(await withGitHubOperation('pr-terminal', async () => {
            const p = await api(`pulls/${old.number}`);
            if (p.state === 'open') return old;
            check();
            const [reviews, checkPages, statusPages] = await Promise.all([
                api(`pulls/${p.number}/reviews?per_page=100`, true),
                api(`commits/${p.head.sha}/check-runs?per_page=100`, true),
                api(`commits/${p.head.sha}/statuses?per_page=100`, true),
            ]);
            return restPR(p, reviews, checkPages, statusPages);
        }));
    }
    return rows;
}
