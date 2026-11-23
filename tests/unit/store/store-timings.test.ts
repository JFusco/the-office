import { DatabaseSync } from 'node:sqlite';
import { expect, test } from 'vitest';
import { snapshotText } from '../../../server/office/http/snapshot-text';
import { storeTimings } from '../../../server/store/store-timings';
import { timeStatements } from '../../../server/store/timed-statements';

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

test('character sizing is outside the recorded work duration', () => {
    const { timings, pass } = clocked();
    timings.time('sql: SELECT', () => { pass(4); return 'text'; }, text => { pass(9); return text.length; });
    expect(timings.report().timings['sql: SELECT']).toEqual({ calls: 1, ms: 4, slowestMS: 4, chars: 4 });
});

test('more than 200 SQL shapes and later snapshot steps keep distinct totals', () => {
    const store = clocked();
    const { timings, pass } = store;
    using db = new DatabaseSync(':memory:');
    timeStatements(db, timings);
    const shapes = Array.from({ length: 201 }, (_, i) => `SELECT 'text' AS col_${i}`);
    for (const sql of shapes) db.prepare(sql).get();
    const requestText = snapshotText(store, () => {
        pass(12);
        return { toJSON() { pass(2); return { revision: 1 }; } };
    }, 'a request');
    const pushText = snapshotText(store, () => {
        pass(25);
        return { toJSON() { pass(4); return { revision: 12 }; } };
    }, 'a push');

    const report = timings.report().timings;
    expect(Object.keys(report)).toHaveLength(205);
    for (let i = 0; i < shapes.length; i++)
        expect(report[`sql: SELECT ? AS col_${i}`]).toMatchObject({ calls: 1, chars: 4 });
    expect(report['browser snapshot: build for a request']).toMatchObject({ calls: 1, ms: 12, chars: 0 });
    expect(report['browser snapshot: build for a push']).toMatchObject({ calls: 1, ms: 25, chars: 0 });
    expect(report['browser snapshot: redact and serialise for a request']).toMatchObject({ calls: 1, ms: 2, chars: requestText.length });
    expect(report['browser snapshot: redact and serialise for a push']).toMatchObject({ calls: 1, ms: 4, chars: pushText.length });
});
