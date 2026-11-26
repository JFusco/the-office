import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../../support/fake-github';
import { wikiSync } from '../../../../../server/delivery/intake/dependency-bots/wiki-sync';
import { adoptDependencyBot } from '../../../../../server/delivery/intake/dependency-bots/adopt';
import { REFUSAL_MEMO_MS } from '../../../../../server/delivery/intake/dependency-bots/refusal-memo';
import { trackingMarker } from '../../../../../server/delivery/intake/dependabot/tracking-issue';
afterEach(cleanupFakes);

const T0 = Date.parse('2026-11-26T13:00:00.000Z'), MINUTE = 60_000;

/**
 * Canonical wiki-sync PR #314 for merged PR #139, as in the wiki-sync tests, on a store whose clock the test moves.
 * Automatic mode (card In review) by default; `pickup` puts the card in Ready with automatic adoption off, so a
 * "not yet" refusal is kept on a record too.
 */
function fixture({ pickup = false } = {}) {
    const f = fakeGitHub();
    let now = T0;
    f.store.clock = { now: () => new Date(now), monotonic: () => now };
    f.store.project.autoAdopt = pickup ? [] : ['wiki-sync'];
    f.state.cards = [{ id: 'pr-card', kind: 'PullRequest', number: 314, status: pickup ? 'ready' : 'review' }];
    Object.assign(f.state.issue, { title: '', body: '', assignees: [] });
    const pr = { number: 314, html_url: `https://github.com/${REPOSITORY}/pull/314`, state: 'open', draft: false, commits: 1, changed_files: 2,
        user: { login: 'JFusco', id: 486049 }, title: 'docs(wiki): reconcile PR #139', body: 'Automated, reviewable wiki reconciliation for merged PR #139.',
        head: { sha: HEAD, ref: 'bot/wiki-sync/139', repo: { full_name: REPOSITORY } }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } } };
    f.state.prs.push(pr);
    const actor = { login: 'github-actions[bot]', id: 41898282 };
    const files: any[] = [{ filename: 'wiki/journal/source.md' }, { filename: 'scripts/wiki/graph/data/graph.json' }];
    const parent = { merged: true, merged_at: '2026-11-07T15:37:10Z', base: { ref: 'main' }, head: { ref: 'codex/profile' } } as Record<string, any>;
    const reads: string[] = [];
    let failParent = false, detail: ((row: any) => any) | undefined;
    const execute = async (program: string, args: string[], options?: any) => {
        const path = args[1] ?? '';
        if (/\/pulls\/(139|314)$|\/pulls\/314\/(commits|files)\?|\/issues\?state=all/.test(path)) reads.push(path);
        if (detail && path.endsWith('/pulls/314')) return JSON.stringify(detail(pr));
        if (path.includes('/pulls/314/commits?')) return JSON.stringify([[{ author: { ...actor }, committer: { ...actor }, sha: pr.head.sha }]]);
        if (path.includes('/pulls/314/files?')) return JSON.stringify([files]);
        if (path.endsWith('/pulls/139')) { if (failParent) throw new Error('gh exited 1: HTTP 502'); return JSON.stringify(parent); }
        return f.execute(program, args, options);
    };
    const adopt = () => adoptDependencyBot(f.store, execute, f.delivery.jobs, f.store.state.coordination!.pickup!, wikiSync);
    const record = () => f.store.state.coordination!.adoptions!.find(r => r.pr === 314)!;
    return { f, pr, parent, files, adopt, record, reads, parentReads: () => reads.filter(path => path.endsWith('/pulls/139')).length,
        at: (ms: number) => { now = T0 + ms; }, failParent: (fail: boolean) => { failParent = fail; }, detail: (read: (row: any) => any) => { detail = read; } };
}

