import type { ProcessTable } from './process-table';

/** The Codex desktop app's Computer Use service: the whole command line is its own executable, with no arguments. */
const SERVICE = /^\/[^ ]*\/Codex Computer Use\.app\/Contents\/MacOS\/SkyComputerUseService$/;
/** Flags the service passes before `--thread-source`, and the bare flags it passes after it. */
const LEADING = new Set(['--json', '--skip-git-repo-check', '--ephemeral']), BARE = new Set(['--ignore-user-config', '--ignore-rules']);
/** Settings that do not widen what the process may touch. The permission settings are checked on their own below. */
const PLAIN = /^(cli_auth_credentials_store|model_reasoning_effort)="[A-Za-z0-9_.-]+"$/;

/**
 * True for exactly the arguments the service starts its memory writer with, read as far as its instruction
 * text: `exec`; the leading flags above with `--ephemeral` among them; `--thread-source computer_history`;
 * both bare flags, so no user configuration is loaded; a model; and settings from a short list, among them
 * one default permission profile that extends `:read-only` and only denies paths. Anything else before the
 * instruction text (another flag, another setting, a second profile, a path that is not denied, a prompt)
 * makes it a different process. The check fails closed: a later version of the app that starts it another
 * way is simply unexplained again.
 */
function isMemoryWriter(command: string[]): boolean {
    const args = command.slice(1), source = args.indexOf('--thread-source');
    if (args[0] !== 'exec' || source < 1 || args[source + 1] !== 'computer_history') return false;
    const leading = args.slice(1, source);
    if (!leading.every(flag => LEADING.has(flag)) || !leading.includes('--ephemeral')) return false;
    const bare = new Set<string>(), settings: string[] = [];
    for (let at = source + 2; at < args.length;) {
        const flag = args[at++];
        if (BARE.has(flag)) { bare.add(flag); continue; }
        if (flag === '--model') { if (!/^[A-Za-z0-9._-]+$/.test(args[at++] || '')) return false; continue; }
        if (flag !== '--config') return false;
        // The instruction text ends what is read: it is the last thing the service passes.
        if (args[at]?.startsWith('developer_instructions=')) break;
        // A value with a space in it was split; it runs until its braces close.
        let value = args[at++] || '';
        const open = (text: string) => text.split('{').length - text.split('}').length;
        while (open(value) > 0 && at < args.length) value += ` ${args[at++]}`;
        if (!value || open(value) !== 0) return false;
        settings.push(value);
    }
    if (bare.size !== BARE.size) return false;
    const profiles = settings.filter(value => value.startsWith('default_permissions=')), rules = settings.filter(value => value.startsWith('permissions.'));
    const name = profiles[0]?.match(/^default_permissions="([A-Za-z0-9_-]+)"$/)?.[1];
    if (profiles.length !== 1 || rules.length !== 1 || !name) return false;
    const denied = rules[0].match(new RegExp(`^permissions\\.${name}=\\{extends=":read-only"(?:,filesystem=\\{(.*)\\})?\\}$`));
    if (!denied || !(denied[1] ?? '').split(',').filter(Boolean).every(entry => /^"[^"]+"="deny"$/.test(entry))) return false;
    return settings.every(value => value === profiles[0] || value === rules[0] || PLAIN.test(value));
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
