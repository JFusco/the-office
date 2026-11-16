import type { command } from '../../workers/process';

type Execute = typeof command;

/** Nothing was changed and the cause may pass (for example a leftover index lock); try again later. */
export class SalvageRetry extends Error {}

/**
 * Keeps whatever a stopped writer left in its worktree under a local ref, then returns the
 * worktree to the accepted commit. Nothing is pushed. Ignored files (installed dependencies)
 * are neither saved nor removed. Every refusal happens before the first write, and `guard`
 * runs before each write so a hold, pause or new owner stops the salvage where it is.
 */
export async function salvageWorktree(execute: Execute, input: { worktree: string; branch: string; accepted: string; ref: string }, guard: () => void = () => {}): Promise<{ abandoned: string; ref: string }> {
    const { worktree, branch, accepted, ref } = input;
    const read = async (...args: string[]) => (await execute('git', args, { cwd: worktree, timeout: 30000, readOnly: true })).trim();
    const write = async (...args: string[]) => { guard(); return (await execute('git', args, { cwd: worktree, timeout: 120000 })).trim(); };
    if (await read('branch', '--show-current') !== branch) throw new Error('Worktree is not on the delivery branch');
    await read('cat-file', '-e', `${accepted}^{commit}`);
    const abandoned = await read('rev-parse', 'HEAD'), status = await read('status', '--porcelain=v1', '--untracked-files=all');
    // A nested repository or submodule holds work that an index snapshot cannot keep and a clean cannot remove.
    if (status.split('\n').some(line => line.startsWith('?? ') && line.endsWith('/')) || await read('submodule', 'status'))
        throw new Error('Worktree holds a nested repository or submodule; its work cannot be saved by the harness');
    let saved = abandoned;
    if (status) {
        try {
            // A commit object made directly from the index: no hooks run and the branch does not move.
            await write('add', '-A');
            saved = await write('commit-tree', await write('write-tree'), '-p', abandoned, '-m', 'Office: unfinished work of a stopped writer run');
        }
        catch (error) { throw new SalvageRetry(String(error), { cause: error }); }
    }
    const kept = saved !== accepted;
    if (kept) await write('update-ref', ref, saved);
    const at = kept ? ` Unfinished work is kept at ${ref}.` : '';
    try {
        await write('reset', '--hard', accepted);
        await write('clean', '-fd');
    }
    catch (error) { throw new Error(`Worktree reset did not finish.${at} ${String(error)}`, { cause: error }); }
    if (await read('rev-parse', 'HEAD') !== accepted || await read('status', '--porcelain=v1', '--untracked-files=all'))
        throw new Error(`Worktree did not return to the accepted commit.${at}`);
    return { abandoned, ref: kept ? ref : '' };
}
