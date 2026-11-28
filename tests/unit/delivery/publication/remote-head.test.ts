import { expect, test } from 'vitest';
import { exactRemoteHead, remoteHead } from '../../../../server/delivery/publication/remote-head';

const SHA = 'a'.repeat(40), OTHER = 'c'.repeat(40);
const answering = (out: string) => (async () => out) as any;

test('delivery keeps its original read; maintenance reads the exact ref by its full name', async () => {
    const candidate = { branch: 'codex/5-x', worktree: '/w' };
    expect(await remoteHead(answering(`${SHA}\trefs/heads/codex/5-x\n`), candidate)).toBe(SHA);
    expect(await remoteHead(answering(''), candidate)).toBe('');
    expect(await exactRemoteHead(answering(`${OTHER}\trefs/heads/team/codex/5-x\n${SHA}\trefs/heads/codex/5-x\n`), candidate)).toBe(SHA);
    expect(await exactRemoteHead(answering(`${OTHER}\trefs/heads/team/codex/5-x\n`), candidate)).toBe('');
    await expect(exactRemoteHead(answering(`${SHA}\trefs/heads/codex/5-x\n${OTHER}\trefs/heads/codex/5-x\n`), candidate)).rejects.toThrow(/twice/);
});
