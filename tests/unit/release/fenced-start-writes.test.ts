import { expect, test } from 'vitest';
import { APPENDED_TABLE, comparableOrder, comparableRow, startEvent } from '../../../server/release/fenced-start-writes';

const body = (state: unknown) => (comparableRow('state', { id: 1n, body: JSON.stringify(state) }) as { body: string }).body;

test('a state row is compared without the values a start rewrites, and nothing else', () => {
    const before = { revision: 7, serverTime: 't0', startedAt: 't0', paused: false, events: [{ id: 7 }], tickets: [{ key: 'GH-1' }] };
    const started = { ...before, revision: 8, serverTime: 't1', startedAt: 't1', events: [{ id: 8 }, { id: 7 }] };
    expect(body(started)).toBe(body(before));
    expect(body({ ...started, paused: true })).not.toBe(body(before));
    expect(body({ ...started, tickets: [] })).not.toBe(body(before));
    // Key order is content: the previous release reads the text as it was written.
    expect(body({ tickets: [], paused: false })).not.toBe(body({ paused: false, tickets: [] }));
});

test.each<[string, Record<string, unknown>]>([
    ['a removed key', { startedAt: undefined }],
    ['an event list that is not a list', { events: 'gone' }],
    ['a revision that is not a count', { revision: { n: 8 } }],
    ['a negative revision', { revision: -1 }],
    ['a clock that is not text', { serverTime: 1 }],
    ['a start time that is null', { startedAt: null }],
])('%s among the start keys is a difference', (_, patch) => {
    const before = { revision: 7, serverTime: 't0', startedAt: 't0', events: [] as unknown[] };
    expect(body({ ...before, ...patch })).not.toBe(body(before));
});

test.each(['not json', '[1]', 'null', '"startedAt"'])('a state body that is not an object (%s) is compared whole', text => {
    expect(comparableRow('state', { id: 1n, body: text })).toEqual({ id: 1n, body: text });
});

test('a state part is compared without the value a start rewrites, while it keeps its key, place and shape', () => {
    const part = (key: string, value: unknown, position = 2n) => comparableRow('state_parts', { key, position, body: JSON.stringify(value) });
    expect(part('startedAt', 't1')).toEqual(part('startedAt', 't0'));
    expect(part('revision', 8)).toEqual(part('revision', 7));
    expect(part('events', [{ id: 8 }])).toEqual(part('events', []));
    expect(part('startedAt', 't1', 3n)).not.toEqual(part('startedAt', 't0'));
    for (const [key, value] of [['startedAt', null], ['serverTime', 1], ['revision', -1], ['events', 'gone']] as const)
        expect(part(key, value)).toEqual({ key, position: 2n, body: JSON.stringify(value) });
    expect(comparableRow('state_parts', { key: 'events', position: 2n, body: 'not json' })).toEqual({ key: 'events', position: 2n, body: 'not json' });
    expect(part('paused', true)).not.toEqual(part('paused', false));
    expect(part('toString', 't1')).toEqual({ key: 'toString', position: 2n, body: '"t1"' });
    // Replacing a part moves its row, so parts are read by key; every other table is read as it lies.
    expect(comparableOrder('state_parts')).toBe(' ORDER BY key');
    expect(['state', 'events', 'effects', 'sqlite_sequence'].map(comparableOrder)).toEqual(['', '', '', '']);
});

test('only an event counter that names the last event is left out; every other row is compared as it is', () => {
    expect(APPENDED_TABLE).toBe('events');
    const counter = { name: 'events', seq: 9n };
    expect(comparableRow('sqlite_sequence', counter, 9n)).toBeNull();
    expect(comparableRow('sqlite_sequence', { name: 'events', seq: 9 }, 9n)).toBeNull();
    for (const last of [8n, 10n, undefined]) expect(comparableRow('sqlite_sequence', counter, last)).toBe(counter);
    for (const seq of ['9', null, 9.5]) expect(comparableRow('sqlite_sequence', { name: 'events', seq }, 9n)).toEqual({ name: 'events', seq });
    const admissions = { name: 'admissions', seq: 3n }, effect = { id: 'e1', body: '{"startedAt":"t"}' };
    expect(comparableRow('sqlite_sequence', admissions, 3n)).toBe(admissions);
    expect(comparableRow('effects', effect)).toBe(effect);
    expect(comparableRow('events', { id: 1n, body: 'x' })).toEqual({ id: 1n, body: 'x' });
});

test('only an office-opened event is one a start records', () => {
    expect(startEvent({ id: 2n, body: JSON.stringify({ id: 0, at: 't', kind: 'office-opened', message: 'open' }) })).toBe(true);
    for (const text of [JSON.stringify({ kind: 'work-time-reported' }), JSON.stringify({ message: 'office-opened' }), '"office-opened"', 'office-opened', 'null', '[]'])
        expect(startEvent({ id: 2n, body: text })).toBe(false);
    expect(startEvent({ id: 2n, body: new Uint8Array([1]) })).toBe(false);
});
