import { expect, test } from 'vitest';
import { sessionScope } from '../../../server/workers/session-scope';
const projects = [{ id: 'cms', repo: '/projects/cms', repository: 'Joe/cms' }, { id: 'brain', repo: '/projects/brain', repository: 'Joe/brain' }];
const row = (type: string, payload: unknown) => JSON.stringify({ type, timestamp: '2026-11-08T19:34:03Z', payload });
const meta = row('session_meta', { id: 'outside' });
const start = row('event_msg', { type: 'task_started' });
const call = (input: string) => row('response_item', { type: 'custom_tool_call', name: 'exec', input });
test('indexes cross-repository issue and PR commands from a chat rooted elsewhere with human context', () => {
    const raw = [meta, start,
        row('response_item', { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Own commits, pushes, merges and cleanup in order.' }] }),
        call('gh pr merge 143 --repo Joe/cms --merge'), call('gh api repos/Joe/cms/issues/142'),
        call('gh pr view 354 --repo Joe/brain'),
    ].join('\n');
    expect(sessionScope(raw, 'outside', projects)).toMatchObject({ activity: 'active', scopes: [
        { project: 'cms', issues: [142], prs: [143] }, { project: 'brain', issues: [], prs: [354] },
    ], userMessages: [{ text: 'Own commits, pushes, merges and cleanup in order.' }] });
});
test('reasoning and other repository numbers are excluded; returned URLs are references, not commands', () => {
    const raw = [meta, start, call('git -C /projects/cms status'),
        call('gh api repos/Joe/cms-extra/issues/142'),
        call('gh api repos/NotJoe/cms/issues/142'),
        call('read https://fakegithub.com/Joe/cms/issues/142'),
        row('response_item', { type: 'reasoning', text: 'https://github.com/Joe/cms/issues/142' }),
        row('response_item', { type: 'function_call_output', output: 'https://github.com/Joe/cms/issues/142' }),
    ].join('\n');
    expect(sessionScope(raw, 'outside', projects).scopes).toEqual([{ project: 'cms', issues: [142], prs: [], evidence: [{ at: '2026-11-08T19:34:03Z', reference: 'github.com/Joe/cms/issues/142', kind: 'reference', issue: 142 }] }]);
});
test('new turns drop historical ticket ownership; completed turns keep context without active ownership', () => {
    const old = [meta, start, call('gh api repos/Joe/cms/issues/142')];
    expect(sessionScope([...old, start, call('gh pr view 354 --repo Joe/brain')].join('\n'), 'outside', projects).scopes.map(s => s.project)).toEqual(['brain']);
    expect(sessionScope([...old, row('event_msg', { type: 'task_complete' })].join('\n'), 'outside', projects)).toMatchObject({ activity: 'idle', scopes: [{ issues: [142] }] });
});
test('missing/wrong identity and partial records cannot establish complete session coverage', () => {
    expect(() => sessionScope(start, 'outside', projects)).toThrow('identity');
    expect(() => sessionScope(meta, 'different', projects)).toThrow('identity');
    expect(() => sessionScope(meta + '\n{"type":', 'outside', projects)).toThrow('incomplete');
});
test('forked sessions bind the first header and replace inherited scope with the child turn', () => {
    const child = row('session_meta', { id: 'outside', forked_from_id: 'parent', subagent_history_start_ordinal: 4 });
    const raw = [child, row('session_meta', { id: 'parent' }), start, call('gh api repos/Joe/cms/issues/142'), start,
        call('gh pr view 354 --repo Joe/brain'), row('event_msg', { type: 'task_complete' }),
    ].join('\n');
    expect(sessionScope(raw, 'outside', projects)).toMatchObject({ activity: 'idle', scopes: [{ project: 'brain', prs: [354] }] });
    expect(() => sessionScope(raw, 'parent', projects)).toThrow('identity');
    expect(sessionScope(raw.split('\n').slice(0, 4).join('\n'), 'outside', projects)).toEqual({ activity: 'unknown', scopes: [], userMessages: [] });
});
