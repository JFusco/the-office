import { expect, test } from 'vitest';
import { claudeSessionScope } from '../../../server/workers/claude-session-scope';
const projects = [{ id: 'brain', repo: '/brain', repository: 'Joe/brain' }, { id: 'cms', repo: '/cms', repository: 'Joe/cms' }];
const row = (type: string, content: unknown, extra = {}) => JSON.stringify({ type, sessionId: 'live', timestamp: '2026-11-08T21:00:00Z', message: { role: type, content }, ...extra });
test('Claude interactive/background context binds cross-repository commands and user decisions without thinking or API-history replay', () => {
    const raw = [row('user', 'Implement the reviewed plan and own cleanup.'),
        row('assistant', [{ type: 'tool_use', name: 'Bash', input: { command: 'gh pr merge 354 --repo Joe/brain' } }]),
        row('user', [{ type: 'tool_result', content: 'https://github.com/Joe/brain/issues/352' }]),
        row('assistant', [{ type: 'thinking', thinking: 'https://github.com/Joe/cms/issues/999' }]),
        row('api-request-blob', [{ type: 'tool_use', name: 'Bash', input: { command: 'gh pr view 999 --repo Joe/cms' } }]),
        row('assistant', [{ type: 'tool_use', name: 'Bash', input: { command: 'gh pr view 888 --repo Joe/cms' } }], { isSidechain: true }),
    ].join('\n');
    expect(claudeSessionScope(raw, 'live', projects)).toMatchObject({ scopes: [{ project: 'brain', issues: [352], prs: [354] }], userMessages: [{ text: 'Implement the reviewed plan and own cleanup.' }] });
});
test('a new human prompt replaces historical Claude issue scope; tool results do not reset the current prompt', () => {
    const raw = [row('user', 'Read https://github.com/Joe/brain/issues/352'), row('user', 'Now work on https://github.com/Joe/cms/issues/142'),
        row('assistant', [{ type: 'tool_use', name: 'Bash', input: { command: 'gh pr view 143 --repo Joe/cms' } }]),
        row('user', [{ type: 'tool_result', content: 'done' }]),
    ].join('\n');
    expect(claudeSessionScope(raw, 'live', projects).scopes).toMatchObject([{ project: 'cms', issues: [142], prs: [143] }]);
});
test('unbound, mismatched and partial Claude transcripts fail closed', () => {
    expect(() => claudeSessionScope('', 'live', projects)).toThrow('bound');
    expect(() => claudeSessionScope(row('user', 'hello', { sessionId: 'other' }), 'live', projects)).toThrow('identity');
    expect(() => claudeSessionScope('{', 'live', projects)).toThrow('incomplete');
});
test('Claude retains prior decisions and project visibility after a brief new prompt', () => {
    const raw = [row('user', 'Read https://github.com/Joe/brain/issues/352 and https://github.com/Joe/cms/issues/142'),
        row('assistant', 'Office owns merges; leave major updates awaiting checkbox approval.'),
        row('user', 'Check on Monday.'),
    ].join('\n');
    expect(claudeSessionScope(raw, 'live', projects)).toMatchObject({ scopes: [], conversation: {
        projects: ['brain', 'cms'], messages: [
            { role: 'user' }, { role: 'assistant', text: 'Office owns merges; leave major updates awaiting checkbox approval.' }, { role: 'user', text: 'Check on Monday.' },
        ],
    } });
});
