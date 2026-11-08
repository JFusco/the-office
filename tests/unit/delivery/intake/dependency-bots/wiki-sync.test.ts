import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../../support/fake-github';
import { wikiSync } from '../../../../../server/delivery/intake/dependency-bots/wiki-sync';
import { adoptDependencyBot } from '../../../../../server/delivery/intake/dependency-bots/adopt';
import { dependabotReviewGuidance } from '../../../../../server/delivery/intake/dependabot/review-guidance';
import { trackingMarker } from '../../../../../server/delivery/intake/dependabot/tracking-issue';
import { HOLDS } from '../../../../../server/office/config';

afterEach(() => { cleanupFakes(); delete HOLDS['GH-314']; });
function fixture(card: string | null = 'review') {
    const f = fakeGitHub();
    f.store.project.autoAdopt = ['wiki-sync'];
    f.state.cards = card ? [{ id: 'pr-card', kind: 'PullRequest', number: 314, status: card }] : [];
    Object.assign(f.state.issue, { title: '', body: '', assignees: [] });
    const pr = { number: 314, html_url: `https://github.com/${REPOSITORY}/pull/314`, state: 'open', draft: false, commits: 1, changed_files: 2,
        user: { login: 'JFusco', id: 486049 }, title: 'docs(wiki): reconcile PR #139', body: 'Automated, reviewable wiki reconciliation for merged PR #139.',
        head: { sha: HEAD, ref: 'bot/wiki-sync/139', repo: { full_name: REPOSITORY } }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } } };
    f.state.prs.push(pr);
    const actor = { login: 'github-actions[bot]', id: 41898282 };
    const commit = { author: { ...actor }, committer: { ...actor } };
    const files: any[] = [{ filename: 'wiki/journal/source.md' }, { filename: 'scripts/wiki/graph/data/graph.json' }];
    const parent = { merged: true, merged_at: '2026-11-07T15:37:10Z', base: { ref: 'main' }, head: { ref: 'codex/profile' } };
    const execute = async (program: string, args: string[], options?: any) => {
        if (args[1]?.includes('/pulls/314/commits?')) return JSON.stringify([[{ ...commit, sha: pr.head.sha }]]);
        if (args[1]?.includes('/pulls/314/files?')) return JSON.stringify([files]);
        if (args[1]?.endsWith('/pulls/139')) return JSON.stringify(parent);
        return f.execute(program, args, options);
    };
    const adopt = (run = execute) => adoptDependencyBot(f.store, run, f.delivery.jobs, f.store.state.coordination!.pickup!, wikiSync);
    const writes = () => f.state.calls.filter(call => /POST|PATCH/.test(call));
    return { f, pr, files, commit, parent, execute, adopt, writes };
}

