import type { JiraBinding } from '../../office/project-bindings-config';
import { unpack } from '../jira-response';
import type { command } from '../../workers/process';

export type Execute = typeof command;

/** One TWG Jira work-item call on the configured site. */
export async function jira(execute: Execute, binding: JiraBinding, args: string[], readOnly: boolean) {
    return (await jiraResponse(execute, binding, args, readOnly)).data;
}

/** Keep native pagination beside data instead of dropping it while unwrapping. */
export async function jiraResponse(execute: Execute, binding: JiraBinding, args: string[], readOnly: boolean) {
    const raw = await execute('twg', ['jira', 'workitem', ...args, '--site', binding.site, '-o', 'json', '--output-summary', 'none'], { readOnly, timeout: 60000 });
    unpack(raw);
    return JSON.parse(raw);
}

