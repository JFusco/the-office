import { afterEach, expect, test } from 'vitest';
import { BASE, cleanupFakes } from '../support/fake-github';
import { fakeBotPR, H1, H2, WEEKLY } from '../support/fake-bot-pr';
import { GENERATOR } from '../../../../server/delivery/closeout/wiki-containment';
import { adoptDependencyBot } from '../../../../server/delivery/intake/dependency-bots/adopt';
import { wikiSync } from '../../../../server/delivery/intake/dependency-bots/wiki-sync';
import { bindGitHubIdentity } from '../../../../server/github/identity/identity-runtime';
import type { InstallationTokens } from '../../../../server/github/identity/installation-token';
import { parseGitHubApp } from '../../../../server/github/identity/app-config';
import { canonicalDigest } from '../../../../server/github/identity/route-entry';
import { changeDigest } from '../../../../server/github/identity/write-boundary';
import { currentPrincipal } from '../../../../server/github/identity/write-credential-scope';
import { APP, appConfig, SYNTHETIC_TOKEN } from '../../github/identity/support/route-fixture';

afterEach(cleanupFakes);

const PAGE = 'wiki/journal/2026-11-20-feature.md', PAGE_SHA = 'c'.repeat(40), OTHER = 'e'.repeat(40), TIP2 = '9'.repeat(40);
const blob = (path: string, sha: string) => ({ path, type: 'blob', mode: '100644', sha });
const generator = blob(GENERATOR.path, GENERATOR.blob);
const NUMBERED_BODY = 'Automated, reviewable wiki reconciliation for merged PR #138.\n';

/** A numbered (or maintenance) wiki PR whose verified regeneration run succeeded without a new commit and reset the body. */
async function sameHead(options: { contained?: boolean; maintenance?: boolean; onDisk?: boolean } = {}) {
    const f = fakeBotPR('wiki-sync', options.maintenance ? { branch: 'bot/wiki-maintenance', onDisk: options.onDisk } : { onDisk: options.onDisk });
    f.state.prFiles[200] = [{ filename: PAGE, status: 'modified' }, { filename: 'wiki/connections.md', status: 'modified' }];
    f.pr.changed_files = 2;
    f.state.trees[H1] = { tree: [blob(PAGE, PAGE_SHA), blob('wiki/connections.md', 'a'.repeat(40)), generator] };
    f.state.trees[BASE] = { tree: [blob(PAGE, options.contained === false ? OTHER : PAGE_SHA), blob('wiki/connections.md', 'b'.repeat(40)), generator] };
    f.state.trees[TIP2] = { tree: [blob(PAGE, OTHER), generator] };
    await f.observe(); await f.step();
    Object.assign(f.state.runs[0], { status: 'completed', conclusion: 'success', updated_at: f.store.clock.now().toISOString() });
    f.pr.body = options.maintenance ? WEEKLY.body : NUMBERED_BODY;
    return f;
}
type Fixture = Awaited<ReturnType<typeof sameHead>>;
const closes = (f: Fixture) => f.writes().filter(m => m.method === 'PATCH' && m.args.includes('state=closed') && m.target.endsWith('/pulls/200'));
const issueCloses = (f: Fixture) => f.writes().filter(m => m.method === 'PATCH' && m.target.endsWith('/issues/5'));
const relinks = (f: Fixture) => f.writes().filter(m => m.method === 'PATCH' && m.target.endsWith('/pulls/200') && m.args.some(a => a.startsWith('body=')));
const posted = (f: Fixture, n: number) => f.writes().filter(m => m.target.endsWith(`/issues/${n}/comments`));
const cardMoves = (f: Fixture) => f.state.mutations.filter(m => m.method === 'GRAPHQL');
const closeEffect = (f: Fixture, step: string) => f.store.getEffect(`harness:${f.job.id}:${f.job.supersededWikiClose?.operation}:${step}`);
const marker = `<!-- office-wiki-superseded:200:${H1} -->`;

async function expectReversalStaysBlocked(f: Fixture) {
    const stageEvents = () => f.store.state.events.filter(e => e.kind === 'github-delivery-stage' || e.kind === 'github-delivery-blocked').length;
    const calls = () => f.state.calls.filter(c => c.endsWith('/pulls/200')).length;
    const before = { events: stageEvents(), reads: calls(), writes: f.state.mutations.length };
    for (let i = 0; i < 2; i++) {
        await f.observe();
        if (f.job.status === 'queued') await f.step();
        expect(f.job.status).toBe('blocked');
        expect(stageEvents()).toBe(before.events);
        expect(f.state.mutations).toHaveLength(before.writes);
    }
    expect(calls()).toBeGreaterThan(before.reads);
}

test('a numbered PR whose target lacks a change stays open with the path named, and nothing is written', async () => {
    const f = await sameHead({ contained: false });
    await f.observe();
    expect(f.job).toMatchObject({ stage: 'merge', status: 'queued' });
    await f.step();
    expect(f.job.status).toBe('blocked');
    expect(f.job.detail).toContain(`${PAGE} (modified)`);
    expect(f.adoption.redos![0].sameHead?.proof).toContain(PAGE);
    expect(f.store.state.events.filter(e => e.kind === 'bot-redo-stopped')).toHaveLength(1);
    await f.observe(); await f.observe();
    expect(f.job.status).toBe('blocked');
    expect(f.store.state.events.filter(e => e.kind === 'bot-redo-stopped')).toHaveLength(1);
    expect(f.writes().filter(m => !m.target.endsWith('/dispatches'))).toEqual([]);
    expect(f.writes().filter(m => m.target.endsWith('/dispatches'))).toHaveLength(1);
    expect(f.job.supersededWikiClose).toBeUndefined();
});

