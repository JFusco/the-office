import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { openPulls, sharedPullInventory } from '../../../../server/delivery/intake/shared-pr-inventory';
afterEach(cleanupFakes);

/** A synthetic open-PR list in pages; nothing else is answered. */
function lister(pages: unknown) {
    const f = fakeGitHub(), calls: string[][] = [];
    const execute = async (program: string, args: string[]) => {
        calls.push([program, ...args]);
        if (program === 'gh' && args[1]?.endsWith('/pulls?state=open&per_page=100') && args.includes('--slurp')) return JSON.stringify(pages);
        throw new Error(`Unexpected synthetic command: ${program} ${args.join(' ')}`);
    };
    return { source: { store: f.store, execute: execute as any }, calls };
}

test('every reader shares one complete traversal, page two included', async () => {
    const { source, calls } = lister([[{ number: 1 }], [{ number: 2 }]]), inventory = sharedPullInventory(source);
    const [first, second] = await Promise.all([inventory.read(), inventory.read()]);
    first.pop();
    expect((await inventory.read()).map(p => p.number)).toEqual([1, 2]);
    expect(second.map(p => p.number)).toEqual([1, 2]);
    expect(calls).toHaveLength(1);
});
test('an incomplete page is no inventory for any reader, and is not traversed again in the same pass', async () => {
    const { source, calls } = lister([[{ number: 1 }], { message: 'Bad gateway' }]), inventory = sharedPullInventory(source);
    await expect(inventory.read()).rejects.toThrow('incomplete');
    await expect(inventory.read()).rejects.toThrow('incomplete');
    expect(calls).toHaveLength(1);
});
test('a PR-body write makes the next reader traverse the list again', async () => {
    const { source, calls } = lister([[{ number: 1 }]]), inventory = sharedPullInventory(source);
    await inventory.read();
    inventory.invalidate();
    const pending = inventory.read();
    inventory.invalidate();
    await pending;
    await inventory.read();
    expect(calls).toHaveLength(3);
});
test('outside a poll each read is its own complete traversal', async () => {
    const { source, calls } = lister([[{ number: 1 }], [{ number: 2 }]]);
    expect((await openPulls(source)).map(p => p.number)).toEqual([1, 2]);
    await openPulls(source);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual(['gh', 'api', 'repos/JFusco/cms-field-vocabulary/pulls?state=open&per_page=100', '--paginate', '--slurp']);
});
