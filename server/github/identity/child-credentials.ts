/**
 * What one `gh` or `git` child of an Office write receives for its credential. Built only for a fixed GitHub adapter
 * inside a write's credential scope (`write-credential-scope.ts`); the service's environment and model workers never
 * see it. A token travels only in the child environment, never in argv.
 */
export interface ChildCredential { env: Record<string, string>; remove: string[] }
export interface WriteCredential {
    principal: 'operator' | 'app';
    /** The call ledger's principal label: `operator`, or `app:<installation id>`. */
    label: string;
    gh: ChildCredential;
    git: ChildCredential;
}

/** Ambient credentials that would otherwise choose the identity of a `gh` child or of git's gh credential helper. */
export const AMBIENT_TOKENS = ['GH_TOKEN', 'GITHUB_TOKEN', 'GH_ENTERPRISE_TOKEN', 'GITHUB_ENTERPRISE_TOKEN'];
/** Debug and tracing switches that can print request headers or credential-helper exchanges. */
export const CREDENTIAL_TRACING = ['GH_DEBUG', 'DEBUG', 'GIT_TRACE', 'GIT_TRACE_CURL', 'GIT_CURL_VERBOSE', 'GIT_TRACE_PACKET', 'GIT_TRACE_SETUP',
    'GIT_TRACE_PERFORMANCE', 'GIT_TRACE_REFS', 'GIT_TRACE2', 'GIT_TRACE2_PERF', 'GIT_TRACE2_EVENT', 'GIT_TRACE2_ENV_VARS', 'GIT_TRACE2_CONFIG_PARAMS'];
/** Prompts and alternative helpers a push must never fall back to. */
export const PROMPTS = ['GIT_ASKPASS', 'SSH_ASKPASS', 'GIT_CONFIG_PARAMETERS', 'GCM_INTERACTIVE'];

// The first entry resets every configured helper before choosing the stored gh helper.
const GIT_HELPER = {
    GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_COUNT: '2', GIT_CONFIG_KEY_0: 'credential.helper', GIT_CONFIG_VALUE_0: '',
    GIT_CONFIG_KEY_1: 'credential.helper', GIT_CONFIG_VALUE_1: '!gh auth git-credential',
};

/** The selected scoped App credential: `GH_TOKEN` for `gh`, and git's credential helper reset to `gh auth git-credential`. */
export function appCredential(installationId: number, token: string): WriteCredential {
    if (!token) throw new Error('A nonempty scoped App token is required');
    return {
        principal: 'app', label: `app:${installationId}`,
        gh: { env: { GH_TOKEN: token, GH_PROMPT_DISABLED: '1' }, remove: [...AMBIENT_TOKENS, ...CREDENTIAL_TRACING] },
        git: {
            env: { ...GIT_HELPER, GH_TOKEN: token, GH_PROMPT_DISABLED: '1', GIT_TRACE_REDACT: '1' },
            remove: [...AMBIENT_TOKENS, ...CREDENTIAL_TRACING, ...PROMPTS, 'NODE_OPTIONS', 'ENV', 'BASH_ENV'],
        },
    };
}

/** A rollback write through the operator's stored gh login: every ambient token is removed, from gh and from git's helper. */
export function operatorRollbackCredential(): WriteCredential {
    return {
        principal: 'operator', label: 'operator',
        gh: { env: { GH_HOST: 'github.com', GH_PROMPT_DISABLED: '1' }, remove: [...AMBIENT_TOKENS, ...CREDENTIAL_TRACING] },
        git: { env: { ...GIT_HELPER, GH_HOST: 'github.com', GH_PROMPT_DISABLED: '1', GIT_TRACE_REDACT: '1' }, remove: [...AMBIENT_TOKENS, ...CREDENTIAL_TRACING, ...PROMPTS] },
    };
}
