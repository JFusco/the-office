import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { githubFollowupPrompt } from '../../../server/github/github-context';
import { cecChatPrompt } from '../../../server/conversations/prompts/conversations';
import { PERSONAS, type TeamMessage } from '../../../src/shared';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const store = () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-chat-names-')), s = new Store(':memory:', projectById('brain'), root);
    cleanup.push(() => { s.close(); rmSync(root, { recursive: true, force: true }); });
    return s;
};
const message = { id: 'm', requestId: 'm', from: 'human', to: 'pm', ticket: '', actionId: '', body: 'Status?', status: 'working', createdAt: '', sessionId: '', recheck: false, error: '', recipients: [], receipts: [] } as TeamMessage;

test('GitHub chat names the responder and the team from the registry, keeping the role id', () => {
    const prompt = githubFollowupPrompt(store(), 'lead', message, '');
    expect(prompt.split('\n')[0]).toBe('Respond to Joe as Sam (lead), for Brain. Morgan is PM, Avery is CTO, Alex develops, Sam independently reviews, Riley verifies. Answer directly in plain language. CTO direction goes through Morgan with notifyRoles=["pm"]. PM may inform relevant roles or request CTO review. Other roles return notifyRoles=[].');
});

test('CEC chat names the responder from the registry, keeping the role id', () => {
    const s = store();
    for (const role of ['pm', 'developer', 'qa'] as const)
        expect(cecChatPrompt(s, role, message, '', null, [])).toMatch(new RegExp(`^Respond to Joe's office message as ${PERSONAS[role].name} \\(${role}\\)\\.`));
});
