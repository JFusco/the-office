import { BLOCKED, jira, type Execute } from './jira-issue';

/** The id of the one transition that moves this issue to Blocked now, read from Jira; never assumed. */
export async function resolveBlockedTransition(execute: Execute, key: string): Promise<string> {
    const data = await jira(execute, ['transition', '--id', key], true);
    const matches = (Array.isArray(data?.transitions) ? data.transitions : []).filter((t: any) => (t.toName || t.to?.name) === BLOCKED);
    if (matches.length !== 1 || !matches[0].id)
        throw new Error(`Jira offers ${matches.length} transitions to ${BLOCKED} for ${key}`);
    // The comment is the one input the Office sends with the move.
    if ((matches[0].fields || []).some((field: any) => field.required && field.fieldId !== 'comment'))
        throw new Error(`The ${BLOCKED} transition for ${key} requires fields the Office does not supply`);
    return String(matches[0].id);
}