test.each(['review', 'ready', 'backlog', null])('canonical wiki PR in %s gets one linked issue and ordinary current-head review', async lane => {
    const { f, pr, adopt, writes } = fixture(lane);
    await adopt();
    expect(f.state.issue).toMatchObject({ title: '[Task] Merge wiki-sync PR #314', assignees: [{ login: 'JFusco' }] });
    expect(f.state.issue.body).toContain(trackingMarker(314, 'wiki-sync')); expect(f.state.issue.body).toContain('wiki reconciliation');
    expect(pr.body).toContain('Closes #5'); expect(f.state.cards.every(card => card.status === 'review')).toBe(true);
    expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ bot: 'wiki-sync', issue: 5, status: 'adopted' });
    await f.delivery.discover([{ key: 'GH-5', url: f.issueUrl }] as any);
    expect(f.delivery.jobs[0]).toMatchObject({ existingPR: true, pr: 314, stage: 'prepare-pr' });
    expect(dependabotReviewGuidance(f.store, { ...f.delivery.jobs[0], stage: 'lead-pr' })).toBe('');
    const count = writes().length; await adopt(); expect(writes()).toHaveLength(count);
});
test.each(['block', 'done', 'progress'])('wiki adoption preserves a human %s lane', async lane => {
    const { adopt, writes } = fixture(lane); await adopt(); expect(writes()).toHaveLength(0);
});
test.each(['not-opted-in', 'paused', 'draining', 'held', 'pickup-disabled'])('wiki PR in review waits when %s', async scenario => {
    const { f, adopt, writes } = fixture();
    if (scenario === 'not-opted-in') f.store.project.autoAdopt = [];
    if (scenario === 'paused') f.store.state.paused = true;
    if (scenario === 'draining') f.store.state.draining = true;
    if (scenario === 'held') HOLDS['GH-314'] = 'Joe hold';
    if (scenario === 'pickup-disabled') f.store.state.coordination!.pickup!.enabled = false;
    await adopt(); expect(writes()).toHaveLength(0);
});
test.each(['wrong-author-id', 'draft', 'fork', 'base', 'branch', 'title', 'parent-open', 'parent-base', 'recursive-parent', 'commit-author', 'commit-committer', 'missing-commits', 'missing-files', 'source-file', 'renamed-source', 'traversal'])('qualification refuses %s before any adoption mutation', async scenario => {
    const { f, pr, files, parent, commit, execute, adopt, writes } = fixture();
    if (scenario === 'wrong-author-id') pr.user.id = 1;
    if (scenario === 'draft') pr.draft = true;
    if (scenario === 'fork') pr.head.repo.full_name = 'another/repo';
    if (scenario === 'base') pr.base.ref = 'release';
    if (scenario === 'branch') pr.head.ref = 'bot/wiki-sync/139/other';
    if (scenario === 'title') pr.title = 'docs(wiki): reconcile PR #138';
    if (scenario === 'parent-open') parent.merged = false;
    if (scenario === 'parent-base') parent.base.ref = 'release';
    if (scenario === 'recursive-parent') parent.head.ref = 'bot/wiki-sync/138';
    if (scenario === 'commit-author') commit.author.id = 1;
    if (scenario === 'commit-committer') commit.committer.login = 'human';
    if (scenario === 'missing-commits') pr.commits = 2;
    if (scenario === 'missing-files') pr.changed_files = 3;
    if (scenario === 'source-file') files[0].filename = 'server/index.ts';
    if (scenario === 'renamed-source') files[0].previous_filename = 'server/index.ts';
    if (scenario === 'traversal') files[0].filename = 'wiki/../server.md';
    expect(await wikiSync.refusal(f.store, execute, pr)).not.toBe('');
    await adopt(); expect(writes()).toHaveLength(0);
});
test.each(['docs(wiki): reconcile missed merges', 'docs(wiki): weekly issue and merge reconciliation'])('canonical maintenance PR %s qualifies without inventing a parent', async title => {
    const { f, pr, execute, adopt } = fixture(); pr.head.ref = 'bot/wiki-maintenance'; pr.title = title;
    pr.body = title.includes('weekly') ? 'Automated, reviewable weekly refresh of cited issue state and missed merge reconciliation. Processed 2 merged PRs.' : 'Automated, reviewable batch wiki reconciliation. Processed 2 merged PRs.';
    expect(await wikiSync.refusal(f.store, execute, pr)).toBe(''); await adopt(); expect(f.store.state.coordination!.adoptions![0].status).toBe('adopted');
});
test('a head or qualification change at the write boundary cannot create an issue', async () => {
    const { f, pr, execute, adopt, writes } = fixture();
    const changed = async (program: string, args: string[], options?: any) => args[1]?.endsWith('/pulls/314') ? JSON.stringify({ ...pr, head: { ...pr.head, sha: 'e'.repeat(40) } }) : execute(program, args, options);
    await adopt(changed); expect(writes()).toHaveLength(0); expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ status: 'blocked' });
});
test('list responses without counts are qualified against detailed current metadata', async () => {
    const { f, pr, execute } = fixture();
    expect(await wikiSync.refusal(f.store, execute, { ...pr, commits: undefined, changed_files: undefined })).toBe('');
});
test('an existing unrelated closing reference never creates another issue', async () => {
    const { pr, adopt, writes } = fixture(); pr.body += '\nCloses #42';
    await adopt(); expect(writes()).toHaveLength(0);
});
test('a workflow rebase reuses its wiki tracking issue and restores the closing link once', async () => {
    const { f, pr, adopt } = fixture(); await adopt(); await f.delivery.discover([{ key: 'GH-5', url: f.issueUrl }] as any);
    pr.head.sha = 'e'.repeat(40); pr.body = 'Automated, reviewable wiki reconciliation for merged PR #139.';
    await adopt(); expect(pr.body).toContain('Closes #5'); expect(f.state.calls.filter(call => call.includes('POST') && call.includes('/issues '))).toHaveLength(1);
    const count = f.state.calls.filter(call => call.includes('PATCH')).length; await adopt(); expect(f.state.calls.filter(call => call.includes('PATCH'))).toHaveLength(count);
});
test('a lost issue-create response is settled by read-back without duplicate issue creation', async () => {
    const { f, execute, adopt } = fixture(); let lost = false;
    const run = async (program: string, args: string[], options?: any) => {
        const result = await execute(program, args, options);
        if (!lost && args[1]?.endsWith('/issues') && args.includes('POST')) { lost = true; throw new Error('Lost response after dispatch'); }
        return result;
    };
    await adopt(run); await adopt(run);
    expect(f.state.calls.filter(call => call.includes('POST') && call.includes('/issues '))).toHaveLength(1);
    expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ status: 'adopted', issue: 5 });
});
