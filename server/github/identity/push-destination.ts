import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, extname, relative, resolve } from 'node:path';
import type { CommandOptions } from '../../workers/spawn-command';

type Execute = (program: string, args: string[], options?: CommandOptions) => Promise<string>;
const HELPER = '!gh auth git-credential';

/**
 * Before an App or rollback push: every effective push URL of `origin`, after `insteadOf` and `pushInsteadOf` rewrites, must be
 * exactly one HTTPS destination for the bound github.com repository, with no embedded credential. The effective
 * configuration, read with the push's own credential environment, must leave only the gh credential helper, no extra
 * authorization header and no askpass prompt. Reads only; a refusal sends nothing.
 */
export async function assertBoundPushDestination(execute: Execute, cwd: string, repository: string): Promise<void> {
    const urls = (await execute('git', ['remote', 'get-url', '--push', '--all', 'origin'], { cwd, readOnly: true, timeout: 30000 })).split('\n').map(line => line.trim()).filter(Boolean);
    if (urls.length !== 1) throw new Error('A scoped push needs exactly one push destination for origin');
    let url: URL;
    try { url = new URL(urls[0]); } catch { throw new Error('A scoped push destination must be an HTTPS URL; SSH and other transports are refused'); }
    if (url.protocol !== 'https:') throw new Error('A scoped push destination must be an HTTPS URL; SSH and other transports are refused');
    if (url.username || url.password) throw new Error('A scoped push destination must not embed a credential');
    if (url.hostname !== 'github.com' || url.port || url.search || url.hash || !new RegExp(`^/${repository.replace(/[.]/g, '\\.')}(?:\\.git)?/?$`, 'i').test(url.pathname))
        throw new Error('The scoped push destination is not the bound github.com repository');
    const config = (await execute('git', ['config', '--list'], { cwd, readOnly: true, timeout: 30000 })).split('\n').filter(Boolean).map(line => {
        const at = line.indexOf('=');
        return at === -1 ? [line.toLowerCase(), ''] : [line.slice(0, at).toLowerCase(), line.slice(at + 1)];
    });
    if (config.some(([key]) => /^http\..*extraheader$/.test(key))) throw new Error('A scoped push refuses a configured extra authorization header');
    if (config.some(([key]) => key === 'core.askpass')) throw new Error('A scoped push refuses a configured askpass prompt');
    const helpers: string[] = [];
    for (const [key, value] of config)
        if (/^credential\.(?:.+\.)?helper$/.test(key)) { if (value) helpers.push(value); else helpers.length = 0; }
    if (helpers.length !== 1 || helpers[0] !== HELPER) throw new Error('A scoped push needs the gh credential helper alone; a competing helper is configured');
}

const PUSH_HOOKS = ['pre-push', 'reference-transaction'];
const HUSKY_RUNNER = '70200b200ca709b0622784f93839a5b2872333a917a09afddefd7dc2d8cdc680'; // Husky 9.1.7
const OFFICE_PRE_PUSH = '9935792b387327549155781a778d2beac5369048a559b0afffba2d5fed82fb56';
const digest = (contents: Buffer | string) => createHash('sha256').update(contents).digest('hex');
const unresolved = () => new Error('The push hook chain cannot be established; the App push route is held');
const file = (path: string): Buffer | undefined => {
    const stat = lstatSync(path, { throwIfNoEntry: false });
    if (!stat) return;
    if (!stat.isFile()) throw unresolved();
    return readFileSync(path);
};

/**
 * Follow literal worktree-relative shell and Node delegates and hash each file. Unrecognized commands hold the
 * route because their descendants cannot be established. The known Office guard and Husky runner have fixed behavior.
 */
export async function pushHookChain(execute: Execute, cwd: string): Promise<string> {
    const raw = (await execute('git', ['rev-parse', '--git-path', 'hooks'], { cwd, readOnly: true, timeout: 30000 })).trim();
    if (!raw) throw unresolved();
    const hooks = resolve(cwd, raw);
    const root = realpathSync(cwd);
    const files: Record<string, string> = {};
    const visiting = new Set<string>();
    function inspect(source: Buffer, kind: 'sh' | 'node'): void {
        if (kind === 'sh' && digest(source) === OFFICE_PRE_PUSH) return;
        for (const line of source.toString('utf8').split('\n').map(line => line.trim())) {
            if (!line) continue;
            if (kind === 'node') {
                if (/^(?:\/\/[^\r\u2028\u2029]*|process\.exit\(\d+\);?|console\.log\((?:'[\w .-]*'|"[\w .-]*")\);?)$/.test(line)) continue;
                throw unresolved();
            }
            if (/^(?:#(?!\!)[^\\]*|#!\/(?:bin\/sh|usr\/bin\/env sh)|:|exit \d+)$/.test(line)) continue;
            const delegate = /^(sh|node) (?:\.\/)?((?:[\w-]+\/)*[\w-]+\.(?:sh|cjs))$/.exec(line);
            if (!delegate) throw unresolved();
            const path = resolve(root, delegate[2]), interpreter = delegate[1] === 'node' ? 'node' : 'sh';
            if ((interpreter === 'sh' ? '.sh' : '.cjs') !== extname(path) || visiting.has(path)) throw unresolved();
            const dependency = file(path);
            if (!dependency || realpathSync(path) !== path) throw unresolved();
            visiting.add(path);
            files['delegate:' + relative(root, path)] = digest(dependency);
            inspect(dependency, interpreter);
            visiting.delete(path);
        }
    }
    for (const name of PUSH_HOOKS) {
        const entry = file(resolve(hooks, name));
        if (!entry) continue;
        files[name] = digest(entry);
        if (basename(hooks) === '_' && entry.toString().trim() === '#!/usr/bin/env sh\n. "$(dirname "$0")/h"') {
            const runner = file(resolve(hooks, 'h'));
            // Husky can source per-user code and prepends the worktree's bin directory to PATH.
            const init = resolve(process.env.XDG_CONFIG_HOME || resolve(homedir(), '.config'), 'husky/init.sh');
            const unbound = [init, ...['sh', 'node'].map(bin => resolve(root, 'node_modules/.bin', bin))];
            if (!runner || digest(runner) !== HUSKY_RUNNER || unbound.some(path => lstatSync(path, { throwIfNoEntry: false })))
                throw unresolved();
            files['husky-runner'] = digest(runner);
            const userHook = file(resolve(dirname(hooks), name));
            if (!userHook) continue;
            files['husky:' + name] = digest(userHook);
            inspect(userHook, 'sh');
        } else inspect(entry, 'sh');
    }
    return digest(JSON.stringify(Object.entries(files).sort()));
}
