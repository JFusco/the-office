import { LOCAL_BINDINGS } from '../../office/config';
import type { Store } from '../../store/store';
import { command } from '../../workers/process';
import type { GitHubAppConfig } from './app-config';
import { keychainKeySource } from './app-key';
import { operatorRollbackCredential } from './child-credentials';
import { fetchTransport, InstallationTokens } from './installation-token';
import { withWriteCredential } from './write-credential-scope';

/**
 * What the write boundary consults for one project store: the parsed `githubApp` block, the installation-token
 * issuer, and the login the operator's stored gh credential answers with once ambient tokens are removed.
 * Production reads the start-up config and builds the issuer lazily; tests bind an injected runtime to their store.
 */
export interface GitHubIdentityRuntime {
    config(): GitHubAppConfig | undefined;
    /** The issuer, or undefined when no App is configured. Building it never reads the key. */
    tokens(): InstallationTokens | undefined;
    operatorLogin(): Promise<string>;
}

let issuer: InstallationTokens | undefined;
const service: GitHubIdentityRuntime = {
    config: () => LOCAL_BINDINGS.githubApp,
    tokens: () => {
        const config = LOCAL_BINDINGS.githubApp;
        if (!config) return;
        return issuer ??= new InstallationTokens(config.appId, keychainKeySource(command, config.keySource), fetchTransport);
    },
    operatorLogin: async () => {
        const raw = await withWriteCredential(operatorRollbackCredential(), () => command('gh', ['api', 'user'], { readOnly: true, timeout: 30000 }));
        const login = JSON.parse(raw)?.login;
        if (typeof login !== 'string' || !login) throw new Error('The operator login is unavailable');
        return login;
    },
};
/** The service's own runtime: the start-up config and its lazily built issuer. */
export const serviceIdentity: GitHubIdentityRuntime = service;
const bound = new WeakMap<Store, GitHubIdentityRuntime>();

export const githubIdentity = (store: Store): GitHubIdentityRuntime => bound.get(store) ?? service;
/** Binds an injected runtime to one store, for fixtures and tools that own their own configuration. */
export function bindGitHubIdentity(store: Store, runtime: Partial<GitHubIdentityRuntime>): void {
    bound.set(store, { ...service, tokens: () => undefined, ...runtime });
}
