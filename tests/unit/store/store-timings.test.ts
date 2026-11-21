import { expect, test } from 'vitest';
import { MAX_TIMED_NAMES, storeTimings } from '../../../server/store/store-timings';

function clocked() { let at = 0; return { timings: storeTimings(() => at, '2026-11-21T00:00:00.000Z'), pass: (ms: number) => { at += ms; } }; }

test('each name totals its calls, time, slowest run and chars, slowest total first', () => {
    const { timings, pass } = clocked();
    expect(timings.time('save: serialise', () => { pass(20); return 'abcd'; }, text => text.length)).toBe('abcd');
    timings.time('save: serialise', () => { pass(30.26); return 'ab'; }, text => text.length);
    timings.time('save: redact', () => pass(100));
    timings.add('transaction: begin to commit', 5, 7);
    expect(timings.report()).toEqual({ since: '2026-11-21T00:00:00.000Z', timings: {
        'save: redact': { calls: 1, ms: 100, slowestMS: 100, chars: 0 },
        'save: serialise': { calls: 2, ms: 50.3, slowestMS: 30.3, chars: 6 },
        'transaction: begin to commit': { calls: 1, ms: 5, slowestMS: 5, chars: 7 } } });
    expect(Object.keys(timings.report().timings)).toEqual(['save: redact', 'save: serialise', 'transaction: begin to commit']);
});

test('work that throws is still timed, and its error reaches the caller unchanged', () => {
    const { timings, pass } = clocked(), failure = new Error('constraint');
    expect(() => timings.time('sql: INSERT', () => { pass(4); throw failure; })).toThrow(failure);
    expect(timings.report().timings['sql: INSERT']).toEqual({ calls: 1, ms: 4, slowestMS: 4, chars: 0 });
});

test('the table of names is bounded: past the bound, time is kept under one shared name', () => {
    const { timings } = clocked();
    for (let i = 0; i < MAX_TIMED_NAMES + 5; i++) timings.add(`name ${i}`, 1);
    timings.add('name 0', 1);
    const report = timings.report().timings;
    expect(Object.keys(report)).toHaveLength(MAX_TIMED_NAMES + 1);
    expect(report.other).toMatchObject({ calls: 5, ms: 5 });
    expect(report['name 0'].calls).toBe(2);
});
