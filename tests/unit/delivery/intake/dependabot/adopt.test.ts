import { claimedDelivery } from '../../../../fixtures/delivery-claim';
import { afterEach, expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../../support/fake-github';
import { adoptDependabot } from '../../../../../server/delivery/intake/dependabot/adopt';
import { trackingMarker } from '../../../../../server/delivery/intake/dependabot/tracking-issue';
import { syncOutbox } from '../../../../../server/conversations/outbox';
afterEach(cleanupFakes);

const REPO = 'JFusco/cms-field-vocabulary', DEPENDABOT = 'dependabot[bot]';
/** Dependabot PR #121 on the board in Ready; the fixture issue #5 stands in for the tracking issue the harness creates. */
function dependabot(overrides: Record<string, any> = {}) {
    const f = fakeGitHub();
    f.state.cards = [{ id: 'pr-card', kind: 'PullRequest', number: 121, status: 'ready' }];
    Object.assign(f.state.issue, { title: '', body: '', assignees: [] });
    f.state.prs.push({ number: 121, html_url: `https://github.com/${REPO}/pull/121`, state: 'open', draft: false, mergeable: true, user: { login: DEPENDABOT }, title: 'chore(deps-dev): bump the dev group with 2 updates', body: 'Updates `eslint` from 10.3.0 to 10.4.0', head: { sha: HEAD, ref: 'dependabot/npm_and_yarn/main/dev-group', repo: { full_name: REPO } }, base: { ref: 'main', sha: BASE, repo: { full_name: REPO } }, merged_at: null, merge_commit_sha: null, updated_at: '2026-11-02T14:00:00Z', ...overrides });
    f.state.prFiles[121] = ['package.json', 'pnpm-lock.yaml'];
    f.state.prCommits[121] = [DEPENDABOT];
    return { f, pr: f.state.prs[0], adopt: () => adoptDependabot(f.store, f.execute as any, f.delivery.jobs, f.store.state.coordination!.pickup!) };
}
const writes = (f: ReturnType<typeof fakeGitHub>) => f.state.calls.filter(c => /POST|PATCH|graphql/.test(c) && !c.includes('query'));

test('a Ready Dependabot PR gets one tracking issue, both cards In review and a closing link, once', async () => {
    const { f, pr, adopt } = dependabot();
    await adopt();
    expect(f.state.issue).toMatchObject({ title: '[Task] Merge Dependabot update #121', assignees: [{ login: 'JFusco' }] });
    expect(f.state.issue.body).toContain(trackingMarker(121));
    expect(f.state.cards.map(c => [c.kind, c.status])).toEqual([['PullRequest', 'review'], ['Issue', 'review']]);
    expect(pr.body).toMatch(/^Updates `eslint` from 10\.3\.0 to 10\.4\.0\n\nCloses #5\n$/);
    expect(f.store.state.coordination!.adoptions).toMatchObject([{ pr: 121, issue: 5, status: 'adopted' }]);
    const calls = f.state.calls.length;
    await adopt();
    expect(f.state.calls.slice(calls).some(c => c.includes('POST') || c.includes('PATCH'))).toBe(false);
});
test('discovery then routes the linked PR to the existing-PR flow, not new development', async () => {
    const { f, adopt } = dependabot();
    await adopt();
    await f.delivery.discover([{ key: 'GH-5', summary: '', url: f.issueUrl, pickupStatus: 'In review' }] as any);
    expect(f.delivery.jobs).toMatchObject([{ key: 'GH-5', pr: 121, stage: 'prepare-pr', status: 'queued', existingPR: true }]);
});
test('the adopted PR runs prepare, Sam\'s exact-head review and reaches the guarded merge with one model call', async () => {
    const { f, adopt } = dependabot();
    f.store.state.coordination!.merges = { enabled: true, authorizedAt: '2026-10-28T00:00:00Z' };
    await adopt();
    await f.delivery.discover([{ key: 'GH-5', summary: '', url: f.issueUrl, pickupStatus: 'In review' }] as any);
    const job = f.delivery.jobs[0], review = resolve(f.artifactRoot(job), 'lead.json');
    writeFileSync(review, '{}');
    const roles: string[] = [];
    f.engine.agents.run = (async (role: string, task: string) => {
        roles.push(role);
        expect(task).toContain('DEPENDABOT ADOPTION: PR #121');
        expect(task).toContain('commit-message and PR-body lint standards, so those standards are bypassed');
        return { outcome: 'passed', summary: 'Dependency-only update is ready', commit: HEAD, blocker: '', findings: [], receipts: [], previewUrl: '', worktree: '', branch: job.branch, prId: 121, qaRunDir: '', paidRuns: 0,
            evidence: [{ id: 'lead', kind: 'review', summary: 'Exact-head review', path: review, commit: HEAD, environment: 'Synthetic', url: '', observedAt: '' }] };
    }) as any;
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'queued', head: HEAD });
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job.detail).not.toMatch(/Error/);
    expect(job).toMatchObject({ stage: 'merge', status: 'queued', pr: 121 });
    expect(roles).toEqual(['lead']);
    expect(f.state.cards.find(c => c.kind === 'PullRequest')?.status).toBe('review');
});
test('foreign commits, drafts, other targets and cards outside Ready are never adopted', async () => {
    const cases: [string, (x: ReturnType<typeof dependabot>) => void, string][] = [
        ['human commit', x => { x.f.state.prCommits[121].push('JFusco'); }, 'not authored and verified as Dependabot'],
        ['draft', x => { x.pr.draft = true; }, 'draft'],
        ['other target', x => { x.pr.base.ref = 'release'; }, 'targets release'],
    ];
    for (const [name, arrange, reason] of cases) {
        const x = dependabot();arrange(x);
        await x.adopt();
        expect(x.f.store.state.coordination!.adoptions?.[0], name).toMatchObject({ status: 'refused' });
        expect(x.f.store.state.coordination!.adoptions![0].detail, name).toContain(reason);
        expect(x.f.state.issue.body, name).toBe('');
        syncOutbox(x.f.store.state);
        expect(x.f.store.state.outbox.some(o => o.id === 'dependabot:121' && o.status === 'open'), name).toBe(true);
    }
    const lane = dependabot();lane.f.state.cards[0].status = 'backlog';
    await lane.adopt();
    expect(lane.f.store.state.coordination!.adoptions ?? []).toEqual([]);
    const human = dependabot({ user: { login: 'JFusco' } });
    await human.adopt();
    expect(human.f.store.state.coordination!.adoptions ?? []).toEqual([]);
});
test('an existing tracking issue is reused after a restart instead of creating a second one', async () => {
    const { f, adopt } = dependabot();
    Object.assign(f.state.issue, { body: `Earlier adoption\n${trackingMarker(121)}`, node_id: 'issue-node-5', user: { login: 'JFusco' }, assignees: [{ login: 'JFusco' }] });
    await adopt();
    expect(f.state.calls.some(c => c.endsWith('/issues -X POST') || /issues -X POST/.test(c))).toBe(false);
    expect(f.store.state.coordination!.adoptions).toMatchObject([{ status: 'adopted', issue: 5 }]);
});
test('a Dependabot rebase that rewrites the body is linked again while delivery is live', async () => {
    const { f, pr, adopt } = dependabot();
    await adopt();
    await f.delivery.discover([{ key: 'GH-5', summary: '', url: f.issueUrl, pickupStatus: 'In review' }] as any);
    Object.assign(pr, { body: 'Updates `eslint` from 10.3.0 to 10.4.1', head: { ...pr.head, sha: 'e'.repeat(40) } });
    await adopt();
    expect(pr.body).toContain('Closes #5');
    expect(f.state.calls.filter(c => c.includes('PATCH'))).toHaveLength(2);
});
test('a paused Office writes nothing', async () => {
    const { f, adopt } = dependabot();
    f.store.state.paused = true;
    await adopt();
    expect(writes(f)).toEqual([]);
    expect(f.store.state.coordination!.adoptions ?? []).toEqual([]);
});

