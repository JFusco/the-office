import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { projectById } from '../../../server/office/projects';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const UNTIL = '2026-11-26T13:30:00.000Z';

/** A GitHub project's engine with a governor that holds while `held` is true; every provider call is recorded. */
function engine(held: { value: boolean }) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-deferred-'));
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root);
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    const calls: string[] = [];
    const execute = async (program: string, args: string[]) => { calls.push(`${program} ${args.join(' ')}`); throw new Error('gh exited 1: API rate limit exceeded (HTTP 403)'); };
    const quota = { hold: () => held.value ? { until: UNTIL } : undefined };
    return { store, calls, engine: new Engine(store, undefined, undefined, undefined, undefined, execute as any, quota) };
}

test('a held monitor reads and writes nothing, and says so, so a cold store stays cold', async () => {
    const x = engine({ value: true });
    expect(await x.engine.github.poll()).toEqual({ until: UNTIL });
    expect(await x.engine.observe()).toEqual({ until: UNTIL });
    expect(x.calls).toEqual([]);
    expect(x.store.state.github).toBeUndefined();
});

test('the last observation, its error and its time stand through a deferral, and the pipelines read waits with it', async () => {
    const held = { value: false }, x = engine(held);
    await x.engine.observe();
    const refused = { ...x.store.state.github! };
    expect(refused).toMatchObject({ status: 'blocked', error: expect.stringContaining('rate limit') });
    held.value = true; x.calls.length = 0;
    await x.engine.observe();
    expect(x.calls).toEqual([]);
    expect(x.store.state.github).toMatchObject({ status: refused.status, error: refused.error, observedAt: refused.observedAt });
    // After a clean observation the pipelines read would follow it; under the hold it does not.
    x.store.state.github = { status: 'idle', error: '', observedAt: '2026-11-26T12:59:00.000Z', issues: [], prs: [], runs: [] };
    x.store.state.pipelines = { observedAt: '2026-11-26T12:59:00.000Z', error: '', items: [] };
    await x.engine.observe();
    expect(x.calls).toEqual([]);
    expect(x.store.state.pipelines).toEqual({ observedAt: '2026-11-26T12:59:00.000Z', error: '', items: [] });
});

test('a mailbox check under a hold keeps the last check and any error, even before anything was observed', async () => {
    const x = engine({ value: true });
    Object.assign(x.store.state.intake, { status: 'blocked', lastChecked: '2026-11-26T12:00:00.000Z', error: 'Error: gh exited 1: API rate limit exceeded (HTTP 403)' });
    const intake = { ...x.store.state.intake };
    await x.engine.checkMail();
    expect(x.store.state.intake).toEqual(intake);
    expect(x.calls).toEqual([]);
});

test('a requested mailbox check under a hold mirrors the standing GitHub observation and its error again', async () => {
    const x = engine({ value: true }), error = 'Error: gh exited 1: API rate limit exceeded (HTTP 403)';
    x.store.state.github = { status: 'blocked', error, observedAt: '2026-11-26T12:57:00.000Z', issues: [], prs: [], runs: [] };
    Object.assign(x.store.state.intake, { status: 'blocked', lastChecked: '2026-11-26T12:57:00.000Z', error });
    // Asking for a check sets the old error aside until the check completes.
    x.engine.requestMail();
    expect(x.store.state.intake).toMatchObject({ status: 'idle', error: '' });
    expect(await x.engine.drainMail()).toBe(true);
    expect(x.calls).toEqual([]);
    expect(x.store.state.intake).toMatchObject({ status: 'blocked', lastChecked: '2026-11-26T12:57:00.000Z', error });
    expect(x.store.state.github).toMatchObject({ status: 'blocked', error, observedAt: '2026-11-26T12:57:00.000Z' });
});
