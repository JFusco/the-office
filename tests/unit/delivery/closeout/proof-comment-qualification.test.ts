import { afterEach, expect, test } from 'vitest';
import { postProofComment } from '../../../../server/delivery/closeout/proof-comment';
import { parseGitHubApp } from '../../../../server/github/identity/app-config';
import { promoteRoute, routeState } from '../../../../server/github/identity/route-activation';
import { canonicalDigest } from '../../../../server/github/identity/route-entry';
import { changeDigest } from '../../../../server/github/identity/write-boundary';
import { currentPrincipal } from '../../../../server/github/identity/write-credential-scope';
import type { TicketJob } from '../../../../src/shared';
import { APP, appConfig, issueUrl, JOB, routeFixture, type RouteFixture } from '../../github/identity/support/route-fixture';

let f: RouteFixture;
afterEach(() => f?.cleanup());

const NUMBER = 629, KEY = 'proof-comment', ID = `harness:${JOB.id}:${KEY}`, OPERATION = 'github-issue-comment';
const MARKER = '<!-- office:proof-comment fixture -->', BODY = `${MARKER}\nThe Office posted this comment as its GitHub App.`;
const ISSUE = issueUrl(NUMBER), PULL = `https://github.com/JFusco/brain/pull/${NUMBER}`, API_ISSUE = `https://api.github.com/repos/JFusco/brain/issues/${NUMBER}`;
const BOT = { login: APP.botLogin, id: APP.botId }, OPERATOR = { login: 'JFusco', id: 7 };
type Comment = { id: number; body: string; html_url: string; issue_url: string; user: { login: string; id: number }; created_at: string };

/** The one pending `comment` entry that designates this proof comment's Effect id for an App trial on `target`. */
function trial(target = ISSUE, beforeDigest = canonicalDigest(null)) {
    const payload = { number: NUMBER, marker: MARKER, body: BODY, author: APP.botLogin };
    return parseGitHubApp(appConfig({ comment: { mode: 'qualify', effectId: ID, adapter: OPERATION, target, beforeDigest,
        expectedDigest: changeDigest({ id: ID, operation: OPERATION, target, payload }), installationId: APP.installationId, repositoryId: APP.repositoryId } }), [f.store.project]);
}

/**
 * One issue conversation on a counted provider. A POST under the scoped App token is recorded as the bot, any other as
 * the operator; every read records the principal it ran under. `atPost` runs as the POST arrives, `onPost` can change
 * what GitHub stored, `land: false` makes the POST store nothing, and `lose` loses the response after the POST.
 */
function conversation(base = ISSUE) {
    const comments: Comment[] = [], posts: string[] = [], reads: string[] = [], exactReads: number[] = [];
    const hooks: {
        lose?: boolean;
        land?: boolean;
        atPost?: () => void;
        onPost?: (made: Comment) => void;
        list?: (comments: readonly Comment[]) => readonly unknown[];
    } = {};
    let next = 500;
    const add = (body: string, user = BOT, created = '2026-11-26T12:00:00Z') => {
        const id = next++, made = { id, body, html_url: `${base}#issuecomment-${id}`, issue_url: API_ISSUE, user: { ...user }, created_at: created };
        comments.push(made);
        return made;
    };
    const execute = async (_program: string, args: string[]) => {
        if (args.includes('POST')) {
            const principal = currentPrincipal();
            posts.push(principal);
            hooks.atPost?.();
            const made = hooks.land === false ? undefined : add(args[args.indexOf('-f') + 1].slice('body='.length), principal === 'operator' ? OPERATOR : BOT);
            if (made) hooks.onPost?.(made);
            if (hooks.lose || !made) throw new Error('gh timed out; previous action outcome must be reconciled');
            return JSON.stringify({ id: made.id, html_url: made.html_url });
        }
        reads.push(currentPrincipal());
        if (args.includes('--paginate')) return JSON.stringify([hooks.list?.(comments) ?? comments]);
        const id = Number(args[1].split('/').pop());
        exactReads.push(id);
        const found = comments.find(item => item.id === id);
        if (!found) throw new Error('gh: Not Found (HTTP 404)');
        return JSON.stringify(found);
    };
    return { comments, posts, reads, exactReads, hooks, add, execute };
}

