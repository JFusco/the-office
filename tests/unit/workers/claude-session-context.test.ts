import { expect, test, vi } from 'vitest';
import { claudeSessionContext, claudeTranscript } from '../../../server/workers/claude-session-context';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { claudeSessionScope } from '../../../server/workers/claude-session-scope';
import type { LiveSession } from '../../../server/workers/session-bridge';
const session: LiveSession = { id: 'live', provider: 'claude', cwd: '/preset', title: 'Cross-project work', branch: '', status: 'active', source: 'test' };
test('Claude context uses the live identity and retains native active/waiting/idle status', async () => {
    const projects = [{ id: 'brain', repo: '/brain', repository: 'Joe/brain' }];
    const raw = JSON.stringify({ type: 'user', sessionId: 'live', message: { content: 'Inspect https://github.com/Joe/brain/issues/352' } });
    const locate = vi.fn(async () => '/fixture/live.jsonl'), read = vi.fn(async () => claudeSessionScope(raw, session.id, projects));
    const enriched = await claudeSessionContext([session, { ...session, status: 'idle' }, { ...session, status: 'waiting' }], projects, read, locate);
    expect(enriched.map(s => s.status)).toEqual(['active', 'idle', 'waiting']);
    expect(enriched.map(s => s.context!.activity)).toEqual(['active', 'idle', 'active']);
    expect(enriched[0].context!.scopes[0].issues).toEqual([352]); expect(locate).toHaveBeenCalledTimes(3);
});
test('missing live Claude transcript cannot become a clear empty inventory', async () => {
    await expect(claudeSessionContext([session], [], async () => { throw new Error('missing'); }, async () => '/fixture/live.jsonl')).rejects.toThrow('missing');
});
test('a moved checkout resolves only the exact live session filename and ambiguous copies stay unavailable', async () => {
    const root = await mkdtemp(join(tmpdir(), 'office-claude-context-'));
    try {
        await mkdir(join(root, 'old-checkout')); const old = join(root, 'old-checkout', 'live.jsonl'); await writeFile(old, '{}');
        expect(await claudeTranscript(session, root)).toBe(old);
        await mkdir(join(root, 'another-checkout')); await writeFile(join(root, 'another-checkout', 'live.jsonl'), '{}');
        await expect(claudeTranscript(session, root)).rejects.toThrow('One transcript');
        await expect(claudeTranscript({ ...session, id: '../escape' }, root)).rejects.toThrow('identity');
    } finally { await rm(root, { recursive: true, force: true }); }
});
