import { beforeAll, expect, test } from 'vitest';
import { PassRecord } from '../../../server/overseer/runner-state';
import { launcherSource } from './launch-world';

// What a finished pass amounts to, from its exit, its phase markers and its last line.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let outcome: any;
beforeAll(async () => { outcome = await launcherSource('pass-outcome'); });

const OFFICE = '/runner/state/office-data';
const record = (extra: Record<string, unknown> = {}) => ({ pass: '7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4', startedAt: '2026-11-26T09:00:00.000Z', endedAt: '2026-11-26T09:00:01.000Z', outcome: 'idle', detail: 'nothing eligible', ...extra });
const printed = (value: unknown) => `starting\n${JSON.stringify(value)}\n`;
const ended = (code: number | null, extra: Record<string, unknown> = {}) => ({ code, signal: null, phases: ['bootstrap', 'run'], stdout: '', stderr: '', ...extra });

test('exit 0 is a success only with a valid record naming the runner’s own Office data root', () => {
    for (const kind of ['stopped', 'paused', 'service-down', 'fenced', 'read-failed', 'idle', 'observing'])
        expect(outcome.classify(ended(0, { stdout: printed({ ...record({ outcome: kind }), officeDataRoot: OFFICE }) }), OFFICE)).toEqual({ kind: 'success', outcome: kind });
    const full = { ...record({ selected: { incident: 'inc-1', revision: 2, state: 'observed', kept: true }, released: { incident: 'inc-0', reason: 'state:fixing' }, cachedHealthAt: null, cachedIncidentsAt: '2026-11-26T08:59:00.000Z', note: 'n' }), officeDataRoot: OFFICE };
    expect(outcome.classify(ended(0, { stdout: printed(full) }), OFFICE).kind).toBe('success');
    const invalid: Record<string, string> = {
        'no output': '', 'cut short': printed({ ...record(), officeDataRoot: OFFICE }).slice(0, -20), 'another data root': printed({ ...record(), officeDataRoot: '/elsewhere' }),
        'an unknown outcome': printed({ ...record({ outcome: 'done' }), officeDataRoot: OFFICE }), 'an unknown key': printed({ ...record({ extra: 1 }), officeDataRoot: OFFICE }),
        'a record before other output': `${JSON.stringify({ ...record(), officeDataRoot: OFFICE })}\ntrailing\n`,
    };
    for (const [name, stdout] of Object.entries(invalid)) expect(outcome.classify(ended(0, { stdout }), OFFICE), name).toMatchObject({ kind: 'exit', detail: 'exit 0 without a valid pass record' });
});

test('the pass record the launcher accepts is the runner’s own PassRecord', () => {
    const cases = [record(), record({ outcome: 'observing', selected: { incident: 'inc-1', revision: 0, state: 'triaged', kept: false } }), record({ extra: 1 }), record({ outcome: 'done' }), record({ detail: 'x'.repeat(501) }), record({ startedAt: 'today' }), record({ selected: { incident: 'inc-1' } })];
    for (const value of cases) expect(outcome.validPassRecord({ ...value, officeDataRoot: OFFICE }, OFFICE), JSON.stringify(value)).toBe(PassRecord.safeParse(value).success);
});

test('every other ending is classified by its exit, its markers and, for an entry without markers, its own message', () => {
    const cases: [string, Record<string, unknown>, string][] = [
        ['exit 3', ended(3), 'locked'],
        ['exit 2', ended(2), 'startup'],
        ['exit 1 after run', ended(1), 'exit'],
        ['exit 1 after bootstrap only', ended(1, { phases: ['bootstrap'] }), 'startup'],
        ['exit 1 without markers, recording failed', ended(1, { phases: [], stderr: 'The pass could not be recorded: disk full' }), 'exit'],
        ['exit 1 without markers, anything else', ended(1, { phases: [], stderr: 'Cannot find module' }), 'startup'],
        ['exit 7', ended(7), 'exit'],
        ['a signal after bootstrap only', ended(null, { signal: 'SIGSEGV', phases: ['bootstrap'] }), 'startup'],
        ['a signal after run', ended(null, { signal: 'SIGSEGV' }), 'exit'],
        ['a signal without markers', ended(null, { signal: 'SIGSEGV', phases: [] }), 'exit'],
    ];
    for (const [name, value, kind] of cases) expect(outcome.classify(value, OFFICE).kind, name).toBe(kind);
});
