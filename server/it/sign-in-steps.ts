import type { OwnerSteps } from '../../src/contracts/owner-steps';
import type { ServiceHealth } from '../../src/shared';

type Step = OwnerSteps['steps'][number];
/** Added to every list: a failing sign-in command is the provider's trouble, not a wrong step. */
export const SIGN_IN_SERVICE_TROUBLE = 'If the sign-in command itself fails with a network or 5xx error, the provider\'s sign-in service is having trouble: wait a few minutes and run it again.';

/** Each provider's own status and sign-in commands, in the order to run them. */
function commands(service: Pick<ServiceHealth, 'id' | 'name'>): Step[] {
    if (service.id === 'openai') return [{ text: 'Check whether Codex is signed in.', run: 'codex login status' }, { text: 'Sign in to Codex.', run: 'codex login' }];
    if (service.id === 'anthropic') return [{ text: 'Check whether Claude is signed in.', run: 'claude auth status' }, { text: 'Sign in to Claude.', run: 'claude auth login' }];
    if (service.id === 'github') return [{ text: 'Check which GitHub account is signed in.', run: 'gh auth status' }, { text: 'Sign in to GitHub.', run: 'gh auth login --scopes project' }];
    if (service.id === 'atlassian') return [{ text: 'Check the Atlassian connection.', run: 'twg doctor' }, { text: 'Sign in to Atlassian again.', run: 'twg login --force' }, { text: 'Check the connection once more to confirm.', run: 'twg doctor' }];
    if (service.id === 'azure' || service.id.startsWith('azure:')) return [{ text: 'Check which Azure account is signed in.', run: 'az account show' }, { text: 'Sign in to Azure.', run: 'az login' }];
    return [{ text: `Restore ${service.name} access for the account the Office runs as.` }];
}

/** The steps only the owner can do when the Office is signed out of a service. */
export function signInSteps(service: Pick<ServiceHealth, 'id' | 'name' | 'failure'>): OwnerSteps {
    return {
        why: `The Office is stopped because it is signed out of ${service.name}. It cannot sign in for you: the credentials are yours to enter.`,
        ...(service.failure ? { providerSaid: service.failure } : {}),
        steps: [...commands(service), { text: SIGN_IN_SERVICE_TROUBLE }],
        doneWhen: `Service health shows a fresh Connected result for ${service.name}. The Office checks about once a minute. This item closes by itself when the Office no longer reports a confirmed sign-in failure. If Service health still shows a sign-in problem after you sign in, the Office service may be using a different account or environment.`,
    };
}
