import { AUTO_ADOPT_BOTS } from '../delivery/intake/dependency-bots/auto-adopt';
import { projectListScope } from '../cec/intake-scope';
import { assertFeaturePlanningConfig, type FeaturePlanningBindings } from '../features/progression/policy';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { OfficeProject } from '../../src/shared';
import { GOAL_EVIDENCE_LIMITS, goalEvidencePath } from '../leadership/goal-evidence';
import { assertModelOverrides, type ModelOverrides } from '../telemetry/model-routes';
import { parseProjectPolicy, type ProjectPolicyInput } from './project-policy-config';
import { parseBindingBlocks, type BindingBlocks } from './project-binding-blocks';
import { assertUniqueProjectKeys } from './jira-project-keys';
import { parseGitHubApp, type GitHubAppConfig } from '../github/identity/app-config';
/** A project entry as written in office-config.json. `policy`, `jira`, `azure` and `prompt` configure start-up and never reach the saved project. */
export type ProjectInput = OfficeProject & { policy?: ProjectPolicyInput; jira?: unknown; azure?: unknown; prompt?: unknown; bindingBlocks?: BindingBlocks };
export interface CECBinding {
    goalEvidencePaths?: string[];
    site: string;
    cloudId: string;
    board: number;
    /** Explicit replacement for a removed Jira board; no automatic fallback. */
    intakeListUrl?: string;
    account: string;
    repo: string;
    organization: string;
    project: string;
    repository: string;
    repositoryId: string;
    target: string;
}
export interface LocalBindings {
    featurePlanning?: FeaturePlanningBindings;
    cec?: CECBinding;
    projects?: ProjectInput[];
    holds?: Record<string, string>;
    legacyAutomation?: string;
    /** Cross-project delivery stages that may run at once (1..3); absent means 1. */
    delivery?: { concurrency?: number };
    /** Per-role Codex model and effort pins; absent roles use the built-in routes. */
    models?: ModelOverrides;
    /** The Office GitHub App's public identifiers and write routes; absent means every route selects the operator. */
    githubApp?: GitHubAppConfig;
}
export function localBindings(dataRoot: string): LocalBindings {
    if (process.env.VITEST || process.env.NODE_ENV === 'test')
        return {};
    const path = resolve(dataRoot, 'office-config.json');
    if (!existsSync(path))
        return {};
    const config: LocalBindings = JSON.parse(readFileSync(path, 'utf8'));
    if (config.projects && (!Array.isArray(config.projects) || config.projects.some(project => !project.id || !project.name || !['github', 'azure'].includes(project.provider) || !project.repo || !project.repository || !project.target) || new Set(config.projects.map(project => project.id)).size !== config.projects.length))
        throw new Error('Local project bindings are incomplete or duplicated');
    for (const project of config.projects || [])
        if ('policy' in project) project.policy = parseProjectPolicy(project, project.policy);
    if (config.cec && (typeof config.cec.board !== 'number' || ['site', 'cloudId', 'account', 'repo', 'organization', 'project', 'repository', 'repositoryId', 'target'].some(key => typeof config.cec![key as keyof CECBinding] !== 'string' || !config.cec![key as keyof CECBinding])))
        throw new Error('Local Jira/Azure binding is incomplete');
    if (config.cec) projectListScope({ ...config.cec, projectKey: 'CEC' });
    // The cec project and the legacy block name one destination; code reads it from the project.
    for (const project of config.projects || [])
        if (config.cec && project.id === 'cec' && project.provider === 'azure')
            for (const field of ['repo', 'repository', 'target'] as const)
                if (project[field] !== config.cec[field]) throw new Error(`Project "cec": ${field} conflicts with legacy cec.${field}`);
    for (const project of config.projects || [])
        if (project.checks !== undefined && (!Array.isArray(project.checks) || !project.checks.length || project.checks.length > 8 || project.checks.some(check => !check || typeof check.name !== 'string' || !/^[\w:.-]{1,60}$/.test(check.name) || !Array.isArray(check.command) || !check.command.length || check.command.some(part => typeof part !== 'string' || !part) || check.timeoutMs !== undefined && (!Number.isInteger(check.timeoutMs) || check.timeoutMs < 1000 || check.timeoutMs > 60 * 60000))))
            throw new Error('Project checks must be named argv commands with an optional timeout');
    for (const project of config.projects || [])
        if (project.autoAdopt !== undefined && (project.provider !== 'github' || !Array.isArray(project.autoAdopt) || project.autoAdopt.some(bot => !(AUTO_ADOPT_BOTS as readonly string[]).includes(bot)) || new Set(project.autoAdopt).size !== project.autoAdopt.length))
            throw new Error('Project autoAdopt must list unique supported dependency bots on a GitHub project');
    // Always assigned, so a raw `bindingBlocks` key in the file can never bypass validation.
    // A block this build cannot honor stops start-up; it is never ignored or saved.
    for (const project of config.projects || [])
        project.bindingBlocks = parseBindingBlocks(project, config.cec);
    assertUniqueProjectKeys(config.projects || []);
    assertModelOverrides(config.models);
    assertFeaturePlanningConfig(config.featurePlanning);
    if (config.githubApp !== undefined) config.githubApp = parseGitHubApp(config.githubApp, config.projects);
    const concurrency = config.delivery?.concurrency;
    if (config.delivery !== undefined && (typeof config.delivery !== 'object' || config.delivery === null || concurrency !== undefined && (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 3)))
        throw new Error('Delivery concurrency must be an integer from 1 to 3');
    for (const value of [config.cec, ...(config.projects || [])]) {
        const paths = value?.goalEvidencePaths;
        if (paths !== undefined && (!Array.isArray(paths) || paths.length > GOAL_EVIDENCE_LIMITS.paths || paths.some(path => !goalEvidencePath(path)) || new Set(paths).size !== paths.length))
            throw new Error('Goal evidence paths must be a bounded unique Markdown allowlist');
    }
    return config;
}
