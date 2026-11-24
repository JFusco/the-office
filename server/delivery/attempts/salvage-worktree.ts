import type { command } from '../../workers/process';

type Execute = typeof command;
type Read = (...args: string[]) => Promise<string>;

/** Nothing was changed and the cause may pass (for example a leftover index lock); try again later. */
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
 * are neither saved nor removed. Every refusal happens before the first write, and `guard`
 * runs before each write so a hold, pause or new owner stops the salvage where it is.
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
    const read: Read = async (...args) => (await execute('git', args, { cwd: worktree, timeout: 30000, readOnly: true })).trim();
    const write = async (...args: string[]) => { guard(); return (await execute('git', args, { cwd: worktree, timeout: 120000 })).trim(); };
    if (await read('branch', '--show-current') !== branch) throw new Error('Worktree is not on the delivery branch');
    await read('cat-file', '-e', `${accepted}^{commit}`);
    const head = await read('rev-parse', 'HEAD'), status = await read('status', '--porcelain=v1', '--untracked-files=all');
    // A nested repository or submodule holds work that an index snapshot cannot keep and a clean cannot remove.
    if (status.split('\n').some(line => line.startsWith('?? ') && line.endsWith('/')) || await read('submodule', 'status'))
        throw new Error('Worktree holds a nested repository or submodule; its work cannot be saved by the harness');
    /** The tree of the worktree's contents as they stand, untracked files included, from the index. */
    const snapshotTree = async () => {
        try { await write('add', '-A'); return await write('write-tree'); }
        catch (error) { throw new SalvageRetry(String(error), { cause: error }); }
    };
    /** Whether the worktree, not yet reset, holds exactly the work kept at the ref. */
    const agrees = async (object: string, kept: { abandoned: string; snapshot: boolean }) => {
        if (!status) return !kept.snapshot && head === object;
        return kept.snapshot && kept.abandoned === head && await snapshotTree() === await read('rev-parse', `${object}^{tree}`);
    };
    const disagrees = (what: string) => new Error(`${what}; nothing was reset. The stopped run's work is kept at ${ref}.`);
    let object = await refObject(read, ref), abandoned = head;
    if (object) {
        const kept = await keptWork(read, object);
        if (head === accepted && !status) {
            let before = '';
            try { before = await read('rev-parse', '--verify', 'ORIG_HEAD^{commit}'); } catch { /* No pre-reset head to corroborate. */ }
            if (before !== kept.abandoned) throw disagrees(`The worktree is at the accepted commit, but its pre-reset head ${before || '(none)'} is not the head ${kept.abandoned} kept at ${ref}`);
            return { abandoned: kept.abandoned, ref };
        }
        if (!await agrees(object, kept)) throw disagrees(`The worktree at ${head} does not hold the work kept at ${ref}`);
        abandoned = kept.abandoned;
    } else {
        let saved = head;
        if (status) {
            try {
                // A commit object made directly from the index: no hooks run and the branch does not move.
                saved = await write('commit-tree', await snapshotTree(), '-p', head, '-m', SNAPSHOT);
            }
            catch (error) { throw error instanceof SalvageRetry ? error : new SalvageRetry(String(error), { cause: error }); }
        }
        if (saved !== accepted) {
            try { await write('update-ref', ref, saved, ''); object = saved; }
            catch (error) {
                // Created first by another pass: its object is the one kept, and the worktree must agree with it.
                object = await refObject(read, ref);
                if (!object) throw new SalvageRetry(`${ref} could not be created: ${String(error)}`, { cause: error });
                const kept = await keptWork(read, object);
                if (!await agrees(object, kept)) throw disagrees(`${ref} was created by another pass and the worktree at ${head} does not hold its work`);
                abandoned = kept.abandoned;
            }
        }
    }
    const at = object ? ` Unfinished work is kept at ${ref}.` : '';
    try {
        await write('reset', '--hard', accepted);
        await write('clean', '-fd');
    }
    catch (error) { throw new Error(`Worktree reset did not finish.${at} ${String(error)}`, { cause: error }); }
    if (await read('rev-parse', 'HEAD') !== accepted || await read('status', '--porcelain=v1', '--untracked-files=all'))
        throw new Error(`Worktree did not return to the accepted commit.${at}`);
    return { abandoned, ref: object ? ref : '' };
}
