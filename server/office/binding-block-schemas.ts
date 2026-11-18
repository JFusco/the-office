import { z } from 'zod';
import { TEXT, https, text } from './parse-config-block';
import { statusesSchema } from './jira-statuses-config';

/** The `jira` block as the cec project may write it: its statuses are checked, and rejected, by the cec rules. */
export const jiraSchema = z.strictObject({
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

/** The `jira` block of a Jira/Azure project other than cec: its own login, credential and workflow statuses. */
export const ownJiraSchema = jiraSchema.extend({
    twgProfile: text,
    credentialAccount: text,
    statuses: statusesSchema,
    htmlFallback: z.boolean({ error: 'must be true or false' }).optional(),
});

const deploymentSchema = z.strictObject({
    environment: text.optional(),
    subscription: text,
    resourceGroup: text,
    containerApp: text,
    container: text.optional(),
    healthPath: z.string({ error: 'must be an absolute URL path' }).regex(/^\/(?!\/)[^?#]*$/, 'must be an absolute URL path').optional(),
    healthy: z.enum(['cos', 'http-ok'], { error: 'must be "cos" or "http-ok"' }),
}, { error: 'must be an object' });

export const azureSchema = z.strictObject({
    organization: https('must be an HTTPS organization URL'),
    project: text,
    repositoryId: text,
    deployment: deploymentSchema,
}, { error: 'must be an object' });

/** The `prompt` block of a Jira/Azure project other than cec. */
export const promptSchema = z.strictObject({
    authority: text,
    preview: z.string({ error: 'must be a string' }).optional(),
}, { error: 'must be an object' });
