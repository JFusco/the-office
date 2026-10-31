import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
afterEach(cleanupFakes);
import { existsSync } from 'node:fs';
import { candidateIdentity, candidateSlug, createCandidate } from '../../../../server/delivery/candidate/create-candidate';

test('identity follows the repository convention', () => {
    expect(candidateSlug('[Bug] Restore Optimizely release-note scans')).toBe('restore-optimizely-release-note-scans');
    expect(candidateIdentity('/x/cms', 91, '[Bug] Restore scans')).toEqual({ branch: 'codex/91-restore-scans', worktree: '/x/cms-worktrees/91-restore-scans' });
});
test('creates the worktree from the fetched target and records identity before the write', async () => {
    const f = fakeGitHub();
    f.delivery.enqueue('GH-5', 0, 'Ready');
    const job = f.delivery.jobs[0];
    const created = await createCandidate(f.store, f.execute as any, job, f.state.issue);
    expect(created).toMatchObject({ base: BASE, reused: false, branch: 'codex/5-restore-release-scans' });
    expect(existsSync(created.worktree)).toBe(true);
    expect(job).toMatchObject({ branch: created.branch, worktree: created.worktree, candidateBase: BASE });
    expect(f.state.calls.some(c => c.startsWith('git fetch origin main'))).toBe(true);
});
test('reuses only its own clean candidate and refuses dirty or foreign state', async () => {
    const f = fakeGitHub(), job = f.candidate({ head: '' });
    expect((await createCandidate(f.store, f.execute as any, job, f.state.issue)).reused).toBe(true);
    f.state.local.dirty = true;
    await expect(createCandidate(f.store, f.execute as any, job, f.state.issue)).rejects.toThrow('uncommitted');
    f.state.local.dirty = false;
    f.state.local.branch = 'someone-else';
    await expect(createCandidate(f.store, f.execute as any, job, f.state.issue)).rejects.toThrow('changed branch');
});
test('an existing path or branch is never adopted', async () => {
    const f = fakeGitHub();
    f.candidate({ head: '' });
    f.delivery.jobs[0].status = 'cancelled';
    f.delivery.enqueue('GH-5', 0, 'Ready');
    await expect(createCandidate(f.store, f.execute as any, f.delivery.jobs.at(-1)!, f.state.issue)).rejects.toThrow('already exists');
});
