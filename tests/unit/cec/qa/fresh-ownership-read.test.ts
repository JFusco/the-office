import { expect, test, vi } from 'vitest';
import { freshOwnershipRead } from '../../../../server/cec/qa/fresh-ownership-read';
import type { Store } from '../../../../server/store/store';

test('waits for an older in-flight read then requests one post-source observation without a loop', async () => {
    const after = '2026-11-15T12:01:00Z', result: any = { observedAt: after, complete: true, fresh: true };
    const refresh = vi.fn().mockResolvedValueOnce({ observedAt: '2026-11-15T12:00:59Z' }).mockResolvedValueOnce(result);
    const forProject = vi.fn(() => result), store = {} as Store;
    expect(await freshOwnershipRead({ refresh, forProject } as any, store, 'CEC-900', 'original', after)).toBe(result);
    expect(refresh).toHaveBeenCalledTimes(2); expect(forProject).toHaveBeenCalledWith(store, 'CEC-900', 'original');
});

test('a new observation needs one native read; unavailable or expired coverage is not rewritten', async () => {
    const after = '2026-11-15T12:01:00Z', result: any = { observedAt: after, complete: false, fresh: false };
    const refresh = vi.fn(async () => result), forProject = vi.fn(() => result);
    expect(await freshOwnershipRead({ refresh, forProject } as any, {} as Store, 'CEC-900', 'original', after)).toBe(result);
    expect(refresh).toHaveBeenCalledTimes(1); expect(result).toMatchObject({ complete: false, fresh: false });
});

test('missing native ownership capability does not fabricate coverage', async () => {
    expect(await freshOwnershipRead(undefined, {} as Store, 'CEC-900', 'original', '2026-11-15T12:01:00Z')).toBeUndefined();
});
