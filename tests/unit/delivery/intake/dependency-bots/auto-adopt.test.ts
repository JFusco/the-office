import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../../support/fake-github';
import { adoptDependencyBot } from '../../../../../server/delivery/intake/dependency-bots/adopt';
import { autoAdopts, waitsQuietly } from '../../../../../server/delivery/intake/dependency-bots/auto-adopt';
import type { AutoAdoptBot } from '../../../../../server/delivery/intake/dependency-bots/effective-auto-adopt';
import { pinCourier } from '../../../../../server/delivery/intake/dependency-bots/pin-courier';
import { wikiSync } from '../../../../../server/delivery/intake/dependency-bots/wiki-sync';
import { adoptDependabot } from '../../../../../server/delivery/intake/dependabot/adopt';
import { localBindings } from '../../../../../server/office/local-config';
import { projectOutbox } from '../../../../../server/conversations/outbox';
import { HOLDS } from '../../../../../server/office/config';

const roots: string[] = [];
afterEach(() => { cleanupFakes(); vi.unstubAllEnvs(); vi.resetModules(); delete HOLDS['GH-314']; roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });

/** Pin-courier PR #314 on a hands-off project; `autoAdopt` absent means the project relies on the default. */
function fixture({ autoAdopt = undefined as AutoAdoptBot[] | undefined, card = 'backlog' as string | null } = {}) {
    const f = fakeGitHub();
    f.state.cards = card ? [{ id: 'pr-card', kind: 'PullRequest', number: 314, status: card }] : [];
    Object.assign(f.state.issue, { title: '', body: '', assignees: [] });
    if (autoAdopt) f.store.project.autoAdopt = autoAdopt;
    else delete f.store.project.autoAdopt;
    const pr = { number: 314, html_url: `https://github.com/${REPOSITORY}/pull/314`, state: 'open', draft: false,
        user: { login: 'pin-courier[bot]', id: 351979519 }, title: 'chore(deps): bump actions minor and patch',
        body: 'Renovate update details', head: { sha: HEAD, ref: 'renovate/actions-minor-patch', repo: { full_name: REPOSITORY } },
        base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } } };
    f.state.prs.push(pr);
    const commits = [{ author: { ...pr.user }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }];
    const execute = async (program: string, args: string[], options?: any) => args[1]?.includes('/commits?')
        ? JSON.stringify([commits]) : f.execute(program, args, options);
    const adopt = () => adoptDependencyBot(f.store, execute, f.delivery.jobs, f.store.state.coordination!.pickup!, pinCourier);
    const writes = () => f.state.calls.filter(call => /POST|PATCH/.test(call)).length;
    return { f, pr, commits, execute, adopt, writes };
}

test('a bot is adopted automatically only when it is in the effective list', () => {
    const board = { githubProject: { owner: 'JFusco', number: 6, url: 'https://github.com/users/JFusco/projects/6' } };
    expect(autoAdopts({ provider: 'github', ...board, autoAdopt: ['pin-courier'] }, 'pin-courier', true)).toBe(true);
    expect(autoAdopts({ provider: 'github', ...board, autoAdopt: ['pin-courier'] }, 'dependabot', true)).toBe(false);
    expect(['dependabot', 'pin-courier', 'wiki-sync'].map(bot => autoAdopts({ provider: 'github', ...board }, bot, true))).toEqual([true, true, true]);
    expect(autoAdopts({ provider: 'github', ...board }, 'pin-courier', false)).toBe(false);
    expect(autoAdopts({ provider: 'github', ...board }, 'renovate', true)).toBe(false);
    expect(waitsQuietly('it is a draft')).toBe(true);
    expect(waitsQuietly('commits are not exclusively pin-courier authored and GitHub verified')).toBe(false);
});

