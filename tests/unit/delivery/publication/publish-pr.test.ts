import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
afterEach(cleanupFakes);
afterEach(() => vi.useRealTimers());
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { publishCandidate } from '../../../../server/delivery/publication/publish-pr';
import { promoteReady } from '../../../../server/delivery/publication/ready-pr';
import { officePRContent } from '../../../../server/delivery/publication/pr-body';
import { HOLDS } from '../../../../server/office/config';
import { digest } from '../../../../server/store/readback-evidence';

test('first publication pushes once and opens one linked draft PR from the developer content', async () => {
    const f = fakeGitHub(), job = f.candidate({stage:'draft'}), root = f.artifactRoot(job);
    writeFileSync(resolve(root, 'pr.json'), JSON.stringify({ title: 'fix(sources): restore scans', body: '## Summary\nRestores.\n## Linked issue\nCloses #5\n' }));
    const published = await claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root));
    expect(published).toMatchObject({ pr: 200, created: true, pushed: true, contentSource: 'developer' });
    expect(f.state.prs).toHaveLength(1);
    expect(f.state.prs[0]).toMatchObject({ draft: true, title: 'fix(sources): restore scans', head: { sha: HEAD } });
    expect(f.state.calls.filter(c => c.startsWith('git push')).length).toBe(1);
    expect(f.state.calls.some(c => c.includes('--force'))).toBe(false);
    expect(f.state.calls.some(c => c.startsWith('pnpm run --silent lint:pr'))).toBe(true);
    // Repeating publication adopts the same PR without another push or PR.
    expect(await claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root))).toMatchObject({ pr: 200, created: false, pushed: false });
    expect(f.state.prs).toHaveLength(1);
});
test('a repair updates the same PR with one ordinary push of a descendant head', async () => {
    const f = fakeGitHub(), job = f.candidate({stage:'draft'}), root = f.artifactRoot(job);
    await claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root));
    job.pr = 200;
    const repaired = 'c'.repeat(40);
    job.head = repaired; f.state.local.head = repaired;
    expect(await claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root))).toMatchObject({ pr: 200, pushed: true, created: false });
    expect(f.state.prs).toHaveLength(1);
    expect(f.state.prs[0].head.sha).toBe(repaired);
    f.state.notAncestor = true;
    job.head = 'd'.repeat(40); f.state.local.head = job.head;
    await expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root))).rejects.toThrow('ancestor');
});
test('remote divergence, a foreign PR, failed lint and holds stop publication before any write', async () => {
    const f = fakeGitHub(), job = f.candidate({stage:'draft'}), root = f.artifactRoot(job);
    f.state.remote[job.branch] = 'e'.repeat(40);
    await expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root))).rejects.toThrow('not the reviewed candidate');
    delete f.state.remote[job.branch];
    f.state.lintFails = true;
    await expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root))).rejects.toThrow('lint:pr');
    expect(f.state.prs).toHaveLength(0);
    f.state.lintFails = false;
    HOLDS['GH-5'] = 'Synthetic hold';
    try { await expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root))).rejects.toThrow('held'); }
    finally { delete HOLDS['GH-5']; }
});
test('a PR creation whose read-back lagged is adopted on retry, never re-sent', async () => {
    const f = fakeGitHub(), job = f.candidate({stage:'draft'}), root = f.artifactRoot(job);
    let creates = 0;
    f.state.fail = (program, args) => { if (program === 'gh' && args[1] === 'create') { creates++; return creates === 1 ? false : 'should not resend'; } return false; };
    const original = f.execute;
    let drop = true;
    const execute = async (program: string, args: string[], options: any) => {
        const out = await original(program, args, options);
        if (program === 'gh' && args[1] === 'list' && drop && f.state.prs.length) return '[]';
        return out;
    };
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const rejected = expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, job, root))).rejects.toThrow();
    await vi.runAllTimersAsync();
    await rejected;
    drop = false;
    expect(await claimedDelivery(f.store, job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, job, root))).toMatchObject({ pr: 200 });
    expect(creates).toBe(1);
}, 30000);
test('promotion writes once; an already-ready PR is only verified', async () => {
    const f = fakeGitHub(), job = f.candidate({stage:'draft'}), root = f.artifactRoot(job);
    await claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root));
    job.pr = 200;
    expect(await claimedDelivery(f.store, job, () => promoteReady(f.store, f.execute as any, f.delivery.jobs, job))).toBe('promoted');
    expect(await claimedDelivery(f.store, job, () => promoteReady(f.store, f.execute as any, f.delivery.jobs, job))).toBe('already-ready');
    expect(f.state.calls.filter(c => c.startsWith('gh pr ready')).length).toBe(1);
});
test('office fallback content carries every required template section and the closing link', () => {
    const f = fakeGitHub(), job = f.candidate({stage:'draft'});
    const content = officePRContent(job, 5, 'fix(sources): restore scans');
    for (const heading of ['## Summary', '## Linked issue', '## Changes', '## Verification', '## Risk and rollback', '## Checklist']) expect(content.body).toContain(heading);
    expect(content.body).toContain('Closes #5');
    expect(content.body).toMatch(/- Risk: \S/);
    // Only evidenced checklist items are ticked: verify:ci appears in the recorded checks, wiki does not.
    expect(content.body).toContain('- [x] `pnpm run verify:ci` passes.');
    expect(content.body).toContain('- [ ] Wiki records are updated for substantive work.');
});
test('developer PR content must close this issue and no other', async () => {
    const f = fakeGitHub(), job = f.candidate({stage:'draft'}), root = f.artifactRoot(job);
    writeFileSync(resolve(root, 'pr.json'), JSON.stringify({ title: 'fix: x', body: '## Summary\nx\nCloses #12\n' }));
    await expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root))).rejects.toThrow('Closes #5');
    writeFileSync(resolve(root, 'pr.json'), JSON.stringify({ title: 'fix: x', body: '## Summary\nx\nCloses #5\nFixes #12\n' }));
    await expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root))).rejects.toThrow('unrelated issue');
    expect(f.state.prs).toHaveLength(0);
});
test('a candidate changed mid-publication is never pushed', async () => {
    const f = fakeGitHub(), job = f.candidate({stage:'draft'}), root = f.artifactRoot(job);
    const original = f.execute;
    const execute = async (program: string, args: string[], options: any) => { if (args[0] === 'ls-remote') job.head = 'c'.repeat(40); return original(program, args, options); };
    await expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, job, root))).rejects.toThrow('head changed');
    expect(f.state.calls.some(c => c.startsWith('git push'))).toBe(false);
});

