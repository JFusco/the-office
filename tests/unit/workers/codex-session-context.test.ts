import { expect, test, vi } from 'vitest';
import { codexSessionContext } from '../../../server/workers/codex-session-context';
import { sessionScope } from '../../../server/workers/session-scope';
import type { LiveSession } from '../../../server/workers/session-bridge';
const session: LiveSession = { id: 'outside', provider: 'codex', cwd: '/projects/preset', title: 'Cross-repo rollout', branch: 'main', status: 'loaded', source: 'test', rolloutPath: '/fixtures/outside.jsonl' };
const raw = [
    { type: 'session_meta', payload: { id: 'outside' } },
    { type: 'event_msg', payload: { type: 'task_started' } },
    { type: 'response_item', payload: { type: 'custom_tool_call', input: 'gh pr merge 143 --repo Joe/cms' } },
].map(row => JSON.stringify(row)).join('\n');
test('enriches only loaded identities and preserves stronger native status using an injected reader', async () => {
    const read = vi.fn(async (_path: string, id: string, projects: any[]) => sessionScope(raw, id, projects));
    const sessions = await codexSessionContext([session, { ...session, id: 'native', rolloutPath: undefined }], [{ id: 'cms', repo: '/projects/cms', repository: 'Joe/cms' }], read);
    expect(read.mock.calls).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ status: 'active', context: { scopes: [{ project: 'cms', prs: [143] }] } });
    expect((await codexSessionContext([{ ...session, status: 'idle' }], [], read))[0].status).toBe('idle');
});
test('unreadable or mismatched live context is a coverage failure, not an empty clear inventory', async () => {
    await expect(codexSessionContext([session], [], async () => { throw new Error('unreadable'); })).rejects.toThrow('unreadable');
    await expect(codexSessionContext([session], [], async () => sessionScope(raw.replace('outside', 'wrong'), session.id, []))).rejects.toThrow('identity');
});
