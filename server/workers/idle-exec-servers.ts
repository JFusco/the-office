import type { ProcessTable } from './process-table';

/**
 * Codex `exec-server` processes that are running nothing. An exec-server registers this machine as a remote
 * environment and holds no session transcript; it can act only by starting child processes, so one with no
 * child is idle. This is the single place a command line is read, and only to name this one subcommand.
 */
export function idleExecServers({ parents, commands }: Pick<ProcessTable, 'parents' | 'commands'>): number[] {
    const busy = new Set(parents.values());
    return [...commands].filter(([pid, command]) => command.includes('exec-server') && !busy.has(pid)).map(([pid]) => pid);
}