test('a marker issue not created and assigned by the Office is never trusted; a closed own tracking issue blocks', async () => {
    const foreign = dependabot();
    Object.assign(foreign.f.state.issue, { body: `Hostile copy\n${trackingMarker(121)}`, node_id: 'issue-node-5', user: { login: 'someone' }, assignees: [] });
    await foreign.adopt();
    expect(foreign.f.state.issue.user.login).toBe('JFusco');
    expect(foreign.f.state.calls.some(c => /issues -X POST/.test(c))).toBe(true);
    const closed = dependabot();
    Object.assign(closed.f.state.issue, { body: trackingMarker(121), node_id: 'issue-node-5', user: { login: 'JFusco' }, assignees: [{ login: 'JFusco' }], state: 'closed' });
    await closed.adopt();
    expect(closed.f.store.state.coordination!.adoptions).toMatchObject([{ status: 'blocked' }]);
    expect(closed.f.store.state.coordination!.adoptions![0].detail).toContain('is closed');
    expect(closed.pr.body).not.toContain('Closes');
});
test('a later non-Dependabot push withdraws the adoption, and a closed PR withdraws its refusal', async () => {
    const { f, adopt } = dependabot();
    await adopt();
    await f.delivery.discover([{ key: 'GH-5', summary: '', url: f.issueUrl, pickupStatus: 'In review' }] as any);
    f.state.prCommits[121].push('JFusco');
    await adopt();
    expect(f.store.state.coordination!.adoptions).toMatchObject([{ status: 'blocked' }]);
    expect(f.store.state.coordination!.adoptions![0].detail).toContain('no longer qualifies');
    const refused = dependabot();refused.f.state.prCommits[121].push('JFusco');
    await refused.adopt();
    refused.pr.state = 'closed';
    await refused.adopt();
    expect(refused.f.store.state.coordination!.adoptions).toMatchObject([{ status: 'withdrawn' }]);
});
test('an unreadable Dependabot listing is reported without failing the poll', async () => {
    const { f, adopt } = dependabot();
    f.state.fail = (program, args) => program === 'gh' && args[1]?.includes('/pulls?state=open') ? 'HTTP 502' : false;
    await expect(adopt()).resolves.toBeUndefined();
    expect(f.store.state.events.some(e => e.kind === 'dependabot-unavailable')).toBe(true);
});
test('a tracking issue is never admitted as new development', async () => {
    const { f, adopt } = dependabot();
    await adopt();
    const { admit } = await import('../../../../../server/delivery/intake/admission');
    const outcome = admit({ store: f.store, state: f.store.state.coordination!, pickup: { enabled: true, status: 'Ready' }, dependencyStores: () => ({}) as any }, f.delivery, { key: 'GH-5', workRequested: 'automatic', prerequisites: [] }, new Date());
    expect(outcome).toMatchObject({ status: 'held' });
    expect(f.delivery.jobs).toEqual([]);
});

