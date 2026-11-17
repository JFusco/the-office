import { jira, type Execute } from './jira-issue';
import type { JiraBinding } from '../../office/project-bindings-config';

/** The id of the one transition that moves this issue to the project's Blocked status now, read from Jira; never assumed. */
export async function resolveBlockedTransition(execute: Execute, binding: JiraBinding, key: string): Promise<string> {
    const blocked = binding.statuses.blocked, data = await jira(execute, binding, ['transition', '--id', key], true);
    const matches = (Array.isArray(data?.transitions) ? data.transitions : []).filter((t: any) => (t.toName || t.to?.name) === blocked);
    if (matches.length !== 1 || !matches[0].id)
        throw new Error(`Jira offers ${matches.length} transitions to ${blocked} for ${key}`);
    // The comment is the one input the Office sends with the move.
    if ((matches[0].fields || []).some((field: any) => field.required && field.fieldId !== 'comment'))
        throw new Error(`The ${blocked} transition for ${key} requires fields the Office does not supply`);
    return String(matches[0].id);
}
