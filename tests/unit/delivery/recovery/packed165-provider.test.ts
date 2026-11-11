import { afterEach, expect, test } from 'vitest';
import { packed165Fixture } from '../support/packed165';
import { cleanupFakes } from '../support/fake-github';
import { readPacked165Provider } from '../../../../server/delivery/recovery/packed165-provider';

afterEach(cleanupFakes);
test('read-only provider fences require current assignment, actual main, allowed board lane and complete absence for both branches', async () => {
    const f = packed165Fixture(), next = f.old.branch + '-pnpm-new';
    const result = await readPacked165Provider(f.delivery, f.job, next);
    expect(result.main).toBe(f.job.candidateBase);
    expect(f.state.calls.filter(c => c.includes('ls-remote')).length).toBe(4); // injected wrapper and underlying fake each retain a record
    expect(f.state.calls.some(c => /git push|POST|PUT|PATCH/.test(c))).toBe(false);
    f.state.remote[next] = f.job.head;
    await expect(readPacked165Provider(f.delivery, f.job, next)).rejects.toThrow('publication requires reconciliation');
});
test.each(['closed', 'unassigned', 'board-block', 'board-missing', 'old-publication', 'main-changed'])('%s stops before fresh source mutation', async scenario => {
    const f = packed165Fixture();
    if (scenario === 'closed') f.state.issue.state = 'closed';
    if (scenario === 'unassigned') f.state.issue.assignees = [];
    if (scenario === 'board-block') f.state.cards[0].status = 'block';
    if (scenario === 'board-missing') f.state.cards = [];
    if (scenario === 'old-publication') f.state.remote[f.job.branch] = f.job.head;
    if (scenario === 'main-changed') { const api = f.delivery.api.bind(f.delivery); f.delivery.api = async path => path.startsWith('git/ref') ? { object: { sha: 'f'.repeat(40) } } : api(path); }
    await expect(f.run()).rejects.toThrow();
    expect(f.state.calls.some(c => c.includes('worktree add'))).toBe(false);
});