test('post-push head observation stops after five reads without repeating the push', async () => {
    const f = fakeGitHub(), job = f.candidate({stage:'draft'}), root = f.artifactRoot(job);
    await claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root));
    job.pr = 200; job.head = 'c'.repeat(40); f.state.local.head = job.head;
    f.state.calls.length = 0;
    let reads = 0;
    const execute = async (program: string, args: string[], options: any) => {
        const out = await f.execute(program, args, options);
        if (program === 'gh' && args[0] === 'api' && args[1].endsWith('/pulls/200')) {
            reads++;
            return JSON.stringify({ ...JSON.parse(out), head: { sha: HEAD, ref: job.branch, repo: { full_name: 'JFusco/cms-field-vocabulary' } } });
        }
        return out;
    };
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const rejected = expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, job, root))).rejects.toThrow('head did not update');
    await vi.runAllTimersAsync();
    await rejected;
    expect(reads).toBe(6); // Initial identity read plus exactly five head observations.
    expect(f.state.calls.filter(call => call.startsWith('git push '))).toHaveLength(1);
    expect(f.state.calls.filter(call => call.startsWith('gh pr create '))).toHaveLength(0);
});

const CONTENT = { title: 'fix(sources): restore scans', body: '## Summary\nRestores.\n## Linked issue\nCloses #5\n' };
/** A draft candidate with developer content; `lists` rewrites what `gh pr list` returns for one state. */
function creation(lists: (state: string, out: any[]) => any[] = (_state, out) => out, loseCreate = false) {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft' }), root = f.artifactRoot(job);
    writeFileSync(resolve(root, 'pr.json'), JSON.stringify(CONTENT));
    const execute = async (program: string, args: string[], options: any) => {
        const out = await f.execute(program, args, options);
        if (program === 'gh' && args[1] === 'create' && loseCreate) { loseCreate = false; throw new Error('gh: HTTP 502 after create'); }
        return program === 'gh' && args[1] === 'list' ? JSON.stringify(lists(args[args.indexOf('--state') + 1], JSON.parse(out))) : out;
    };
    const publish = () => claimedDelivery(f.store, job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, job, root));
    return { ...f, job, publish, effect: () => f.store.getEffect(`harness:${job.id}:pr-create:${HEAD}`) as any };
}

