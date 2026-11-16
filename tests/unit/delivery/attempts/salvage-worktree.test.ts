import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { SalvageRetry, salvageWorktree } from '../../../../server/delivery/attempts/salvage-worktree';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const ENV = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@example.test', GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@example.test' };
/** A real local repository: the accepted commit plus whatever the stopped run left. */
function repository() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-salvage-')); roots.push(root);
    const git = (...args: string[]) => execFileSync('git', args, { cwd: root, env: ENV, encoding: 'utf8' }).trim();
    const execute = (async (_program: string, args: string[]) => git(...args)) as any;
    git('init', '-q', '-b', 'codex/5-fix'); writeFileSync(resolve(root, '.gitignore'), 'node_modules\n'); writeFileSync(resolve(root, 'a.txt'), 'accepted\n');
    git('add', '-A'); git('commit', '-q', '-m', 'accepted');
    return { root, git, execute, accepted: git('rev-parse', 'HEAD') };
}

test('unfinished commits and uncommitted files are kept under the ref and the worktree returns to the accepted commit', async () => {
    const { root, git, execute, accepted } = repository();
    writeFileSync(resolve(root, 'a.txt'), 'committed by the stopped run\n'); git('commit', '-qam', 'partial');
    const partial = git('rev-parse', 'HEAD');
    writeFileSync(resolve(root, 'a.txt'), 'uncommitted edit\n'); writeFileSync(resolve(root, 'new.txt'), 'untracked\n');
    mkdirSync(resolve(root, 'node_modules')); writeFileSync(resolve(root, 'node_modules/kept'), 'installed');
    const saved = await salvageWorktree(execute, { worktree: root, branch: 'codex/5-fix', accepted, ref: 'refs/office/salvage/job/work' });
    expect(saved).toEqual({ abandoned: partial, ref: 'refs/office/salvage/job/work' });
    expect(git('rev-parse', 'HEAD')).toBe(accepted);
    expect(git('status', '--porcelain=v1', '--untracked-files=all')).toBe('');
    expect(existsSync(resolve(root, 'new.txt'))).toBe(false);
    expect(existsSync(resolve(root, 'node_modules/kept'))).toBe(true);
    expect(git('show', 'refs/office/salvage/job/work:a.txt')).toBe('uncommitted edit');
    expect(git('show', 'refs/office/salvage/job/work:new.txt')).toBe('untracked');
    expect(git('rev-parse', 'refs/office/salvage/job/work^')).toBe(partial);
});

test('a worktree already at the accepted commit keeps no ref, and a wrong branch is refused untouched', async () => {
    const { root, git, execute, accepted } = repository();
    expect(await salvageWorktree(execute, { worktree: root, branch: 'codex/5-fix', accepted, ref: 'refs/office/salvage/job/none' })).toEqual({ abandoned: accepted, ref: '' });
    expect(git('for-each-ref', 'refs/office')).toBe('');
    writeFileSync(resolve(root, 'a.txt'), 'edit\n');
    await expect(salvageWorktree(execute, { worktree: root, branch: 'other', accepted, ref: 'refs/office/salvage/job/x' })).rejects.toThrow('not on the delivery branch');
    expect(git('status', '--porcelain=v1')).toContain('a.txt');
});

test('a nested repository is refused before anything is written, and a locked index asks for a retry with nothing changed', async () => {
    const nested = repository();
    writeFileSync(resolve(nested.root, 'a.txt'), 'edit\n'); mkdirSync(resolve(nested.root, 'inner'));
    execFileSync('git', ['init', '-q'], { cwd: resolve(nested.root, 'inner'), env: ENV });
    await expect(salvageWorktree(nested.execute, { worktree: nested.root, branch: 'codex/5-fix', accepted: nested.accepted, ref: 'refs/office/salvage/job/n' })).rejects.toThrow('nested repository');
    expect(nested.git('status', '--porcelain=v1')).toContain('a.txt');
    expect(nested.git('for-each-ref', 'refs/office')).toBe('');
    const locked = repository();
    writeFileSync(resolve(locked.root, 'a.txt'), 'edit\n'); writeFileSync(resolve(locked.root, '.git/index.lock'), '');
    await expect(salvageWorktree(locked.execute, { worktree: locked.root, branch: 'codex/5-fix', accepted: locked.accepted, ref: 'refs/office/salvage/job/l' })).rejects.toBeInstanceOf(SalvageRetry);
    rmSync(resolve(locked.root, '.git/index.lock'));
    expect(locked.git('status', '--porcelain=v1')).toContain('a.txt');
});

test('the guard runs before every write and stops the salvage before the reset', async () => {
    const { root, git, execute, accepted } = repository();
    writeFileSync(resolve(root, 'a.txt'), 'by the stopped run\n'); git('commit', '-qam', 'partial');
    const partial = git('rev-parse', 'HEAD');
    let writes = 0;
    await expect(salvageWorktree(execute, { worktree: root, branch: 'codex/5-fix', accepted, ref: 'refs/office/salvage/job/g' }, () => { if (++writes === 2) throw new Error('held'); })).rejects.toThrow('held');
    expect(git('rev-parse', 'HEAD')).toBe(partial);
    expect(git('rev-parse', 'refs/office/salvage/job/g')).toBe(partial);
});
