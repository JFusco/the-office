import { expect, test } from 'vitest';
import { SessionBridge } from '../../../server/workers/session-bridge';

test('duplicate Claude identities preserve the active client context when another client reports idle', async () => {
    const store: any = { project: { id: 'brain', repo: '/brain', repository: 'Joe/brain' }, state: { workLog: [] } };
    const execute: any = async (program: string) => program === 'claude'
        ? JSON.stringify([{ sessionId: 'same', cwd: '/preset', status: 'working' }, { sessionId: 'same', cwd: '/preset', status: 'idle' }]) : '/test/.git';
    const context: any = async (sessions: any[]) => sessions.map(session => ({ ...session, context: {
        activity: session.status === 'idle' ? 'idle' : 'active', userMessages: [],
        scopes: [{ project: 'brain', issues: [session.status === 'idle' ? 999 : 352], prs: [], evidence: [{ kind: 'command', issue: session.status === 'idle' ? 999 : 352, at: '', reference: 'test' }] }],
    } }));
    const bridge = new SessionBridge(() => [store], execute, async () => [], async () => Object.assign([], { unaccounted: [] }), undefined, context);
    await bridge.refresh();
    expect(bridge.forProject(store, 'GH-352').ownership.status).toBe('owned');
    expect(bridge.forProject(store, 'GH-999').ownership.status).toBe('clear');
});
