import type { ProcessTable } from './process-table';

/**
 * Codex processes that are only answering `codex login status`: the whole command line is the executable and
 * those two words. The Office's own health check runs it every few minutes, and a person may too. It reports
 * whether a login is configured and exits; it starts no session and cannot work in a checkout. Nothing can
 * follow the two words, so a prompt that contains them is not this.
 */
export function loginStatusQueries({ commands }: Pick<ProcessTable, 'commands'>): number[] {
    return [...commands].filter(([, command]) => command.length === 3 && command[1] === 'login' && command[2] === 'status').map(([pid]) => pid);
}
