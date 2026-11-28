import type { MaintenanceProvider } from './launch-qualification';

/**
 * A maintenance launch as a template: the exact ordered arguments and effective settings, with the per-assignment
 * values (`{session}`, `{schema}`, `{schemaPath}`, `{cwd}`, `{scratch}`, `{gitDir}`, `{gitCommonDir}`, `{branchRef}`,
 * `{model}`, `{effort}`) left as placeholders. A qualification record stores the same template; a launch is admitted
 * only when both, with the harness-bound values written in, are identical.
 */
export interface LaunchTemplate {
    provider: MaintenanceProvider;
    policy: string;
    arguments: string[];
    settings: unknown;
    tools: string[];
    filesystem: { readable: string[]; writable: string[]; denied: string[] };
    network: { allowed: string[] };
}
