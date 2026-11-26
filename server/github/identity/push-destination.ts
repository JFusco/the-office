import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, resolve } from 'node:path';
import type { CommandOptions } from '../../workers/spawn-command';

type Execute = (program: string, args: string[], options?: CommandOptions) => Promise<string>;
const HELPER = '!gh auth git-credential';

/**
 * Before an App push: every effective push URL of `origin`, after `insteadOf` and `pushInsteadOf` rewrites, must be
 * exactly one HTTPS destination for the bound github.com repository, with no embedded credential. The effective
 * configuration, read with the push's own credential environment, must leave only the gh credential helper, no extra
 * authorization header and no askpass prompt. Reads only; a refusal sends nothing.
 */
export async function assertAppPushDestination(execute: Execute, cwd: string, repository: string): Promise<void> {
    const urls = (await execute('git', ['remote', 'get-url', '--push', '--all', 'origin'], { cwd, readOnly: true, timeout: 30000 })).split('\n').map(line => line.trim()).filter(Boolean);
    if (urls.length !== 1) throw new Error('An App push needs exactly one push destination for origin');
    let url: URL;
    try { url = new URL(urls[0]); } catch { throw new Error('An App push destination must be an HTTPS URL; SSH and other transports are refused'); }
    if (url.protocol !== 'https:') throw new Error('An App push destination must be an HTTPS URL; SSH and other transports are refused');
    if (url.username || url.password) throw new Error('An App push destination must not embed a credential');
    if (url.hostname !== 'github.com' || url.port || url.search || url.hash || !new RegExp(`^/${repository.replace(/[.]/g, '\\.')}(?:\\.git)?/?$`, 'i').test(url.pathname))
        throw new Error('The App push destination is not the bound github.com repository');
    const config = (await execute('git', ['config', '--list'], { cwd, readOnly: true, timeout: 30000 })).split('\n').filter(Boolean).map(line => {
        const at = line.indexOf('=');
        return at === -1 ? [line.toLowerCase(), ''] : [line.slice(0, at).toLowerCase(), line.slice(at + 1)];
    });
    if (config.some(([key]) => /^http\..*extraheader$/.test(key))) throw new Error('An App push refuses a configured extra authorization header');
    if (config.some(([key]) => key === 'core.askpass')) throw new Error('An App push refuses a configured askpass prompt');
    const helpers: string[] = [];
    for (const [key, value] of config)
        if (/^credential\.(?:.+\.)?helper$/.test(key)) { if (value) helpers.push(value); else helpers.length = 0; }
    if (helpers.length !== 1 || helpers[0] !== HELPER) throw new Error('An App push needs the gh credential helper alone; a competing helper is configured');
}

/** The hook files git runs for a push and that inherit its environment. A Husky runner's own user hook is included. */
const PUSH_HOOKS = ['pre-push', 'reference-transaction'];

/**
 * The digest of the hook chain a push from `cwd` runs, by hook name and content. An App push is admitted only when it
 * equals a digest qualified for the repository (`githubApp.repositories[project].pushHooks`): a changed hook, or a new
 * one, holds the route.
 */
export async function pushHookChain(execute: Execute, cwd: string): Promise<string> {
    const raw = (await execute('git', ['rev-parse', '--git-path', 'hooks'], { cwd, readOnly: true, timeout: 30000 })).trim();
    const hooks = isAbsolute(raw) ? raw : resolve(cwd, raw);
    const files: Record<string, string> = {};
    const add = (path: string, name: string) => { if (existsSync(path)) files[name] = createHash('sha256').update(readFileSync(path)).digest('hex'); };
    for (const name of PUSH_HOOKS) {
        add(resolve(hooks, name), name);
        // Husky's `.husky/_/<hook>` sources its runner `h`, which runs the user's `.husky/<hook>`.
        if (basename(hooks) === '_' && files[name]) { add(resolve(hooks, 'h'), 'husky-runner'); add(resolve(dirname(hooks), name), `husky:${name}`); }
    }
    return createHash('sha256').update(JSON.stringify(Object.entries(files).sort())).digest('hex');
}
