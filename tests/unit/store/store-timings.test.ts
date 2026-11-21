import { DatabaseSync } from 'node:sqlite';
import { expect, test } from 'vitest';
import { serialisedSnapshot } from '../../../server/office/http/serialised-snapshot';
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
    const { timings } = clocked();
    using db = new DatabaseSync(':memory:');
    timeStatements(db, timings);
    const shapes = Array.from({ length: 201 }, (_, i) => `SELECT 'text' AS col_${i}`);
    for (const sql of shapes) db.prepare(sql).get();
    const snapshot = timings.time('browser snapshot: build and redact', () => ({ revision: 1 }));
    const body = serialisedSnapshot({ timings }, snapshot, 'a request');
    serialisedSnapshot({ timings }, snapshot, 'a push');

    const report = timings.report().timings;
    expect(Object.keys(report)).toHaveLength(204);
    for (let i = 0; i < shapes.length; i++)
        expect(report[`sql: SELECT ? AS col_${i}`]).toMatchObject({ calls: 1, chars: 4 });
    expect(report['browser snapshot: build and redact']).toMatchObject({ calls: 1, chars: 0 });
    expect(report['browser snapshot: serialise for a request']).toMatchObject({ calls: 1, chars: body.length });
    expect(report['browser snapshot: serialise for a push']).toMatchObject({ calls: 1, chars: body.length });
});
