import { expect, test } from 'vitest';
import { SessionBridge } from '../../../server/workers/session-bridge';
import { knowledgeStore } from '../knowledge/knowledge-fixture';

test.each(['active', 'idle', 'unknown', 'failed', 'timeout'])('socket absence requires complete live process activity (%s)', async activity => {
    const fixture = knowledgeStore('cec');
    try {
        const native = async () => { throw Object.assign(new Error('Socket absent'), { code: activity === 'timeout' ? 'ETIMEDOUT' : 'ENOENT' }); };
        const desktop = async () => {
            if (activity === 'failed') throw new Error('Descriptor coverage failed');
            return [{ id: 'other', provider: 'codex', cwd: '/unrelated', title: 'Other task', branch: '',
                status: activity === 'unknown' ? 'loaded' : activity === 'idle' ? 'idle' : 'active', source: 'fixture',
                context: { activity, scopes: [], userMessages: [] } }] as any;
        };
        const execute = async (program: string) => program === 'claude' ? '[]' : '/unrelated/.git';
        const bridge = new SessionBridge(() => [fixture.store], execute as any, native, desktop);
        await bridge.refresh();
        expect(bridge.current.complete).toBe(['active', 'idle'].includes(activity));
        expect(bridge.current.sources[0].ok).toBe(false);
        expect(bridge.forProject(fixture.store, 'CEC-154').ownership.status).toBe(['active', 'idle'].includes(activity) ? 'clear' : 'unavailable');
        if (activity === 'active') {
            bridge.current.sessions.find(session => session.id === 'other')!.ticket = 'CEC-154';
            expect(bridge.forProject(fixture.store, 'CEC-154').ownership.status).toBe('owned');
        }
    } finally { fixture.close(); }
});
