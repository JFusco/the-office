import { z } from 'zod';
import type { CECBinding } from './local-config';
import { legacyCecBindings, type ProjectBindings } from './project-bindings-config';
import { projectListScope } from '../cec/intake-scope';

const TEXT = 'must be a non-empty string';
const text = z.string({ error: TEXT }).min(1, TEXT);
const https = (reason: string) => z.string({ error: reason }).refine(value => {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash; }
    catch { return false; }
}, reason);

const jiraSchema = z.strictObject({
    site: https('must be an HTTPS site origin').refine(value => { try { return new URL(value).origin === value; } catch { return false; } }, 'must be an HTTPS site origin'),
    cloudId: text,
    account: text,
    projectKey: z.string({ error: 'must be an uppercase Jira project key' }).regex(/^[A-Z][A-Z0-9_]*$/, 'must be an uppercase Jira project key'),
    twgProfile: text.optional(),
    credentialAccount: text.optional(),
    board: z.number({ error: 'must be a positive integer when jira.intakeListUrl is absent' }).int().min(0).optional(),
    intakeListUrl: z.string({ error: TEXT }).optional(),
    statuses: z.unknown().optional(),
}, { error: 'must be an object' });

const deploymentSchema = z.strictObject({
    environment: text.optional(),
    subscription: text,
    resourceGroup: text,
    containerApp: text,
    container: text.optional(),
    healthPath: z.string({ error: 'must be an absolute URL path' }).regex(/^\/(?!\/)[^?#]*$/, 'must be an absolute URL path').optional(),
    healthy: z.enum(['cos', 'http-ok'], { error: 'must be "cos" or "http-ok"' }),
}, { error: 'must be an object' });

const azureSchema = z.strictObject({
    organization: https('must be an HTTPS organization URL'),
    project: text,
    repositoryId: text,
    deployment: deploymentSchema,
}, { error: 'must be an object' });

/** A project's explicit `jira` and `azure` blocks, validated. */
export interface BindingBlocks { jira: z.infer<typeof jiraSchema>; azure: z.infer<typeof azureSchema> }

function parsed<T>(id: string, block: string, schema: z.ZodType<T>, raw: unknown): T {
    const result = schema.safeParse(raw);
    if (result.success) return result.data;
    const issue = result.error.issues[0], path = [block, ...issue.path].join('.');
    const at = issue.path.reduce<unknown>((value, key) => value && typeof value === 'object' ? (value as Record<PropertyKey, unknown>)[key as PropertyKey] : undefined, raw);
    const missing = issue.code === 'invalid_type' && issue.path.length > 0 && at === undefined;
    throw new Error(`Project "${id}": ${issue.code === 'unrecognized_keys' ? `${path}.${issue.keys[0]} is not supported` : missing ? `${path} is required` : `${path} ${issue.message}`}`);
}

/**
 * Validate one project's explicit `jira` and `azure` blocks. Until the rules phase only the
 * cec project may carry them, they must describe the same destination as the legacy `cec`
 * block (prompts still read that block), and workflow statuses cannot be overridden.
 */
export function parseBindingBlocks(project: { id: string; provider: string; jira?: unknown; azure?: unknown }, cec: CECBinding | undefined): BindingBlocks | undefined {
    const fail = (reason: string): never => { throw new Error(`Project "${project.id}": ${reason}`); };
    const hasJira = 'jira' in project, hasAzure = 'azure' in project;
    if (!hasJira && !hasAzure) return undefined;
    if (project.provider !== 'azure') fail(`${hasJira ? 'jira' : 'azure'} is only supported for provider "azure"`);
    if (hasJira !== hasAzure) fail('jira and azure must be supplied together');
    if (project.id !== 'cec') fail('a Jira/Azure project other than cec requires the rules phase');
    const jira = parsed(project.id, 'jira', jiraSchema, project.jira), azure = parsed(project.id, 'azure', azureSchema, project.azure);
    if (jira.statuses !== undefined) fail('jira.statuses requires the rules phase');
    if (jira.projectKey !== 'CEC') fail('jira.projectKey other than "CEC" requires the rules phase');
    if (jira.intakeListUrl === undefined && !(jira.board! > 0)) fail('jira.board must be a positive integer when jira.intakeListUrl is absent');
    try { projectListScope({ site: jira.site, board: jira.board ?? 0, account: jira.account, intakeListUrl: jira.intakeListUrl }); }
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
export function explicitBindings(cec: CECBinding, blocks: BindingBlocks): ProjectBindings {
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
    });
}
