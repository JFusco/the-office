import { afterEach, expect, test } from 'vitest';
import { cleanupFakes } from '../support/fake-github';
import { fakeBotPR, H1, H2, BATCH, WEEKLY, type Bot } from '../support/fake-bot-pr';
import { adoptDependencyBot } from '../../../../server/delivery/intake/dependency-bots/adopt';
import { wikiSync } from '../../../../server/delivery/intake/dependency-bots/wiki-sync';
import { HOLDS } from '../../../../server/office/config';
import { redoBase } from '../../../../server/delivery/repairs/bot-redo/ledger';

afterEach(() => { delete HOLDS['GH-5']; delete HOLDS['GH-200']; cleanupFakes(); });

const dispatches = (f: ReturnType<typeof fakeBotPR>) => f.writes().filter(m => m.target.endsWith('/dispatches'));
const comments = (f: ReturnType<typeof fakeBotPR>) => f.writes().filter(m => /\/issues\/200\/comments$/.test(m.target));
const merges = (f: ReturnType<typeof fakeBotPR>) => f.writes().filter(m => m.method === 'PUT');

test('a conflicted numbered wiki PR is regenerated once by its workflow, relinked by adoption and merged on the new head', async () => {
    const f = fakeBotPR('wiki-sync');
    await f.observe();
    expect(f.writes()).toEqual([]);
    expect(f.job).toMatchObject({ stage: 'merge', status: 'queued', head: H1 });
    expect(f.adoption.redos).toMatchObject([{ sha: H1, bot: 'wiki-sync', issue: 5, branch: 'bot/wiki-sync/138' }]);
    await f.step();
    expect(dispatches(f)).toHaveLength(1);
    expect(dispatches(f)[0].args).toEqual(expect.arrayContaining(['X-GitHub-Api-Version: 2026-03-10', 'ref=main', 'inputs[pr_number]=138']));
    expect(f.job).toMatchObject({ stage: 'merge', status: 'watching' });
    expect(f.store.getEffect(f.adoption.redos![0].effectId!)?.status).toBe('verified');
    await f.observe(); await f.observe();
    expect(dispatches(f)).toHaveLength(1);
    // The workflow force-pushes an Actions-authored head and resets the body, so the native link is gone.
    f.publish(H2, { body: 'Automated, reviewable wiki reconciliation for merged PR #138.\n', checks: 'pass' });
    await f.observe();
    expect(f.job).toMatchObject({ status: 'watching', head: H1 });
    expect(f.job.detail).toContain('native link');
    await adoptDependencyBot(f.store, f.execute, f.delivery.jobs, f.store.state.coordination!.pickup!, wikiSync);
    expect(f.pr.body).toContain('Closes #5');
    await f.observe();
    expect(f.adoption.redos![0].settled).toMatchObject({ replacement: H2, cause: 'attributed', effectId: f.adoption.redos![0].effectId });
    expect(f.job).toMatchObject({ stage: 'merge', status: 'queued', head: H2 });
    await f.step();
    expect(merges(f)).toHaveLength(1);
    expect(merges(f)[0].args).toContain(`sha=${H2}`);
    expect(f.job.mergeCommit).toBe('f'.repeat(40));
    expect(dispatches(f)).toHaveLength(1);
    expect(f.pushes()).toEqual([]);
});

test.each([
    ['weekly', WEEKLY, 'wiki-issue-sync.yml'],
    ['batch', BATCH, 'wiki-sync.yml'],
])('a conflicted %s maintenance PR dispatches %s with no inputs', async (_kind, pair, workflow) => {
    const f = fakeBotPR('wiki-sync', { branch: 'bot/wiki-maintenance', title: `${pair.title} [skip release]`, body: pair.body });
    await f.observe(); await f.step();
    expect(dispatches(f)).toHaveLength(1);
    expect(dispatches(f)[0].target).toBe(`repos/${f.store.project.repository}/actions/workflows/${workflow}/dispatches`);
    expect(dispatches(f)[0].args.filter(a => a.startsWith('inputs['))).toEqual([]);
});