test.each(['backlog', null])('by default a hands-off project adopts a verified pin-courier PR with its card in %s', async card => {
    const { f, pr, adopt } = fixture({ card });
    await adopt();
    expect(f.state.issue).toMatchObject({ title: '[Task] Merge pin-courier update #314', assignees: [{ login: 'JFusco' }] });
    expect(pr.body).toContain('Closes #5');
    expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ bot: 'pin-courier', status: 'adopted', issue: 5 });
    expect(f.state.cards.every(item => item.status === 'review')).toBe(true);
});

test('an explicit list adopts that bot automatically', async () => {
    const { f, adopt } = fixture({ autoAdopt: ['pin-courier'] });
    await adopt();
    expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ bot: 'pin-courier', status: 'adopted', issue: 5 });
});

test('with an explicit empty list a Backlog card still waits for a person', async () => {
    const { f, adopt, writes } = fixture({ autoAdopt: [] });
    await adopt();
    expect(writes()).toBe(0);
    expect(f.store.state.coordination!.adoptions || []).toEqual([]);
});

test('["pin-courier"] selects only pin-courier: a Dependabot PR in Backlog and a wiki-sync PR In review are left alone', async () => {
    const { f, execute } = fixture({ autoAdopt: ['pin-courier'] });
    f.state.prs.push(
        { number: 121, html_url: `https://github.com/${REPOSITORY}/pull/121`, state: 'open', draft: false, user: { login: 'dependabot[bot]' }, title: 'chore(deps-dev): bump eslint', body: 'Updates `eslint`',
            head: { sha: HEAD, ref: 'dependabot/npm_and_yarn/eslint', repo: { full_name: REPOSITORY } }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } } },
        { number: 316, html_url: `https://github.com/${REPOSITORY}/pull/316`, state: 'open', draft: false, user: { login: 'JFusco', id: 486049 }, title: 'docs(wiki): reconcile PR #139', body: 'Automated, reviewable wiki reconciliation for merged PR #139.',
            head: { sha: HEAD, ref: 'bot/wiki-sync/139', repo: { full_name: REPOSITORY } }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } } });
    f.state.cards.push({ id: 'card-121', kind: 'PullRequest', number: 121, status: 'backlog' }, { id: 'card-316', kind: 'PullRequest', number: 316, status: 'review' });
    const pickup = f.store.state.coordination!.pickup!;
    // In the poll's order.
    await adoptDependabot(f.store, execute, f.delivery.jobs, pickup);
    await adoptDependencyBot(f.store, execute, f.delivery.jobs, pickup, pinCourier);
    await adoptDependencyBot(f.store, execute, f.delivery.jobs, pickup, wikiSync);
    expect(f.store.state.coordination!.adoptions).toEqual([expect.objectContaining({ bot: 'pin-courier', pr: 314, status: 'adopted' })]);
    expect(f.state.prs.filter(p => p.number !== 314).map(p => p.body)).toEqual(['Updates `eslint`', 'Automated, reviewable wiki reconciliation for merged PR #139.']);
    expect(f.state.cards.filter(c => c.number !== 314 && c.kind === 'PullRequest').map(c => c.status)).toEqual(['backlog', 'review']);
    expect(f.state.mutations.filter(m => /pulls\/(121|316)/.test(m.target) || m.args.some(arg => /card-(121|316)/.test(arg)))).toEqual([]);
});

test('a draft waits quietly in automatic mode and is adopted once it is ready', async () => {
    const { f, pr, adopt, writes } = fixture();
    pr.draft = true;
    await adopt();
    expect(writes()).toBe(0);
    expect(f.store.state.coordination!.adoptions || []).toEqual([]);
    expect(projectOutbox(f.store.state).some(item => item.id.startsWith('dependabot:'))).toBe(false);
    pr.draft = false;
    await adopt();
    expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ status: 'adopted' });
});

test('an unverified commit is refused in automatic mode and reaches Joe', async () => {
    const { f, commits, adopt, writes } = fixture();
    commits[0].commit.verification.verified = false;
    await adopt();
    expect(writes()).toBe(0);
    expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ status: 'refused' });
    expect(f.store.state.coordination!.adoptions![0].detail).toContain('was not adopted automatically');
    expect(projectOutbox(f.store.state).some(item => item.id === 'dependabot:314')).toBe(true);
});