const proof = (kind: 'issue' | 'pull' = 'issue') => ({ number: NUMBER, kind, marker: MARKER, body: BODY });
const post = (provider: ReturnType<typeof conversation>, kind: 'issue' | 'pull' = 'issue') =>
    postProofComment(f.store, provider.execute, JOB as TicketJob, KEY, proof(kind), () => {});
const promotion = () => promoteRoute(f.store, f.config()!, 'comment', { mode: 'office-app', proofEffectIds: [ID] });

test('a fresh App proof comment records exact actor-bearing evidence from independent reads', async () => {
    f = routeFixture();
    f.setConfig(trial());
    f.advance(350);
    const provider = conversation();
    await expect(post(provider)).resolves.toEqual({ id: 500, url: `${ISSUE}#issuecomment-500` });
    const intent = f.store.getEffect(ID)!;
    expect(intent).toMatchObject({ status: 'verified', writer: { principal: 'app', login: APP.botLogin, botId: APP.botId, grant: { kind: 'trial' } } });
    expect(intent.qualification).toEqual({ record: `${ISSUE}#issuecomment-500`, target: ISSUE, transition: 'issue comment created', actor: BOT, observedAt: '2026-11-26T12:00:00.350Z' });
    expect(provider.posts).toEqual([`app:${APP.installationId}`]);
    // The pre-state read runs before the token; the exact read-back and the conversation read run under it.
    expect(provider.reads).toEqual(['operator', 'operator', `app:${APP.installationId}`, `app:${APP.installationId}`, `app:${APP.installationId}`]);
    // A qualified issue comment alone never opens the route: the PR-comment mutation is unproved.
    expect(promotion()).toEqual({ ok: false, reason: 'no verified trial proves rest-pr-comment' });
    expect(routeState(f.store, 'comment')).toEqual({ kind: 'never-activated' });
});

test('a lost POST response is reconciled by marker under its saved App writer without qualifying', async () => {
    f = routeFixture();
    f.setConfig(trial());
    const provider = conversation();
    provider.hooks.lose = true;
    await expect(post(provider)).rejects.toThrow('timed out');
    expect(f.store.getEffect(ID)).toMatchObject({ status: 'uncertain', receipt: null });
    expect(f.store.getEffect(ID)!.qualification).toBeUndefined();
    f.reopen();
    provider.hooks.lose = false;
    const before = provider.reads.length;
    await expect(post(provider)).resolves.toEqual({ id: 500, url: `${ISSUE}#issuecomment-500` });
    expect(provider.posts).toEqual([`app:${APP.installationId}`]);
    expect(provider.reads.slice(before)).toEqual([`app:${APP.installationId}`]);
    expect(provider.exactReads).toEqual([]);
    expect(f.store.getEffect(ID)).toMatchObject({ status: 'verified', receipt: { id: 500 } });
    expect(f.store.getEffect(ID)!.qualification).toBeUndefined();
});

test.each([
    ['omits the receipt ID', () => [], 'does not yet show the comment read by its ID'],
    ['has an unreadable body', (comments: readonly Comment[]) => [...comments, { id: 501 }], 'Complete issue comment bodies'],
] as const)('a conversation listing that %s leaves the Effect open for read-back', async (_case, incompleteListing, error) => {
    f = routeFixture();
    f.setConfig(trial());
    const provider = conversation();
    provider.hooks.list = comments => comments.length ? incompleteListing(comments) : comments;
    await expect(post(provider)).rejects.toThrow(error);
    expect(f.store.getEffect(ID)).toMatchObject({ status: 'uncertain', receipt: { id: 500 } });
    expect(f.store.getEffect(ID)!.qualification).toBeUndefined();
    expect(provider.posts).toHaveLength(1);
    expect(provider.exactReads).toEqual([500, 500]);

    delete provider.hooks.list;
    await expect(post(provider)).resolves.toEqual({ id: 500, url: `${ISSUE}#issuecomment-500` });
    expect(f.store.getEffect(ID)).toMatchObject({ status: 'verified', receipt: { id: 500 },
        qualification: { record: `${ISSUE}#issuecomment-500`, target: ISSUE, actor: BOT } });
    expect(provider.exactReads).toEqual([500, 500, 500, 500]);
    expect(provider.posts).toHaveLength(1);
});

