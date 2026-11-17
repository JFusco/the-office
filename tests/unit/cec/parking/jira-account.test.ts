import { expect, test } from 'vitest';
import { jiraAccount } from '../../../../server/cec/parking/jira-account';
import { CEC } from '../../../../server/office/config';
import { projectById } from '../../../../server/office/projects';
import { jiraBinding } from '../../../../server/office/project-bindings';

const binding = jiraBinding(projectById('cec'));

const credential = { user: 'office@example.test', token: 'secret-token' };

test('the account behind the token is read from Jira with a read-only request that keeps the token out of the arguments', async () => {
    const calls: any[] = [];
    const execute: any = async (program: string, args: string[], options: any) => { calls.push({ program, args, options }); return JSON.stringify({ accountId: 'office-account-id', emailAddress: 'office@example.test' }); };
    expect(await jiraAccount(execute, binding, credential)).toBe('office-account-id');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ program: 'curl', options: { readOnly: true } });
    expect(calls[0].args.join(' ')).not.toContain('secret-token');
    expect(calls[0].args).not.toContain('--output');
    expect(calls[0].options.input).toContain(`url = "${CEC.site}/rest/api/3/myself"`);
    expect(calls[0].options.input).toContain('request = "GET"');
    expect(calls[0].options.input).not.toContain('data-raw');
});

test('a token Jira refuses, or an answer without an account, is one plain error that repeats nothing', async () => {
    for (const execute of [async () => { throw new Error('curl exited 22: 401 secret-token'); }, async () => '{}', async () => 'not json'] as any[]) {
        const error = await jiraAccount(execute, binding, credential).then(() => undefined, e => e as Error);
        expect(error?.message).toBe('Jira did not accept the Office API token');
    }
});
