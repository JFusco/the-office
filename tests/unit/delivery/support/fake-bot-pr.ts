import { fakeGitHub, BASE, REPOSITORY } from './fake-github';
import { trackingIssueBody } from '../../../../server/delivery/intake/dependabot/tracking-issue';
import { withAssignment } from '../../../../server/workers/assignment-context';
import type { DependabotAdoption, TicketJob } from '../../../../src/shared';

export const H1 = '1'.repeat(40), H2 = '2'.repeat(40), H3 = '3'.repeat(40);
export type Bot = 'dependabot' | 'pin-courier' | 'wiki-sync';
const OWNER = { login: 'JFusco', id: 486049 }, ACTIONS = { login: 'github-actions[bot]', id: 41898282 }, PIN = { login: 'pin-courier[bot]', id: 351979519 };
const BRANCH: Record<Bot, string> = { dependabot: 'dependabot/npm_and_yarn/vite-7.0.1', 'pin-courier': 'renovate/vite-7.x', 'wiki-sync': 'bot/wiki-sync/138' };
export const WEEKLY = { title: 'docs(wiki): weekly issue and merge reconciliation', body: 'Automated, reviewable weekly refresh of cited issue state and missed merge reconciliation.\n' };
export const BATCH = { title: 'docs(wiki): reconcile missed merges', body: 'Automated, reviewable batch wiki reconciliation.\n' };
export const RENOVATE_BOX = '- [ ] <!-- rebase-check -->If you want to rebase/retry this PR, check this box';

/** An adopted, conflicted bot PR #200 with its owned tracking issue #5, its delivery job in merge/watching and real qualifiers. */
export function fakeBotPR(bot: Bot, options: { branch?: string; title?: string; body?: string; onDisk?: boolean } = {}) {
    const f = fakeGitHub(5, { onDisk: options.onDisk });
    f.store.state.coordination!.merges = { enabled: true, authorizedAt: '2026-11-25T00:00:00Z' };
    const branch = options.branch ?? BRANCH[bot], maintenance = branch === 'bot/wiki-maintenance';
    const body = options.body ?? (bot === 'wiki-sync' ? maintenance ? WEEKLY.body : 'Automated, reviewable wiki reconciliation for merged PR #138.\n'
        : bot === 'pin-courier' ? `Update vite.\n\n${RENOVATE_BOX}\n` : 'Bumps vite.\n');
    const title = options.title ?? (bot === 'wiki-sync' ? maintenance ? WEEKLY.title : 'docs(wiki): reconcile PR #138' : 'chore(deps): bump vite');
    const user = bot === 'wiki-sync' ? OWNER : bot === 'pin-courier' ? PIN : { login: 'dependabot[bot]', id: 49699333 };
    const pr: any = { number: 200, html_url: `https://github.com/${REPOSITORY}/pull/200`, state: 'open', draft: false, merged: false, mergeable: false, title, body: `${body}\nCloses #5\n`, user,
        head: { sha: H1, ref: branch, repo: { full_name: REPOSITORY } }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } }, merged_at: null, merge_commit_sha: null, commits: 1, changed_files: 1, updated_at: '2026-11-25T00:00:00Z' };
    f.state.prs.push(pr);
    if (bot === 'wiki-sync') f.state.prs.push({ number: 138, html_url: `https://github.com/${REPOSITORY}/pull/138`, state: 'closed', merged: true, merged_at: '2026-11-20T00:00:00Z', head: { sha: 'd'.repeat(40), ref: 'codex/137-feature' }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } } });
    f.state.prFiles[200] = [{ filename: 'wiki/journal/2026-11-20-feature.md', status: 'modified' }];
    Object.assign(f.state.issue, { user: { login: 'JFusco' }, node_id: 'issue-node-5', body: trackingIssueBody({ bot: bot === 'dependabot' ? undefined : bot, number: 200, title, url: pr.html_url, head: H1, body }), state_reason: null });
    const adoption: DependabotAdoption = { id: 'adoption-200', pr: 200, issue: 5, status: 'adopted', ...(bot === 'dependabot' ? {} : { bot }), url: pr.html_url, title, detail: 'fixture', at: '2026-11-25T00:00:00Z' };
    f.store.state.coordination!.adoptions = [adoption];
    const job = f.candidate({ existingPR: true, pr: 200, prUrl: pr.html_url, stage: 'merge', status: 'watching', head: H1, branch, worktree: '' });
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' });
    f.state.cards[0].status = 'review';
    /** The bot (only) publishes a head: its own commit identity and, when asked, a mergeable state and passing checks. */
    function publish(sha: string, change: { mergeable?: boolean | null; body?: string; checks?: 'pass' | 'pending' } = {}) {
        pr.head.sha = sha; pr.mergeable = change.mergeable ?? true;
        if (change.body !== undefined) pr.body = change.body;
        f.state.prCommits[200] = [bot === 'wiki-sync' ? { sha, author: ACTIONS, committer: ACTIONS }
            : { sha, author: bot === 'pin-courier' ? PIN : { login: 'dependabot[bot]' }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }];
        if (change.checks) f.state.checks[sha] = [{ id: 11, head_sha: sha, name: 'quality', app: { slug: 'ci', id: 3 }, status: change.checks === 'pass' ? 'completed' : 'in_progress', conclusion: change.checks === 'pass' ? 'success' : null }];
    }
    publish(H1, { mergeable: false });
    /** One scheduled delivery step under an exact running claim. */
    async function step(target: TicketJob = job) {
        const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: target.id }, 'owner', target.stage)!;
        try { await withAssignment(claim, 'delivery', () => f.delivery.step(target)); }
        finally { f.store.finishClaim(claim.id, 'completed'); }
    }
    const writes = () => f.state.mutations.filter(m => m.method !== 'GRAPHQL');
    const pushes = () => f.state.calls.filter(call => /^git (push|commit)/.test(call));
    return { ...f, pr, job, adoption, publish, step, writes, pushes, observe: () => f.delivery.observe() };
}
