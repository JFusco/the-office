import type { ProcessTable } from './process-table';

/** The Codex desktop app's Computer Use service: the whole command line is its own executable, with no arguments. */
const SERVICE = /^\/[^ ]*\/Codex Computer Use\.app\/Contents\/MacOS\/SkyComputerUseService$/;

/**
 * True for the arguments the service starts its memory writer with: `exec`, then flags only up to
 * `--thread-source computer_history`, `--ephemeral` among them, and before any instruction text a default
 * permission profile that extends `:read-only`. A prompt that contains the same words is not this: it comes
 * after the flags, and a flag-like word inside it is not in this position.
 */
function isMemoryWriter(command: string[]): boolean {
    const args = command.slice(1), source = args.indexOf('--thread-source');
    if (args[0] !== 'exec' || source < 1 || args[source + 1] !== 'computer_history') return false;
    const flags = args.slice(1, source);
    if (!flags.every(token => token.startsWith('--')) || !flags.includes('--ephemeral')) return false;
    const text = args.findIndex(token => token.startsWith('developer_instructions=')), settings = text < 0 ? args : args.slice(0, text);
    const value = (prefix: string) => settings.find((token, at) => settings[at - 1] === '--config' && token.startsWith(prefix));
    const profile = value('default_permissions=')?.match(/^default_permissions="([A-Za-z0-9_-]+)"$/)?.[1];
    return !!profile && !!value(`permissions.${profile}={extends=":read-only"`);
}

/**
 * The Codex desktop app's background memory writers: `codex exec` runs its Computer Use service starts to
 * summarise recorded activity. One is ephemeral, so it holds no session transcript, and its own permission
 * profile is read-only, so it cannot work in a checkout. It is known by its parent's executable and by the
 * arguments it is started with; like `idle-exec-servers.ts`, this is a place a command line is read, and only
 * to name this one process.
 */
export function computerHistoryWriters({ parents, commands }: Pick<ProcessTable, 'parents' | 'commands'>): number[] {
    return [...commands].filter(([pid, command]) => isMemoryWriter(command) && SERVICE.test((commands.get(parents.get(pid) || 0) || []).join(' '))).map(([pid]) => pid);
}
