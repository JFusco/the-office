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


test('forked Claude history never imports the parent conversation or active commands', () => {
    const parent = [row('user', 'Edit https://github.com/Joe/brain/issues/352', { sessionId: 'parent' }),
        row('assistant', [{ type: 'tool_use', name: 'Bash', input: { command: 'gh pr merge 354 --repo Joe/brain' } }], { sessionId: 'parent' })];
    const boundary = JSON.stringify({ type: 'custom-title', sessionId: 'live', customTitle: 'Forked chat' });
    const idle = claudeSessionScope([...parent, boundary].join('\n'), 'live', projects);
    expect(idle).toMatchObject({ scopes: [], userMessages: [], conversation: { projects: [], messages: [] } });
    const active = claudeSessionScope([...parent, boundary, row('user', 'Read https://github.com/Joe/cms/issues/142')].join('\n'), 'live', projects);
    expect(active.scopes).toMatchObject([{ project: 'cms', issues: [142] }]);
    expect(active.conversation?.projects).toEqual(['cms']);
});

test('a foreign identity after Claude child binding remains an error', () => {
    const boundary = JSON.stringify({ type: 'custom-title', sessionId: 'live' });
    expect(() => claudeSessionScope([boundary, row('user', 'wrong', { sessionId: 'other' })].join('\n'), 'live', projects)).toThrow('identity');
});

import { claudeScopeParser } from '../../../server/workers/claude-session-scope';
import { sessionContextFile } from '../../../server/workers/session-context-file';
import { mkdtemp, writeFile, appendFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LINES = [row('user', 'Other parent prompt', { sessionId: 'parent' }),
    row('user', 'Implement https://github.com/Joe/brain/issues/352 and own cleanup.'),
    row('assistant', [{ type: 'text', text: 'Starting.' }, { type: 'tool_use', name: 'Bash', input: { command: 'gh pr merge 354 --repo Joe/brain' } }]),
    row('user', [{ type: 'tool_result', content: 'merged' }]),
    row('assistant', [{ type: 'tool_use', name: 'Bash', input: { command: 'gh pr view 888 --repo Joe/cms' } }], { isSidechain: true }),
    row('summary', 'not a message'),
    row('user', 'Now look at https://github.com/Joe/cms/issues/142'),
    row('assistant', [{ type: 'tool_use', name: 'Bash', input: { command: 'gh pr view 143 --repo Joe/cms' } }])];

test('the line parser gives the same context as the whole-text parser, at every split point through a fork', () => {
    const whole = claudeSessionScope(LINES.join('\n'), 'live', projects);
    for (let cut = 0; cut <= LINES.length; cut++) {
        const first = claudeScopeParser('live', projects);
        for (const line of LINES.slice(0, cut)) first.write(line);
        // The fork carries on from the checkpoint; the original keeps its own state.
        const resumed = first.fork!();
        for (const line of LINES.slice(cut)) resumed.write(line);
        expect(resumed.finish()).toEqual(whole);
        // Writing through the fork changed nothing in the parser it was taken from.
        const before = (() => { try { return claudeSessionScope(LINES.slice(0, cut).join('\n'), 'live', projects); } catch { return undefined; } })();
        if (before) expect(first.finish()).toEqual(before); else expect(() => first.finish()).toThrow();
    }
});

test('the line parser fails closed like the whole-text parser', () => {
    expect(() => claudeScopeParser('live', projects).finish()).toThrow('bound');
    const partial = claudeScopeParser('live', projects);
    expect(() => partial.write('{')).toThrow('incomplete');
    const foreign = claudeScopeParser('live', projects);
    foreign.write(row('user', 'mine'));
    expect(() => foreign.write(row('user', 'theirs', { sessionId: 'other' }))).toThrow('identity');
    const onlyParent = claudeScopeParser('live', projects);
    onlyParent.write(row('user', 'theirs', { sessionId: 'parent' }));
    expect(() => onlyParent.finish()).toThrow('identity');
});

test('read through the file reader: a transcript that grew is read again at its new length, with the whole-text result', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'office-claude-stream-')), path = join(directory, 'live.jsonl');
    try {
        const read = sessionContextFile(directory, claudeSessionScope, claudeScopeParser);
        await writeFile(path, LINES.slice(0, 4).join('\n') + '\n');
        expect(await read(path, 'live', projects)).toEqual(claudeSessionScope(LINES.slice(0, 4).join('\n'), 'live', projects));
        await appendFile(path, LINES.slice(4).join('\n') + '\n');
        expect(await read(path, 'live', projects)).toEqual(claudeSessionScope(LINES.join('\n'), 'live', projects));
    } finally { await rm(directory, { recursive: true, force: true }); }
});
