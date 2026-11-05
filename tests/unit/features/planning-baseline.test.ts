import { expect, test } from 'vitest';
import { compareBaseline, scopePaths } from '../../../server/features/planning-baseline';
import type { FeatureBaseline } from '../../../src/contracts/features';
test('freshness compares scoped modes and content, not only commit identity', async () => {
    const baseline: FeatureBaseline = { repository: 'r', ref: 'main', sha: 'a'.repeat(40), path: '/snapshot', files: { 'src/a.ts': { digest: 'b'.repeat(40), mode: 100644 } }, scope: ['src/a.ts'] };
    let mode = '100644';
    const execute = (async (_program: string, args: string[]) => args[0] === 'remote' ? 'https://example.test/repo.git' : args[0] === 'check-ref-format' || args[0] === 'fetch' ? '' : args[0] === 'ls-remote' ? 'c'.repeat(40) + '\trefs/heads/main' : mode + ' blob ' + 'b'.repeat(40) + '\tsrc/a.ts\0' + '100644 blob ' + 'd'.repeat(40) + '\tunrelated.txt\0') as any;
    const store = { project: { repo: '/live', target: 'main' } } as any;
    expect((await compareBaseline(store, baseline, execute)).observedSha).toBe('c'.repeat(40));
    mode = '100755';
    await expect(compareBaseline(store, baseline, execute)).rejects.toThrow('changed');
    expect(scopePaths(['src/a.ts'])).toContain('src/AGENTS.md');
    expect(() => scopePaths(['../escape'])).toThrow();
});