test('the original create records the digest of what it published, under its unchanged Effect identity', async () => {
    const f = creation();
    expect(await f.publish()).toMatchObject({ pr: 200, created: true, pushed: true, contentSource: 'developer' });
    expect(f.effect()).toMatchObject({ status: 'verified', operation: 'github-pr-create', target: `JFusco/cms-field-vocabulary:${f.job.branch}`,
        payload: { head: HEAD, branch: f.job.branch, base: 'main' }, expectedState: { key: `pr-create:${HEAD}` },
        receipt: { number: 200, url: 'https://github.com/JFusco/cms-field-vocabulary/pull/200', contentSha256: digest(CONTENT) } });
    // Adopting it again records nothing new.
    expect(await f.publish()).toMatchObject({ pr: 200, created: false });
    expect(f.state.calls.filter(c => c.startsWith('gh pr create'))).toHaveLength(1);
});

test('a read-back that differs from the supplied content publishes without a digest', async () => {
    const f = creation((state, out) => state === 'open' ? out.map(pr => ({ ...pr, body: pr.body.trimEnd() })) : out);
    expect(await f.publish()).toMatchObject({ pr: 200, created: true });
    expect(f.effect()?.receipt).toEqual({ number: 200, url: 'https://github.com/JFusco/cms-field-vocabulary/pull/200' });
});

test('an adopted pull request has no create intent at all', async () => {
    const f = creation();
    f.state.remote[f.job.branch] = HEAD;
    f.state.prs.push({ number: 200, html_url: 'https://github.com/JFusco/cms-field-vocabulary/pull/200', state: 'open', draft: true, title: CONTENT.title, body: CONTENT.body,
        head: { sha: HEAD, ref: f.job.branch }, base: { ref: 'main', sha: BASE, repo: { full_name: 'JFusco/cms-field-vocabulary' } }, merged_at: null });
    expect(await f.publish()).toMatchObject({ pr: 200, created: false });
    expect(f.effect()).toBeUndefined(); expect(f.state.calls.some(c => c.startsWith('gh pr create'))).toBe(false);
});

test('a lost create response is reconciled by read-back alone: no digest, no second create', async () => {
    let hide = false;
    const f = creation((state, out) => state === 'all' && hide ? [] : out, true);
    await expect(f.publish()).rejects.toThrow('HTTP 502');
    expect(f.effect()).toMatchObject({ status: 'uncertain', receipt: null });
    // The list lags, so publication reaches the saved intent and reads it back instead of creating again.
    hide = true;
    expect(await f.publish()).toMatchObject({ pr: 200, created: true });
    expect(f.effect()).toMatchObject({ status: 'verified', receipt: { number: 200, url: 'https://github.com/JFusco/cms-field-vocabulary/pull/200' } });
    expect(f.effect()?.receipt.contentSha256).toBeUndefined();
    expect(f.state.calls.filter(c => c.startsWith('gh pr create'))).toHaveLength(1);
});