test('a same-size inventory from before a base advance cannot close the PR', async () => {
    const f = await sameHead();
    await f.observe();
    const missing = 'wiki/new.md';
    f.state.trees[H1].tree.push(blob(missing, PAGE_SHA));
    f.state.trees[TIP2].tree[0].sha = PAGE_SHA;
    let lists = 0, moved = false;
    f.state.fail = (_p, args) => {
        if (args.some(a => a.endsWith('/pulls/200/files?per_page=100'))) lists++;
        // Qualification reads the files once. Advance the base after the proof reads them.
        if (lists === 2 && !moved && args.some(a => a.endsWith('/pulls/200'))) {
            moved = true;
            f.pr.base.sha = f.state.targetTip = TIP2;
            f.state.prFiles[200][0] = { filename: missing, status: 'modified' };
        }
        return false;
    };
    await f.step();
    expect(moved).toBe(true);
    expect(f.job.detail).toContain('base commit changed during its file inventory');
    expect(f.job.supersededWikiClose).toBeUndefined();
    expect(closes(f)).toEqual([]);
    await f.observe();
    expect(f.job.status).toBe('queued');
    await f.step();
    expect(f.job.detail).toContain(missing);
    expect(closes(f)).toEqual([]);
});

test('a transient tree read retries containment on the next claim', async () => {
    const f = await sameHead();
    await f.observe();
    let failed = false;
    f.state.fail = (_p, args) => {
        if (!failed && args.some(a => a.includes('/git/trees/'))) { failed = true; return 'HTTP 502: Bad Gateway'; }
        return false;
    };
    await f.step();
    expect(failed).toBe(true);
    expect(f.job.detail).toContain('HTTP 502: Bad Gateway');
    expect(f.job.supersededWikiClose).toBeUndefined();
    expect(f.adoption.redos![0].sameHead?.proof).toBeUndefined();
    expect(f.writes().filter(m => !m.target.endsWith('/dispatches'))).toEqual([]);
    await f.observe(); await f.step();
    expect(closes(f)).toHaveLength(1);
    expect(f.job.status).toBe('cancelled');
});

test('a contained numbered PR is relinked once, waits for the native link, then closed as superseded with its issue and cards', async () => {
    const f = await sameHead();
    await f.observe(); expect(f.job.status).toBe('queued');
    let delayed = 1;
    f.state.fail = (program, args) => { if (program === 'gh' && args[0] === 'pr' && args[1] === 'view' && relinks(f).length && delayed-- > 0) f.state.nativeLinks[200] = false; return false; };
    await f.step();
    expect(f.job.supersededWikiClose).toMatchObject({ pr: 200, parent: 138, issue: 5, head: H1, target: BASE, run: { id: f.state.runs[0].id } });
    expect(relinks(f)).toHaveLength(1);
    expect(f.job.status).toBe('watching');
    expect(closes(f)).toEqual([]);
    delete f.state.nativeLinks[200];
    await f.observe(); expect(f.job.status).toBe('queued');
    await f.step();
    expect(relinks(f)).toHaveLength(1);
    expect(posted(f, 200)).toHaveLength(1); expect(posted(f, 5)).toHaveLength(1);
    expect(f.state.comments.filter(c => c.body.startsWith(marker)).map(c => c.issue_url.split('/').at(-1))).toEqual(['200', '5']);
    expect(closes(f)).toHaveLength(1);
    expect(issueCloses(f)).toHaveLength(1);
    expect(f.state.issue).toMatchObject({ state: 'closed', state_reason: 'not_planned' });
    expect(f.state.cards.map(c => c.status)).toEqual(['done', 'done']);
    expect(cardMoves(f)).toHaveLength(2);
    expect(f.pr).toMatchObject({ state: 'closed', merged: false, merged_at: null, head: { sha: H1 } });
    expect(f.job).toMatchObject({ status: 'cancelled' });
    expect(f.job.steps.at(-1)?.stage).toBe('superseded-closeout');
    expect(f.adoption.status).toBe('withdrawn');
    expect(f.store.state.events.filter(e => e.kind === 'wiki-pr-superseded')).toHaveLength(1);
    expect(f.writes().filter(m => m.method === 'DELETE' || m.method === 'PUT')).toEqual([]);
    expect(f.writes().filter(m => m.target.endsWith('/dispatches'))).toHaveLength(1);
});

