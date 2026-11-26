import type { CommandOptions } from '../../workers/spawn-command';
import type { KeychainKeySource } from './app-config';

/** Where the App's private signing key comes from. Read lazily, only when an App token is actually needed. */
export interface AppKeySource { read(): Promise<string> }
type Execute = (program: string, args: string[], options?: CommandOptions) => Promise<string>;

const PEM = /^-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]+-----END [A-Z ]*PRIVATE KEY-----\s*$/;

/**
 * The approved-handoff candidate: one generic-password item selected exactly by service and account, as
 * `server/cec/parking/jira-credential.ts` reads the Jira token. Nothing is cached here or logged; the reader's stdout
 * never reaches an output hook, and a failure names only a timeout, the tool's exit code or a malformed item.
 * Used only when `githubApp.keySource` selects it.
 */
export function keychainKeySource(execute: Execute, selector: KeychainKeySource): AppKeySource {
    return {
        async read() {
            let text = '', cause = '';
            try { text = (await execute('security', ['find-generic-password', '-s', selector.service, '-a', selector.account, '-w'], { readOnly: true, timeout: 10000 })).trim(); }
            catch (error) { cause = readFailure(error); }
            // The Keychain prints a secret with line breaks as hex.
            if (text && !text.startsWith('-----') && /^(?:[0-9a-f]{2})+$/i.test(text)) text = Buffer.from(text, 'hex').toString('utf8').trim();
            if (!PEM.test(text)) throw new Error(`The App signing key is not available in the Keychain (service ${selector.service})${cause || ': the item is not a private key'}`);
            return text;
        },
    };
}

function readFailure(error: unknown): string {
    if ((error as { category?: string } | undefined)?.category === 'transient-read') return ': the read timed out';
    const code = String((error as Error | undefined)?.message || '').match(/^security exited (\d+)\b/)?.[1];
    return code ? `: security exited ${code}` : ': the read failed';
}