test('an edit observed only in the conversation listing prevents qualification', async () => {
    f = routeFixture();
    f.setConfig(trial());
    const provider = conversation();
    provider.hooks.list = comments => comments.map(comment => ({ ...comment, body: `${comment.body}\nedited` }));
    await expect(post(provider)).resolves.toMatchObject({ id: 500 });
    expect(f.store.getEffect(ID)).toMatchObject({ status: 'verified', receipt: { id: 500 } });
    expect(f.store.getEffect(ID)!.qualification).toBeUndefined();
    expect(provider.posts).toHaveLength(1);
});

test.each([
    ['another account id under the bot login', (provider: ReturnType<typeof conversation>, made: Comment) => { made.user.id = 999; }],
    ['a second comment that starts with the marker', (provider: ReturnType<typeof conversation>) => { provider.add(`${MARKER}\nquoted`, OPERATOR); }],
])('a verified comment with %s proves nothing', async (_case, change) => {
    f = routeFixture();
    f.setConfig(trial());
    const provider = conversation();
    provider.hooks.onPost = made => change(provider, made);
    await expect(post(provider)).resolves.toMatchObject({ id: 500 });
    expect(f.store.getEffect(ID)).toMatchObject({ status: 'verified' });
    expect(f.store.getEffect(ID)!.qualification).toBeUndefined();
    expect(provider.posts).toHaveLength(1);
    expect(promotion()).toEqual({ ok: false, reason: 'a proof Effect has no actor-bearing read-back for the App on its bound target' });
});

test.each([
    ['another body', (made: Comment) => { made.body = `${MARKER}\nedited`; }],
    ['another issue', (made: Comment) => { made.issue_url = `${API_ISSUE}0`; }],
    ['another login', (made: Comment) => { made.user = { ...OPERATOR }; }],
])('a comment read back with %s stays unverified and is never sent again', async (_case, change) => {
    f = routeFixture();
    f.setConfig(trial());
    const provider = conversation();
    provider.hooks.onPost = change;
    await expect(post(provider)).rejects.toThrow('did not verify');
    await expect(post(provider)).rejects.toThrow('will not be resent');
    expect(f.store.getEffect(ID)).toMatchObject({ status: 'uncertain', receipt: { id: 500 } });
    expect(f.store.getEffect(ID)!.qualification).toBeUndefined();
    expect(provider.posts).toHaveLength(1);
});

test('a marked comment already on the issue holds the trial before an intent exists', async () => {
    f = routeFixture();
    f.setConfig(trial());
    const provider = conversation();
    provider.add(BODY, BOT, '2026-11-26T11:00:00Z');
    await expect(post(provider)).rejects.toThrow('the bound pre-state does not match the designated trial');
    expect(f.store.getEffect(ID)).toBeUndefined();
    expect(provider.posts).toEqual([]);
});

test('a receipt-backed comment with a pre-dispatch timestamp proves nothing', async () => {
    f = routeFixture();
    f.setConfig(trial());
    const provider = conversation();
    provider.hooks.list = comments => {
        if (f.store.getEffect(ID)?.status === 'prepared') f.advance(2_000);
        return comments;
    };
    await expect(post(provider)).resolves.toMatchObject({ id: 500 });
    expect(f.store.getEffect(ID)).toMatchObject({ status: 'verified', createdAt: '2026-11-26T12:00:00.000Z',
        dispatchedAt: '2026-11-26T12:00:02.000Z', receipt: { id: 500 } });
    expect(f.store.getEffect(ID)!.qualification).toBeUndefined();
    expect(provider.posts).toHaveLength(1);
});

