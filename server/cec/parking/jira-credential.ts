import type { Execute } from './jira-transport';

export const KEYCHAIN_SERVICE = 'the-office-jira';
export interface JiraCredential { user: string; token: string }

/**
 * The Jira user and API token for the one REST write, read from the login Keychain when it is needed.
 * Nothing is cached or stored, and a failure never repeats what the Keychain returned:
 * it names only a timeout, the tool's exit code, or which part of the item is missing.
 */
export async function jiraCredential(execute: Execute, account?: string): Promise<JiraCredential> {
    let user = '', token = '', cause = '';
    // With an account the entry is selected exactly; without one, only a single-account Keychain is unambiguous.
    const item = ['find-generic-password', '-s', KEYCHAIN_SERVICE, ...(account ? ['-a', account] : [])];
    try {
        user = (await execute('security', item, { readOnly: true, timeout: 10000 })).match(/"acct"<blob>="([^"]+)"/)?.[1] || '';
        token = (await execute('security', [...item, '-w'], { readOnly: true, timeout: 10000 })).trim();
    }
    catch (error) { cause = readFailure(error); }
    if (!user || !token)
        throw new Error(`Jira API token is not available in the Keychain (service ${KEYCHAIN_SERVICE})${cause || (user ? ': the item has no token' : ': the item has no account')}`);
    return { user, token };
}

/** Why a read failed, in words that cannot carry the tool's output. */
function readFailure(error: unknown): string {
    if ((error as { category?: string } | undefined)?.category === 'transient-read')
        return ': the read timed out';
    const code = String((error as Error | undefined)?.message || '').match(/^security exited (\d+)\b/)?.[1];
    return code ? `: security exited ${code}` : ': the read failed';
}
