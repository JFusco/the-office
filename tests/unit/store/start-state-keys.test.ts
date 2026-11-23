import { expect, test } from 'vitest';
import { comparableRow } from '../../../server/release/fenced-start-writes';
import { START_STATE_KEYS, startStateKey } from '../../../server/store/start-state-keys';

/** Two values a start may write for each key, in the shape the previous release reads. */
const VALUES: Record<string, [unknown, unknown]> = {
    startedAt: ['2026-11-22T09:00:00.000Z', '2026-11-22T10:00:00.000Z'],
    serverTime: ['2026-11-22T09:00:00.000Z', '2026-11-22T10:00:00.000Z'],
    revision: [1, 2],
    events: [[{ id: 1 }], [{ id: 2 }, { id: 1 }]],
};
const part = (key: string, value: unknown) => comparableRow('state_parts', { key, position: 3, body: JSON.stringify(value) });
const whole = (key: string, value: unknown) => comparableRow('state', { id: 1, body: JSON.stringify({ paused: false, [key]: value, pilotKey: '' }) });

test('the keys a start rewrites are the four the store names, and no other', () => {
    expect([...START_STATE_KEYS].sort()).toEqual(Object.keys(VALUES).sort());
    expect(START_STATE_KEYS.map(startStateKey)).toEqual([true, true, true, true]);
    expect(['paused', 'agents', 'outbox', 'started', 'Revision', '', 'toString'].filter(startStateKey)).toEqual([]);
});

test.each(Object.entries(VALUES))('the release comparison sets aside a change to the value of %s alone, in its part row and in the whole row', (key, [before, after]) => {
    expect(startStateKey(key)).toBe(true);
    expect(part(key, after)).toEqual(part(key, before));
    expect(whole(key, after)).toEqual(whole(key, before));
    // Only the value: the key, its place and its shape are still compared.
    expect(part(key, { not: 'its shape' })).not.toEqual(part(key, before));
    expect(whole(key, { not: 'its shape' })).not.toEqual(whole(key, before));
    expect(comparableRow('state_parts', { key, position: 4, body: JSON.stringify(after) })).not.toEqual(part(key, before));
});

test('a change to any other key is a difference to the release comparison, as it is a reason for the store to remove the whole row', () => {
    expect(startStateKey('paused')).toBe(false);
    expect(part('paused', true)).not.toEqual(part('paused', false));
    expect(whole('paused', true)).not.toEqual(whole('paused', false));
});
