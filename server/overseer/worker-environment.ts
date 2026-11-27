import { checkRunDirectories, type DirectoryFacts, type RunDirectories } from './run-directories';
import type { ValidatedRunnerPaths } from './runner-root';

/**
 * A model worker's complete environment, built from fixed constants and its run's own folders. It
 * reads nothing from the runner's environment, so no GitHub, Jira, Azure, Slack, SSH-agent, cloud or
 * Office credential or configuration can reach a worker through it. Pass it as `replaceEnv`
 * (`server/workers/spawn-command.ts`).
 */

export type WorkerProvider = 'claude' | 'codex';
export const WORKER_PATH = '/usr/bin:/bin:/usr/sbin:/sbin';
/** Present on macOS (`locale -a`); `C.UTF-8` is not. */
export const WORKER_LOCALE = 'en_US.UTF-8';
/** The one variable that relocates each provider CLI's own state: its sessions, transcripts and settings. */
export const PROVIDER_DIRECTORY = { claude: 'CLAUDE_CONFIG_DIR', codex: 'CODEX_HOME' } as const satisfies Record<WorkerProvider, string>;
/**
 * Names that carry a provider sign-in. Only the wrapper adds `CLAUDE_CODE_OAUTH_TOKEN`, to one
 * Claude reader call (`worker-sandbox-run.ts#runSandboxed`); no setting or prepared environment does.
 */
export const SIGN_IN_NAMES = ['CLAUDE_CODE_OAUTH_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'OPENAI_API_KEY', 'CODEX_API_KEY'] as const;
/**
 * Names the environment or the sandbox wrapper sets itself; no provider setting may use one. The
 * wrapper (`worker-sandbox-run.ts`) sets `CLAUDE_CODE_TMPDIR` to the run's `tmp`, where the sandbox
 * runtime would otherwise use a shared folder.
 */
export const RESERVED_NAMES = ['PATH', 'LANG', 'LC_ALL', 'HOME', 'TMPDIR', 'OFFICE_DATA_ROOT', 'OFFICE_NO_POLL', 'CLAUDE_CODE_TMPDIR', ...Object.values(PROVIDER_DIRECTORY), ...SIGN_IN_NAMES] as const;
/**
 * Non-secret provider configuration a worker may be given, per provider. Empty until a provider's
 * qualification establishes what it needs; every addition is reviewed there.
 */
export const PROVIDER_SETTINGS: Readonly<Record<WorkerProvider, readonly string[]>> = { claude: [], codex: [] };

export interface WorkerEnvironmentInput {
    /** The runner paths as `validateRunnerRoot` returned them. */
    paths: ValidatedRunnerPaths;
    provider: WorkerProvider;
    /** As `createRunDirectories` returned it, for those paths. */
    run: RunDirectories;
    settings?: Readonly<Record<string, string>>;
    facts?: DirectoryFacts;
}

export function workerEnvironment({ paths, provider, run, settings = {}, facts }: WorkerEnvironmentInput): Record<string, string> {
    if (!Object.hasOwn(PROVIDER_DIRECTORY, provider)) throw new Error(`Unknown worker provider ${JSON.stringify(String(provider).slice(0, 40))}`);
    checkRunDirectories(paths, run, facts);
    const allowed = PROVIDER_SETTINGS[provider], accepted: Record<string, string> = {};
    for (const [name, value] of Object.entries(settings)) {
        if (!allowed.includes(name)) throw new Error(`${JSON.stringify(name.slice(0, 80))} is not a setting a ${provider} worker may be given`);
        accepted[name] = value;
    }
    return {
        PATH: WORKER_PATH, LANG: WORKER_LOCALE, LC_ALL: WORKER_LOCALE,
        HOME: run.home, TMPDIR: run.tmp, [PROVIDER_DIRECTORY[provider]]: run.provider,
        OFFICE_DATA_ROOT: run.officeData, OFFICE_NO_POLL: '1',
        ...accepted,
    };
}