test.each(['office[bot]', 'someone-else'])('wiki closeout checks the tracking issue against its saved App writer (%s)', async login => {
    const f = await sameHead();
    const { id: projectId, repository } = f.store.project;
    const author = 'office[bot]', target = `${repository}#wiki-sync-200`, id = `harness:${f.adoption.id}:issue:200`;
    f.store.putEffect({
        id, work: { projectId, kind: 'delivery', id: f.adoption.id }, attemptId: f.adoption.id,
        operation: 'github-issue-create', target, authorization: 'office-harness', payload: { pr: 200 }, expectedState: { key: 'issue:200' },
        status: 'verified', createdAt: '2026-11-26T12:00:00Z', dispatchedAt: '2026-11-26T12:00:00Z', verifiedAt: '2026-11-26T12:00:00Z',
        receipt: { number: 5, nodeId: f.state.issue.node_id, url: f.issueUrl }, error: '', elapsedMs: 0,
        writer: { principal: 'app', projectId, repository, operation: 'issue-create', login: author, appId: 1, installationId: 2, repositoryId: 3,
            grant: { kind: 'trial', entryDigest: 'fixture' }, binding: { adapter: 'github-issue-create', target } },
    });
    f.state.issue.user = { login };
    await f.observe();
    await f.step();
    if (login === author) {
        expect(f.job.status, f.job.detail).toBe('cancelled');
        expect(issueCloses(f)).toHaveLength(1);
        expect(closeEffect(f, 'issue-close')?.status).toBe('verified');
    } else {
        expect(f.job.detail).toContain('tracking issue is not open');
        expect(f.job.supersededWikiClose).toBeUndefined();
        expect(closes(f)).toEqual([]);
        expect(issueCloses(f)).toEqual([]);
    }
});

test.each([
    ['the relink', (args: string[]) => args.some(a => a.startsWith('body=Automated')) && args.includes('PATCH')],
    ['the PR comment', (args: string[]) => args.some(a => a.endsWith('/issues/200/comments'))],
    ['the PR close', (args: string[]) => args.includes('state=closed') && args.some(a => a.endsWith('/pulls/200'))],
    ['the issue comment', (args: string[]) => args.some(a => a.endsWith('/issues/5/comments'))],
    ['the issue close', (args: string[]) => args.some(a => a.endsWith('/issues/5')) && args.includes('PATCH')],
    ['the first card move', (args: string[]) => args[1] === 'graphql'],
])('a lost response on %s is read back after a restart and never resent', async (_kind, matches) => {
    const f = await sameHead({ onDisk: true });
    await f.observe();
    let lost = false;
    f.state.loseResponse = (_p, args) => { if (!lost && matches(args)) { lost = true; return true; } return false; };
    await f.step();
    expect(lost).toBe(true);
    expect(f.job.status).toBe('blocked');
    f.job.status = 'working'; f.store.save();
    const { store, delivery } = f.reopen();
    store.recover();
    const job = store.state.coordination!.jobs!.find(j => j.id === f.job.id)!;
    expect(job.status).toBe('interrupted');
    await delivery.observe();
    expect(job.status).toBe('queued');
    const claim = store.claimWork({ projectId: store.project.id, kind: 'delivery', id: job.id }, 'owner', 'merge')!;
    const { withAssignment } = await import('../../../../server/workers/assignment-context');
    await withAssignment(claim, 'delivery', () => delivery.step(job)); store.finishClaim(claim.id, 'completed');
    expect(job.status).toBe('cancelled');
    expect(relinks(f)).toHaveLength(1); expect(posted(f, 200)).toHaveLength(1); expect(posted(f, 5)).toHaveLength(1);
    expect(closes(f)).toHaveLength(1); expect(issueCloses(f)).toHaveLength(1); expect(cardMoves(f)).toHaveLength(2);
    expect(store.state.events.filter(e => e.kind === 'wiki-pr-superseded')).toHaveLength(1);
});

