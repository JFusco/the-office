import { expect, test } from 'vitest';
import { jiraCredential, KEYCHAIN_SERVICE } from '../../../../server/cec/parking/jira-credential';

const keychain = (attributes: string, token: string) => { const calls: any[] = []; const execute: any = async (program: string, args: string[], options: any) => { calls.push({ program, args, options }); return args.includes('-w') ? token : attributes; }; return { execute, calls }; };

test('the Jira user and token come from the Keychain item with read-only calls', async () => {
    const k = keychain('keychain: "login.keychain-db"\n    "acct"<blob>="office@example.test"\n    "svce"<blob>="the-office-jira"\n', 'secret-token\n');
    expect(await jiraCredential(k.execute)).toEqual({ user: 'office@example.test', token: 'secret-token' });
    expect(k.calls.every(call => call.program === 'security' && call.options.readOnly === true && call.args.includes(KEYCHAIN_SERVICE))).toBe(true);
});

test('a missing item, account or token is one plain error that repeats nothing the Keychain returned', async () => {
    const unavailable = `Jira API token is not available in the Keychain (service ${KEYCHAIN_SERVICE})`;
    const timedOut = Object.assign(new Error('security read timed out; secret-token'), { category: 'transient-read' });
    const failures: [any, string][] = [
        [keychain('"svce"<blob>="the-office-jira"\n', 'secret-token\n').execute, 'the item has no account'],
        [keychain('"acct"<blob>="office@example.test"\n', '\n').execute, 'the item has no token'],
        [async () => { throw new Error('security exited 44: secret-token could not be found'); }, 'security exited 44'],
        [async () => { throw timedOut; }, 'the read timed out'],
        [async () => { throw new Error('spawn security ENOENT secret-token'); }, 'the read failed'],
    ];
    for (const [execute, cause] of failures) {
        const error = await jiraCredential(execute).then(() => undefined, e => e as Error);
        expect(error?.message).toBe(`${unavailable}: ${cause}`);
    }
});

test('a configured account selects that Keychain entry for both reads; without one the lookup is unchanged', async () => {
    const k = keychain('"acct"<blob>="second@example.test"\n', 'second-token\n');
    expect(await jiraCredential(k.execute, 'second@example.test')).toEqual({ user: 'second@example.test', token: 'second-token' });
    expect(k.calls.map(call => call.args)).toEqual([
        ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-a', 'second@example.test'],
        ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-a', 'second@example.test', '-w'],
    ]);
    const legacy = keychain('"acct"<blob>="office@example.test"\n', 'secret-token\n');
    await jiraCredential(legacy.execute);
    expect(legacy.calls.map(call => call.args)).toEqual([['find-generic-password', '-s', KEYCHAIN_SERVICE], ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-w']]);
});
