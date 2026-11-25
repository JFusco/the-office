import { expect, test } from 'vitest';
import { CallLedger } from '../../../server/github/call-ledger';
import { noCalls } from '../../../server/github/call-outcome';

const T0 = Date.parse('2026-11-24T12:00:00.000Z'), MINUTE = 60_000;
const one = (values: Partial<ReturnType<typeof noCalls>> = {}) => ({ ...noCalls(), invocations: 1, attempts: 1, pages: 1, responses: 1, fullResponses: 1, ...values });
function ledger() { let now = T0; const value = new CallLedger(() => now); return { value, at: (minutes: number) => { now = T0 + minutes * MINUTE; } }; }

test('calls are summed by source and family, busiest first, beside the totals', () => {
    const { value } = ledger();
    value.record('monitor', 'pulls', one({ attempts: 2, pages: 2, responses: 2, fullResponses: 2 }), 'brain');
    value.record('monitor', 'pull', one(), 'brain');
    value.record('monitor', 'pull', one(), 'cms-field-vocabulary');
    value.record('health', 'gh-auth', { ...noCalls(), invocations: 1, opaque: 1, unknown: 1 });
    const report = value.report();
    expect(report.totals).toMatchObject({ invocations: 4, attempts: 4, pages: 4, opaque: 1, unknown: 1 });
    expect(report.sources.map(s => [s.source, s.invocations])).toEqual([['monitor', 3], ['health', 1]]);
    expect(report.sources[0].families.map(f => [f.family, f.invocations, f.pages])).toEqual([['pull', 2, 2], ['pulls', 1, 2]]);
    expect(report.projects).toMatchObject([
        { project: 'brain', invocations: 2, pages: 3, sources: [{ source: 'monitor', families: [{ family: 'pull', pages: 1 }, { family: 'pulls', pages: 2 }] }] },
        { project: 'cms-field-vocabulary', invocations: 1, pages: 1, sources: [{ source: 'monitor', families: [{ family: 'pull', pages: 1 }] }] },
        { project: 'office', invocations: 1, pages: 0, sources: [{ source: 'health', opaque: 1 }] },
    ]);
});

test('the hour rolls: counts older than 60 minutes expire and the window says it is complete', () => {
    const { value, at } = ledger();
    value.record('monitor', 'pulls', one());
    at(30); value.record('pipelines', 'workflows', one());
    at(61);
    const report = value.report();
    expect(report.sources.map(s => s.source)).toEqual(['pipelines']);
    expect(report.window).toEqual({ from: new Date(T0 + MINUTE).toISOString(), to: new Date(T0 + 61 * MINUTE).toISOString(), coveredMinutes: 60, complete: true });
    at(95);
    expect(value.report()).toMatchObject({ totals: noCalls(), sources: [] });
});

test('a new ledger covers only the time since it started', () => {
    const { value, at } = ledger();
    at(10); value.record('monitor', 'issues', one());
    at(25);
    expect(value.report()).toMatchObject({ collectingSince: new Date(T0).toISOString(), window: { from: new Date(T0).toISOString(), coveredMinutes: 25, complete: false }, totals: { invocations: 1 } });
});
