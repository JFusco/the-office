import { AsyncLocalStorage } from 'node:async_hooks';
import { basename } from 'node:path';
import type { CommandOptions } from '../../workers/spawn-command';
import type { WriteCredential } from './child-credentials';

const scope = new AsyncLocalStorage<WriteCredential>();

/** Runs one write's dispatch, verification or read-back with its selected credential. */
export const withWriteCredential = <T>(credential: WriteCredential, work: () => T): T => scope.run(credential, work);
/** The credential of the write in progress, or undefined: no write scope, so the operator exactly as before. */
export const currentWriteCredential = (): WriteCredential | undefined => scope.getStore();
/** The principal a GitHub call is made as, for the call ledger and quota windows. */
export const currentPrincipal = (): string => scope.getStore()?.label ?? 'operator';

/**
 * The options for one child under the current write credential. Only `gh` and `git` receive it, and its own entries
 * win over the caller's; any other program, or no write scope, gets the caller's options unchanged (the same object).
 * The credential rides the caller's own environment form: added through the ordinary `env` merge, or into a whole
 * replacement environment when the caller passes one, never both. Its removals (`envRemove`) apply to either form.
 */
export function credentialOptions(program: string, options: CommandOptions, credential = currentWriteCredential()): CommandOptions {
    const name = basename(program), part = credential && (name === 'gh' ? credential.gh : name === 'git' ? credential.git : undefined);
    if (!part) return options;
    const remove = new Set(part.remove);
    const envRemove = [...new Set([...(options.envRemove ?? []), ...remove])];
    const provided = { ...(options.replaceEnv ?? options.env) };
    for (const key of remove) {
        // The push recorder supplies its own event log and explicitly disables tracing environment and config values.
        if (name === 'git' && (key === 'GIT_TRACE2_EVENT' ||
            (key === 'GIT_TRACE2_ENV_VARS' || key === 'GIT_TRACE2_CONFIG_PARAMS') && provided[key] === '')) continue;
        delete provided[key];
    }
    const env = { ...provided, ...part.env };
    if (options.replaceEnv !== undefined)
        return { ...options, replaceEnv: env, envRemove: options.envRemove?.filter(key => !Object.hasOwn(part.env, key)) };
    return { ...options, env, envRemove };
}
