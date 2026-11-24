import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import type { command } from '../../workers/process';

type Execute = typeof command;
type Read = (...args: string[]) => Promise<string>;

/** An operation could not establish the salvage outcome and may succeed on a later poll. */
export class SalvageRetry extends Error {}

/** The message of the commit the harness makes from a stopped run's uncommitted work. */
const SNAPSHOT = 'Office: unfinished work of a stopped writer run';

/** The object a ref names, or '' when there is none. A failed read changes nothing and may pass. */
async function refObject(read: Read, ref: string): Promise<string> {
    try {
        const line = (await read('for-each-ref', '--format=%(refname) %(objectname)', ref)).split('\n').find(line => line.startsWith(`${ref} `));
        return line ? line.slice(ref.length + 1).trim() : '';
    } catch (error) { throw new SalvageRetry(`${ref} could not be read: ${String(error)}`, { cause: error }); }
}

/** What a kept object says the stopped run left: the head it stopped at, and whether the harness made the object from uncommitted work on that head. */
async function keptWork(read: Read, object: string): Promise<{ abandoned: string; snapshot: boolean }> {
    const lines = (await read('show', '-s', '--format=P:%P%nS:%s', object)).split('\n');
    const parents = (lines.find(line => line.startsWith('P:')) ?? 'P:').slice(2).split(' ').filter(Boolean), subject = (lines.find(line => line.startsWith('S:')) ?? 'S:').slice(2);
    return subject === SNAPSHOT && parents.length === 1 ? { abandoned: parents[0], snapshot: true } : { abandoned: object, snapshot: false };
}

/**
 * Keeps whatever a stopped writer left in its worktree under a local ref, then returns the
 * worktree to the accepted commit. Nothing is pushed. Ignored files (installed dependencies)
 * are neither saved nor removed. The guard runs before each Git write so a hold, pause or
 * new owner stops the salvage where it is.
 *
 * The ref is created once, against an empty old value, and never moved: the first object kept for
 * a run is the one kept. A later salvage of the same run (its restart was never recorded, or
 * another pass created the ref first) reads that object and goes on only where the worktree
 * agrees with it. A worktree already clean at the accepted commit whose pre-reset head
 * (`ORIG_HEAD`) is the kept head, or the sole parent of the harness's snapshot, was reset by
 * that salvage: its head and ref are returned and nothing is reset again. A worktree not yet
 * reset is reset only while its head and contents, untracked files included, are exactly what
 * the ref keeps. Otherwise it is refused before any reset or clean, naming the ref.
 */
