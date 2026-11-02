/**
 * `git worktree remove` deletes files one by one; a removal cut off by a timeout leaves the
 * worktree with only tracked files deleted. Every deleted file is committed at HEAD, so finishing
 * that removal loses nothing. Any modified, added, renamed or untracked path is real work.
 */
export function interruptedRemoval(porcelain: string): boolean {
    const lines = porcelain.split('\n').filter(Boolean);
    return lines.length > 0 && lines.every(line => line === ` D ${line.slice(3)}` || line === `D  ${line.slice(3)}`);
}
