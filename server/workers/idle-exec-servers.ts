import type { ProcessTable } from './process-table';

/**
 * True when the first argument that is neither a flag nor the value of `-c`/`--config` is `exec-server` and a flag
 * follows it, as the service is started. A prompt that merely begins with the word is followed by more words, and
 * any other value-taking global flag yields a non-match.
 */
const isExecServer = (command: string[]) => {
    const args = command.slice(1), at = args.findIndex((token, i) => !token.startsWith('-') && !['-c', '--config'].includes(args[i - 1]));
    return args[at] === 'exec-server' && !!args[at + 1]?.startsWith('--');
};

/**
 * Codex `exec-server` processes that are running nothing. An exec-server registers this machine as a remote
 * environment and holds no session transcript; it can act only by starting child processes, so one with no
 * child is idle. This is the single place a command line is read, and only to name this one subcommand.
 */
export function idleExecServers({ parents, commands }: Pick<ProcessTable, 'parents' | 'commands'>): number[] {
    const busy = new Set(parents.values());
    return [...commands].filter(([pid, command]) => isExecServer(command) && !busy.has(pid)).map(([pid]) => pid);
}
