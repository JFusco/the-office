import type { Execute } from './jira-transport';

export const KEYCHAIN_SERVICE = 'the-office-jira';
export interface JiraCredential { user: string; token: string }

/**
 * The Jira user and API token for the one REST write, read from the login Keychain when it is needed.
 * Nothing is cached or stored, and a failure never repeats what the Keychain returned.
 */
export async function jiraCredential(execute: Execute, account?: string): Promise<JiraCredential> {
    let user = '', token = '';
    // With an account the entry is selected exactly; without one, only a single-account Keychain is unambiguous.
    const item = ['find-generic-password', '-s', KEYCHAIN_SERVICE, ...(account ? ['-a', account] : [])];
    try {
        user = (await execute('security', item, { readOnly: true, timeout: 10000 })).match(/"acct"<blob>="([^"]+)"/)?.[1] || '';
        token = (await execute('security', [...item, '-w'], { readOnly: true, timeout: 10000 })).trim();
    }
    catch { /* The reason is the same for the reader: the item cannot be used. */ }
    if (!user || !token)
        throw new Error(`Jira API token is not available in the Keychain (service ${KEYCHAIN_SERVICE})`);
    return { user, token };
}
