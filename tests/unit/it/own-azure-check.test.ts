import { expect, test } from 'vitest';
import { ownAzureCheck } from '../../../server/it/own-azure-check';

const cec = { id: 'cec', provider: 'azure' as const }, acme = { id: 'acme', provider: 'azure' as const }, brain = { id: 'brain', provider: 'github' as const };

test('each Jira/Azure project follows only its own Azure DevOps check', () => {
    expect(ownAzureCheck(cec, 'azure')).toBe(true);
    expect(ownAzureCheck(cec, 'azure:acme')).toBe(false);
    expect(ownAzureCheck(acme, 'azure:acme')).toBe(true);
    expect(ownAzureCheck(acme, 'azure')).toBe(false);
    expect(ownAzureCheck(acme, 'azure:other')).toBe(false);
});

test('GitHub projects keep the shared list they had, and other services are unaffected', () => {
    expect(ownAzureCheck(brain, 'azure')).toBe(true);
    expect(ownAzureCheck(brain, 'azure:acme')).toBe(false);
    for (const project of [cec, acme, brain]) for (const id of ['openai', 'github', 'atlassian', 'slack', 'listener:cec']) expect(ownAzureCheck(project, id)).toBe(true);
});
