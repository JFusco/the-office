import { jiraRest } from './jira-rest';
import type { Execute } from './jira-transport';
import type { JiraCredential } from './jira-credential';
import type { JiraBinding } from '../../office/project-bindings-config';

/** The Jira account a credential acts as, read from Jira. A token Jira no longer accepts fails here, before any write. */
export async function jiraAccount(execute: Execute, binding: JiraBinding, credential: JiraCredential): Promise<string> {
    let account = '';
    try { account = String(JSON.parse(await jiraRest(execute, binding, credential, { method: 'GET', path: 'myself' })).accountId || ''); }
    catch { /* Reported below without repeating the response. */ }
    if (!account)
        throw new Error('Jira did not accept the Office API token');
    return account;
}
