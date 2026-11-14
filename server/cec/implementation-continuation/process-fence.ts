import { execFile } from 'node:child_process';
import { resolve, sep } from 'node:path';

type Read = (program: string, args: string[]) => Promise<string>;
const nativeRead: Read = (program, args) => new Promise((done, fail) => execFile(program, args,
    { encoding: 'utf8', timeout: 10000, maxBuffer: 4 * 1024 * 1024 }, (error, out) => error
        ? fail(new Error('Saved worktree process visibility is unavailable')) : done(out)));

/** Metadata only. No process commands, transcript text, or signals are exposed. */
export async function assertCandidateIdle(worktree: string, read: Read = nativeRead) {
    const raw = await read('lsof', ['-a', '-d', 'cwd', '-Fpn']);
    let pid = 0, processes = 0;
    const holders = new Set<number>(), root = resolve(worktree);
    for (const line of raw.split('\n')) {
        if (line[0] === 'p') {
            pid = Number(line.slice(1));
            if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('Saved worktree process inventory is malformed');
            processes++;
        } else if (line[0] === 'n') {
            if (!pid) throw new Error('Saved worktree process inventory is malformed');
            const cwd = resolve(line.slice(1));
            if (cwd === root || cwd.startsWith(root + sep)) holders.add(pid);
        }
    }
    if (!processes) throw new Error('Saved worktree process inventory is empty');
    if (holders.size) throw new Error('A process still uses the saved worktree; preserve it until it settles');
}
