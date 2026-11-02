import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';

/** Provider CLIs that read or write live GitHub, Jira and Azure state. */
const LIVE_PROVIDERS = new Set(['gh', 'twg', 'az']);
/** Git subcommands that can contact a remote. */
const GIT_NETWORK = new Set(['push', 'fetch', 'pull', 'ls-remote', 'clone', 'remote', 'submodule', 'archive', 'lfs']);

/** Network remotes: URLs with a scheme other than file://, and scp-style `[user@]host.domain:path`. */
function networkUrl(value: string): boolean {
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? !/^file:\/\//i.test(value) : /^(?:[^/@\s]+@)?[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+:/.test(value);
}

/** Every fetch and push URL configured in the repository at cwd. */
function remoteUrls(cwd?: string): string[] {
    try { return execFileSync('git', ['remote', '-v'], { cwd, encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').map(line => line.split(/\s+/)[1]).filter(Boolean); }
    catch { return []; }
}

/**
 * Why this command would reach a live service, or ''. Unit tests inject fake runners; anything that
 * reaches the real runner under a test must stay local. Fails closed: a git network command is refused
 * whenever its target or the repository's remotes could leave this machine.
 */
export function liveReach(program: string, args: string[], cwd?: string): string {
    if (LIVE_PROVIDERS.has(basename(program)))
        return `live provider CLI "${program}"`;
    if (basename(program) !== 'git')
        return '';
    let i = 0;
    while (i < args.length && args[i].startsWith('-'))
        i += ['-C', '-c'].includes(args[i]) ? 2 : 1;
    const subcommand = args[i], rest = args.slice(i + 1);
    // Only these forms contact a remote; `remote add`, `submodule status`, plain `archive` and the like stay local.
    const local = subcommand === 'remote' && !['update', 'show', 'prune'].includes(rest[0]) || subcommand === 'submodule' && rest[0] !== 'update'
        || subcommand === 'archive' && !rest.some(arg => arg.startsWith('--remote')) || subcommand === 'lfs' && !['fetch', 'pull', 'push'].includes(rest[0]);
    if (!GIT_NETWORK.has(subcommand) || local)
        return '';
    const url = rest.find(networkUrl);
    if (url)
        return `git ${subcommand} to ${url}`;
    if (subcommand === 'clone')
        return '';
    const network = remoteUrls(cwd).filter(networkUrl);
    return network.length ? `git ${subcommand} in a repository with network remote ${network[0]}` : '';
}
