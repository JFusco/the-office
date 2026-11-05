import { expect, test, vi } from 'vitest';
import { readAzurePRs } from '../../../server/cec/observed-prs';

test('collects every active page alongside recent history, including old open PRs', async () => {
    const read = vi.fn(async (args: string[]) => args.includes('all') ? [{ pullRequestId: 500, status: 'completed' }, { pullRequestId: 1, status: 'active', description: 'old' }] : args.at(-1) === '0' ? Array.from({ length: 100 }, (_, i) => ({ pullRequestId: i + 1, status: 'active', description: 'Current implementation evidence' })) : [{ pullRequestId: 101, status: 'active' }]);
    const prs = await readAzurePRs('owned-repository', read);
    expect(prs).toHaveLength(102); expect(prs[0].description).toBe('Current implementation evidence');
    expect(prs.some(pr => pr.pullRequestId === 101)).toBe(true);
    expect(read.mock.calls.every(([args]) => args[args.indexOf('--repository') + 1] === 'owned-repository')).toBe(true);
    expect(read.mock.calls[2][0]).toContain('100');
});
test('failed or repeated active pages reject the observation rather than silently dropping open work', async () => {
    const page = Array.from({ length: 100 }, (_, i) => ({ pullRequestId: i + 1, status: 'active' }));
    await expect(readAzurePRs('repo', async args => args.includes('all') ? [] : page)).rejects.toThrow('did not advance');
    await expect(readAzurePRs('repo', async args => { if (args.includes('active')) throw new Error('Provider unavailable'); return []; })).rejects.toThrow('Provider unavailable');
});
