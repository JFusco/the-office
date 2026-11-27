import { projectOutbox } from '../../../../../server/conversations/outbox';
import { claimedDelivery } from '../../../../fixtures/delivery-claim';
import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../../support/fake-github';
import { adoptDependabot } from '../../../../../server/delivery/intake/dependabot/adopt';
import { dependabotReviewGuidance } from '../../../../../server/delivery/intake/dependabot/review-guidance';
import { trackingMarker } from '../../../../../server/delivery/intake/dependabot/tracking-issue';
import type { AutoAdoptBot } from '../../../../../server/delivery/intake/dependency-bots/effective-auto-adopt';
import { handsOff } from '../../../../../server/delivery/harness/scope';
import { syncOutbox } from '../../../../../server/conversations/outbox';
afterEach(cleanupFakes);

const REPO = 'JFusco/cms-field-vocabulary', DEPENDABOT = 'dependabot[bot]', BODY = 'Updates `eslint` from 10.3.0 to 10.4.0';
/**
 * Dependabot PR #121 on the board in Ready (`card`: another lane, `null` for no card, `'unset'` for a card with no Status);
 * the fixture issue #5 stands in for the tracking issue the harness creates. `autoAdopt` absent: the hands-off default.
 */
function dependabot(overrides: Record<string, any> = {}, { autoAdopt, card = 'ready' }: { autoAdopt?: AutoAdoptBot[]; card?: string | null } = {}) {
    const f = fakeGitHub();
    if (autoAdopt) f.store.project.autoAdopt = autoAdopt;
    else delete f.store.project.autoAdopt;
    // An unset Status is a card with no Status value at all, which the board read reports as nothing.
    f.state.cards = card === null ? [] : [{ id: 'pr-card', kind: 'PullRequest', number: 121, status: card === 'unset' ? undefined as unknown as string : card }];
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
test('the adopted PR runs prepare then reaches the guarded merge without a review or QA model call', async () => {
    const { f, adopt } = dependabot();
    f.store.state.coordination!.merges = { enabled: true, authorizedAt: '2026-10-28T00:00:00Z' };
    await adopt();
    await f.delivery.discover([{ key: 'GH-5', summary: '', url: f.issueUrl, pickupStatus: 'In review' }] as any);
    const job = f.delivery.jobs[0];
    const roles: string[] = [];
    f.engine.agents.run = (async (role: string) => {
        roles.push(role);
        throw new Error(`Unexpected automation model call: ${role}`);
    }) as any;
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'queued', head: HEAD });
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job.detail).not.toMatch(/Error/);
    expect(job).toMatchObject({ stage: 'merge', status: 'queued', pr: 121 });
    expect(roles).toEqual([]);
    expect(job.steps.some(step => ['review', 'validate', 'lead-pr'].includes(step.stage))).toBe(false);
    expect(f.state.cards.find(c => c.kind === 'PullRequest')?.status).toBe('review');
});
test('foreign commits, other targets and, under manual pickup, drafts and cards outside Ready are never adopted', async () => {
    // A draft is refused only when a person moved its card; automatic mode waits for it quietly (below).
    const cases: [string, (x: ReturnType<typeof dependabot>) => void, string, AutoAdoptBot[] | undefined][] = [
        ['human commit', x => { x.f.state.prCommits[121].push('JFusco'); }, 'not authored and verified as Dependabot', undefined],
        ['draft', x => { x.pr.draft = true; }, 'draft', []],
        ['other target', x => { x.pr.base.ref = 'release'; }, 'targets release', undefined],
    ];
    for (const [name, arrange, reason, autoAdopt] of cases) {
        const x = dependabot({}, { autoAdopt });arrange(x);
        await x.adopt();
        expect(x.f.store.state.coordination!.adoptions?.[0], name).toMatchObject({ status: 'refused' });
        expect(x.f.store.state.coordination!.adoptions![0].detail, name).toContain(reason);
        expect(x.f.state.issue.body, name).toBe('');
        syncOutbox(x.f.store.state);
        expect(x.f.store.state.outbox.some(o => o.id === 'dependabot:121' && o.status === 'open'), name).toBe(true);
    }
    const lane = dependabot({}, { autoAdopt: [], card: 'backlog' });
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
    // Adopted automatically with no PR card: the only remedy is to reopen the named issue.
    const closed = dependabot({}, { card: null });
    Object.assign(closed.f.state.issue, { body: trackingMarker(121), node_id: 'issue-node-5', user: { login: 'JFusco' }, assignees: [{ login: 'JFusco' }], state: 'closed' });
    await closed.adopt(); await closed.adopt();
    expect(closed.f.store.state.coordination!.adoptions).toMatchObject([{ status: 'blocked' }]);
    expect(closed.f.store.state.coordination!.adoptions![0].detail).toContain('Tracking issue #5 for dependency PR #121 is closed; reopen #5 to resume its adoption');
    expect(closed.f.store.state.coordination!.adoptions![0].detail).not.toContain('pickup lane');
    expect(closed.pr.body).not.toContain('Closes');
    expect(closed.f.state.cards).toEqual([]);
    expect(closed.f.state.mutations).toEqual([]);
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

test('an adoption is marked in progress while it runs and raises no question for Joe meanwhile', async () => {
    const { f, adopt } = dependabot();
    const during = new Set<string>(), asked: string[] = [];
    f.state.fail = () => {
        for (const record of f.store.state.coordination!.adoptions || []) during.add(record.status);
        asked.push(...projectOutbox(f.store.state).filter(action => action.status === 'open' && action.id.startsWith('dependabot:')).map(action => action.id));
        return false;
    };
    await adopt();
    expect([...during]).toEqual(['adopting']);
    expect(asked).toEqual([]);
    expect(f.store.state.coordination!.adoptions).toMatchObject([{ status: 'adopted' }]);
});

const rest = (f: ReturnType<typeof fakeGitHub>) => f.state.mutations.filter(m => m.method !== 'GRAPHQL').map(m => `${m.method} ${m.target}`);
const graphqlWrites = (f: ReturnType<typeof fakeGitHub>) => f.state.mutations.filter(m => m.method === 'GRAPHQL');

test.each([null, 'unset', 'backlog', 'ready'])('by default a qualifying Dependabot PR with card %s is adopted without a person moving it', async card => {
    const { f, pr, adopt } = dependabot({}, { card });
    await adopt();
    expect(f.store.state.coordination!.adoptions).toMatchObject([{ pr: 121, issue: 5, status: 'adopted' }]);
    expect(f.store.state.coordination!.adoptions![0]).not.toHaveProperty('bot');
    expect(f.state.issue.body).toContain(trackingMarker(121));
    expect(pr.body).toBe(`${BODY}\n\nCloses #5\n`);
    // The issue card is added and put In review; a PR card is moved only when the PR has one.
    expect(f.state.cards.filter(c => c.kind === 'Issue').map(c => c.status)).toEqual(['review']);
    expect(f.state.cards.filter(c => c.kind === 'PullRequest').map(c => c.status)).toEqual(card === null ? [] : ['review']);
    expect(rest(f)).toEqual([`POST repos/${REPO}/issues`, `PATCH repos/${REPO}/pulls/121`]);
    expect(graphqlWrites(f)).toHaveLength(card === null ? 2 : 3);
    const writes = f.state.mutations.length;
    await adopt();
    expect(f.state.mutations).toHaveLength(writes);
});
test.each(['review', 'progress', 'block', 'done', 'retired-option'])('by default a Dependabot PR card in %s keeps the PR out of automatic adoption', async card => {
    // `retired-option` is a Status the board no longer lists: an assigned lane that cannot be identified.
    const { f, pr, adopt } = dependabot({}, { card });
    await adopt();
    expect(f.store.state.coordination!.adoptions ?? []).toEqual([]);
    expect(f.state.mutations).toEqual([]);
    expect(pr.body).toBe(BODY);
});
test('with an explicit empty list the PR waits in Backlog and is adopted once a person moves it to Ready', async () => {
    const { f, adopt } = dependabot({}, { autoAdopt: [], card: 'backlog' });
    await adopt();
    expect(f.store.state.coordination!.adoptions ?? []).toEqual([]);
    expect(f.state.mutations).toEqual([]);
    f.state.cards[0].status = 'ready';
    await adopt();
    expect(f.store.state.coordination!.adoptions).toMatchObject([{ pr: 121, issue: 5, status: 'adopted' }]);
    expect(rest(f)).toEqual([`POST repos/${REPO}/issues`, `PATCH repos/${REPO}/pulls/121`]);
});
test('a project that is not hands-off adopts nothing, even in Ready with Dependabot listed', async () => {
    const { f, pr, adopt } = dependabot({}, { autoAdopt: ['dependabot'] });
    f.store.project.id = 'not-hands-off';
    expect(handsOff(f.store)).toBe(false);
    await adopt();
    expect(f.store.state.coordination!.adoptions ?? []).toEqual([]);
    expect(f.state.mutations).toEqual([]);
    expect(pr.body).toBe(BODY);
});
test('a new Dependabot draft waits quietly in automatic mode, then is adopted once it is ready', async () => {
    const { f, pr, adopt } = dependabot({ draft: true }, { card: 'backlog' });
    await adopt(); await adopt();
    expect(f.store.state.coordination!.adoptions ?? []).toEqual([]);
    syncOutbox(f.store.state);
    expect(f.store.state.outbox.filter(o => o.id.startsWith('dependabot:'))).toEqual([]);
    expect(f.state.mutations).toEqual([]);
    pr.draft = false;
    await adopt();
    expect(f.store.state.coordination!.adoptions).toMatchObject([{ pr: 121, status: 'adopted' }]);
});
test('a Backlog Dependabot PR for another branch is refused once, visibly, and never written to', async () => {
    const { f, pr, adopt } = dependabot({}, { card: 'backlog' });
    pr.base.ref = 'release';
    for (let poll = 0; poll < 3; poll++) {
        await adopt();
        syncOutbox(f.store.state);
        expect(f.store.state.outbox.filter(o => o.id === 'dependabot:121' && o.status === 'open')).toHaveLength(1);
    }
    expect(f.store.state.coordination!.adoptions).toMatchObject([{ pr: 121, status: 'refused' }]);
    expect(f.store.state.coordination!.adoptions![0].detail).toBe('Dependabot PR #121 was not adopted automatically: it targets release, not main. Handle it manually.');
    expect(f.store.state.events.filter(e => e.kind === 'dependabot-refused')).toHaveLength(1);
    expect(f.state.mutations).toEqual([]);
});
test('a foreign commit is refused in automatic mode with today\'s reason', async () => {
    const { f, adopt } = dependabot({}, { card: 'backlog' });
    f.state.prCommits[121].push('JFusco');
    await adopt();
    expect(f.store.state.coordination!.adoptions).toMatchObject([{ status: 'refused' }]);
    expect(f.store.state.coordination!.adoptions![0].detail).toMatch(/^Dependabot PR #121 was not adopted automatically: it has commits not authored and verified as Dependabot \(c{7}\)\. Handle it manually\.$/);
    expect(f.state.mutations).toEqual([]);
});
test('an automatic adoption is described accurately in its tracking issue and in Sam\'s Dependabot guidance', async () => {
    const { f, adopt } = dependabot({}, { card: null });
    await adopt();
    expect(f.state.issue.body).toContain('Dependabot opened #121 (`chore(deps-dev): bump the dev group with 2 updates`), a dependency update the Office adopted for delivery.');
    expect(f.state.issue.body).not.toContain('pickup lane');
    expect(f.state.issue.body).toContain(trackingMarker(121));
    await f.delivery.discover([{ key: 'GH-5', summary: '', url: f.issueUrl, pickupStatus: 'In review' }] as any);
    const guidance = dependabotReviewGuidance(f.store, { ...f.delivery.jobs[0], stage: 'lead-pr' });
    expect(guidance).toContain('PR #121 is a Dependabot dependency update (every commit written by Dependabot and GitHub-verified) that the Office adopted for delivery.');
    expect(guidance).toContain('The gate is the hosted checks on the exact current head.');
    expect(guidance).not.toMatch(/Joe moved|pickup lane/);
});
