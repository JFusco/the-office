import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../../support/fake-github';
import { adoptDependencyBot } from '../../../../../server/delivery/intake/dependency-bots/adopt';
import { autoAdopts, waitsQuietly } from '../../../../../server/delivery/intake/dependency-bots/auto-adopt';
import { pinCourier } from '../../../../../server/delivery/intake/dependency-bots/pin-courier';
import { localBindings } from '../../../../../server/office/local-config';
import { projectOutbox } from '../../../../../server/conversations/outbox';
import { HOLDS } from '../../../../../server/office/config';

const roots: string[] = [];
afterEach(() => { cleanupFakes(); vi.unstubAllEnvs(); delete HOLDS['GH-314']; roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });

function fixture({ auto = true, card = 'backlog' as string | null } = {}) {
    const f = fakeGitHub();
    f.state.cards = card ? [{ id: 'pr-card', kind: 'PullRequest', number: 314, status: card }] : [];
    Object.assign(f.state.issue, { title: '', body: '', assignees: [] });
    if (auto) Object.assign(f.store.project, { autoAdopt: ['pin-courier'] });
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
    return { f, pr, commits, adopt, writes };
}

test('only a listed, supported bot is adopted automatically', () => {
    expect(autoAdopts({ autoAdopt: ['pin-courier'] }, 'pin-courier')).toBe(true);
    expect(autoAdopts({ autoAdopt: ['pin-courier'] }, 'dependabot')).toBe(false);
    expect(autoAdopts({}, 'pin-courier')).toBe(false);
    expect(waitsQuietly('it is a draft')).toBe(true);
    expect(waitsQuietly('commits are not exclusively pin-courier authored and GitHub verified')).toBe(false);
});

test.each(['backlog', null])('an opted-in project adopts a verified pin-courier PR with its card in %s', async card => {
    const { f, pr, adopt } = fixture({ card });
    await adopt();
    expect(f.state.issue).toMatchObject({ title: '[Task] Merge pin-courier update #314', assignees: [{ login: 'JFusco' }] });
    expect(pr.body).toContain('Closes #5');
    expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ bot: 'pin-courier', status: 'adopted', issue: 5 });
    expect(f.state.cards.every(item => item.status === 'review')).toBe(true);
});

test('without the opt-in a Backlog card still waits for a person', async () => {
    const { f, adopt, writes } = fixture({ auto: false });
    await adopt();
    expect(writes()).toBe(0);
    expect(f.store.state.coordination!.adoptions || []).toEqual([]);
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

test('autoAdopt config must list unique supported bots on a GitHub project', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-auto-adopt-config-')); roots.push(root);
    vi.stubEnv('VITEST', ''); vi.stubEnv('NODE_ENV', 'production');
    const project = { id: 'cms-field-vocabulary', name: 'CMS', provider: 'github', repo: '/tmp/cms', repository: 'JFusco/cms-field-vocabulary', target: 'main' };
    const write = (extra: Record<string, unknown>) => writeFileSync(resolve(root, 'office-config.json'), JSON.stringify({ projects: [{ ...project, ...extra }] }));
    write({ autoAdopt: ['pin-courier', 'wiki-sync'] }); expect(localBindings(root).projects![0].autoAdopt).toEqual(['pin-courier', 'wiki-sync']);
    write({}); expect(localBindings(root).projects![0].autoAdopt).toBeUndefined();
    for (const autoAdopt of [['dependabot'], ['pin-courier', 'pin-courier'], 'pin-courier'])
        { write({ autoAdopt }); expect(() => localBindings(root)).toThrow('autoAdopt'); }
    write({ autoAdopt: ['pin-courier'], provider: 'azure' }); expect(() => localBindings(root)).toThrow('autoAdopt');
});
