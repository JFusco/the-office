import { expect, test } from 'vitest';
import { SessionBridge, loadedCodexSession, type LiveSession } from '../../../server/workers/session-bridge';
import { accountCodexProcesses } from '../../../server/workers/codex-process-inventory';
import { codexSessionContext } from '../../../server/workers/codex-session-context';
import { sessionScope } from '../../../server/workers/session-scope';
import type { ContextProject } from '../../../server/workers/session-context-file';
import { CEC } from '../../../server/office/config';
import { knowledgeStore } from '../knowledge/knowledge-fixture';

test.each(['active', 'idle', 'unknown', 'failed', 'timeout'])('socket absence requires complete live process activity (%s)', async activity => {
    const fixture = knowledgeStore('cec');
    try {
        const native = async () => { throw Object.assign(new Error('Socket absent'), { code: activity === 'timeout' ? 'ETIMEDOUT' : 'ENOENT' }); };
        const desktop = async () => {
            if (activity === 'failed') throw new Error('Descriptor coverage failed');
            return Object.assign([{ id: 'other', provider: 'codex', cwd: '/unrelated', title: 'Other task', branch: '',
                status: activity === 'unknown' ? 'loaded' : activity === 'idle' ? 'idle' : 'active', source: 'fixture',
                context: { activity, scopes: [], userMessages: [] } }] as any, { unaccounted: [] });
        };
        const execute = async (program: string) => program === 'claude' ? '[]' : '/unrelated/.git';
        const bridge = new SessionBridge(() => [fixture.store], execute as any, native, desktop);
        await bridge.refresh();
        expect(bridge.current.complete).toBe(['active', 'idle'].includes(activity));
        expect(bridge.current.sources[0].ok).toBe(false);
        expect(bridge.forProject(fixture.store, 'CEC-154').ownership.status).toBe(['active', 'idle'].includes(activity) ? 'clear' : 'unavailable');
    } finally { fixture.close(); }
});

const row = (type: string, payload: unknown) => JSON.stringify({ type, timestamp: '2026-11-11T00:00:00Z', payload });
const rollout = '/home/test/.codex/sessions/2026/11/rollout-live.jsonl';
function absentRuntimeBridge(fixture: ReturnType<typeof knowledgeStore>, lsof: string, input: string) {
    const raw = [row('session_meta', { id: 'live' }), row('event_msg', { type: 'task_started' }),
        row('response_item', { type: 'custom_tool_call', name: 'exec', input })].join('\n');
    const native = async (): Promise<LiveSession[]> => { throw Object.assign(new Error('Socket absent'), { code: 'ENOENT' }); };
    const desktop = async (_execute: unknown, workers: ReadonlySet<number>) => accountCodexProcesses(lsof,
        path => loadedCodexSession({ id: 'live', cwd: '/elsewhere', title: 'Generic task', git_branch: 'main', thread_source: 'user', rollout_path: path }), workers);
    const context = (sessions: LiveSession[], projects: ContextProject[]) => codexSessionContext(sessions, projects, async (_path, id, scoped) => sessionScope(raw, id, scoped));
    const execute = async (program: string, _args: string[], options?: { cwd?: string }) =>
        program === 'claude' ? '[]' : options?.cwd === fixture.store.project.repo ? '/cec/.git' : '/elsewhere/.git';
    return new SessionBridge(() => [fixture.store], execute as any, native, desktop, context);
}

test('a real parsed active CEC command in a generically titled chat owns only that exact ticket', async () => {
    const fixture = knowledgeStore('cec');
    try {
        const bridge = absentRuntimeBridge(fixture, `p101\nn${rollout}\np102\nn${rollout}`, `twg jira workitem update --id CEC-154 --site ${CEC.site} -o json`);
        await bridge.refresh();
        expect(bridge.current.complete).toBe(true);
        expect(bridge.current.sessions.filter(session => session.id === 'live')).toHaveLength(1);
        expect(bridge.forProject(fixture.store, 'CEC-154').ownership.status).toBe('owned');
        expect(bridge.forProject(fixture.store, 'CEC-155').ownership.status).toBe('clear');
    } finally { fixture.close(); }
});