test.each([false, true])('an unreadable pre-state comment body prevents dispatch (during preflight: %s)', async duringPreflight => {
    f = routeFixture();
    f.setConfig(trial());
    const provider = conversation();
    provider.hooks.list = comments => Boolean(f.store.getEffect(ID)) === duringPreflight ? [{ id: 499 }] : comments;
    await expect(post(provider)).rejects.toThrow('Complete issue comment bodies');
    if (duringPreflight) expect(f.store.getEffect(ID)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    else expect(f.store.getEffect(ID)).toBeUndefined();
    expect(provider.posts).toEqual([]);
});

test.each(['2026-11-26T11:59:00Z', '2026-11-26T12:00:00Z'])('a marker-only recovery of an independent comment timestamped %s proves nothing', async createdAt => {
    f = routeFixture();
    f.setConfig(trial());
    const provider = conversation();
    provider.hooks.land = false;
    provider.hooks.atPost = () => { provider.add(BODY, BOT, createdAt); };
    await expect(post(provider)).rejects.toThrow('timed out');
    expect(f.store.getEffect(ID)).toMatchObject({ status: 'uncertain', receipt: null });
    await expect(post(provider)).resolves.toMatchObject({ id: 500 });
    expect(f.store.getEffect(ID)).toMatchObject({ status: 'verified', receipt: { id: 500 } });
    expect(f.store.getEffect(ID)!.qualification).toBeUndefined();
    expect(provider.posts).toHaveLength(1);
});

test.each([false, true])('a trial that bound an already-present marker proves nothing (POST lands: %s)', async lands => {
    f = routeFixture();
    const provider = conversation();
    const existing = provider.add(BODY);
    const beforeDigest = canonicalDigest({ id: existing.id, url: existing.html_url });
    f.setConfig(trial(ISSUE, beforeDigest));
    provider.hooks.land = lands;
    if (lands) provider.hooks.atPost = () => { provider.comments.shift(); };
    else await expect(post(provider)).rejects.toThrow('timed out');
    const expectedId = lands ? 501 : existing.id;
    await expect(post(provider)).resolves.toMatchObject({ id: expectedId });
    expect(f.store.getEffect(ID)).toMatchObject({ status: 'verified', writer: { binding: { beforeDigest } }, receipt: { id: expectedId } });
    expect(f.store.getEffect(ID)!.qualification).toBeUndefined();
    expect(provider.posts).toHaveLength(1);
});

test('two marked comments after a lost response leave the Effect attempted, unqualified and unsent', async () => {
    f = routeFixture();
    f.setConfig(trial());
    const provider = conversation();
    provider.hooks.lose = true;
    provider.hooks.onPost = () => { provider.add(BODY, BOT); };
    await expect(post(provider)).rejects.toThrow('timed out');
    provider.hooks.lose = false;
    await expect(post(provider)).rejects.toThrow('needs reconciliation');
    expect(f.store.getEffect(ID)).toMatchObject({ status: 'uncertain' });
    expect(f.store.getEffect(ID)!.qualification).toBeUndefined();
    expect(provider.posts).toHaveLength(1);
});

test('an operator comment keeps its author check and makes no qualification read', async () => {
    f = routeFixture();
    const provider = conversation();
    await expect(post(provider)).resolves.toMatchObject({ id: 500 });
    const intent = f.store.getEffect(ID)!;
    expect(intent).toMatchObject({ status: 'verified', writer: { principal: 'operator', login: 'JFusco' } });
    expect(intent.qualification).toBeUndefined();
    expect(provider.posts).toEqual(['operator']);
    expect(provider.reads).toEqual(['operator']);
});

test('an App comment on a pull request conversation never qualifies the issue-comment trial', async () => {
    f = routeFixture();
    f.setConfig(trial(PULL));
    const provider = conversation(PULL);
    await expect(post(provider, 'pull')).resolves.toMatchObject({ id: 500 });
    const intent = f.store.getEffect(ID)!;
    expect(intent).toMatchObject({ status: 'verified', writer: { principal: 'app', grant: { kind: 'trial' } } });
    expect(intent.qualification).toBeUndefined();
});
