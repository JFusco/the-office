import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../delivery/support/fake-github';
import { MERGE_NOTICE_RECHECK_MS, clearCooldown, coolDown, coolingDown } from '../../../server/conversations/merge-notice-cooldown';
afterEach(cleanupFakes);

function clocked() {
    const f = fakeGitHub();
    let now = Date.parse('2026-11-25T12:00:00Z');
    f.store.clock = { now: () => new Date(now), monotonic: () => now };
    return { store: f.store, advance: (ms: number) => { now += ms; } };
}

test('a wait lasts thirty minutes under the same settings', () => {
    const x = clocked();
    expect(coolingDown(x.store, 313, 'settings')).toBe(false);
    coolDown(x.store, 313, 'settings');
    x.advance(MERGE_NOTICE_RECHECK_MS - 1);
    expect(coolingDown(x.store, 313, 'settings')).toBe(true);
    expect(coolingDown(x.store, 314, 'settings')).toBe(false);
    x.advance(1);
    expect(coolingDown(x.store, 313, 'settings')).toBe(false);
});
test('changed settings or a reopened PR end the wait at once', () => {
    const x = clocked();
    coolDown(x.store, 313, 'settings');
    expect(coolingDown(x.store, 313, 'changed')).toBe(false);
    expect(coolingDown(x.store, 313, 'settings')).toBe(false);
    coolDown(x.store, 313, 'settings');
    clearCooldown(x.store, 313);
    expect(coolingDown(x.store, 313, 'settings')).toBe(false);
});
test('waits are per project store, so another project or a restarted store reads at once', () => {
    const one = clocked(), other = clocked();
    coolDown(one.store, 313, 'settings');
    expect(coolingDown(other.store, 313, 'settings')).toBe(false);
});
test('reopening clears both PR and issue waits for that PR', () => {
    const { store } = clocked();
    coolDown(store, 313, 'settings', 'GH-5');
    expect(coolingDown(store, 313, 'settings', 'GH-5')).toBe(true);
    expect(coolingDown(store, 313, 'settings')).toBe(false);
    expect(coolingDown(store, 313, 'settings', 'GH-6')).toBe(false);
    coolDown(store, 313, 'settings');
    coolDown(store, 313, 'settings', 'GH-6');
    coolDown(store, 3130, 'settings', 'GH-5');
    clearCooldown(store, 313);
    expect(coolingDown(store, 313, 'settings')).toBe(false);
    expect(coolingDown(store, 313, 'settings', 'GH-5')).toBe(false);
    expect(coolingDown(store, 313, 'settings', 'GH-6')).toBe(false);
    expect(coolingDown(store, 3130, 'settings', 'GH-5')).toBe(true);
});
