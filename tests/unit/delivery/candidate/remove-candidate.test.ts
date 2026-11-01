import { afterEach, expect, test } from 'vitest';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { removeCandidate } from '../../../../server/delivery/candidate/remove-candidate';
import { assertMayMutate } from '../../../../server/delivery/harness/guards';
afterEach(cleanupFakes);

function owned() {
    const f = fakeGitHub(), job = f.candidate({ status: 'blocked', stage: 'review' });
    f.state.localBranches.add(job.branch);f.state.remote[job.branch] = HEAD;f.state.local.head = HEAD;
    return { f, job, guard: () => assertMayMutate(f.store, f.delivery.jobs, job, job.head) };
}
test('removes the job-owned worktree, local branch and remote branch once, with a verified effect', async () => {
    const { f, job, guard } = owned();
    expect(await removeCandidate(f.store, f.execute as any, job, guard, HEAD)).toEqual({ worktree: true, local: true, remote: true });
    expect(existsSync(job.worktree)).toBe(false);expect(f.state.localBranches.has(job.branch)).toBe(false);expect(f.state.remote[job.branch]).toBeFalsy();
    expect(f.store.getEffect(`harness:${job.id}:remove-remote:${job.branch}`)?.status).toBe('verified');
    expect(await removeCandidate(f.store, f.execute as any, job, guard)).toEqual({ worktree: false, local: false, remote: false });
    expect(f.state.calls.filter(c => c.startsWith('git push origin :refs/heads/'))).toHaveLength(1);
});
test('an adopted PR branch, another issue\'s branch or a worktree outside the worktrees folder is skipped untouched', async () => {
    const cases: [string, (x: ReturnType<typeof owned>) => void][] = [
        ['adopted existing PR', x => { x.job.existingPR = true; }],
        ["not this issue's Office branch", x => { x.job.branch = 'feature/human-work'; x.f.state.localBranches.add('feature/human-work'); }],
        ['outside', x => { const outside = resolve(x.f.root, 'elsewhere');mkdirSync(outside, { recursive: true });x.job.worktree = outside; }],
    ];
    for (const [reason, arrange] of cases) {
        const x = owned();arrange(x);
        const result = await removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard);
        expect(result.skipped).toContain(reason);expect(x.f.state.localBranches.has(x.job.branch)).toBe(true);expect(x.f.state.calls.some(c => /worktree remove|branch -D|push origin :/.test(c))).toBe(false);
    }
});
test('uncommitted work, a changed branch, an open PR from or into it, a later tip or a pause preserve everything', async () => {
    const cases: [string, (x: ReturnType<typeof owned>) => void, string?][] = [
        ['uncommitted changes', x => { x.f.state.local.dirty = true; }],
        ['no longer on', x => { x.f.state.local.branch = 'codex/other'; }],
        ['open PR from it', x => { x.f.state.prs.push({ number: 7, state: 'open', head: { sha: HEAD, ref: x.job.branch }, base: { ref: 'main' } }); }],
        ['open PR into it', x => { x.f.state.prs.push({ number: 8, state: 'open', head: { sha: HEAD, ref: 'codex/9-child' }, base: { ref: x.job.branch } }); }],
        ['not the delivered', x => { x.f.state.local.head = 'c'.repeat(40); }, HEAD],
        ['paused', x => { x.f.store.state.paused = true; }],
    ];
    for (const [message, arrange, tip] of cases) {
        const x = owned(), worktree = x.job.worktree;arrange(x);
        await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard, tip)).rejects.toThrow(message);
        expect(x.f.state.remote[x.job.branch]).toBe(HEAD);expect(existsSync(worktree)).toBe(true);expect(x.f.state.localBranches.has(x.job.branch)).toBe(true);
        expect(x.f.state.calls.some(c => /worktree remove|worktree prune|branch -D|push origin :/.test(c))).toBe(false);
    }
});
test('an uncertain earlier remote delete is settled by read-back once the branch is gone, never resent', async () => {
    const x = owned();x.f.state.fail = (_p, args) => args[0] === 'push';
    await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard)).rejects.toThrow();
    const id = `harness:${x.job.id}:remove-remote:${x.job.branch}`;expect(['uncertain', 'dispatching']).toContain(x.f.store.getEffect(id)?.status);
    x.f.state.fail = () => false;x.f.state.remote[x.job.branch] = '';
    await removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard);
    expect(x.f.store.getEffect(id)?.status).toBe('verified');expect(x.f.state.calls.filter(c => c.startsWith('git push origin :refs/heads/'))).toHaveLength(1);
});