test('Dependabot is asked once with its own rebase command, read back by ID, and its rebased head merges', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe(); await f.step();
    expect(comments(f)).toHaveLength(1);
    expect(comments(f)[0].args).toContain('body=@dependabot rebase');
    expect(f.state.calls.some(c => /issues\/comments\/\d+$/.test(c))).toBe(true);
    await f.observe();
    expect(comments(f)).toHaveLength(1);
    f.publish(H2, { checks: 'pass' });
    await f.observe();
    expect(f.job).toMatchObject({ status: 'queued', head: H2 });
    await f.step();
    expect(merges(f)).toHaveLength(1);
    expect(comments(f)).toHaveLength(1);
});

test('Pin Courier gets only its rebase box checked; the tracking link and the rest of the body are kept', async () => {
    const f = fakeBotPR('pin-courier'), before = f.pr.body;
    await f.observe(); await f.step();
    const patches = f.writes().filter(m => m.method === 'PATCH');
    expect(patches).toHaveLength(1);
    expect(f.pr.body).toBe(before.replace('- [ ] <!-- rebase-check -->', '- [x] <!-- rebase-check -->'));
    expect(f.pr.body).toContain('Closes #5');
    expect(f.job.status).toBe('watching');
});

test.each([
    ['already requested', (b: string) => b.replace('- [ ]', '- [x]'), 'watching'],
    ['missing', (b: string) => b.replace(/- \[ \] <!-- rebase-check -->.*\n/, ''), 'blocked'],
    ['ambiguous', (b: string) => `${b}\n- [ ] <!-- rebase-check -->again\n`, 'blocked'],
])('a Pin Courier rebase control that is %s sends no write', async (_kind, edit, status) => {
    const f = fakeBotPR('pin-courier');
    f.pr.body = edit(f.pr.body);
    await f.observe(); await f.step();
    expect(f.writes()).toEqual([]);
    expect(f.job.status).toBe(status);
    await f.observe(); await f.step();
    expect(f.writes()).toEqual([]);
});

test('a second conflicted head is a new allowance; the first head is never asked twice', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe(); await f.step();
    f.publish(H2, { mergeable: false });
    await f.observe();
    expect(f.adoption.redos!.map(r => r.sha)).toEqual([H1, H2]);
    expect(f.job.detail).toContain('conflicted head 2');
    await f.step(); await f.observe(); await f.step();
    expect(comments(f)).toHaveLength(2);
});

test.each([['unknown', null], ['draft', false]] as const)('a %s PR admits no redo', async (kind, mergeable) => {
    const f = fakeBotPR('wiki-sync');
    f.pr.mergeable = mergeable; if (kind === 'draft') f.pr.draft = true;
    await f.observe();
    expect(f.adoption.redos).toBeUndefined();
    expect(f.job.stage).toBe('merge');
    expect(f.job.status).not.toBe('queued');
    expect(f.writes()).toEqual([]);
});

test('drain stops new admission; the next claim after drain sends the one request', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    f.store.state.draining = true;
    await f.step();
    expect(f.writes()).toEqual([]);
    expect(f.job.status).toBe('watching');
    f.store.state.draining = false;
    await f.observe(); await f.step();
    expect(comments(f)).toHaveLength(1);
});

test.each<[string, (f: ReturnType<typeof fakeBotPR>) => void]>([
    ['an issue hold', () => { HOLDS['GH-5'] = 'Synthetic hold'; }],
    ['a PR hold', () => { HOLDS['GH-200'] = 'Synthetic hold'; }],
    ['merging disabled', f => { f.store.state.coordination!.merges!.enabled = false; }],
    ['a withdrawn adoption', f => { f.adoption.status = 'blocked'; }],
    ['a different adoption for the same pair', f => { f.store.state.coordination!.adoptions = [{ ...f.adoption, id: 'new-adoption' }]; }],
    ['a moved head', f => { f.pr.head.sha = H2; }],
    ['a pending board update', f => { (f.job.boardUpdates ??= []).push({ status: 'pending' } as never); }],
    ['an unread stage receipt', f => { f.job.steps.push({ stage: 'lead-pr', result: { receipts: [{ uncertain: true, verified: false }] } } as never); }],
])('%s during the request preflight sends nothing', async (_kind, change) => {
    const f = fakeBotPR('wiki-sync');
    await f.observe();
    let changed = false;
    f.state.fail = (_p, args) => { if (!changed && args.some(a => a.endsWith('/pulls/200/commits?per_page=100')) && f.job.status === 'working' && f.store.getEffect(`bot-redo:${f.store.project.id}:${f.store.project.repository}:200:${H1}`)) { changed = true; change(f); } return false; };
    await f.step();
    expect(changed).toBe(true);
    expect(dispatches(f)).toEqual([]);
    expect(f.store.getEffect(`bot-redo:${f.store.project.id}:${f.store.project.repository}:200:${H1}`)?.status).toBe('rejected');
});