test('a Dependabot update of any ecosystem is adopted, including GitHub Actions workflow changes', async () => {
    const { f, adopt } = dependabot({ title: 'ci(deps): bump actions/checkout from 4 to 5', head: { sha: HEAD, ref: 'dependabot/github_actions/actions/checkout-5', repo: { full_name: REPO } } });
    f.state.prFiles[121] = ['.github/workflows/quality.yml', '.github/workflows/commitlint.yml'];
    await adopt();
    expect(f.store.state.coordination!.adoptions).toMatchObject([{ status: 'adopted', issue: 5 }]);
});
test('a commit claiming Dependabot as author but committed by someone else is refused', async () => {
    const x = dependabot();
    const execute = x.f.execute;
    (x.f as any).execute = async (program: string, args: string[], options: any) => {
        const out = await execute(program, args, options);
        return /\/pulls\/121\/commits/.test(args[1] || '') ? JSON.stringify(JSON.parse(out).map((page: any[]) => page.map(c => ({ ...c, committer: { login: 'JFusco' } })))) : out;
    };
    await adoptDependabot(x.f.store, (x.f as any).execute, x.f.delivery.jobs, x.f.store.state.coordination!.pickup!);
    expect(x.f.store.state.coordination!.adoptions).toMatchObject([{ status: 'refused' }]);
    expect(x.f.state.issue.body).toBe('');
});
