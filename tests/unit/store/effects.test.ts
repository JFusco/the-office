import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { projectById } from '../../../server/office/projects';
import { Effects } from '../../../server/store/effects';
import { Store } from '../../../server/store/store';

let store: Store;
beforeEach(() => { store = new Store(':memory:', projectById('brain')); });
afterEach(() => store.close());

function operation() {
    return {
        id: 'same', work: { projectId: 'brain', kind: 'delivery' as const, id: 'job' },
        attemptId: 'attempt', operation: 'publish', target: 'branch', authorization: 'approved',
        payload: { head: 'reviewed' }, expectedState: { draft: true },
        preflight: vi.fn(async () => {}), dispatch: vi.fn(async () => ({ number: 7 })), verify: async () => true,
    };
}

test.each([
    ['work', { work: { projectId: 'brain', kind: 'delivery' as const, id: 'other' } }],
    ['attempt', { attemptId: 'other' }], ['operation', { operation: 'promote' }],
    ['target', { target: 'elsewhere' }], ['authorization', { authorization: 'different approval' }],
    ['payload', { payload: { head: 'other' } }], ['expected state', { expectedState: { draft: false } }],
] as const)('reusing a verified intent with a changed %s preserves the original receipt', async (_, change) => {
    const effects = new Effects(store), original = operation();
    const receipt = await effects.execute(original);
    await expect(effects.execute({ ...original, ...change })).rejects.toThrow('different operation');
    expect(original.preflight).toHaveBeenCalledOnce();
    expect(original.dispatch).toHaveBeenCalledOnce();
    expect(store.getEffect(original.id)).toMatchObject({ status: 'verified', receipt });
});

test('two concurrent preflights for one intent dispatch exactly once', async () => {
    const effects = new Effects(store), original = operation();
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    original.preflight.mockImplementation(() => gate);
    const attempts = [effects.execute(original), effects.execute(original)];
    expect(original.preflight).toHaveBeenCalledTimes(2);
    release();
    const results = await Promise.allSettled(attempts);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(original.dispatch).toHaveBeenCalledOnce();
    expect(store.getEffect(original.id)).toMatchObject({ status: 'verified', receipt: { number: 7 } });
});
