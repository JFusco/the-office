import type { z } from 'zod';
import { projectListScope } from '../cec/intake-scope';
import { azureSchema, ownJiraSchema, promptSchema } from './binding-block-schemas';
import { resolvedStatuses } from './jira-statuses-config';
import { parsed } from './parse-config-block';
import type { JiraBinding } from './project-bindings-config';

/** The validated `jira`, `azure` and `prompt` blocks of a Jira/Azure project other than cec, statuses resolved. */
export interface OwnBindingBlocks {
    jira: Omit<z.infer<typeof ownJiraSchema>, 'statuses'> & { statuses: JiraBinding['statuses'] };
    azure: z.infer<typeof azureSchema>;
    prompt: z.infer<typeof promptSchema>;
}

const BLOCKS = ['jira', 'azure', 'prompt'] as const;

/**
 * Validate the blocks of a Jira/Azure project other than cec. It is configured entirely from its own
 * entry: all three blocks are required and nothing is read from, or compared with, the legacy `cec` block.
 */
export function parseOwnBindingBlocks(project: { id: string; jira?: unknown; azure?: unknown; prompt?: unknown }): OwnBindingBlocks {
    const fail = (reason: string): never => { throw new Error(`Project "${project.id}": ${reason}`); };
    const missing = BLOCKS.filter(block => !(block in project));
    if (missing.length) fail(`${missing.length > 1 ? `${missing.slice(0, -1).join(', ')} and ${missing.at(-1)} are` : `${missing[0]} is`} required for a Jira/Azure project`);
    const jira = parsed(project.id, 'jira', ownJiraSchema, project.jira), azure = parsed(project.id, 'azure', azureSchema, project.azure);
    const prompt = parsed(project.id, 'prompt', promptSchema, project.prompt);
    if (jira.projectKey === 'GH') fail('jira.projectKey "GH" is reserved for GitHub issues');
    if (jira.intakeListUrl === undefined && !(jira.board! > 0)) fail('jira.board must be a positive integer when jira.intakeListUrl is absent');
    try { projectListScope({ site: jira.site, board: jira.board ?? 0, account: jira.account, intakeListUrl: jira.intakeListUrl, projectKey: jira.projectKey }); }
    catch { fail('jira.intakeListUrl must be the configured site\'s project list for the configured assignee'); }
    return { jira: { ...jira, statuses: resolvedStatuses(jira.statuses, fail) }, azure, prompt };
}
