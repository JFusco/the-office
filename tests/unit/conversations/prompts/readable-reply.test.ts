import { expect, test } from 'vitest';
import { ctoChatPrompt } from '../../../../server/conversations/prompts/conversations';
import { READABLE_REPLY } from '../../../../server/conversations/prompts/readable-reply';

test('Avery is told how a chat reply should read, just before what to return', () => {
    const prompt = ctoChatPrompt({} as any, { from: 'human', body: 'Where do the goals stand?' } as any, { projects: [] }, '');
    expect(prompt).toContain(READABLE_REPLY);
    expect(prompt.indexOf(READABLE_REPLY)).toBeLessThan(prompt.indexOf('Return a concise reply'));
    expect(prompt.indexOf(READABLE_REPLY)).toBeGreaterThan(prompt.indexOf('CURRENT MESSAGE'));
});

test('the rule asks for the answer first and keeps references a reader does not need out of the reply', () => {
    for (const part of ['Open with two or three plain sentences that answer what he asked', 'by its link when you have one, never an invented one', 'keep every exact identifier Morgan needs', 'leave out commit hashes', 'paths to files on the Office machine', 'unless Joe asks for them or one of them is the answer', 'Use a table only for data that is tabular'])
        expect(READABLE_REPLY).toContain(part);
});

test('a report from the delivery team is not answered under the chat rule', () => {
    expect(ctoChatPrompt({} as any, { from: 'pm', body: 'Goal evidence report' } as any, { projects: [] }, '')).not.toContain('READABLE REPLY');
});
