import { expect, test } from 'vitest';
import { SIGN_IN_SERVICE_TROUBLE, signInSteps } from '../../../server/it/sign-in-steps';

const runs = (id: string, name = 'Service') => signInSteps({ id, name }).steps.flatMap(step => step.run ? [step.run] : []);

test('each known service lists its own status and sign-in commands in order', () => {
    expect(runs('openai')).toEqual(['codex login status', 'codex login']);
    expect(runs('anthropic')).toEqual(['claude auth status', 'claude auth login']);
    expect(runs('github', 'GitHub')).toEqual(['gh auth status', 'gh auth login --scopes project']);
    expect(runs('atlassian')).toEqual(['twg doctor', 'twg login --force', 'twg doctor']);
    expect(runs('azure')).toEqual(['az account show', 'az login']);
    expect(runs('azure:second')).toEqual(['az account show', 'az login']);
});

test('an unknown service gets one plain step and no command', () => {
    const { steps } = signInSteps({ id: 'elsewhere', name: 'Elsewhere' });
    expect(steps.map(step => step.run)).toEqual([undefined, undefined]);
    expect(steps[0].text).toBe('Restore Elsewhere access for the account the Office runs as.');
});

test('every list ends with what to do when the sign-in service itself is failing', () => {
    for (const id of ['openai', 'anthropic', 'github', 'atlassian', 'azure', 'azure:second', 'elsewhere'])
        expect(signInSteps({ id, name: 'Service' }).steps.at(-1)).toEqual({ text: SIGN_IN_SERVICE_TROUBLE });
    expect(SIGN_IN_SERVICE_TROUBLE).toContain('network or 5xx error');
});

test('the reason names the service and quotes the provider\'s error only when one was recorded', () => {
    const name = 'Atlassian · Jira & Confluence';
    const quoted = signInSteps({ id: 'atlassian', name, failure: 'Error: twg exited 77: Your OAuth session has expired.' });
    expect(quoted.why).toContain(`signed out of ${name}`);
    expect(quoted.why).toContain('It cannot sign in for you: the credentials are yours to enter.');
    // The provider's words are kept apart from the Office's own, so each can be compared and shown on its own.
    expect(quoted.providerSaid).toBe('Error: twg exited 77: Your OAuth session has expired.');
    expect(quoted.why).not.toContain('OAuth session');
    const plain = signInSteps({ id: 'atlassian', name });
    expect(plain.why).toContain(`signed out of ${name}`);
    expect(plain.why).toBe(quoted.why);
    expect('providerSaid' in plain).toBe(false);
});

test('it names the result that confirms sign-in and explains when the item closes', () => {
    const { doneWhen } = signInSteps({ id: 'github', name: 'GitHub' });
    expect(doneWhen).toContain('Service health shows a fresh Connected result for GitHub.');
    expect(doneWhen).toContain('about once a minute');
    expect(doneWhen).toContain('closes by itself when the Office no longer reports a confirmed sign-in failure');
    expect(doneWhen).toContain('different account or environment');
});
