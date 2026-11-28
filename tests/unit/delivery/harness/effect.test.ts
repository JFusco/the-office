import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
afterEach(cleanupFakes);
import { effectIdGuard, harnessEffect } from '../../../../server/delivery/harness/effect';

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

const settled = (f: ReturnType<typeof fakeGitHub>, id: string) => { const intent = f.store.getEffect(id)!; intent.dispatchedAt = new Date(Date.now() - 11 * 60 * 1000).toISOString(); f.store.putEffect(intent); };
test('an absolute write shown not to have landed is sent once more; a second miss is not', async () => {
    const f = fakeGitHub(), job = f.candidate(), id = `harness:${job.id}:k`;
    let writes = 0, fails = true, done = false, before = true;
    const effect = { key: 'k', operation: 'op', target: 't', payload: {}, guard: () => {}, dispatch: async () => { writes++; if (fails) throw new Error('timeout before dispatch'); done = true; return { ok: true }; },
        readBack: async () => done ? { ok: true } : null, notLanded: async () => before };
    await expect(harnessEffect(f.store, job, effect)).rejects.toThrow('timeout');
    // Not settled yet: only read back.
    await expect(harnessEffect(f.store, job, effect)).rejects.toThrow('will not be resent');
    expect(writes).toBe(1);
    // Settled, but the target no longer shows the earlier state: not ours to send again.
    settled(f, id); before = false;
    await expect(harnessEffect(f.store, job, effect)).rejects.toThrow('will not be resent');
    expect([writes, f.store.getEffect(id)?.status]).toEqual([1, 'uncertain']);
    // Settled and still the earlier state: one fresh intent, which misses too.
    before = true;
    await expect(harnessEffect(f.store, job, effect)).rejects.toThrow('timeout');
    expect([writes, f.store.getEffect(id)?.status, f.store.getEffect(`${id}:retry-1`)?.status]).toEqual([2, 'rejected', 'uncertain']);
    settled(f, `${id}:retry-1`);
    await expect(harnessEffect(f.store, job, effect)).rejects.toThrow('will not be resent');
    expect(writes).toBe(2);
    // A later read-back that sees the write still verifies it.
    done = true;
    expect(await harnessEffect(f.store, job, effect)).toEqual({ ok: true });
    expect(writes).toBe(2);
});
test('an effect that does not declare itself absolute is never sent again, however long it has settled', async () => {
    const f = fakeGitHub(), job = f.candidate(), id = `harness:${job.id}:k`;
    let writes = 0;
    const effect = { key: 'k', operation: 'op', target: 't', payload: {}, guard: () => {}, dispatch: async () => { writes++; throw new Error('timeout after dispatch'); }, readBack: async () => null };
    await expect(harnessEffect(f.store, job, effect)).rejects.toThrow('timeout');
    settled(f, id);
    await expect(harnessEffect(f.store, job, effect)).rejects.toThrow('will not be resent');
    expect([writes, f.store.getEffect(id)?.status]).toEqual([1, 'uncertain']);
});
test('a guard marked with effectIdGuard is given the exact Effect id it guards, at admission and at the end of preflight', async () => {
    const f = fakeGitHub(), job = f.candidate(), seen: (string | undefined)[] = [];
    // The first attempt is refused in its preflight, so the second uses a fresh id.
    const effect = { key: 'k', operation: 'op', target: 't', payload: {}, guard: effectIdGuard((id?: string) => { seen.push(id); if (seen.length === 2) throw new Error('held'); }), dispatch: async () => ({ ok: true }), readBack: async () => ({ ok: true }) };
    await expect(harnessEffect(f.store, job, effect)).rejects.toThrow('held');
    await harnessEffect(f.store, job, effect);
    const base = `harness:${job.id}:k`;
    expect(seen).toEqual([base, base, `${base}:retry-1`, `${base}:retry-1`]);
});
test('an ordinary guard, including one with its own optional parameter, is called with no arguments', async () => {
    const f = fakeGitHub(), job = f.candidate(), calls: unknown[][] = [];
    const guard = (...args: unknown[]) => { calls.push(args); };
    await harnessEffect(f.store, job, { key: 'k', operation: 'op', target: 't', payload: {}, guard, dispatch: async () => ({ ok: true }), readBack: async () => ({ ok: true }) });
    expect(calls).toEqual([[], []]);
});

test('checked execution keeps delivery ids and binds another owner\'s work, attempt and synchronous claim (#612)', async () => {
    const { checkedEffect } = await import('../../../../server/delivery/harness/effect');
    const f = fakeGitHub(), job = f.candidate();
    let writes = 0, refuse = 'not this claim';
    const effect = { key: 'k2', operation: 'op', target: 't', payload: {}, guard: () => {}, dispatch: async () => { writes++; return { ok: true }; }, readBack: async () => ({ ok: true }) };
    await harnessEffect(f.store, job, effect);
    expect(f.store.getEffect(`harness:${job.id}:k2`)).toMatchObject({ work: { kind: 'delivery', id: job.id }, attemptId: job.id });
    const binding = { base: 'maintenance:run:subject:k3', work: { projectId: f.store.project.id, kind: 'maintenance' as const, id: 'run' }, attemptId: 'run', claim: () => refuse || undefined };
    await expect(checkedEffect(f.store, binding, { ...effect, key: 'k3' })).rejects.toThrow('not this claim');
    expect(f.store.getEffect('maintenance:run:subject:k3')).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    refuse = '';
    await checkedEffect(f.store, { ...binding, base: 'maintenance:run:subject:k4' }, { ...effect, key: 'k4' });
    expect(f.store.getEffect('maintenance:run:subject:k4')).toMatchObject({ status: 'verified', work: { kind: 'maintenance', id: 'run' }, attemptId: 'run' });
    expect(writes).toBe(2);
});
