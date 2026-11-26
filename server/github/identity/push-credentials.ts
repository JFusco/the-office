import type { Store } from '../../store/store';
import type { CommandOptions } from '../../workers/spawn-command';
import { githubIdentity } from './identity-runtime';
import { assertAppPushDestination, pushHookChain } from './push-destination';
import { currentWriteCredential } from './write-credential-scope';

type Execute = (program: string, args: string[], options?: CommandOptions) => Promise<string>;

/**
 * The checks a push site runs immediately before its one `git push`, under the push's own write credential. The
 * operator on a never-activated route runs none, exactly as before. A rollback push needs none either: its child
 * environment already has every ambient token removed. An App push requires the one bound HTTPS destination and
 * only the gh credential helper (`push-destination.ts`), and a hook chain qualified for the repository; the push's
 * own argv, refspecs, lease, hooks and capture are unchanged, and the token reaches git only in its environment.
 */
export async function assertPushCredential(store: Store, execute: Execute, cwd: string): Promise<void> {
    if (currentWriteCredential()?.principal !== 'app') return;
    const binding = githubIdentity(store).config()?.repositories[store.project.id];
    if (!binding) throw new Error('An App push needs the project in githubApp.repositories');
    await assertAppPushDestination(execute, cwd, binding.repository);
    if (!binding.pushHooks?.includes(await pushHookChain(execute, cwd)))
        throw new Error('The push hook chain is not qualified for App pushes; the push route is held');
}