export async function salvageWorktree(execute: Execute, input: { worktree: string; branch: string; accepted: string; ref: string }, guard: () => void = () => {}): Promise<{ abandoned: string; ref: string }> {
    const { worktree, branch, accepted, ref } = input;
    const read: Read = async (...args) => (await execute('git', args, {
        cwd: worktree, timeout: 30000, readOnly: true, env: { GIT_OPTIONAL_LOCKS: '0' },
    })).trimEnd();
    const write = async (args: string[], env?: Record<string, string>) => {
        guard();
        return (await execute('git', args, { cwd: worktree, timeout: 120000, env })).trim();
    };
    const retry = async <T>(operation: string, attempt: () => Promise<T>): Promise<T> => {
        try { return await attempt(); }
        catch (error) { throw new SalvageRetry(`${ref}: ${operation}: ${String(error)}`, { cause: error }); }
    };
    const readKept: Read = (...args) => retry(`could not read ${args.join(' ')}`, () => read(...args));
    const disagrees = (what: string) => new Error(`${what}; nothing was reset. The stopped run's work is kept at ${ref}.`);
    const observe = async (hasKept: boolean) => {
        const git = hasKept ? readKept : read;
        const refuse = hasKept ? disagrees : (reason: string) => new Error(reason);
        if (await git('branch', '--show-current') !== branch) throw refuse('Worktree is not on the delivery branch');
        await git('cat-file', '-e', `${accepted}^{commit}`);
        const head = await git('rev-parse', 'HEAD'), status = await git('status', '--porcelain=v1', '--untracked-files=all');
        // A nested repository or submodule holds work an index snapshot cannot keep.
        if (status.split('\n').some(line => line.startsWith('?? ') && line.endsWith('/')) || await git('submodule', 'status'))
            throw refuse('Worktree holds a nested repository or submodule; its work cannot be saved by the harness');
        return { head, status };
    };
    const snapshotTree = async (env?: Record<string, string>) => {
        await write(['add', '-A'], env);
        return write(['write-tree'], env);
    };
    const reset = async (abandoned: string, kept: string) => {
        const at = kept ? ` Unfinished work is kept at ${kept}.` : '';
        try {
            await write(['reset', '--hard', accepted]);
            await write(['clean', '-fd']);
        }
        catch (error) { throw new Error(`Worktree reset did not finish.${at} ${String(error)}`, { cause: error }); }
        if (await read('rev-parse', 'HEAD') !== accepted || await read('status', '--porcelain=v1', '--untracked-files=all'))
            throw new Error(`Worktree did not return to the accepted commit.${at}`);
        return { abandoned, ref: kept };
    };
    let object = await refObject(read, ref);
    let { head, status } = await observe(!!object);
    if (!object) {
        // A commit object made directly from the index leaves the branch in place.
        const saved = status
            ? await retry('could not snapshot the worktree', async () => write(['commit-tree', await snapshotTree(), '-p', head, '-m', SNAPSHOT]))
            : head;
        if (saved === accepted) return reset(head, '');
        try { await write(['update-ref', ref, saved, '']); }
        catch (error) {
            object = await refObject(read, ref);
            if (!object) throw new SalvageRetry(`${ref} could not be created: ${String(error)}`, { cause: error });
        }
        if (!object) return reset(head, ref);
        // The winner may have reset while this pass was creating the ref.
        ({ head, status } = await observe(true));
    }

    const kept = await keptWork(readKept, object);
    if (head === accepted && !status) {
        // Git can return no revision for both a missing pseudoref and an unreadable file.
        const before = await readKept('rev-parse', '--revs-only', '--end-of-options', 'ORIG_HEAD^{commit}');
        if (!before) await retry('could not verify ORIG_HEAD', async () => {
            const path = resolve(worktree, await read('rev-parse', '--git-path', 'ORIG_HEAD'));
            const raw = await readFile(path, 'utf8').catch(error => {
                if (error.code === 'ENOENT') return '';
                throw error;
            });
            if (raw.trim() === kept.abandoned) throw new Error('the pre-reset commit could not be resolved');
        });
        if (before !== kept.abandoned) throw disagrees(`The worktree is at the accepted commit, but its pre-reset head ${before || '(none)'} is not the head ${kept.abandoned}`);
        return { abandoned: kept.abandoned, ref };
    }
    const mismatch = () => disagrees(`The worktree at ${head} does not match the saved work`);
    if (head !== kept.abandoned || !!status !== kept.snapshot) throw mismatch();
    if (kept.snapshot) {
        const tree = await readKept('rev-parse', `${object}^{tree}`);
        const current = await retry('could not compare worktree contents', async () => {
            const index = resolve(worktree, await read('rev-parse', '--git-path', 'index'));
            const scratch = await mkdtemp(resolve(tmpdir(), 'office-salvage-index-'));
            try {
                const copy = resolve(scratch, 'index');
                await copyFile(index, copy);
                return await snapshotTree({ GIT_INDEX_FILE: copy });
            } finally { await rm(scratch, { recursive: true, force: true }); }
        });
        if (current !== tree) throw mismatch();
        // A staged change can differ from the kept work even when its working file matches.
        const staged = await readKept('diff', '--cached', '--no-renames', '--name-only', '-z', head);
        if (staged) {
            const differs = new Set((await readKept('diff', '--cached', '--no-renames', '--name-only', '-z', tree)).split('\0').filter(Boolean));
            if (staged.split('\0').some(path => differs.has(path))) throw mismatch();
        }
    }
    return reset(kept.abandoned, ref);
}