test.each(['block', 'done', 'progress', 'review'])('a PR card a person put in %s keeps the PR out of automatic adoption', async card => {
    const { f, pr, adopt, writes } = fixture({ card });
    await adopt();
    expect(writes()).toBe(0);
    expect(pr.body).toBe('Renovate update details');
    expect(f.store.state.coordination!.adoptions || []).toEqual([]);
});

test('a PR for another base waits quietly, and a held PR is never adopted automatically', async () => {
    const other = fixture();
    other.pr.base.ref = 'release';
    await other.adopt();
    expect(other.writes()).toBe(0);
    expect(other.f.store.state.coordination!.adoptions || []).toEqual([]);
    const held = fixture();
    HOLDS['GH-314'] = 'Joe hold';
    await held.adopt();
    expect(held.writes()).toBe(0);
});

test('a paused office adopts nothing automatically even when the PR qualifies', async () => {
    const { f, adopt, writes } = fixture();
    f.store.state.paused = true;
    await adopt();
    expect(writes()).toBe(0);
    f.store.state.paused = false;
    await adopt();
    expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ status: 'adopted' });
});

const configProject = { id: 'cms-field-vocabulary', name: 'CMS', provider: 'github', repo: '/tmp/cms', repository: 'JFusco/cms-field-vocabulary', target: 'main' };
function configRoot(extra: Record<string, unknown>) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-auto-adopt-config-')); roots.push(root);
    const write = (more: Record<string, unknown>) => writeFileSync(resolve(root, 'office-config.json'), JSON.stringify({ projects: [{ ...configProject, ...more }] }));
    write(extra);
    return { root, write };
}

test('autoAdopt config must list unique supported bots on a GitHub project', () => {
    vi.stubEnv('VITEST', ''); vi.stubEnv('NODE_ENV', 'production');
    const { root, write } = configRoot({ autoAdopt: ['pin-courier', 'wiki-sync'] });
    expect(localBindings(root).projects![0].autoAdopt).toEqual(['pin-courier', 'wiki-sync']);
    for (const autoAdopt of [['dependabot'], ['wiki-sync', 'dependabot', 'pin-courier'], []])
        { write({ autoAdopt }); expect(localBindings(root).projects![0].autoAdopt).toEqual(autoAdopt); }
    write({}); expect(localBindings(root).projects![0].autoAdopt).toBeUndefined();
    for (const autoAdopt of [['renovate'], ['pin-courier', 'pin-courier'], 'pin-courier'])
        { write({ autoAdopt }); expect(() => localBindings(root)).toThrow('autoAdopt'); }
    write({ autoAdopt: ['pin-courier'], provider: 'azure' }); expect(() => localBindings(root)).toThrow('autoAdopt');
});

test('start-up loads a Dependabot override through fresh config modules, with the test bypass off', async () => {
    const { root } = configRoot({ autoAdopt: ['dependabot', 'wiki-sync'] });
    vi.stubEnv('VITEST', ''); vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('OFFICE_DATA_ROOT', root);
    vi.resetModules();
    // The order the service starts in: config validates the bots while it loads, then projects and their policy.
    const config = await import('../../../../../server/office/config');
    const projects = await import('../../../../../server/office/projects');
    const policy = await import('../../../../../server/office/project-policy');
    expect(config.DATA).toBe(root);
    expect(config.LOCAL_BINDINGS.projects![0].autoAdopt).toEqual(['dependabot', 'wiki-sync']);
    expect(projects.PROJECTS).toMatchObject([{ id: 'cms-field-vocabulary', autoAdopt: ['dependabot', 'wiki-sync'] }]);
    expect(policy.projectPolicy(projects.PROJECTS[0]).handsOff).toBe(true);
});
