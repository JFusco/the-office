import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
afterEach(cleanupFakes);
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
test('a failed dependency seed is advisory and never blocks the new candidate', async () => {
    const f = fakeGitHub();
    f.delivery.enqueue('GH-5', 0, 'Ready');
    const job = f.delivery.jobs[0], original = f.execute;
    const execute = async (program: string, args: string[], options: any) => {
        const result = await (original as any)(program, args, options);
        if (program === 'git' && args[0] === 'worktree') writeFileSync(resolve(args[4], 'package.json'), JSON.stringify({ packageManager: 'pnpm@10.33.0' }));
        if (program === 'pnpm' && args[0] === 'install') throw new Error('registry unavailable');
        return result;
    };
    const created = await createCandidate(f.store, execute as any, job, f.state.issue);
    expect(created).toMatchObject({ reused: false, branch: 'codex/5-restore-release-scans' });
    expect(f.store.state.events.some(e => e.kind === 'candidate-seed-failed' && e.message.includes('registry unavailable'))).toBe(true);
    expect(f.store.state.events.some(e => e.kind === 'candidate-created')).toBe(true);
});

test('candidate seeding still skips a different pnpm major', async () => {
    const f = fakeGitHub();
    f.delivery.enqueue('GH-5', 0, 'Ready');
    const calls: string[] = [];
    const execute = async (program: string, args: string[], options: any) => {
        if (program === 'pnpm') { calls.push(args[0]); return '10.33.0\n'; }
        const result = await f.execute(program, args, options);
        if (program === 'git' && args[0] === 'worktree') writeFileSync(resolve(args[4], 'package.json'), JSON.stringify({ packageManager: 'pnpm@9.1.0' }));
        return result;
    };
    const created = await createCandidate(f.store, execute as any, f.delivery.jobs[0], f.state.issue);
    expect(created.reused).toBe(false);
    expect(calls).toEqual(['--version']);
    expect(f.store.state.events.some(e => e.kind === 'candidate-seed-failed')).toBe(false);
});