test('a legacy number-and-URL create receipt still reads as the publication', async () => {
    const f = creation((state, out) => state === 'all' ? [] : out);
    f.state.remote[f.job.branch] = HEAD;
    f.state.prs.push({ number: 200, html_url: 'https://github.com/JFusco/cms-field-vocabulary/pull/200', state: 'open', draft: true, title: CONTENT.title, body: CONTENT.body,
        head: { sha: HEAD, ref: f.job.branch }, base: { ref: 'main', sha: BASE, repo: { full_name: 'JFusco/cms-field-vocabulary' } }, merged_at: null });
    f.store.putEffect({ id: `harness:${f.job.id}:pr-create:${HEAD}`, work: { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, attemptId: f.job.id,
        operation: 'github-pr-create', target: `JFusco/cms-field-vocabulary:${f.job.branch}`, authorization: 'office-harness', payload: { head: HEAD, branch: f.job.branch, base: 'main' },
        expectedState: { key: `pr-create:${HEAD}` }, status: 'verified', createdAt: '2026-11-01T00:00:00Z', dispatchedAt: '2026-11-01T00:00:01Z', verifiedAt: '2026-11-01T00:00:02Z',
        receipt: { number: 200, url: 'https://github.com/JFusco/cms-field-vocabulary/pull/200' }, error: '', elapsedMs: 1 });
    expect(await f.publish()).toMatchObject({ pr: 200, url: 'https://github.com/JFusco/cms-field-vocabulary/pull/200', created: true });
    expect(f.state.calls.some(c => c.startsWith('gh pr create'))).toBe(false);
});

test('a lost push response is settled by reading the branch under its original intent and writer; the push is never sent again', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft' }), root = f.artifactRoot(job);
    writeFileSync(resolve(root, 'pr.json'), JSON.stringify({ title: 'fix(sources): restore scans', body: '## Summary\nRestores.\n## Linked issue\nCloses #5\n' }));
    let lost = 0;
    // The push lands, then its response is lost.
    const execute = async (program: string, args: string[], options?: any) => {
        const out = await f.execute(program, args, options);
        if (program === 'git' && args[0] === 'push' && !lost++) throw new Error('git push response lost: connection reset');
        return out;
    };
    await expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, job, root))).rejects.toThrow();
    const id = `harness:${job.id}:push:${HEAD}`, sent = f.store.getEffect(id)!;
    expect(sent.status).toBe('uncertain');
    expect(f.state.remote[job.branch]).toBe(HEAD);
    const published = await claimedDelivery(f.store, job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, job, root));
    expect(published).toMatchObject({ pr: 200, created: true, pushed: false });
    expect(f.store.getEffect(id)).toMatchObject({ status: 'verified', writer: sent.writer, dispatchedAt: sent.dispatchedAt });
    expect(f.state.calls.filter(c => c.startsWith('git push'))).toHaveLength(1);
    expect(f.state.calls.filter(c => c.startsWith('gh pr create'))).toHaveLength(1);
});

// --- #617: a [skip release] commit that changes the npm package is refused before any push intent.
import { PROJECT_POLICY_INPUTS } from '../../../../server/office/projects';
import { markedPublication } from '../support/marker-publication';
import { cleanupMarkerRepos } from '../support/marker-repo';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
afterEach(cleanupMarkerRepos);

const PROVIDER = /^(gh |git (ls-remote|push|remote|fetch) )/;
/** Run one publication with the CMS opt-in on or off, keeping the provider calls and every other command apart. */
async function withCheck<T>(on: boolean, run: () => Promise<T>): Promise<T> {
    const inputs = PROJECT_POLICY_INPUTS as Map<string, object>, saved = inputs.get('cms-field-vocabulary');
    if (!on) inputs.set('cms-field-vocabulary', { ...saved, releaseMarkerCheck: false });
    try { return await run(); } finally { if (saved) inputs.set('cms-field-vocabulary', saved); else inputs.delete('cms-field-vocabulary'); }
}
const pushRows = (f: { store: any; job: any }) => [0, 1, 2].map(n => f.store.getEffect(`harness:${f.job.id}:push:${f.job.head}${n ? `:retry-${n}` : ''}`)).filter(Boolean);
const refused = async (promise: Promise<unknown>) => { try { await promise; } catch (error) { if (error instanceof ReleaseMarkerRefusal) return error.evidence; throw error; } throw new Error('expected a release-marker refusal'); };

