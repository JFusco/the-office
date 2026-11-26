import type { GitHubAppConfig } from './app-config';
import { appCredential, type WriteCredential } from './child-credentials';
import { serviceIdentity } from './identity-runtime';
import type { AuthenticationCounters, InstallationTokens } from './installation-token';

/** The App detail of /api/health, apart from the operator's own `gh` login status: public identifiers and counts only. */
export interface AppReadiness {
    configured: boolean;
    appId?: number;
    installationId?: number;
    botLogin?: string;
    repositories: number;
    /** Direct App-authentication traffic (token exchanges), counted apart from ordinary GitHub calls. */
    authentication: AuthenticationCounters;
}
/** What the call accounting needs of the App: a principal's own credential for its quota probe, and its readiness. */
export interface AppPrincipals {
    credential(principal: string): Promise<WriteCredential | undefined>;
    readiness(): AppReadiness;
}

export function appPrincipals(config: () => GitHubAppConfig | undefined, tokens: () => InstallationTokens | undefined): AppPrincipals {
    return {
        async credential(principal) {
            const app = config(), issuer = tokens(), repository = app && Object.values(app.repositories)[0];
            if (!app || !issuer || !repository || principal !== `app:${app.installationId}`) return;
            // The installation's one shared budget: any of its repositories reads it, with the Metadata grant alone.
            const token = await issuer.token({ installationId: app.installationId, repositoryId: repository.repositoryId, permissions: { metadata: 'read' } });
            return appCredential(app.installationId, token.token);
        },
        readiness() {
            const app = config();
            const authentication = app ? { ...(tokens()?.counters ?? { exchanges: 0, failures: 0, cached: 0 }) } : { exchanges: 0, failures: 0, cached: 0 };
            return app ? { configured: true, appId: app.appId, installationId: app.installationId, botLogin: app.botLogin, repositories: Object.keys(app.repositories).length, authentication }
                : { configured: false, repositories: 0, authentication };
        },
    };
}
export const serviceAppPrincipals: AppPrincipals = appPrincipals(() => serviceIdentity.config(), () => serviceIdentity.tokens());
