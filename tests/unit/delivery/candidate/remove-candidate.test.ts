import { afterEach, expect, test } from 'vitest';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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
    expect(f.state.calls.filter(c => c.startsWith('gh api -X DELETE '))).toHaveLength(1);
});
test('a candidate the Office did not create, another issue\'s branch or a worktree outside the worktrees folder is skipped untouched', async () => {
    const cases: [string, (x: ReturnType<typeof owned>) => void][] = [
        ['did not create', x => { delete x.job.candidateBase; }],
        ['not the branch created', x => { x.job.branch = 'codex/5-native-run'; x.f.state.localBranches.add('codex/5-native-run'); }],
        ["not this issue's Office branch", x => { x.job.branch = 'feature/human-work'; x.f.state.localBranches.add('feature/human-work'); }],
        ['not directly inside', x => { const outside = resolve(x.f.root, 'elsewhere');mkdirSync(outside, { recursive: true });x.job.worktree = outside; }],
    ];
    for (const [reason, arrange] of cases) {
        const x = owned();arrange(x);
        const result = await removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard);
        expect(result.skipped).toContain(reason);expect(x.f.state.localBranches.has(x.job.branch)).toBe(true);expect(x.f.state.calls.some(c => /worktree remove|worktree prune|rm -rf|branch -D|push origin :|-X DELETE/.test(c))).toBe(false);
    }
});
test('an Office-created candidate whose own PR discovery marked existingPR is still removed', async () => {
    const { f, job, guard } = owned();job.existingPR = true;
    expect(await removeCandidate(f.store, f.execute as any, job, guard, HEAD)).toEqual({ worktree: true, local: true, remote: true });
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
        expect(x.f.state.calls.some(c => /worktree remove|worktree prune|rm -rf|branch -D|push origin :|-X DELETE/.test(c))).toBe(false);
    }
});
test('an uncertain earlier remote delete is settled by read-back once the branch is gone, never resent', async () => {
    const x = owned();x.f.state.fail = (_p, args) => args[2] === 'DELETE';
    await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard)).rejects.toThrow();
    const id = `harness:${x.job.id}:remove-remote:${x.job.branch}`;expect(['uncertain', 'dispatching']).toContain(x.f.store.getEffect(id)?.status);
    x.f.state.fail = () => false;x.f.state.remote[x.job.branch] = '';
    await removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard);
    expect(x.f.store.getEffect(id)?.status).toBe('verified');expect(x.f.state.calls.filter(c => c.startsWith('gh api -X DELETE '))).toHaveLength(1);
});
test('a removal cut off midway (only committed files deleted) is finished; real changes still preserve', async () => {
    const { f, job, guard } = owned();
    f.state.local.status = ' D catalog/catalog.json\n D LICENSE';
    expect(await removeCandidate(f.store, f.execute as any, job, guard, HEAD)).toEqual({ worktree: true, local: true, remote: true });
    expect(existsSync(job.worktree)).toBe(false);expect(f.state.calls).toContain('git worktree prune');
    const kept = owned();kept.f.state.local.status = ' D LICENSE\n M src/index.ts';
    await expect(removeCandidate(kept.f.store, kept.f.execute as any, kept.job, kept.guard, HEAD)).rejects.toThrow('uncommitted changes');
    expect(existsSync(kept.job.worktree)).toBe(true);expect(kept.f.state.calls.some(c => c.includes('worktree prune') || c.startsWith('rm '))).toBe(false);
});

test('removal sets the worktree aside instantly and deletes it in the background', async () => {
    const { f, job, guard } = owned();
    await removeCandidate(f.store, f.execute as any, job, guard, HEAD);
    const aside = resolve(dirname(job.worktree), '.office-removed');
    expect(existsSync(job.worktree)).toBe(false);
    expect(existsSync(aside)).toBe(true);
    expect(f.state.calls.some(c => c.startsWith(`rm -rf -- ${aside}/`))).toBe(true);
    expect(f.state.calls.some(c => c.includes('worktree remove'))).toBe(false);
});

