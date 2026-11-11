import { expect, test } from 'vitest';
import { sessionScope } from '../../../server/workers/session-scope';
import { CEC } from '../../../server/office/config';
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
test('later follow-ups retain cross-project conversation and decisions without retaining active issue claims', () => {
    const raw = [meta, start, call('gh pr merge 143 --repo Joe/cms --merge'), call('gh pr view 354 --repo Joe/brain'),
        row('response_item', { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Keep major updates behind checkbox approval.' }] }),
        row('response_item', { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Office remains sole merge owner. Do not move dashboard #355 to Ready.' }] }),
        row('event_msg', { type: 'task_complete' }), start,
        row('response_item', { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Check after Monday’s run.' }] }),
    ].join('\n');
    const context = sessionScope(raw, 'outside', projects);
    expect(context).toMatchObject({ activity: 'active', scopes: [], userMessages: [{ text: 'Check after Monday’s run.' }], conversation: {
        projects: ['cms', 'brain'], omittedMessages: 0, messages: [
            { role: 'user', text: 'Keep major updates behind checkbox approval.' },
            { role: 'assistant', text: 'Office remains sole merge owner. Do not move dashboard #355 to Ready.' },
            { role: 'user', text: 'Check after Monday’s run.' },
        ],
    } });
});
test('exact configured-site TWG commands bind CEC tickets as commands; other sites and returned URLs do not', () => {
    const cec = [{ id: 'cec', repo: '/projects/cec', repository: 'Org/cec-repo', provider: 'azure' as const }];
    const scopes = (...rows: string[]) => sessionScope([meta, start, ...rows].join('\n'), 'outside', cec).scopes;
    expect(scopes(call(`twg jira workitem update --id CEC-154 --site ${CEC.site} -o json`))).toMatchObject([
        { project: 'cec', issues: [154], prs: [], evidence: [{ kind: 'command', issue: 154 }] }]);
    expect(scopes(call(`twg jira workitem get CEC-155 --site ${CEC.site}`))).toMatchObject([{ project: 'cec', issues: [155] }]);
    expect(scopes(call('twg jira workitem update --id CEC-154 --site https://elsewhere.invalid'))).toEqual([]);
    const returned = scopes(row('response_item', { type: 'function_call_output', output: `Updated ${CEC.site}/browse/CEC-154 with twg jira workitem update --id CEC-154 --site ${CEC.site}` }));
    expect(returned).toMatchObject([{ project: 'cec', issues: [154] }]);
    expect(returned[0].evidence.map(evidence => evidence.kind)).toEqual(['reference']);
    expect(sessionScope([meta, start, call(`twg jira workitem update --id CEC-154 --site ${CEC.site}`)].join('\n'), 'outside', projects).scopes).toEqual([]);
});
test('configured-site host variants are commands; a site-less command is only a reference for its exact key', () => {
    const cec = [{ id: 'cec', repo: '/projects/cec', repository: 'Org/cec-repo', provider: 'azure' as const }];
    const host = new URL(CEC.site).host;
    const evidence = (...rows: string[]) => sessionScope([meta, start, ...rows].join('\n'), 'outside', cec).scopes.flatMap(scope => scope.evidence.map(e => [e.kind, e.issue]));
    for (const site of [host, `https://${host}/`, `"https://${host}/"`, host.toUpperCase()])
        expect(evidence(call(`twg jira workitem update --id CEC-154 --site ${site}`))).toEqual([['command', 154]]);
    expect(evidence(call(`twg jira workitem update --id CEC-154 --site='${host}' -o json`))).toEqual([['command', 154]]);
    expect(evidence(call('twg jira workitem update --id CEC-154 -o json'))).toEqual([['reference', 154]]);
    expect(evidence(call(`twg jira workitem update --id CEC-154 --site https://${host}.elsewhere.invalid`))).toEqual([]);
    expect(evidence(call(`twg jira workitem update --id CEC-154 --site elsewhere.invalid`))).toEqual([]);
    expect(evidence(row('response_item', { type: 'function_call_output', output: `Ran twg jira workitem update --id CEC-154 --site ${host}` }))).toEqual([]);
    expect(evidence(row('response_item', { type: 'function_call_output', output: `${CEC.site}/browse/CEC-154` }))).toEqual([['reference', 154]]);
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
    expect(sessionScope(raw.split('\n').slice(0, 4).join('\n'), 'outside', projects)).toEqual({ activity: 'unknown', scopes: [], userMessages: [], conversation: { projects: [], messages: [], omittedMessages: 0 } });
});
