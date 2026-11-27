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
            return JSON.stringify({ ...JSON.parse(out), head: { sha: HEAD, ref: job.branch } });
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