test('a worktree edited during the network checks, or locked, is preserved in place', async () => {
    const edited = owned();
    let reads = 0;
    const execute = edited.f.execute;
    (edited.f as any).execute = async (program: string, args: string[], options: any) => { if (args[0] === 'status' && ++reads === 2) return '?? notes.md'; return execute(program, args, options); };
    await expect(removeCandidate(edited.f.store, (edited.f as any).execute, edited.job, edited.guard, HEAD)).rejects.toThrow('changed during cleanup');
    expect(existsSync(edited.job.worktree)).toBe(true);
    const locked = owned();
    const run = locked.f.execute;
    (locked.f as any).execute = async (program: string, args: string[], options: any) => args[0] === 'worktree' && args[1] === 'list' ? `worktree ${locked.job.worktree}\nHEAD ${HEAD}\nlocked agent session\n` : run(program, args, options);
    await expect(removeCandidate(locked.f.store, (locked.f as any).execute, locked.job, locked.guard, HEAD)).rejects.toThrow('is locked');
    expect(existsSync(locked.job.worktree)).toBe(true);
});
test('a worktree Git keeps registered after it was set aside is restored in place', async () => {
    const x = owned();
    const run = x.f.execute;
    let lists = 0;
    (x.f as any).execute = async (program: string, args: string[], options: any) => args[0] === 'worktree' && args[1] === 'list' ? (++lists > 1 ? `worktree ${x.job.worktree}\n` : '') : run(program, args, options);
    await expect(removeCandidate(x.f.store, (x.f as any).execute, x.job, x.guard, HEAD)).rejects.toThrow('restored in place');
    expect(existsSync(x.job.worktree)).toBe(true);
});