test.each(['host', 'slash'])('the configured site as a bare host or with a trailing slash is real command ownership (%s)', async form => {
    const fixture = knowledgeStore('cec');
    try {
        const host = new URL(CEC.site).host;
        const bridge = absentRuntimeBridge(fixture, `p101\nn${rollout}`, `twg jira workitem update --id CEC-154 --site ${form === 'host' ? host : `https://${host}/`}`);
        await bridge.refresh();
        expect(bridge.current.complete).toBe(true);
        expect(bridge.forProject(fixture.store, 'CEC-154').ownership.status).toBe('owned');
        expect(bridge.forProject(fixture.store, 'CEC-155').ownership.status).toBe('clear');
    } finally { fixture.close(); }
});

test('a site-less Jira command leaves its exact ticket uncertain, never falsely clear', async () => {
    const fixture = knowledgeStore('cec');
    try {
        const bridge = absentRuntimeBridge(fixture, `p101\nn${rollout}`, 'twg jira workitem update --id CEC-154 -o json');
        await bridge.refresh();
        expect(bridge.current.complete).toBe(true);
        expect(bridge.forProject(fixture.store, 'CEC-154').ownership.status).toBe('uncertain');
        expect(bridge.forProject(fixture.store, 'CEC-155').ownership.status).toBe('clear');
    } finally { fixture.close(); }
});

const shared: LiveSession = { id: 'shared', provider: 'codex', cwd: '/unrelated', title: 'Other task', branch: '', status: 'idle', source: 'runtime' };
const descriptor: LiveSession = { ...shared, status: 'loaded', source: 'descriptor', context: { activity: 'unknown', scopes: [], userMessages: [] } };
const accounted = (sessions: LiveSession[], unaccounted: number[] = []) => Object.assign(sessions, { unaccounted });
test.each([
    ['an unaccounted PID', [shared], accounted([], [202]), false, '1 Codex process is not accounted for'],
    ['a missing accounting report', [shared], [], false, 'accounting report is missing'],
    ["only Codex's registered daemon unaccounted", [shared], Object.assign(accounted([], [301, 302]), { daemon: [301, 302] }), true, 'Loaded identities'],
    ['a stranger beside the registered daemon', [shared], Object.assign(accounted([], [301, 303]), { daemon: [301] }), false, '1 Codex process is not accounted for'],
    ['an unknown desktop-only session', [shared], accounted([{ ...descriptor, id: 'desktop-only' }]), false, '1 loaded session has unknown current-turn activity'],
    ['unrelated unknown native activity', [{ ...shared, id: 'other', status: 'loaded' }], accounted([]), false, 'Loaded identities'],
    ['unknown activity on both matching identities', [{ ...shared, status: 'loaded' }], accounted([descriptor]), false, '1 loaded session has unknown current-turn activity'],
    ['known idle native activity for the matching identity', [shared], accounted([descriptor]), true, 'Loaded identities'],
    ['known active native activity for the matching identity', [{ ...shared, status: 'active' }], accounted([descriptor]), true, 'Loaded identities'],
    ['known waiting native activity for the matching identity', [{ ...shared, status: 'waiting' }], accounted([descriptor]), true, 'Loaded identities'],
] as [string, LiveSession[], LiveSession[], boolean, string][])('a fulfilled native inventory with %s', async (_case, native, desktop, complete, cause) => {
    const fixture = knowledgeStore('cec');
    try {
        const execute = async (program: string) => program === 'claude' ? '[]' : '/unrelated/.git';
        const bridge = new SessionBridge(() => [fixture.store], execute as any, async () => native, async () => desktop);
        await bridge.refresh();
        expect(bridge.current.complete).toBe(complete);
        expect(bridge.forProject(fixture.store, 'CEC-154').ownership.status).toBe(complete ? 'clear' : 'unavailable');
        // The desktop source explains its own incomplete cause by count only, never identities.
        expect(bridge.current.sources[2]).toMatchObject({ ok: true });
        expect(bridge.current.sources[2].detail).toContain(cause);
        expect(bridge.current.sources[2].detail).not.toContain('desktop-only');
    } finally { fixture.close(); }
});

test('a Jira command on another site cannot make the chat a CEC owner', async () => {
    const fixture = knowledgeStore('cec');
    try {
        const bridge = absentRuntimeBridge(fixture, `p101\nn${rollout}`, 'twg jira workitem update --id CEC-154 --site https://elsewhere.invalid');
        await bridge.refresh();
        expect(bridge.forProject(fixture.store, 'CEC-154').ownership.status).toBe('clear');
    } finally { fixture.close(); }
});

test('a Codex process without a rollout descriptor keeps socket-absent coverage unavailable unless it is a running Office worker', async () => {
    const fixture = knowledgeStore('cec');
    try {
        const bridge = absentRuntimeBridge(fixture, `p101\nn${rollout}\np202\nn/tmp/unrelated.log`, `twg jira workitem get CEC-1 --site ${CEC.site}`);
        await bridge.refresh();
        expect(bridge.current.complete).toBe(false);
        expect(bridge.forProject(fixture.store, 'CEC-154').ownership.status).toBe('unavailable');
        (fixture.store.state.workLog ??= []).push({ id: 'office-worker', status: 'running', processId: 202, role: 'pm', provider: 'codex', sessionId: 'office', requestId: 'assessment:x', ticket: '', task: 'Office worker' } as any);
        await bridge.refresh();
        expect(bridge.current.complete).toBe(true);
        expect(bridge.forProject(fixture.store, 'CEC-154').ownership.status).toBe('clear');
    } finally { fixture.close(); }
});

test("the daemon's processes stay unaccounted when the runtime they host does not answer", async () => {
    const fixture = knowledgeStore('cec');
    try {
        const execute = async (program: string) => program === 'claude' ? '[]' : '/unrelated/.git';
        const absent = Object.assign(new Error('absent'), { code: 'ENOENT' });
        const bridge = new SessionBridge(() => [fixture.store], execute as any, async () => { throw absent; }, async () => Object.assign(accounted([], [301]), { daemon: [301] }));
        await bridge.refresh();
        expect(bridge.current.complete).toBe(false);
        expect(bridge.current.sources[2].detail).toContain('1 Codex process is not accounted for');
    } finally { fixture.close(); }
});
