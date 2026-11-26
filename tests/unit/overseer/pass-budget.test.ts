import { writeFileSync } from 'node:fs';
import { afterEach, expect, test } from 'vitest';
import { RUNNER_DEFAULTS } from '../../../server/overseer/config';
import { forwardFailures } from '../../../server/overseer/forward-events';
import { officeWriter } from '../../../server/overseer/office-writer';
import { passAllowance, passBudget } from '../../../server/overseer/pass-budget';
import { ensurePrivateDirectory } from '../../../server/overseer/runner-root';
import { failure, officeWorld, ORIGIN, runnerStore } from './forward-world';
import { runnerRoot } from './runner-world';

const open: { close(): void }[] = [];
afterEach(() => open.splice(0).forEach(item => item.close()));
const NOW = new Date('2026-11-26T12:00:00.000Z');
const counts = Object.fromEntries(['success', 'locked', 'interrupted', 'config', 'pin', 'startup', 'exit', 'hang', 'lost', 'orphan'].map(kind => [kind, 0]));
function launcherState(paths: ReturnType<typeof runnerRoot>, pid: number, deadline: string) {
    ensurePrivateDirectory(paths.state);
    const current = { id: '00000000-0000-4000-8000-000000000001', commit: 'a'.repeat(40), entry: '/release/server/overseer.ts', startedAt: '2026-11-26T11:59:50.000Z', deadline, counted: null, observation: null, phase: 'registered', pid, pgid: pid, start: 'Thu Nov 26 11:59:50 2026' };
    writeFileSync(paths.launcherState, JSON.stringify({ version: 1, current, consecutiveFailures: 0, counts, last: null, recent: [] }), { mode: 0o600 });
}

test('a pass the launcher started takes the time left of the deadline it registered for this helper; a pass run by hand takes the manual allowance', () => {
    const paths = runnerRoot();
    expect(passAllowance(paths, { launched: false, parent: 1, now: NOW, manualMs: 240_000 })).toEqual({ ms: 240_000 });
    expect(passAllowance(paths, { launched: true, parent: 4242, now: NOW, manualMs: 240_000 })).toEqual({ unknown: expect.stringContaining('is absent') });
    // The deadline counts the launcher's startup: ten seconds of a 30 s deadline are already gone.
    launcherState(paths, 4242, '2026-11-26T12:00:20.000Z');
    expect(passAllowance(paths, { launched: true, parent: 4242, now: NOW, manualMs: 240_000 })).toEqual({ ms: 20_000 });
    expect(passAllowance(paths, { launched: true, parent: 999, now: NOW, manualMs: 240_000 })).toEqual({ unknown: expect.stringContaining('does not register this pass') });
    writeFileSync(paths.launcherState, '{');
    expect(passAllowance(paths, { launched: true, parent: 4242, now: NOW, manualMs: 240_000 })).toEqual({ unknown: expect.stringContaining('cannot be read') });
});

test('the minimum launcher deadline leaves finalizing time and splits the rest: a quarter for forwarding, observation to three quarters, the rest for the halt', () => {
    let clock = 0;
    const budget = passBudget(30_000, { monotonic: () => clock, finalizeMs: 6_000, forwardMaxMs: 30_000 });
    expect(budget.remaining()).toBe(6_000);
    budget.enter('observe');
    expect(budget.remaining()).toBe(18_000);
    clock = 18_000;
    expect(budget.remaining()).toBe(0);
    budget.enter('report');
    expect(budget.remaining()).toBe(6_000);
    clock = 30_000;
    expect(budget.remaining()).toBe(0);
    // A long pass still forwards for at most 30 s.
    expect(passBudget(900_000, { monotonic: () => 0, finalizeMs: 6_000, forwardMaxMs: 30_000 }).remaining()).toBe(30_000);
});

test('with slow answers, forwarding stops when its quarter is spent, before the limit, and starts no request after it', async () => {
    let clock = 0;
    const world = officeWorld();
    const slow: typeof fetch = async (input, init) => { clock += 2_500; return world.request(input, init); };
    const budget = passBudget(30_000, { monotonic: () => clock, finalizeMs: 6_000, forwardMaxMs: 30_000 });
    const runner = runnerStore(); open.push(runner);
    const events = Array.from({ length: 10 }, (_, index) => failure('service-down', undefined, `2026-11-26T1${index % 10}:00:00.000Z`));
    const summary = await forwardFailures({ entries: events.map(event => ({ event })), origin: ORIGIN, state: runner.state, effects: runner.effects, writer: officeWriter(ORIGIN, slow, RUNNER_DEFAULTS, budget.remaining), limit: 20, remaining: budget.remaining });
    expect(summary.examined).toBeLessThan(events.length);
    expect(clock).toBeLessThanOrEqual(6_000 + 2_500);
    const sentAfter = world.requests.length;
    budget.enter('report');
    expect(budget.remaining()).toBeGreaterThan(0);
    expect(sentAfter).toBeLessThanOrEqual(3);
});