test('a lead-pr job routed straight to merge with an unrelated unread write requests nothing', async () => {
    const f = fakeBotPR('dependabot');
    f.job.stage = 'lead-pr';
    await f.step();
    expect(f.job).toMatchObject({ stage: 'merge', status: 'queued' });
    expect(f.adoption.redos).toBeUndefined();
    expect(f.writes()).toEqual([]);
    await f.step();
    expect(f.job).toMatchObject({ stage: 'merge', status: 'blocked' });
    expect(f.job.detail).toContain('PR readiness or reviewed commit changed');
    expect(f.writes()).toEqual([]);
    f.store.putEffect({ id: 'unrelated', work: { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, attemptId: f.job.id, operation: 'github-pr-body', target: f.pr.html_url, authorization: 'x', payload: {}, expectedState: {}, status: 'uncertain', createdAt: '', dispatchedAt: '2026-11-25T00:00:00Z', verifiedAt: '', receipt: null, error: 'lost', elapsedMs: 0 });
    await f.observe();
    expect(f.job.status).toBe('queued');
    expect(f.adoption.redos).toMatchObject([{ sha: H1 }]);
    await f.step();
    expect(f.writes()).toEqual([]);
    expect(f.job.status).toBe('blocked');
    expect(f.job.detail).toContain('Unresolved external writes');
});

test.each<[string, (pr: any) => void]>([
    ['a body edit', pr => { pr.body += '\nKeep this edit.\n'; }],
    ['a draft conversion', pr => { pr.draft = true; }],
    ['a retarget', pr => { pr.base.ref = 'develop'; }],
])('Pin Courier sends no redo when the final preflight read sees %s', async (_kind, change) => {
    const f = fakeBotPR('pin-courier'), id = redoBase(f.store, 200, H1);
    await f.observe();
    let issueRead = false, changed = false;
    f.state.fail = (_p, args) => {
        if (f.store.getEffect(id)?.status !== 'prepared') return false;
        if (args.some(a => a.endsWith('/issues/5'))) issueRead = true;
        if (issueRead && args.some(a => a.endsWith('/pulls/200'))) { change(f.pr); changed = true; }
        return false;
    };
    const expected = structuredClone(f.pr);
    change(expected);
    await f.step();
    expect(changed).toBe(true);
    expect(f.store.getEffect(id)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(f.writes()).toEqual([]);
    expect(f.pr.body).toBe(expected.body);
});

test.each(['dependabot', 'pin-courier', 'wiki-sync'] as Bot[])('%s: observation of a conflict never writes and never commits to the bot branch', async bot => {
    const f = fakeBotPR(bot);
    for (let i = 0; i < 3; i++) await f.observe();
    expect(f.writes()).toEqual([]);
    expect(f.pushes()).toEqual([]);
    expect(f.adoption.redos).toHaveLength(1);
});

test('a held delivery records no conflict and queues nothing', async () => {
    const f = fakeBotPR('dependabot');
    HOLDS['GH-5'] = 'Synthetic hold';
    await f.observe();
    expect(f.adoption.redos).toBeUndefined();
    expect(f.job.status).not.toBe('queued');
    expect(f.job.detail).toContain('held or owned');
});

test('a recorded conflict that GitHub reports mergeable again before the request merges on the ordinary path, with no request', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    f.publish(H1, { mergeable: true, checks: 'pass' });
    await f.step();
    expect(comments(f)).toEqual([]);
    expect(merges(f)).toHaveLength(1);
});

test('a default branch other than the configured target dispatches nothing', async () => {
    const f = fakeBotPR('wiki-sync');
    f.state.repo.default_branch = 'develop';
    await f.observe(); await f.step();
    expect(dispatches(f)).toEqual([]);
    expect(f.job.status).toBe('blocked');
    expect(f.job.detail).toContain('live default branch');
});
