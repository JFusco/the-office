import type { GitHubPR } from '../../src/shared';
import { githubPRDescription } from './pr-evidence';
import { closingDirectives } from './pr-links';

/**
 * One PR as the monitor projects GitHub's REST answers: its detail, every review, every check-run page and every
 * status for its head. REST lists statuses newest first, so the first per context is kept, in that order, after the
 * check runs. A missing required field (a null user) fails the projection.
 */
export function restPR(p: any, reviews: any[], checkPages: any[], statusPages: any[]): GitHubPR {
    const latestStatuses = new Map<string, any>();
    for (const s of statusPages) if (!latestStatuses.has(s.context)) latestStatuses.set(s.context, s);
    return { linkedIssues: closingDirectives(p.body), number: p.number, title: p.title, state: p.state, draft: p.draft, author: p.user.login, head: p.head.sha, base: p.base.ref, url: p.html_url, mergedAt: p.merged_at || '', mergeable: p.mergeable,
        ...githubPRDescription(p.body), reviews: reviews.map((r: any) => ({ author: r.user.login, state: r.state, commit: r.commit_id })),
        checks: [...checkPages.flatMap((page: any) => page.check_runs).map((c: any) => ({ name: c.name, status: c.status, conclusion: c.conclusion || '', url: c.html_url, sha: c.head_sha })),
            ...Array.from(latestStatuses.values()).map((s: any) => ({ name: s.context, status: s.state === 'pending' ? 'pending' : 'completed', conclusion: s.state, url: s.target_url || '', sha: p.head.sha }))] };
}