/** A job that adopted the pull request a completed maintenance run drafted: it recorded no candidate of its own. */
function adopted() {
    const x = owned();
    delete x.job.candidateBase;
    x.f.store.state.maintenance = { runs: [{ id: 'run-1', status: 'completed', steps: [{ role: 'developer', stage: 'draft-pr', result: { outcome: 'passed', summary: '', receipts: [{ id: 'pr', action: 'gh-pr-create-draft', target: '', verified: true, uncertain: false, detail: '' }], candidates: [{ issue: Number(x.job.key.slice(3)), worktree: x.job.worktree, branch: x.job.branch, head: 'e'.repeat(40), summary: '' }] } }] }] } as any;
    return x;
}
test('a candidate a completed maintenance run created is removed like the Office\'s own, and marked as such', async () => {
    const { f, job, guard } = adopted();
    expect(await removeCandidate(f.store, f.execute as any, job, guard, HEAD)).toEqual({ worktree: true, local: true, remote: true, created: true });
    expect(existsSync(job.worktree)).toBe(false);expect(f.state.localBranches.has(job.branch)).toBe(false);expect(f.state.remote[job.branch]).toBeFalsy();
    expect(f.store.getEffect(`harness:${job.id}:remove-remote:${job.branch}`)?.status).toBe('verified');
});
test('the run\'s worktree is found at its own path when the job worked in a private clone elsewhere', async () => {
    const { f, job, guard } = adopted(), created = job.worktree;
    job.worktree = resolve(f.root, 'private-clone', 'candidate');
    expect(await removeCandidate(f.store, f.execute as any, job, guard, HEAD)).toMatchObject({ worktree: true, local: true, remote: true, created: true });
    expect(existsSync(created)).toBe(false);
});
test('the run\'s copy may be behind the delivered head, but not outside it; the remote branch must be at it', async () => {
    const behind = adopted();
    behind.f.state.local.head = 'c'.repeat(40);
    expect(await removeCandidate(behind.f.store, behind.f.execute as any, behind.job, behind.guard, HEAD)).toMatchObject({ worktree: true, local: true, remote: true });
    expect(behind.f.state.calls.some(c => c.includes('merge-base --is-ancestor'))).toBe(true);

    const diverged = adopted(), kept = diverged.job.worktree;
    diverged.f.state.local.head = 'c'.repeat(40); (diverged.f.state as any).notAncestor = true;
    await expect(removeCandidate(diverged.f.store, diverged.f.execute as any, diverged.job, diverged.guard, HEAD)).rejects.toThrow('could not be shown to be in the delivered');
    expect([existsSync(kept), diverged.f.state.localBranches.has(diverged.job.branch), !!diverged.f.state.remote[diverged.job.branch]]).toEqual([true, true, true]);

    const moved = adopted();
    moved.f.state.remote[moved.job.branch] = 'd'.repeat(40);
    await expect(removeCandidate(moved.f.store, moved.f.execute as any, moved.job, moved.guard, HEAD)).rejects.toThrow('not the delivered');
    expect(existsSync(moved.job.worktree)).toBe(true);
});
test('an owned candidate still has to be exactly at the delivered head', async () => {
    const x = owned();
    x.f.state.local.head = 'c'.repeat(40);
    await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard, HEAD)).rejects.toThrow('not the delivered');
    expect(x.f.state.calls.some(c => c.includes('merge-base --is-ancestor'))).toBe(false);
});
test('uncommitted work or an open pull request preserves a maintenance-created candidate too', async () => {
    const dirty = adopted(); dirty.f.state.local.dirty = true;
    await expect(removeCandidate(dirty.f.store, dirty.f.execute as any, dirty.job, dirty.guard, HEAD)).rejects.toThrow('uncommitted changes');
    const open = adopted(); open.f.state.prs.push({ number: 7, state: 'open', head: { sha: HEAD, ref: open.job.branch }, base: { ref: 'main' } });
    await expect(removeCandidate(open.f.store, open.f.execute as any, open.job, open.guard, HEAD)).rejects.toThrow('open PR from it');
    expect(existsSync(open.job.worktree)).toBe(true);
});
test('without a delivered head a maintenance run\'s candidate is not taken as owned', async () => {
    const { f, job, guard } = adopted();
    const result = await removeCandidate(f.store, f.execute as any, job, guard);
    expect(result.skipped).toContain('did not create');
    expect([existsSync(job.worktree), f.state.localBranches.has(job.branch), !!f.state.remote[job.branch]]).toEqual([true, true, true]);
    expect(f.state.calls.some(c => /worktree remove|worktree prune|branch -D|push origin :|-X DELETE/.test(c))).toBe(false);
});
test('a candidate the job created itself keeps the exact-head rule even when a maintenance run also recorded it', async () => {
    const x = adopted(); x.job.candidateBase = 'f'.repeat(40);
    x.f.state.local.head = 'c'.repeat(40);
    await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard, HEAD)).rejects.toThrow('not the delivered');
    expect(x.f.state.calls.some(c => c.includes('merge-base --is-ancestor'))).toBe(false);
});
test('after the job\'s private repair clone is gone, the run\'s own worktree and branches are still removed', async () => {
    const { f, job, guard } = adopted(), created = job.worktree, id = 'review-1';
    const clone = resolve(f.store.dataRoot, 'ticket-work', job.id, `ci-${id}`, 'candidate');
    job.adoptedRepairCheckout = { id, worktree: clone, branch: job.branch, head: HEAD } as any;
    job.worktree = clone;
    expect(await removeCandidate(f.store, f.execute as any, job, guard, HEAD)).toEqual({ worktree: true, local: true, remote: true, created: true });
    expect([existsSync(created), f.state.localBranches.has(job.branch), !!f.state.remote[job.branch]]).toEqual([false, false, false]);
});

