import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { SalvageRetry, salvageWorktree } from '../../../../server/delivery/attempts/salvage-worktree';
import type { command } from '../../../../server/workers/process';

type Execute = typeof command;
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const ENV = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', GIT_AUTHOR_NAME: 'T', GIT_AUTHOR_EMAIL: 't@example.test', GIT_COMMITTER_NAME: 'T', GIT_COMMITTER_EMAIL: 't@example.test' };
/** A real local repository: the accepted commit plus whatever the stopped run left. */
function repository() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-salvage-')); roots.push(root);
    const execute: Execute = async (program, args, options) =>
        execFileSync(program, args, { cwd: root, env: { ...ENV, ...options?.env }, encoding: 'utf8', stdio: 'pipe' });
    const git = (...args: string[]) => execFileSync('git', args, { cwd: root, env: ENV, encoding: 'utf8', stdio: 'pipe' }).trim();
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
    const ref = 'refs/office/salvage/job/l';
    const failure = await salvageWorktree(locked.execute, { worktree: locked.root, branch: 'codex/5-fix', accepted: locked.accepted, ref }).catch(error => error);
    expect(failure).toBeInstanceOf(SalvageRetry);
    expect(String(failure)).toContain(ref);
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
function stoppedWork(dirty = true) {
    const r = repository();
    writeFileSync(resolve(r.root, 'a.txt'), 'committed by the stopped run\n'); r.git('commit', '-qam', 'partial');
    const partial = r.git('rev-parse', 'HEAD');
    if (dirty) {
        writeFileSync(resolve(r.root, 'a.txt'), 'uncommitted edit\n');
        writeFileSync(resolve(r.root, 'new.txt'), 'untracked\n');
    }
    const sent: string[][] = [];
    const execute: Execute = async (program, args, options) => { sent.push(args); return r.execute(program, args, options); };
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

test.each([true, false])('a salvage after a completed reset corroborates the kept work and resets nothing again (dirty: %s)', async dirty => {
    const w = stoppedWork(dirty);
    const first = await salvageWorktree(w.execute, w.input), kept = w.git('rev-parse', w.input.ref);
    expect(first).toEqual({ abandoned: w.partial, ref: w.input.ref });
    expect(kept === w.partial).toBe(!dirty);
    w.sent.length = 0;
    expect(await salvageWorktree(w.execute, w.input)).toEqual(first);
    expect(w.sent.some(args => ['reset', 'clean', 'update-ref', 'add', 'commit-tree'].includes(args[0]))).toBe(false);
    expect(w.git('rev-parse', w.input.ref)).toBe(kept);
});

function expectNoCleanup(w: ReturnType<typeof stoppedWork>) {
    expect(w.sent.filter(args => ['reset', 'clean'].includes(args[0]))).toEqual([]);
}

async function expectRefusal(w: ReturnType<typeof stoppedWork>, kept: string, reason = `kept at ${w.input.ref}`) {
    w.sent.length = 0;
    const error = await salvageWorktree(w.execute, w.input).catch(error => error);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(SalvageRetry);
    expect(String(error)).toContain(reason);
    expect(String(error)).toContain(`kept at ${w.input.ref}`);
    expectNoCleanup(w);
    expect(w.git('rev-parse', w.input.ref)).toBe(kept);
}

async function snapshotBeforeReset(w: ReturnType<typeof stoppedWork>) {
    await expect(salvageWorktree(w.execute, w.input, () => { if (w.sent.at(-1)?.[0] === 'update-ref') throw new Error('held'); })).rejects.toThrow('held');
    return w.git('rev-parse', w.input.ref);
}

test.each(['mismatched', 'missing'])('an accepted worktree with a %s pre-reset head is refused', async evidence => {
    const w = stoppedWork(false);
    await salvageWorktree(w.execute, w.input);
    const kept = w.git('rev-parse', w.input.ref);
    if (evidence === 'mismatched') w.git('reset', '-q', '--hard', w.accepted);
    else w.git('update-ref', '-d', 'ORIG_HEAD');
    await expectRefusal(w, kept, `pre-reset head ${evidence === 'missing' ? '(none)' : w.accepted}`);
});

test('an unreadable pre-reset head is retryable even when Git returns no revision', async () => {
    const w = stoppedWork(false), expected = await salvageWorktree(w.execute, w.input);
    const origHead = resolve(w.root, '.git/ORIG_HEAD');
    chmodSync(origHead, 0o000);
    w.sent.length = 0;
    try {
        const failure = await salvageWorktree(w.execute, w.input).catch(error => error);
        expect(failure).toBeInstanceOf(SalvageRetry);
        expect(String(failure)).toContain(w.input.ref);
    } finally { chmodSync(origHead, 0o644); }
    expectNoCleanup(w);
    expect(await salvageWorktree(w.execute, w.input)).toEqual(expected);
    expectNoCleanup(w);
});

test('changes after a snapshot are refused without overwriting separately staged contents', async () => {
    const w = stoppedWork(), kept = await snapshotBeforeReset(w), file = resolve(w.root, 'new.txt');
    writeFileSync(file, 'staged after the snapshot\n');
    w.git('add', 'new.txt');
    const staged = w.git('rev-parse', ':new.txt');
    writeFileSync(file, 'written after the snapshot\n');
    await expectRefusal(w, kept);
    expect(w.git('show', `${w.input.ref}:new.txt`)).toBe('untracked');
    expect(w.git('rev-parse', ':new.txt')).toBe(staged);
    expect(readFileSync(file, 'utf8')).toBe('written after the snapshot\n');
});

test('an unstaged change after the snapshot is refused and kept', async () => {
    const w = stoppedWork(), kept = await snapshotBeforeReset(w), file = resolve(w.root, 'new.txt');
    writeFileSync(file, 'written after the snapshot\n');
    await expectRefusal(w, kept);
    expect(readFileSync(file, 'utf8')).toBe('written after the snapshot\n');
});

test('kept committed work with new uncommitted work on it is refused and the new work kept', async () => {
    const w = stoppedWork(false), kept = await snapshotBeforeReset(w), file = resolve(w.root, 'later.txt');
    expect(kept).toBe(w.partial);
    writeFileSync(file, 'written after the ref was kept\n');
    await expectRefusal(w, kept);
    expect(readFileSync(file, 'utf8')).toBe('written after the ref was kept\n');
});

test('a pre-reset head Git does not resolve, though its file names the kept head, is retryable', async () => {
    const w = stoppedWork(false), expected = await salvageWorktree(w.execute, w.input);
    const blind: Execute = async (program, args, options) => args.includes('--revs-only') ? '' : w.execute(program, args, options);
    w.sent.length = 0;
    const failure = await salvageWorktree(blind, w.input).catch(error => error);
    expect(failure).toBeInstanceOf(SalvageRetry);
    expect(String(failure)).toContain(w.input.ref);
    expectNoCleanup(w);
    expect(await salvageWorktree(w.execute, w.input)).toEqual(expected);
});

test('a staged change is preserved even when the working file matches the saved snapshot', async () => {
    const w = stoppedWork(), kept = await snapshotBeforeReset(w), file = resolve(w.root, 'a.txt');
    writeFileSync(file, 'independently staged\n');
    w.git('add', 'a.txt');
    const staged = w.git('rev-parse', ':a.txt');
    writeFileSync(file, 'uncommitted edit\n');
    await expectRefusal(w, kept);
    expect(w.git('rev-parse', ':a.txt')).toBe(staged);
    expect(readFileSync(file, 'utf8')).toBe('uncommitted edit\n');
});

test.each(['moved head', 'cleaned'])('a worktree that no longer holds the kept work is refused (%s)', async after => {
    const w = stoppedWork(), kept = await snapshotBeforeReset(w);
    if (after === 'moved head') w.git('reset', '-q', '--soft', w.accepted);
    else {
        w.git('reset', '-q', '--hard', w.partial);
        w.git('clean', '-fdq');
    }
    await expectRefusal(w, kept);
});

test.each([true, false])('a ref another pass created first keeps its object (matching snapshot: %s)', async same => {
    const w = stoppedWork();
    let winner = '';
    // Another pass creates the ref between this one's snapshot and its own creation of the ref.
    const racing: Execute = async (program, args, options) => {
        if (args[0] === 'update-ref' && !winner) {
            const tree = same ? w.git('write-tree') : w.git('rev-parse', `${w.accepted}^{tree}`);
            winner = (await w.execute('git', ['commit-tree', tree, '-p', w.partial, '-m', SNAPSHOT], {
                env: { GIT_AUTHOR_DATE: '2001-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2001-01-01T00:00:00Z' },
            })).trim();
            w.git('update-ref', w.input.ref, winner, '');
        }
        return w.execute(program, args, options);
    };
    if (same) {
        expect(await salvageWorktree(racing, w.input)).toEqual({ abandoned: w.partial, ref: w.input.ref });
        expect(w.git('rev-parse', 'HEAD')).toBe(w.accepted);
    }
    else {
        await expect(salvageWorktree(racing, w.input)).rejects.toThrow(`kept at ${w.input.ref}`);
        expect(w.git('rev-parse', 'HEAD')).toBe(w.partial);
        expect(w.git('status', '--porcelain=v1')).toContain('a.txt');
    }
    expect(w.git('rev-parse', w.input.ref)).toBe(winner);
});

test.each([false, true])('a losing ref creation observes the winning reset (new file: %s)', async newFile => {
    const w = stoppedWork(false), file = resolve(w.root, 'after-reset.txt');
    const racing: Execute = async (program, args, options) => {
        if (args[0] === 'update-ref') {
            expect(await salvageWorktree(w.execute, w.input)).toEqual({ abandoned: w.partial, ref: w.input.ref });
            if (newFile) writeFileSync(file, 'written after the winning reset\n');
            w.sent.length = 0;
        }
        return w.execute(program, args, options);
    };
    if (newFile) {
        await expect(salvageWorktree(racing, w.input)).rejects.toThrow(`kept at ${w.input.ref}`);
        expect(readFileSync(file, 'utf8')).toBe('written after the winning reset\n');
    } else expect(await salvageWorktree(racing, w.input)).toEqual({ abandoned: w.partial, ref: w.input.ref });
    expectNoCleanup(w);
    expect(w.git('rev-parse', w.input.ref)).toBe(w.partial);
    expect(w.git('rev-parse', 'ORIG_HEAD')).toBe(w.partial);
});

test('a transient saved-tree read failure names the ref and a retry uses the original snapshot', async () => {
    const w = stoppedWork(), kept = await snapshotBeforeReset(w);
    const unreadable: Execute = async (program, args, options) => {
        if (args[0] === 'rev-parse' && args[1] === `${kept}^{tree}`) throw new Error('Synthetic tree read timeout');
        return w.execute(program, args, options);
    };
    w.sent.length = 0;
    const failure = await salvageWorktree(unreadable, w.input).catch(error => error);
    expect(failure).toBeInstanceOf(SalvageRetry);
    expect(String(failure)).toContain(w.input.ref);
    expectNoCleanup(w);
    expect(await salvageWorktree(w.execute, w.input)).toEqual({ abandoned: w.partial, ref: w.input.ref });
    expect(w.git('rev-parse', w.input.ref)).toBe(kept);
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
