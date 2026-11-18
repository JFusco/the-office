import type { z } from 'zod';
import type { CECBinding } from './local-config';
import { legacyCecBindings, type ProjectBindings } from './project-bindings-config';
import { projectListScope } from '../cec/intake-scope';
import { azureSchema, jiraSchema } from './binding-block-schemas';
import { parseOwnBindingBlocks, type OwnBindingBlocks } from './own-binding-blocks';
import { parsed } from './parse-config-block';

/** The cec project's explicit `jira` and `azure` blocks, validated against the legacy `cec` block. */
export interface CecBindingBlocks { jira: z.infer<typeof jiraSchema>; azure: z.infer<typeof azureSchema> }
/** A project's validated explicit blocks: the cec project's, or another Jira/Azure project's own (with `prompt`). */
export type BindingBlocks = CecBindingBlocks | OwnBindingBlocks;

/**
 * Validate one project's explicit `jira`, `azure` and `prompt` blocks. Only Azure projects carry them.
 * A Jira/Azure project other than cec must carry all three and is configured from them alone. The cec
 * project keeps its legacy rules: its blocks must describe the same destination as the legacy `cec`
 * block, and its workflow statuses and prompt text cannot be overridden yet.
 */
export function parseBindingBlocks(project: { id: string; provider: string; jira?: unknown; azure?: unknown; prompt?: unknown }, cec: CECBinding | undefined): BindingBlocks | undefined {
    const fail = (reason: string): never => { throw new Error(`Project "${project.id}": ${reason}`); };
    const hasJira = 'jira' in project, hasAzure = 'azure' in project, hasPrompt = 'prompt' in project;
    if (project.provider === 'azure' && project.id !== 'cec') return parseOwnBindingBlocks(project);
    if (!hasJira && !hasAzure && !hasPrompt) return undefined;
    if (project.provider !== 'azure') fail(`${hasJira ? 'jira' : hasAzure ? 'azure' : 'prompt'} is only supported for provider "azure"`);
    if (hasPrompt) fail('prompt requires the rules phase');
    if (hasJira !== hasAzure) fail('jira and azure must be supplied together');
    const jira = parsed(project.id, 'jira', jiraSchema, project.jira), azure = parsed(project.id, 'azure', azureSchema, project.azure);
    if (jira.statuses !== undefined) fail('jira.statuses requires the rules phase');
    if (jira.projectKey !== 'CEC') fail('jira.projectKey other than "CEC" requires the rules phase');
    if (jira.intakeListUrl === undefined && !(jira.board! > 0)) fail('jira.board must be a positive integer when jira.intakeListUrl is absent');
    try { projectListScope({ site: jira.site, board: jira.board ?? 0, account: jira.account, intakeListUrl: jira.intakeListUrl, projectKey: 'CEC' }); }
    catch { fail('jira.intakeListUrl must be the configured site\'s project list for the configured assignee'); }
    if (!cec) fail('jira and azure require the legacy cec block until the rules phase');
    const legacy: [string, unknown, unknown][] = [
        ['jira.site', jira.site, cec!.site], ['jira.cloudId', jira.cloudId, cec!.cloudId], ['jira.account', jira.account, cec!.account],
        ['jira.board', jira.board ?? cec!.board, cec!.board], ['jira.intakeListUrl', jira.intakeListUrl, cec!.intakeListUrl],
        ['azure.organization', azure.organization, cec!.organization], ['azure.project', azure.project, cec!.project], ['azure.repositoryId', azure.repositoryId, cec!.repositoryId],
    ];
    for (const [path, value, before] of legacy)
        if (value !== before) fail(`${path} conflicts with legacy cec.${path.split('.')[1]}`);
    return { jira, azure };
}

/** The resolved bindings for explicit blocks: the legacy workflow values with the configured connection, profile, credential and deployment. */
export function explicitBindings(cec: CECBinding, blocks: CecBindingBlocks): ProjectBindings {
    const legacy = legacyCecBindings(cec), { jira, azure } = blocks, deployment = azure.deployment;
    return Object.freeze({
        jira: Object.freeze({
            ...legacy.jira,
            ...(jira.twgProfile === undefined ? {} : { twgProfile: jira.twgProfile }),
            ...(jira.credentialAccount === undefined ? {} : { credentialAccount: jira.credentialAccount }),
        }),
        azure: Object.freeze({
            ...legacy.azure,
            deployment: Object.freeze({
                environment: deployment.environment ?? 'staging', subscription: deployment.subscription, resourceGroup: deployment.resourceGroup,
                containerApp: deployment.containerApp, container: deployment.container ?? deployment.containerApp,
                healthPath: deployment.healthPath ?? '/api/health', healthy: deployment.healthy,
            }),
        }),
        prompt: legacy.prompt,
    });
}