/** The delete was attempted and failed without reaching the provider; the branch is still at the delivered head. */
async function failedDelete(agoMs: number) {
    const x = owned(), id = `harness:${x.job.id}:remove-remote:${x.job.branch}`;
    x.f.state.fail = (_p, args) => args[2] === 'DELETE';
    await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard, HEAD)).rejects.toThrow();
    x.f.state.fail = () => false;
    const intent = x.f.store.getEffect(id)!; intent.dispatchedAt = new Date(Date.now() - agoMs).toISOString(); x.f.store.putEffect(intent);
    const deletes = () => x.f.state.calls.filter(c => c.startsWith('gh api -X DELETE ')).length;
    return { ...x, id, deletes };
}
test('the remote branch is deleted through the provider, not by a push that would run the repository hooks', async () => {
    const { f, job, guard } = owned();
    await removeCandidate(f.store, f.execute as any, job, guard, HEAD);
    expect(f.state.calls.filter(c => c.startsWith('gh api -X DELETE '))).toEqual([`gh api -X DELETE repos/${f.store.project.repository}/git/refs/heads/${job.branch}`]);
    expect(f.state.calls.some(c => c.startsWith('git push'))).toBe(false);
});
test('a delete read back as never landed, once it has settled, is sent once more under a fresh intent', async () => {
    const x = await failedDelete(11 * 60 * 1000);
    expect(await removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard, HEAD)).toMatchObject({ remote: true });
    expect(x.f.store.getEffect(x.id)).toMatchObject({ status: 'rejected' });
    expect(x.f.store.getEffect(x.id)!.notLandedAt).toBeTruthy();
    expect(x.f.store.getEffect(`${x.id}:retry-1`)?.status).toBe('verified');
    expect([x.deletes(), !!x.f.state.remote[x.job.branch]]).toEqual([2, false]);
});
test('an attempt that has not had time to settle is only read back', async () => {
    const x = await failedDelete(60 * 1000);
    await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard, HEAD)).rejects.toThrow('will not be resent');
    expect([x.deletes(), x.f.store.getEffect(x.id)?.status]).toEqual([1, 'uncertain']);
});
test('a second miss for the same branch is not sent again', async () => {
    const x = await failedDelete(11 * 60 * 1000);
    x.f.state.fail = (_p, args) => args[2] === 'DELETE';
    await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard, HEAD)).rejects.toThrow();
    x.f.state.fail = () => false;
    const second = x.f.store.getEffect(`${x.id}:retry-1`)!; second.dispatchedAt = new Date(Date.now() - 11 * 60 * 1000).toISOString(); x.f.store.putEffect(second);
    await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard, HEAD)).rejects.toThrow('will not be resent');
    await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard, HEAD)).rejects.toThrow('will not be resent');
    expect([x.deletes(), !!x.f.state.remote[x.job.branch], !!x.f.store.getEffect(`${x.id}:retry-2`)]).toEqual([2, true, false]);
});
test('a branch that moved after the attempt is preserved, not deleted again', async () => {
    const x = await failedDelete(11 * 60 * 1000);
    x.f.state.remote[x.job.branch] = 'd'.repeat(40);
    await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard, HEAD)).rejects.toThrow('not the delivered');
    expect(x.deletes()).toBe(1);
});
test('without a delivered head nothing is sent again', async () => {
    const x = await failedDelete(11 * 60 * 1000);
    await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard)).rejects.toThrow('will not be resent');
    expect(x.deletes()).toBe(1);
});
test('a branch whose name the provider path could misread is not deleted remotely', async () => {
    const x = owned(), odd = `${x.job.branch}#x`, worktree = x.job.worktree;
    x.f.state.localBranches.add(odd); x.f.state.remote[odd] = HEAD; x.f.state.local.branch = odd;
    x.job.branch = odd; x.job.worktree = resolve(dirname(worktree), odd.slice('codex/'.length));
    mkdirSync(x.job.worktree, { recursive: true });
    await expect(removeCandidate(x.f.store, x.f.execute as any, x.job, x.guard, HEAD)).rejects.toThrow('cannot address exactly');
    expect([!!x.f.state.remote[odd], x.f.state.calls.some(c => c.includes('-X DELETE')), existsSync(x.job.worktree), x.f.state.localBranches.has(odd)]).toEqual([true, false, true, true]);
});
