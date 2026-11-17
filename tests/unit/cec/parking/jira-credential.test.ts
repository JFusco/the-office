import { expect, test } from 'vitest';
import { jiraCredential, KEYCHAIN_SERVICE } from '../../../../server/cec/parking/jira-credential';

const keychain = (attributes: string, token: string) => { const calls: any[] = []; const execute: any = async (program: string, args: string[], options: any) => { calls.push({ program, args, options }); return args.includes('-w') ? token : attributes; }; return { execute, calls }; };

test('the Jira user and token come from the Keychain item with read-only calls', async () => {
    const k = keychain('keychain: "login.keychain-db"\n    "acct"<blob>="office@example.test"\n    "svce"<blob>="the-office-jira"\n', 'secret-token\n');
    expect(await jiraCredential(k.execute)).toEqual({ user: 'office@example.test', token: 'secret-token' });
    expect(k.calls.every(call => call.program === 'security' && call.options.readOnly === true && call.args.includes(KEYCHAIN_SERVICE))).toBe(true);
});

test('a missing item, account or token is one plain error that repeats nothing the Keychain returned', async () => {
    const failures: any[] = [keychain('"svce"<blob>="the-office-jira"\n', 'secret-token\n').execute, keychain('"acct"<blob>="office@example.test"\n', '\n').execute,
        async () => { throw new Error('security exited 44: secret-token could not be found'); }];
    for (const execute of failures) {
        const error = await jiraCredential(execute).then(() => undefined, e => e as Error);
        expect(error?.message).toBe(`Jira API token is not available in the Keychain (service ${KEYCHAIN_SERVICE})`);
    }
});
