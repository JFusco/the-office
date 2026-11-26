import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, REPOSITORY } from '../support/fake-github';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { sharedPullInventory } from '../../../../server/delivery/intake/shared-pr-inventory';
import type { TicketJob } from '../../../../src/shared';
afterEach(cleanupFakes);

const row = (number: number, head: string, base = 'main', state = 'open') => ({ number, state, head: { ref: head }, base: { ref: base } });
/**
 * Dependency refresh over a fixed set of jobs. Open PRs are listed on two pages; every PR, open or not, can be
 * read by number. `during` runs while a by-number read is out.
 */
function refresh() {
    const f = fakeGitHub(), reads: string[] = [], lists: string[] = [];
    const prs = new Map<number, any>([[700, row(700, 'parent-branch')], [701, row(701, 'child-branch', 'parent-branch')], [702, row(702, 'feature-branch', 'other-branch')],
        [703, row(703, 'other-branch')], [690, row(690, 'old-branch', 'main', 'closed')], [680, row(680, 'cancelled-branch')], [699, row(699, 'closed-parent', 'main', 'closed')]]);
    let during: (pr: number) => void = () => {};
    const execute = async (program: string, args: string[]) => {
        const path = args[1] || '';
        if (program === 'gh' && path.endsWith('/pulls?state=open&per_page=100')) {
            lists.push(path);
            const open = [...prs.values()].filter(p => p.state === 'open');
            return JSON.stringify([open.slice(0, 2), open.slice(2)]);
        }
        const number = Number(/\/pulls\/(\d+)$/.exec(path)?.[1]);
        if (program === 'gh' && prs.has(number)) { reads.push(`pulls/${number}`); during(number); return JSON.stringify(prs.get(number)); }
        throw new Error(`Unexpected synthetic command: ${program} ${args.join(' ')}`);
    };
    const delivery = new GitHubDelivery(f.store, f.engine, execute as any);
    const job = (id: string, pr: number, status: TicketJob['status']): TicketJob => {
        const value = { id, key: `GH-${pr}`, pr, prUrl: `https://github.com/${REPOSITORY}/pull/${pr}`, status, stage: 'prepare-pr', requestedAt: '', head: '', worktree: '', branch: '', detail: '', steps: [] } as TicketJob;
        delivery.jobs.push(value);
        return value;
    };
    const jobs = { parent: job('parent', 700, 'blocked'), child: job('child', 701, 'queued'), unrelated: job('unrelated', 702, 'queued'),
        completed: job('completed', 690, 'completed'), cancelled: job('cancelled', 680, 'cancelled') };
    return { f, delivery, jobs, prs, reads, lists, inventory: () => sharedPullInventory(delivery), setDuring: (fn: (pr: number) => void) => during = fn };
}

test('the poll routes live jobs from its inventory and reads no finished job and no PR it already listed', async () => {
    const x = refresh(), inventory = x.inventory();
    await inventory.read();
    await x.delivery.refreshDependencies(inventory);
    expect(x.lists).toHaveLength(1);
    expect(x.reads).toEqual([]);
    expect(x.jobs.child).toMatchObject({ branch: 'child-branch', dependsOnPR: 700, detail: 'Waiting for parent PR #700 to finish closeout.' });
    // An open PR no live job tracks (#703, head other-branch) is never a parent.
    expect(x.jobs.unrelated.branch).toBe('feature-branch');
    expect(x.jobs.unrelated.dependsOnPR).toBeUndefined();
    expect(x.jobs.completed.branch).toBe('');
    expect(x.jobs.cancelled.branch).toBe('');
});
test('a live PR the inventory lacks is read once by number, and still parents its child', async () => {
    const x = refresh();
    x.jobs.parent.pr = 699;
    x.prs.get(701)!.base.ref = 'closed-parent';
    x.delivery.jobs.push({ ...x.jobs.parent, id: 'duplicate' });
    await x.delivery.refreshDependencies(x.inventory());
    expect(x.reads).toEqual(['pulls/699']);
    expect(x.jobs.child.dependsOnPR).toBe(699);
});
test('the pump, with no inventory, reads each live PR once and no finished one', async () => {
    const x = refresh();
    await x.delivery.refreshDependencies();
    expect(x.lists).toEqual([]);
    expect(x.reads.sort()).toEqual(['pulls/700', 'pulls/701', 'pulls/702']);
    expect(x.jobs.child.dependsOnPR).toBe(700);
});
test('a job cancelled, or a parent finished, while the read is out changes no routing', async () => {
    const x = refresh();
    x.setDuring(pr => {
        if (pr === 701) { x.jobs.child.status = 'cancelled'; x.prs.get(701)!.head.ref = 'rewritten'; }
        if (pr === 702) x.jobs.parent.status = 'completed';
    });
    x.prs.get(702)!.base.ref = 'parent-branch';
    await x.delivery.refreshDependencies();
    expect(x.jobs.child).toMatchObject({ branch: '', detail: '' });
    expect(x.jobs.child.dependsOnPR).toBeUndefined();
    expect(x.jobs.unrelated).toMatchObject({ branch: 'feature-branch', detail: '' });
    expect(x.jobs.unrelated.dependsOnPR).toBeUndefined();
});
test('missing PR identity stops routing', async () => {
    const x = refresh();
    x.prs.set(702, { number: 702, state: 'closed' });
    await expect(x.delivery.refreshDependencies()).rejects.toThrow('PR dependency identity is unavailable');
});