test('unmarked create and descendant publication make the baseline provider calls, both refs in the one create probe, and no npm call', async () => {
    const runs: { provider: string[]; other: string[] }[] = [];
    for (const on of [false, true]) {
        const f = fakeGitHub(), job = f.candidate({ stage: 'draft' }), root = f.artifactRoot(job);
        writeFileSync(resolve(root, 'pr.json'), JSON.stringify(CONTENT));
        await withCheck(on, () => claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root)));
        job.pr = 200; job.head = 'c'.repeat(40); f.state.local.head = job.head;
        await withCheck(on, () => claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root)));
        runs.push({ provider: f.state.calls.filter(call => PROVIDER.test(call)), other: f.state.calls.filter(call => !PROVIDER.test(call)) });
    }
    const [baseline, checked] = runs, probe = `git ls-remote --heads origin refs/heads/codex/5-restore-release-scans`;
    const create = baseline.provider.indexOf(probe);
    expect(checked.provider).toEqual(baseline.provider.map((call, index) => index === create ? `${probe} refs/heads/main` : call));
    expect(checked.provider.filter(call => call === `${probe} refs/heads/main`)).toHaveLength(1);
    expect(checked.provider.filter(call => call.startsWith('git push'))).toHaveLength(2);
    // Only local history reads are added: no npm, no snapshot, no other process.
    const added = checked.other.filter(call => !baseline.other.includes(call));
    expect(added.filter(call => !/^git (rev-parse --is-shallow-repository|cat-file -e|log -z |merge-base --is-ancestor )/.test(call))).toEqual([]);
    expect(checked.other.some(call => call.startsWith(process.execPath) || /read-tree|checkout-index|ls-tree/.test(call))).toBe(false);
});

test('a marker carried only by target commits merged in through update-base, or with no recorded base, needs no npm and no extra provider call', async () => {
    for (const base of [true, false]) {
        const f = markedPublication();
        f.git(['checkout', '-q', 'main']);
        const target = f.commit({ 'OPERATING.md': 'operating 2\n' }, 'docs(operating): reconcile [skip release]');
        f.git(['checkout', '-q', f.job.branch]);
        f.commit({ 'wiki/index.md': 'wiki 2\n' }, 'docs(wiki): candidate');
        f.git(['merge', '-q', '--no-edit', '-m', 'chore(merge): update base', 'main']);
        f.at(f.git(['rev-parse', 'HEAD']).trim());
        f.state.targetTip = target;
        if (!base) delete f.job.candidateBase;
        expect(await claimedDelivery(f.store, f.job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, f.job, f.root))).toMatchObject({ created: true, pushed: true });
        expect(f.npm).toHaveLength(0);
        expect(f.provider.filter(call => call.startsWith('git ls-remote'))).toEqual([`git ls-remote --heads origin refs/heads/${f.job.branch} refs/heads/main`, `git ls-remote --heads origin refs/heads/${f.job.branch}`]);
    }
});

test('a marked package change is refused on create with zero pushes and zero push rows, retries included', async () => {
    const f = markedPublication();
    const marked = f.commit({ 'README.md': 'readme 2\n', 'wiki/index.md': 'wiki 2\n' }, 'docs(readme): source acceptance [skip release]');
    f.at(marked);
    const stop = await refused(claimedDelivery(f.store, f.job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, f.job, f.root)));
    expect(stop).toMatchObject({ reason: 'marked-package-change', commit: marked, paths: ['README.md'] });
    expect(f.state.calls.filter(call => call.startsWith('git push'))).toHaveLength(0);
    expect(pushRows(f)).toEqual([]);
    expect(f.npm.filter(call => call.args[1] === 'pack').map(call => call.args.slice(1))).toEqual([['pack', '--dry-run', '--json', '--ignore-scripts', '--offline'], ['pack', '--dry-run', '--json', '--ignore-scripts', '--offline']]);
    // The same refusal again still writes nothing.
    await refused(claimedDelivery(f.store, f.job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, f.job, f.root)));
    expect(pushRows(f)).toEqual([]);
});

