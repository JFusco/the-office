import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
afterEach(cleanupFakes);
import { harnessEffect } from '../../../../server/delivery/harness/effect';

test('a verified harness write is reused, never repeated', async () => {
    const f = fakeGitHub(), job = f.candidate();
    let writes = 0;
    const effect = { key: 'k', operation: 'op', target: 't', payload: {}, guard: () => {}, dispatch: async () => { writes++; return { ok: true }; }, readBack: async () => ({ ok: true }) };
    await harnessEffect(f.store, job, effect);
    await harnessEffect(f.store, job, effect);
    expect(writes).toBe(1);
});
test('an uncertain write is reconciled by read-back and never resent', async () => {
    const f = fakeGitHub(), job = f.candidate();
    let writes = 0, observable = false;
    const effect = { key: 'k', operation: 'op', target: 't', payload: {}, guard: () => {}, dispatch: async () => { writes++; throw new Error('timeout after dispatch'); }, readBack: async () => observable ? { ok: true } : null };
    await expect(harnessEffect(f.store, job, effect)).rejects.toThrow('timeout');
    await expect(harnessEffect(f.store, job, effect)).rejects.toThrow('will not be resent');
    observable = true;
    expect(await harnessEffect(f.store, job, effect)).toEqual({ ok: true });
    expect(writes).toBe(1);
});
test('a rejected preflight never dispatched, so a later attempt may run', async () => {
    const f = fakeGitHub(), job = f.candidate();
    let held = true, writes = 0;
    const effect = { key: 'k', operation: 'op', target: 't', payload: {}, guard: () => { if (held) throw new Error('held'); }, dispatch: async () => { writes++; return { ok: true }; }, readBack: async () => ({ ok: true }) };
    await expect(harnessEffect(f.store, job, effect)).rejects.toThrow('held');
    held = false;
    await harnessEffect(f.store, job, effect);
    expect(writes).toBe(1);
});
