import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { OfficeProject } from '../src/shared';
import { GOAL_EVIDENCE_LIMITS, goalEvidencePath } from './goal-evidence';
export interface CECBinding {
    goalEvidencePaths?: string[];
    site: string;
    cloudId: string;
    board: number;
    account: string;
    repo: string;
    organization: string;
    project: string;
    repository: string;
    repositoryId: string;
    target: string;
}
export interface LocalBindings {
    cec?: CECBinding;
    projects?: OfficeProject[];
    holds?: Record<string, string>;
    legacyAutomation?: string;
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
    if (config.cec && (typeof config.cec.board !== 'number' || ['site', 'cloudId', 'account', 'repo', 'organization', 'project', 'repository', 'repositoryId', 'target'].some(key => typeof config.cec![key as keyof CECBinding] !== 'string' || !config.cec![key as keyof CECBinding])))
        throw new Error('Local Jira/Azure binding is incomplete');
    for (const value of [config.cec, ...(config.projects || [])]) {
        const paths = value?.goalEvidencePaths;
        if (paths !== undefined && (!Array.isArray(paths) || paths.length > GOAL_EVIDENCE_LIMITS.paths || paths.some(path => !goalEvidencePath(path)) || new Set(paths).size !== paths.length))
            throw new Error('Goal evidence paths must be a bounded unique Markdown allowlist');
    }
    return config;
}
