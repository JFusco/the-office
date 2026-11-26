import type { Store } from '../../store/store';
import type { CommandOptions } from '../../workers/spawn-command';
import { githubIdentity } from './identity-runtime';
import { assertBoundPushDestination, pushHookChain } from './push-destination';
import { currentWriteCredential } from './write-credential-scope';

type Execute = (program: string, args: string[], options?: CommandOptions) => Promise<string>;

/**
 * The checks a push site runs immediately before its one `git push`, under the push's own write credential. The
 * operator on a never-activated route runs none. App and rollback pushes require one bound HTTPS destination and
 * the gh credential helper. An App push also requires the hook chain to be qualified for the repository.
 */
export async function assertPushCredential(store: Store, execute: Execute, cwd: string): Promise<void> {
    const credential = currentWriteCredential();
    if (!credential) return;
    const binding = githubIdentity(store).config()?.repositories[store.project.id];
    if (!binding) throw new Error('A scoped push needs the project in githubApp.repositories');
    await assertBoundPushDestination(execute, cwd, binding.repository);
    if (credential.principal === 'app' && !binding.pushHooks?.includes(await pushHookChain(execute, cwd)))
        throw new Error('The push hook chain is not qualified for App pushes; the push route is held');
}
