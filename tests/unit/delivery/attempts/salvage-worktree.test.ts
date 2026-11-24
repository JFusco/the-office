import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
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

const SNAPSHOT = 'Office: unfinished work of a stopped writer run';
/** A stopped run's commit plus uncommitted and untracked work on it. */
function stoppedWork() {
    const r = repository();
    writeFileSync(resolve(r.root, 'a.txt'), 'committed by the stopped run\n'); r.git('commit', '-qam', 'partial');
    const partial = r.git('rev-parse', 'HEAD');
    writeFileSync(resolve(r.root, 'a.txt'), 'uncommitted edit\n'); writeFileSync(resolve(r.root, 'new.txt'), 'untracked\n');
    const sent: string[][] = [];
    const execute = (async (program: string, args: string[]) => { sent.push(args); return r.execute(program, args); }) as any;
    return { ...r, partial, execute, sent, input: { worktree: r.root, branch: 'codex/5-fix', accepted: r.accepted, ref: 'refs/office/salvage/job/work' } };
}

test('a salvage stopped before its reset is finished by the next one, which keeps the first snapshot, its parent and its files', async () => {
    const w = stoppedWork();
    await expect(salvageWorktree(w.execute, w.input, () => { if (w.sent.at(-1)?.[0] === 'update-ref') throw new Error('held'); })).rejects.toThrow('held');
    // The guard runs before the write it names: here, before the reset that follows the ref.
    const kept = w.git('rev-parse', w.input.ref);
    expect(w.git('rev-parse', 'HEAD')).toBe(w.partial);
    expect(await salvageWorktree(w.execute, w.input)).toEqual({ abandoned: w.partial, ref: w.input.ref });
    expect(w.git('rev-parse', w.input.ref)).toBe(kept);
    expect(w.git('rev-parse', `${w.input.ref}^`)).toBe(w.partial);
    expect(w.git('show', `${w.input.ref}:a.txt`)).toBe('uncommitted edit');
    expect(w.git('show', `${w.input.ref}:new.txt`)).toBe('untracked');
    expect(w.git('rev-parse', 'HEAD')).toBe(w.accepted);
    expect(w.git('status', '--porcelain=v1', '--untracked-files=all')).toBe('');
});

test('a salvage after a completed reset corroborates the kept work and resets nothing again', async () => {
    for (const dirty of [true, false]) {
        const w = stoppedWork();
        if (!dirty) w.git('stash', '-u', '-q');
        const first = await salvageWorktree(w.execute, w.input), kept = w.git('rev-parse', w.input.ref);
        expect(first).toEqual({ abandoned: w.partial, ref: w.input.ref });
        expect(kept === w.partial, String(dirty)).toBe(!dirty);
        w.sent.length = 0;
        expect(await salvageWorktree(w.execute, w.input), String(dirty)).toEqual(first);
        expect(w.sent.some(args => ['reset', 'clean', 'update-ref', 'add', 'commit-tree'].includes(args[0])), String(dirty)).toBe(false);
        expect(w.git('rev-parse', w.input.ref)).toBe(kept);
    }
});

test('a worktree that does not hold the kept work is refused before any reset or clean, naming the ref', async () => {
    // Clean at the accepted commit, but reset since by someone else: its pre-reset head is not the kept head.
    const reset = stoppedWork();
    await salvageWorktree(reset.execute, reset.input);
    const kept = reset.git('rev-parse', reset.input.ref);
    reset.git('reset', '-q', '--hard', reset.accepted);
    await expect(salvageWorktree(reset.execute, reset.input)).rejects.toThrow(`kept at ${reset.input.ref}`);
    expect(reset.git('rev-parse', reset.input.ref)).toBe(kept);
    // Not yet reset, but its contents changed after the snapshot was kept.
    const changed = stoppedWork();
    await expect(salvageWorktree(changed.execute, changed.input, () => { if (changed.sent.at(-1)?.[0] === 'update-ref') throw new Error('held'); })).rejects.toThrow('held');
    writeFileSync(resolve(changed.root, 'new.txt'), 'written after the snapshot\n');
    changed.sent.length = 0;
    await expect(salvageWorktree(changed.execute, changed.input)).rejects.toThrow(`kept at ${changed.input.ref}`);
    expect(changed.sent.some(args => ['reset', 'clean'].includes(args[0]))).toBe(false);
    expect(changed.git('show', `${changed.input.ref}:new.txt`)).toBe('untracked');
    expect(readFileSync(resolve(changed.root, 'new.txt'), 'utf8')).toBe('written after the snapshot\n');
    // The same contents on another head, and a tree cleaned of the snapshot's work, are not what was kept.
    for (const after of ['moved head', 'cleaned']) {
        const w = stoppedWork();
        await expect(salvageWorktree(w.execute, w.input, () => { if (w.sent.at(-1)?.[0] === 'update-ref') throw new Error('held'); })).rejects.toThrow('held');
        if (after === 'moved head') w.git('reset', '-q', '--soft', w.accepted);
        else { w.git('reset', '-q', '--hard', w.partial); w.git('clean', '-fdq'); }
        w.sent.length = 0;
        await expect(salvageWorktree(w.execute, w.input), after).rejects.toThrow(`kept at ${w.input.ref}`);
        expect(w.sent.some(args => ['reset', 'clean'].includes(args[0])), after).toBe(false);
    }
});

test('a ref another pass created first keeps its object: the salvage goes on only if the worktree holds that work', async () => {
    for (const same of [true, false]) {
        const w = stoppedWork();
        let winner = '';
        // Another pass creates the ref between this one's snapshot and its own creation of the ref.
        const racing = (async (program: string, args: string[]) => {
            if (args[0] === 'update-ref' && !winner) {
                const tree = same ? w.git('write-tree') : w.accepted && w.git('rev-parse', `${w.accepted}^{tree}`);
                winner = execFileSync('git', ['commit-tree', tree, '-p', w.partial, '-m', SNAPSHOT], { cwd: w.root, env: { ...ENV, GIT_AUTHOR_DATE: '2001-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2001-01-01T00:00:00Z' }, encoding: 'utf8' }).trim();
                w.git('update-ref', w.input.ref, winner, '');
            }
            return w.execute(program, args);
        }) as any;
        if (same) {
            expect(await salvageWorktree(racing, w.input)).toEqual({ abandoned: w.partial, ref: w.input.ref });
            expect(w.git('rev-parse', 'HEAD')).toBe(w.accepted);
        }
        else {
            await expect(salvageWorktree(racing, w.input)).rejects.toThrow(`kept at ${w.input.ref}`);
            expect(w.git('rev-parse', 'HEAD')).toBe(w.partial);
            expect(w.git('status', '--porcelain=v1')).toContain('a.txt');
        }
        expect(w.git('rev-parse', w.input.ref), String(same)).toBe(winner);
    }
});

test('a ref that cannot be created while it is absent asks for a retry naming it, with nothing reset', async () => {
    const w = stoppedWork();
    mkdirSync(resolve(w.root, '.git/refs/office/salvage/job'), { recursive: true });
    writeFileSync(resolve(w.root, '.git/refs/office/salvage/job/work.lock'), '');
    const failure = await salvageWorktree(w.execute, w.input).catch(error => error);
    expect(failure).toBeInstanceOf(SalvageRetry);
    expect(String(failure)).toContain(w.input.ref);
    expect(w.git('rev-parse', 'HEAD')).toBe(w.partial);
    expect(w.git('for-each-ref', 'refs/office')).toBe('');
});