test('an unchanged refused PR is not qualified again for five minutes, then is, and its memo is dated each time', async () => {
    const x = fixture(); x.parent.merged = false;
    await x.adopt();
    const first = structuredClone(x.record()), reads = x.reads.length;
    expect(first).toMatchObject({ status: 'refused', refusalMemo: { checkedAt: new Date(T0).toISOString() } });
    expect(first.detail).toContain('the source PR is not an eligible merged parent');
    x.at(REFUSAL_MEMO_MS - 1); await x.adopt();
    expect(x.reads).toHaveLength(reads);
    x.at(REFUSAL_MEMO_MS); await x.adopt();
    expect(x.parentReads()).toBe(3);
    // The refusal is worded as before, so the record keeps its time; only the memo is dated anew.
    expect(x.record()).toMatchObject({ status: 'refused', at: first.at, refusalMemo: { key: first.refusalMemo!.key, checkedAt: new Date(T0 + REFUSAL_MEMO_MS).toISOString() } });
});

test('a tracking issue created later is found once the memo expires, and the PR is adopted', async () => {
    const x = fixture(); x.pr.body += '\nCloses #5';
    await x.adopt();
    expect(x.record().detail).toContain('closes an issue other than its owned tracking issue');
    Object.assign(x.f.state.issue, { body: trackingMarker(314, 'wiki-sync'), user: { login: 'JFusco' }, assignees: [{ login: 'JFusco' }] });
    x.at(MINUTE); await x.adopt();
    expect(x.record().status).toBe('refused');
    x.at(REFUSAL_MEMO_MS); await x.adopt();
    expect(x.record()).toMatchObject({ status: 'adopted', issue: 5 });
    expect(x.record().refusalMemo).toBeUndefined();
});

test.each([
    { name: 'draft-only', refuse: (pr: any) => { pr.draft = true; }, allow: (pr: any) => { pr.draft = false; }, said: 'it is a draft' },
    { name: 'base-only', refuse: (pr: any) => { pr.base.ref = 'release'; }, allow: (pr: any) => { pr.base.ref = 'main'; }, said: 'it does not target the configured base' },
])('a $name change is qualified at once, within the memo', async ({ refuse, allow, said }) => {
    const x = fixture({ pickup: true }); refuse(x.pr);
    await x.adopt();
    expect(x.record()).toMatchObject({ status: 'refused', refusalMemo: { checkedAt: new Date(T0).toISOString() } });
    expect(x.record().detail).toContain(said);
    allow(x.pr); x.at(MINUTE); await x.adopt();
    expect(x.record()).toMatchObject({ status: 'adopted', issue: 5 });
});

test('a change to the base SHA alone, or any other key field, is qualified again', async () => {
    const x = fixture(); x.parent.merged = false;
    await x.adopt();
    const parentReads = x.parentReads();
    x.pr.base.sha = 'c'.repeat(40); x.at(MINUTE); await x.adopt();
    expect(x.parentReads()).toBe(parentReads + 1);
    x.pr.title = 'docs(wiki): reconcile PR #139 [skip release]'; x.at(2 * MINUTE); await x.adopt();
    expect(x.parentReads()).toBe(parentReads + 2);
});

test('an older refused record without a memo takes the live path', async () => {
    const x = fixture();
    x.f.store.state.coordination!.adoptions = [{ id: 'old', bot: 'wiki-sync', pr: 314, url: x.pr.html_url, title: x.pr.title, issue: 0, status: 'refused', detail: 'Refused by an older release.', at: '2026-11-20T00:00:00.000Z' }];
    await x.adopt();
    expect(x.parentReads()).toBeGreaterThan(0);
    expect(x.record()).toMatchObject({ id: 'old', status: 'adopted', issue: 5 });
});

test.each([
    { name: 'incomplete file coverage', setup: (x: ReturnType<typeof fixture>) => { x.pr.changed_files = 3; }, status: 'refused' },
    { name: 'a head that disagrees', setup: (x: ReturnType<typeof fixture>) => { delete (x.pr as any).commits; x.detail(row => ({ ...row, commits: 1, head: { ...row.head, sha: 'e'.repeat(40) } })); }, status: 'refused' },
    { name: 'a read error', setup: (x: ReturnType<typeof fixture>) => { x.failParent(true); }, status: 'blocked' },
])('$name is never kept: the next pass qualifies again', async ({ setup, status }) => {
    const x = fixture({ pickup: true }); setup(x);
    await x.adopt();
    expect(x.record().status).toBe(status);
    expect(x.record().refusalMemo).toBeUndefined();
    const reads = x.reads.length;
    x.at(MINUTE); await x.adopt();
    expect(x.reads.length).toBeGreaterThan(reads);
});
