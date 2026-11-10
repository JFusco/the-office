import { lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import type { TicketJob } from '../../../src/shared';

/** Keep native pnpm commands inside the saved private clone, including commands in its subfolders. */
export function candidateWorkspaceEnvironment(dataRoot: string, job: TicketJob | undefined, cwd: string): { NPM_CONFIG_WORKSPACE_DIR: string } | undefined {
    if (!job?.worktree || resolve(cwd) !== resolve(job.worktree)) return;
    const repair = job.ciRepairs?.filter(repair => repair.worktree === job.worktree).at(-1) ||
        (job.adoptedRepairCheckout?.worktree === job.worktree ? job.adoptedRepairCheckout : undefined);
    if (!repair) return; // Primary inspection and ordinary adjacent worktrees keep their existing environment.
    if (!isAbsolute(cwd) || !/^[\w-]{1,80}$/.test(job.id) || !/^[\w-]{1,80}$/.test(repair.id)) throw Error('Private candidate workspace identity changed');
    const parts = ['ticket-work', job.id, `ci-${repair.id}`, 'candidate'];
    if (resolve(cwd) !== resolve(dataRoot, ...parts)) throw Error('Private candidate workspace path changed');
    let current = realpathSync(dataRoot);
    for (const part of parts) {
        current = resolve(current, part);
        const entry = lstatSync(current);
        if (entry.isSymbolicLink() || !entry.isDirectory()) throw Error('Private candidate workspace must retain its owned directories');
    }
    if (realpathSync(cwd) !== current) throw Error('Private candidate workspace location changed');
    return { NPM_CONFIG_WORKSPACE_DIR: current };
}
