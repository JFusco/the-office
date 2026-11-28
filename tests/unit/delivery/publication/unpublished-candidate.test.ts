import { afterEach, expect, test } from 'vitest';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { unpublishedCandidate } from '../../../../server/delivery/publication/unpublished-candidate';
import { BASE, cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { saveEffect } from '../support/marker-records';

afterEach(cleanupFakes);

function candidate() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'implement' });
    const read = () => unpublishedCandidate(f.store, f.execute as any, job, { head: HEAD, branch: job.branch, worktree: job.worktree });
    return { f, job, read };
}
const diagnostic = (promise: Promise<unknown>) => promise.then(() => 'resolved', (error: unknown) => error instanceof ReleaseMarkerRefusal ? error.evidence.diagnostic ?? '' : `untyped: ${String(error)}`);

test('an unpublished candidate is read back with both refs, no pull request and a quiet Effects history', async () => {
    const c = candidate();
    expect(await c.read()).toEqual({ candidate: '', target: BASE, pullRequests: 0, observedAt: expect.any(String) });
    const calls = c.f.state.calls;
    expect(calls).toContain(`git ls-remote --heads origin refs/heads/${c.job.branch} refs/heads/main`);
    expect(calls).toContain(`gh pr list --repo JFusco/cms-field-vocabulary --head ${c.job.branch} --state all --json number`);
    // A preflight that was rejected before dispatch never published anything.
    saveEffect(c.f.store, c.job, `harness:${c.job.id}:push:${HEAD}`, 'git-push', 'rejected');
    expect(await diagnostic(c.read())).toBe('resolved');
});

test.each([
    ['a dirty checkout', (c: ReturnType<typeof candidate>) => { c.f.state.local.dirty = true; }, 'the checkout moved'],
    ['a moved HEAD', (c: ReturnType<typeof candidate>) => { c.f.state.local.head = 'f'.repeat(40); }, 'the checkout moved'],
    ['a recorded PR', (c: ReturnType<typeof candidate>) => { c.job.pr = 12; }, 'already publishes PR #12'],
    ['an adopted existing PR', (c: ReturnType<typeof candidate>) => { c.job.existingPR = true; }, 'already publishes PR'],
    ['the branch on the remote', (c: ReturnType<typeof candidate>) => { c.f.state.remote[c.job.branch] = HEAD; }, 'is already on the remote'],
    ['a pull request in any state', (c: ReturnType<typeof candidate>) => { c.f.state.prs.push({ number: 9, html_url: 'u', state: 'closed', draft: false, title: '', body: '', head: { sha: HEAD, ref: c.job.branch }, base: { ref: 'main', sha: BASE }, merged_at: null }); }, 'already has a pull request'],
    ['a prepared write', (c: ReturnType<typeof candidate>) => saveEffect(c.f.store, c.job, 'harness:x:card', 'github-board', 'prepared'), 'still unsettled'],
    ['an uncertain write', (c: ReturnType<typeof candidate>) => saveEffect(c.f.store, c.job, 'harness:x:push', 'git-push', 'uncertain', '2026-11-20T10:00:01Z'), 'still unsettled'],
    ['a verified push', (c: ReturnType<typeof candidate>) => saveEffect(c.f.store, c.job, 'harness:x:push', 'git-push', 'verified', '2026-11-20T10:00:01Z'), 'saved publication'],
    ['a dispatched PR create read back as not landed', (c: ReturnType<typeof candidate>) => saveEffect(c.f.store, c.job, 'harness:x:pr', 'github-pr-create', 'rejected', '2026-11-20T10:00:01Z'), 'saved publication'],
])('%s is a typed stop, never a return', async (_name, change, expected) => {
    const c = candidate();
    change(c);
    expect(await diagnostic(c.read())).toContain(expected);
});

test('the remote must still show the saved publication: a moved target or a published branch is a typed stop at that moment', async () => {
    const { samePublication } = await import('../../../../server/delivery/publication/unpublished-candidate');
    const saved = { candidate: '', target: BASE, pullRequests: 0, observedAt: 'a' };
    expect(() => samePublication(saved, { ...saved, observedAt: 'b' }, 'before x')).not.toThrow();
    for (const observed of [{ ...saved, target: HEAD }, { ...saved, target: '' }, { ...saved, candidate: HEAD }]) {
        let error: unknown;
        try { samePublication(saved, observed, 'before the branch moved'); } catch (failure) { error = failure; }
        expect(error).toBeInstanceOf(ReleaseMarkerRefusal);
        expect((error as ReleaseMarkerRefusal).evidence.diagnostic).toMatch(/^the remote refs moved before the branch moved: /);
    }
});