test.each(['without a preparation', 'with an interrupted preparation'])('a tracking issue already closed as completed keeps its reason %s', async mode => {
    const f = await sameHead();
    await f.observe();
    const issueComment = (args: string[]) => args.some(a => a.endsWith('/issues/5/comments')) && args.includes('POST');
    let preparedId: string | undefined;
    if (mode === 'with an interrupted preparation') {
        f.state.loseResponse = (_p, args) => issueComment(args);
        await f.step();
        const key = `${f.job.supersededWikiClose!.operation}:issue-close`;
        preparedId = `harness:${f.job.id}:${key}`;
        f.store.putEffect({ id: preparedId, work: { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, attemptId: f.job.id,
            operation: 'github-issue-close', target: f.state.issue.html_url, authorization: 'office-harness', payload: { issue: 5, reason: 'not_planned' },
            expectedState: { key }, status: 'prepared', createdAt: f.store.clock.now().toISOString(), dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
        Object.assign(f.state.issue, { state: 'closed', state_reason: 'completed' });
        f.state.loseResponse = () => false;
        await f.observe();
        expect(f.job.status).toBe('queued');
    } else {
        f.state.fail = (_p, args) => {
            if (issueComment(args)) Object.assign(f.state.issue, { state: 'closed', state_reason: 'completed' });
            return false;
        };
    }
    await f.step();
    expect(f.job.status).toBe('cancelled');
    expect(issueCloses(f)).toEqual([]);
    if (preparedId) expect(f.store.getEffect(preparedId)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(f.job.supersededWikiClose?.issueReason).toBe('completed');
    expect(f.job.steps.at(-1)?.result.summary).toContain('was already closed (completed)');
    expect(f.state.issue.state_reason).toBe('completed');
    expect(posted(f, 5)).toHaveLength(1);
    for (const c of f.state.comments.filter(c => c.body.startsWith(marker))) {
        expect(c.body).toContain(H1.slice(0, 7));
        expect(c.body).toContain(BASE.slice(0, 7));
        expect(c.body).toContain(f.state.runs[0].html_url);
        expect(c.body).not.toMatch(/is closed as not planned/i);
    }
    await f.observe();
    expect(f.store.state.events.filter(e => e.kind === 'wiki-pr-superseded')).toHaveLength(1);
});

test('a target that loses a proven change before the close sends no close and leaves the PR open', async () => {
    const f = await sameHead();
    await f.observe();
    f.state.fail = (_p, args) => { if (args.some(a => a.endsWith('/issues/200/comments')) && args.includes('POST')) f.pr.base.sha = f.state.targetTip = TIP2; return false; };
    await f.step();
    expect(posted(f, 200)).toHaveLength(1);
    expect(closes(f)).toEqual([]);
    expect(f.pr.state).toBe('open');
    expect(f.state.issue.state).toBe('open');
    expect(f.state.comments[0].body).toContain(BASE.slice(0, 7));
    expect(f.state.comments[0].body).not.toMatch(/is closed as not planned/i);
    expect(f.job.supersededWikiClose).toBeUndefined();
    expect(f.job.status).toBe('blocked');
    expect(f.job.detail).toContain('stays open');
    expect(f.job.steps.at(-1)?.stage).toBe('superseded-close-abandoned');
    await f.observe(); await f.observe();
    expect(closes(f)).toEqual([]);
});

test.each(['loses', 'keeps'])('a target that %s a proven change during prepared close qualification is rechecked', async outcome => {
    const f = await sameHead();
    await f.observe();
    if (outcome === 'keeps') f.state.trees[TIP2].tree[0].sha = PAGE_SHA;
    let moved = false, preparedId = '';
    f.state.fail = (_p, args) => {
        const prepared = closeEffect(f, 'pr-close');
        if (!moved && prepared?.status === 'prepared' && args.some(a => a.endsWith('/pulls/200/commits?per_page=100'))) {
            moved = true;
            preparedId = prepared.id;
            f.pr.base.sha = f.state.targetTip = TIP2;
        }
        return false;
    };
    await f.step();
    expect(moved).toBe(true);
    if (outcome === 'keeps') {
        expect(closes(f)).toHaveLength(1);
        expect(f.job.supersededWikiClose?.revalidated).toMatchObject([{ target: TIP2 }]);
        expect(f.job.status).toBe('cancelled');
    } else {
        expect(f.store.getEffect(preparedId)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
        expect(f.pr.state).toBe('open');
        expect(f.adoption.redos![0].sameHead?.proof).toContain(PAGE);
        expect(closes(f)).toEqual([]);
        expect(posted(f, 5)).toEqual([]); expect(issueCloses(f)).toEqual([]); expect(cardMoves(f)).toEqual([]);
    }
});

test('drift after the PR close that the target no longer corroborates is kept as a partial outcome with no further write', async () => {
    const f = await sameHead();
    await f.observe();
    // A closed PR's base stays where it was; only the target moves.
    f.state.fail = (_p, args) => { if (args.includes('state=closed')) f.state.targetTip = TIP2; return false; };
    await f.step();
    expect(closes(f)).toHaveLength(1);
    expect(f.job.supersededWikiClose?.partial).toContain('was closed at');
    expect(f.job.supersededWikiClose?.partial).toContain(`does not contain ${PAGE}`);
    expect(posted(f, 5)).toEqual([]); expect(issueCloses(f)).toEqual([]); expect(cardMoves(f)).toEqual([]);
    await f.observe(); await f.step();
    expect(posted(f, 5)).toEqual([]); expect(issueCloses(f)).toEqual([]);
    expect(f.job.status).toBe('blocked');
});

test.each([false, true])('a close applied at a different head stays uncertain and preserves the actual outcome (lost response: %s)', async lost => {
    const f = await sameHead();
    await f.observe();
    f.state.loseResponse = (_p, args) => {
        if (!args.includes('state=closed') || !args.some(a => a.endsWith('/pulls/200'))) return false;
        f.publish(H2);
        return lost;
    };
    await f.step();
    expect(f.pr).toMatchObject({ state: 'closed', merged: false, head: { sha: H2 } });
    await f.observe(); await f.observe();
    expect(f.job).toMatchObject({ status: 'blocked', supersededWikiClose: { head: H1, observedPRClose: { state: 'closed', head: H2 } } });
    expect(f.job.detail).toContain(H2.slice(0, 7));
    expect(closeEffect(f, 'pr-close')).toMatchObject({ status: 'uncertain', payload: { head: H1 } });
    expect(closes(f)).toHaveLength(1);
    expect(posted(f, 5)).toEqual([]); expect(issueCloses(f)).toEqual([]); expect(cardMoves(f)).toEqual([]);
    expect(f.store.state.events.filter(e => e.kind === 'wiki-pr-superseded')).toEqual([]);
});

test.each([
    ['an edited proof comment', (c: any) => { c.body += ' edited'; }],
    ['a copied proof comment by another account', (c: any) => { c.user = { login: 'someone' }; }],
])('%s is never taken as the Office’s comment', async (_kind, change) => {
    const f = await sameHead();
    await f.observe();
    f.state.loseResponse = (_p, args) => args.some(a => a.endsWith('/issues/200/comments')) && args.includes('POST') && (change(f.state.comments.at(-1)), true);
    await f.step();
    await f.observe();
    expect(f.job.status).toBe('blocked');
    expect(f.job.detail).toContain('pr-comment');
    expect(posted(f, 200)).toHaveLength(1);
    expect(closes(f)).toEqual([]);
});

test('proof comment read-back keeps the POST ID across a failed verification GET', async () => {
    const f = await sameHead();
    await f.observe();
    let failed = false;
    f.state.fail = (_p, args) => {
        if (!failed && args.some(a => /\/issues\/comments\/\d+$/.test(a))) { failed = true; return 'HTTP 502: Bad Gateway'; }
        return false;
    };
    await f.step();
    expect(failed).toBe(true);
    const original = f.state.comments.pop()!, other = original.id + 100;
    const row = closeEffect(f, 'pr-comment')!;
    expect(row).toMatchObject({ status: 'uncertain', receipt: { id: original.id } });
    f.state.comments.push({ ...original, id: other, html_url: original.html_url.replace(String(original.id), String(other)) });
    await f.observe();
    expect(f.store.getEffect(row.id)).toMatchObject({ status: 'uncertain', receipt: { id: original.id } });
    expect(f.pr.state).toBe('open');
    expect(closes(f)).toEqual([]);
    f.state.comments.push(original);
    await f.observe(); await f.step();
    expect(f.store.getEffect(row.id)).toMatchObject({ status: 'verified', receipt: { id: original.id } });
    expect(posted(f, 200)).toHaveLength(1);
    expect(closes(f)).toHaveLength(1);
});

test.each([
    ['a designated App trial', 'app', APP.botId, true],
    ['another account id under the bot login', 'app', 999, false],
    ['the historical operator', 'operator', undefined, false],
] as const)('a failed issue-comment verification by %s is settled by read-back with one POST', async (_writer, principal, accountId, qualifies) => {
    const f = await sameHead();
    await f.observe();
    const { id: projectId, repository } = f.store.project;
    const operation = 'github-issue-comment';
    const commentsPath = `repos/${repository}/issues/${f.state.issue.number}/comments`;
    const listing = `${commentsPath}?per_page=100`;
    const exactRead = (id: number) => `repos/${repository}/issues/comments/${id}`;
    const expectedPrincipal = principal === 'app' ? `app:${APP.installationId}` : 'operator';
    let trialEnabled = principal === 'app';
    const tokens = { token: async () => ({ token: SYNTHETIC_TOKEN }) } as unknown as InstallationTokens;
    bindGitHubIdentity(f.store, {
        config: () => {
            const close = f.job.supersededWikiClose;
            if (!trialEnabled || !close) return;
            const id = `harness:${close.job}:${close.operation}:issue-comment`;
            const target = `https://github.com/${close.repository}/issues/${close.issue}`;
            const body = close.comments.issue;
            const payload = { number: close.issue, marker: body.split('\n', 1)[0], body, author: APP.botLogin };
            return parseGitHubApp(appConfig({}, {
                repositories: { [projectId]: { repository, repositoryId: APP.repositoryId } },
                writes: { [projectId]: { comment: { mode: 'qualify', effectId: id, adapter: operation, target,
                    beforeDigest: canonicalDigest(null), expectedDigest: changeDigest({ id, operation, target, payload }),
                    installationId: APP.installationId, repositoryId: APP.repositoryId } } },
            }), [f.store.project]);
        },
        tokens: () => tokens,
        operatorLogin: async () => 'JFusco',
    });

    const posts: string[] = [], reads: { target: string; principal: string }[] = [];
    let dispatched: ReturnType<typeof closeEffect>, commentId: number | undefined, failVerification = true;
    f.state.loseResponse = (_p, args) => {
        if (args[1] !== commentsPath || !args.includes('POST')) return false;
        const actualPrincipal = currentPrincipal();
        const stored = f.state.comments.at(-1)!;
        commentId = stored.id;
        posts.push(actualPrincipal);
        dispatched = closeEffect(f, 'issue-comment');
        if (actualPrincipal !== 'operator')
            Object.assign(stored, { user: { login: APP.botLogin, id: accountId }, created_at: f.store.clock.now().toISOString() });
        return false;
    };
    f.state.fail = (_p, args) => {
        if (commentId === undefined) return false;
        const byId = args[1] === exactRead(commentId);
        if (byId || args[1] === listing) reads.push({ target: args[1], principal: currentPrincipal() });
        if (byId && failVerification) { failVerification = false; return 'HTTP 502: Bad Gateway'; }
        return false;
    };
    await f.step();
    const sent = f.state.comments.filter(c => c.body.startsWith(marker) && c.issue_url.endsWith('/issues/5'));
    expect(sent).toHaveLength(1);
    const byId = exactRead(sent[0].id), url = `${f.issueUrl}#issuecomment-${sent[0].id}`;
    expect(posts).toEqual([expectedPrincipal]);
    expect(dispatched).toMatchObject({ status: 'dispatching', writer: { principal, grant: { kind: principal === 'app' ? 'trial' : 'operator' } } });
    expect(reads).toEqual([{ target: byId, principal: expectedPrincipal }]);
    const attempted = closeEffect(f, 'issue-comment')!;
    expect(attempted).toMatchObject({ status: 'uncertain', receipt: { id: sent[0].id, url } });
    expect(attempted.qualification).toBeUndefined();

    // Observation settles the attempt under its saved writer before the next claimed step.
    trialEnabled = false;
    await f.observe();
    const recoveryTargets = qualifies ? [byId, byId, listing] : principal === 'app' ? [byId, byId] : [byId];
    expect(reads.slice(1)).toEqual(recoveryTargets.map(target => ({ target, principal: expectedPrincipal })));
    const settled = closeEffect(f, 'issue-comment')!;
    expect(settled).toMatchObject({ status: 'verified', receipt: { id: sent[0].id, url } });
    if (qualifies) expect(settled.qualification).toEqual({ record: url, target: f.issueUrl, transition: 'issue comment created',
        actor: { login: APP.botLogin, id: APP.botId }, observedAt: expect.any(String) });
    else expect(settled.qualification).toBeUndefined();
    expect(closeEffect(f, 'pr-comment')!.qualification).toBeUndefined();
    await f.step();
    expect(f.job.status, f.job.detail).toBe('cancelled');
    expect(posted(f, 5)).toHaveLength(1);
    expect(posts).toEqual([expectedPrincipal]);
});

test('a PR reopened after the Office closed it gets no issue comment, issue close or card move', async () => {
    const f = await sameHead();
    await f.observe();
    f.state.fail = (_p, args) => { if (closes(f).length && args.some(a => a.includes('/git/ref/heads/'))) f.pr.state = 'open'; return false; };
    await f.step();
    expect(closes(f)).toHaveLength(1);
    expect(posted(f, 5)).toEqual([]); expect(issueCloses(f)).toEqual([]); expect(cardMoves(f)).toEqual([]);
    expect(f.job.status).toBe('blocked');
    expect(f.job.detail).toContain('not the exact closed, unmerged PR');
    await expectReversalStaysBlocked(f);
});

test('a PR reopened at a new head after its close record is qualified again instead of closed', async () => {
    const f = await sameHead();
    await f.observe();
    f.state.fail = (_p, args) => { if (args.some(a => a.endsWith('/issues/200/comments')) && args.includes('POST')) f.publish(H2, { body: `${NUMBERED_BODY}\nCloses #5\n`, checks: 'pass' }); return false; };
    await f.step();
    expect(closes(f)).toEqual([]);
    expect(f.job.supersededWikiClose).toBeUndefined();
    expect(f.job.status).toBe('watching');
    await f.observe();
    expect(f.adoption.redos![0].settled?.replacement).toBe(H2);
    expect(f.job).toMatchObject({ status: 'queued', head: H2 });
});

test('a PR closed during the proof comment and reopened at the same head rechecks containment and reuses its writes', async () => {
    const f = await sameHead();
    await f.observe();
    f.state.fail = (_p, args) => {
        if (args.some(a => a.endsWith('/issues/200/comments')) && args.includes('POST')) f.pr.state = 'closed';
        return false;
    };
    await f.step();
    expect(f.job.status).toBe('watching');
    expect(f.job.supersededWikiClose).toBeUndefined();
    expect(closes(f)).toEqual([]);
    expect(posted(f, 200)).toHaveLength(1);
    const originalBody = f.state.comments.find(c => c.body.startsWith(marker)).body;
    f.pr.state = 'open';
    f.pr.base.sha = f.state.targetTip = TIP2;
    f.state.trees[TIP2].tree[0].sha = PAGE_SHA;
    await f.observe();
    expect(f.job.status).toBe('queued');
    await f.step();
    expect(f.job.status).toBe('cancelled');
    expect(f.job.supersededWikiClose).toMatchObject({ target: TIP2, comments: { pr: originalBody } });
    expect(posted(f, 200)).toHaveLength(1);
    expect(relinks(f)).toHaveLength(1);
    expect(closes(f)).toHaveLength(1);
    expect(posted(f, 5)).toHaveLength(1);
    expect(issueCloses(f)).toHaveLength(1);
});

test('a new head before the first pending proof comment abandons the saved close', async () => {
    const f = await sameHead();
    await f.observe();
    // The proof comment's author is its Effect's own writer, never a viewer read: the first PR read after the relink fails instead.
    f.state.fail = (_p, args) => closeEffect(f, 'relink')?.status === 'verified' && args[0] === 'api' && String(args[1]).endsWith('/pulls/200') ? 'HTTP 502: Bad Gateway' : false;
    await f.step();
    expect(f.job.supersededWikiClose?.head).toBe(H1);
    expect(posted(f, 200)).toEqual([]);
    expect(closeEffect(f, 'relink')?.status).toBe('verified');
    f.state.fail = () => false;
    f.publish(H2, { body: `${NUMBERED_BODY}\nCloses #5\n`, checks: 'pass' });
    await f.observe(); await f.step();
    expect(f.job.supersededWikiClose).toBeUndefined();
    expect(f.job.steps.at(-1)?.result.receipts).toEqual([expect.objectContaining({ id: 'relink', verified: true })]);
    expect(posted(f, 200)).toEqual([]);
    expect(closes(f)).toEqual([]);
    await f.observe();
    expect(f.job).toMatchObject({ status: 'queued', head: H2 });
});

test.each(['PR', 'issue'])('a reopened %s during the final card read-back cannot complete supersession', async subject => {
    const f = await sameHead();
    await f.observe();
    let reopened = false;
    f.state.fail = (_p, args) => {
        if (!reopened && cardMoves(f).length === 2 && args[1] === 'graphql') {
            reopened = true;
            (subject === 'PR' ? f.pr : f.state.issue).state = 'open';
        }
        return false;
    };
    await f.step();
    expect(reopened).toBe(true);
    expect(f.state.cards.map(c => c.status)).toEqual(['done', 'done']);
    const prReceipt = closeEffect(f, 'pr-close'), issueReceipt = closeEffect(f, 'issue-close');
    expect(prReceipt?.status).toBe('verified');
    expect(issueReceipt?.status).toBe('verified');
    await expectReversalStaysBlocked(f);
    expect(f.job.status).toBe('blocked');
    expect(f.adoption.status).toBe('adopted');
    expect(f.store.state.events.filter(e => e.kind === 'wiki-pr-superseded')).toEqual([]);
    expect(closeEffect(f, 'pr-close')).toEqual(prReceipt);
    expect(closeEffect(f, 'issue-close')).toEqual(issueReceipt);
    expect(cardMoves(f)).toHaveLength(2);
});

test.each([0, 1])('reopening the issue after %i card moves blocks the remaining moves', async moved => {
    const f = await sameHead();
    await f.observe();
    let reopened = false;
    f.state.fail = (_p, args) => {
        if (!reopened && cardMoves(f).length === moved && closeEffect(f, 'issue-close')?.status === 'verified' &&
            args.some(a => a.endsWith('/issues/5'))) {
            reopened = true;
            f.state.issue.state = 'open';
        }
        return false;
    };
    await f.step();
    expect(reopened).toBe(true);
    expect(cardMoves(f)).toHaveLength(moved);
    expect(f.state.cards.map(c => c.status).sort()).toEqual(moved === 0 ? ['review', 'review'] : ['done', 'review']);
    expect(closeEffect(f, 'issue-close')).toMatchObject({ status: 'verified', receipt: { state: 'closed', reason: 'not_planned' } });
    expect(f.job).toMatchObject({ status: 'blocked', detail: expect.stringContaining('recorded closure') });
    expect(f.store.state.events.filter(e => e.kind === 'wiki-pr-superseded')).toEqual([]);
});

test.each(['relink', 'issue-close'])('disabling merging on the prepared %s’s final read rejects that write', async step => {
    const f = await sameHead();
    await f.observe();
    let issueReads = 0, disabled = false;
    f.state.fail = (_p, args) => {
        if (closeEffect(f, step)?.status !== 'prepared') return false;
        const issue = args.some(a => a.endsWith('/issues/5'));
        if (issue) issueReads++;
        if (step === 'relink' ? issueReads > 0 && args.some(a => a.endsWith('/pulls/200')) : issue && issueReads === 2) {
            disabled = true;
            f.store.state.coordination!.merges!.enabled = false;
        }
        return false;
    };
    await f.step();
    expect(disabled).toBe(true);
    expect(closeEffect(f, step)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(step === 'relink' ? relinks(f) : issueCloses(f)).toEqual([]);
});

test.each([
    ['matching head and issue', H1, 5, true],
    ['a different head', H2, 5, false],
    ['a different issue', H1, 6, false],
])('a prior adoption link with %s is reconciled only against its original intent', async (_description, head, issue, matches) => {
    const f = await sameHead();
    f.pr.body = `${NUMBERED_BODY}\nCloses #5\n`;
    const key = `pr-body:200:${head}`, id = `harness:${f.adoption.id}:${key}`;
    f.store.putEffect({ id, work: { projectId: f.store.project.id, kind: 'delivery', id: f.adoption.id }, attemptId: f.adoption.id,
        operation: 'github-pr-body', target: f.pr.html_url, authorization: 'office-harness', payload: { issue }, expectedState: { key },
        status: 'uncertain', createdAt: '', dispatchedAt: f.store.clock.now().toISOString(), verifiedAt: '', receipt: null, error: 'lost response', elapsedMs: null });
    await f.observe();
    let priorStatus: string | undefined;
    f.state.fail = (_p, args) => {
        if (args.some(a => a.endsWith('/issues/200/comments')) && args.includes('POST')) priorStatus = f.store.getEffect(id)?.status;
        return false;
    };
    await f.step();
    expect(relinks(f)).toEqual([]);
    if (matches) {
        expect(priorStatus).toBe('verified');
        expect(f.store.getEffect(id)).toMatchObject({ status: 'verified', receipt: { head } });
        expect(f.job.status).toBe('cancelled');
    } else {
        expect(f.store.getEffect(id)).toMatchObject({ status: 'uncertain', error: 'lost response' });
        expect(posted(f, 200)).toEqual([]);
        expect(closes(f)).toEqual([]);
        expect(f.job.status).toBe('blocked');
    }
});

test('a same-head maintenance PR stays open for its weekly refresh, reports once after eight days, then merges the weekly head', async () => {
    const f = await sameHead({ maintenance: true });
    let at = Date.parse(f.state.runs[0].updated_at);
    f.store.clock = { now: () => new Date(at), monotonic: () => at };
    await f.observe();
    expect(f.job.status).toBe('watching');
    expect(f.job.detail).toContain('next weekly refresh');
    at += 8 * 24 * 3_600_000 + 1;
    await f.observe(); await f.observe();
    expect(f.job.status).toBe('blocked');
    expect(f.store.state.events.filter(e => e.kind === 'bot-redo-stopped')).toHaveLength(1);
    expect(f.writes().filter(m => !m.target.endsWith('/dispatches'))).toEqual([]);
    f.publish(H2, { body: WEEKLY.body, checks: 'pass' });
    await f.observe();
    expect(f.job.status).toBe('watching');
    await adoptDependencyBot(f.store, f.execute, f.delivery.jobs, f.store.state.coordination!.pickup!, wikiSync);
    await f.observe();
    expect(f.job).toMatchObject({ status: 'queued', head: H2 });
    await f.step();
    expect(f.writes().filter(m => m.method === 'PUT')).toHaveLength(1);
    expect(closes(f)).toEqual([]);
});

test('an ordinary, never-redone wiki PR does not enter the superseded close', async () => {
    const f = fakeBotPR('wiki-sync');
    f.pr.mergeable = true; f.publish(H1, { checks: 'pass' });
    await f.observe(); await f.step();
    expect(f.job.supersededWikiClose).toBeUndefined();
    expect(f.writes().filter(m => m.method === 'PUT')).toHaveLength(1);
});

test('a claimed re-entry reads an earlier unread PR close back before anything else, with no observation between', async () => {
    const f = await sameHead();
    await f.observe();
    let lost = false;
    f.state.loseResponse = (_p, args) => { if (!lost && args.includes('state=closed')) { lost = true; return true; } return false; };
    await f.step();
    expect(f.job.status).toBe('blocked');
    // The first re-entry cannot read the close back (a transient failure): the close record is kept and nothing moves.
    let failOnce = true;
    f.state.fail = (_p, args) => { if (failOnce && args.some(a => a.includes('/git/ref/heads/'))) { failOnce = false; return 'HTTP 502: Bad Gateway'; } return false; };
    f.job.status = 'queued';
    await f.step();
    expect(f.job.status).toBe('blocked');
    expect(f.job.supersededWikiClose).toBeDefined();
    expect(f.job.detail).toContain('pr-close is unverified after read-back');
    f.job.status = 'queued';
    await f.step();
    expect(f.job.status).toBe('cancelled');
    expect(closes(f)).toHaveLength(1);
    expect(f.job.steps.some(s => s.stage === 'superseded-close-abandoned')).toBe(false);
});

test.each([false, true])('a target that still holds every change after the PR close is corroborated with the closed PR’s frozen base (lost response: %s)', async lost => {
    const f = await sameHead();
    f.state.trees[TIP2] = { tree: [blob(PAGE, PAGE_SHA), blob('wiki/connections.md', OTHER), generator] };
    await f.observe();
    let moved = false;
    f.state.loseResponse = (_p, args) => lost && args.includes('state=closed');
    f.state.fail = (_p, args) => { if (!moved && args.includes('state=closed')) { moved = true; f.state.targetTip = TIP2; } return false; };
    await f.step();
    if (lost) {
        expect(f.job.status).toBe('blocked');
        f.state.loseResponse = () => false;
        await f.observe();
        expect(f.job.status).toBe('queued');
        await f.step();
    }
    expect(f.pr.base.sha).toBe(BASE);
    expect(f.job.supersededWikiClose?.partial).toBeUndefined();
    expect(f.job.supersededWikiClose?.revalidated).toMatchObject([{ target: TIP2 }]);
    expect(closes(f)).toHaveLength(1); expect(posted(f, 5)).toHaveLength(1); expect(issueCloses(f)).toHaveLength(1);
    expect(f.state.issue).toMatchObject({ state: 'closed', state_reason: 'not_planned' });
    expect(f.state.cards.map(c => c.status)).toEqual(['done', 'done']);
    expect(f.job.status).toBe('cancelled');
    expect(f.store.state.events.filter(e => e.kind === 'wiki-pr-superseded')).toHaveLength(1);
});

test('a corroboration read that cannot bind the closed PR’s base waits instead of recording a partial outcome', async () => {
    const f = await sameHead();
    f.state.trees[TIP2] = { tree: [blob(PAGE, PAGE_SHA), blob('wiki/connections.md', OTHER), generator] };
    await f.observe();
    // After the close, the second PR read is the corroborating proof's first: its base is unreadable once.
    let afterClose = -1;
    f.state.fail = (_p, args) => {
        if (args.includes('state=closed')) { afterClose = 0; f.state.targetTip = TIP2; return false; }
        if (afterClose >= 0 && args.includes(`repos/${f.store.project.repository}/pulls/200`) && !args.includes('-X')) {
            afterClose++;
            if (afterClose === 2) f.pr.base.sha = ''; else if (afterClose === 3) f.pr.base.sha = BASE;
        }
        return false;
    };
    await f.step();
    expect(f.job.status).toBe('blocked');
    expect(f.job.detail).toContain('corroboration waits');
    expect(f.job.supersededWikiClose?.partial).toBeUndefined();
    await f.observe(); await f.step();
    expect(f.pr.base.sha).toBe(BASE);
    expect(f.job.status).toBe('cancelled');
    expect(closes(f)).toHaveLength(1); expect(issueCloses(f)).toHaveLength(1);
});