test('a target rewind and stale tracking refs never hide a marked commit; a missing target object or shallow history stops as incomplete coverage', async () => {
    const f = markedPublication();
    const marked = f.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): reword [skip release]');
    f.git(['checkout', '-q', 'main']); f.git(['merge', '-q', '--ff-only', f.job.branch]); f.git(['checkout', '-q', f.job.branch]);
    const head = f.commit({ 'wiki/index.md': 'wiki 2\n' }, 'docs(wiki): after');
    f.at(head);
    // The remote target was rewound to the base, though the local tracking ref still shows the marked commit.
    f.git(['update-ref', 'refs/remotes/origin/main', marked]);
    f.state.targetTip = f.base;
    expect(await refused(claimedDelivery(f.store, f.job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, f.job, f.root)))).toMatchObject({ reason: 'marked-package-change', commit: marked });
    f.state.targetTip = 'f'.repeat(40);
    const missing = await refused(claimedDelivery(f.store, f.job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, f.job, f.root)));
    expect(missing).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('not in this repository') });
    // Only the first, decidable check probed npm once and packed its two revisions.
    expect(f.npm.map(call => call.args[1])).toEqual(['--version', 'pack', 'pack']);
    f.state.targetTip = f.base;
    // A shallow boundary inside the range: what lies beyond it cannot be known.
    writeFileSync(resolve(f.worktree, '.git', 'shallow'), `${marked}\n`);
    expect(await refused(claimedDelivery(f.store, f.job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, f.job, f.root)))).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('shallow') });
    expect(f.state.calls.filter(call => call.startsWith('git push'))).toHaveLength(0);
    expect(pushRows(f)).toEqual([]);
});

test('an admitted marked push rechecks the live refs: movement before admission writes no row, movement in preflight leaves one rejected undispatched row', async () => {
    for (const moveAt of [2, 3]) {
        const f = markedPublication();
        f.at(f.commit({ 'wiki/index.md': 'wiki 2\n', 'scripts/wiki/graph/data/graph.json': '{"n":2}\n' }, 'docs(wiki): reconcile [skip release]'));
        let probes = 0;
        const execute = async (program: string, args: string[], options: any) => {
            if (program === 'git' && args[0] === 'ls-remote' && args.includes('refs/heads/main') && ++probes === moveAt) f.state.targetTip = f.job.head;
            return f.execute(program, args, options);
        };
        const stop = await refused(claimedDelivery(f.store, f.job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, f.job, f.root)));
        expect(stop).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('remote refs moved after the release-marker check') });
        expect(f.state.calls.filter(call => call.startsWith('git push'))).toHaveLength(0);
        const rows = pushRows(f);
        if (moveAt === 2) expect(rows).toEqual([]);
        else expect(rows).toEqual([expect.objectContaining({ status: 'rejected', dispatchedAt: '', error: expect.stringContaining('remote refs moved after the release-marker check') })]);
    }
    // Unmoved, the same marked wiki-only candidate is pushed once under the ordinary Effect.
    const f = markedPublication();
    f.at(f.commit({ 'wiki/index.md': 'wiki 2\n' }, 'docs(wiki): reconcile [skip release]'));
    expect(await claimedDelivery(f.store, f.job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, f.job, f.root))).toMatchObject({ created: true, pushed: true });
    expect(pushRows(f)).toEqual([expect.objectContaining({ status: 'verified' })]);
});

test('a descendant publication binds the PR read to this repository and target, then refuses a marked package change before any new row', async () => {
    const f = markedPublication();
    f.at(f.commit({ 'wiki/index.md': 'wiki 2\n' }, 'docs(wiki): first'));
    await claimedDelivery(f.store, f.job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, f.job, f.root));
    f.job.pr = 200;
    const marked = f.commit({ 'OPERATING.md': 'operating 2\n' }, 'docs(operating): reword [skip release]');
    f.at(marked);
    f.state.prs[0].base.sha = f.base;
    expect(await refused(claimedDelivery(f.store, f.job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, f.job, f.root)))).toMatchObject({ reason: 'marked-package-change', commit: marked, paths: ['OPERATING.md'] });
    expect(f.state.calls.filter(call => call.startsWith('git push'))).toHaveLength(1);
    expect(pushRows(f)).toEqual([]);
    // A PR that does not show this repository's head is not an observation the check can use.
    f.state.prs[0].head.repo = { full_name: 'someone/fork' };
    expect(await refused(claimedDelivery(f.store, f.job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, f.job, f.root)))).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('exact identity') });
});
