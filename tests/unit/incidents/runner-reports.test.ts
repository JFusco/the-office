import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, test } from 'vitest';
import type { HaltReport } from '../../../server/incidents/runner-report';
import { RunnerReports } from '../../../server/incidents/runner-reports';
import { tempDir } from '../overseer/runner-world';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
const AT = new Date('2026-11-26T12:00:00.000Z');
const report = (sequence: number, over: Partial<HaltReport> = {}): HaltReport => ({ version: 1, sequence, kind: 'running', control: null, reason: '', since: null, pass: '7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4', reportedAt: '2026-11-26T12:00:00.000Z', ...over });
const stopped = (sequence: number, over: Partial<HaltReport> = {}) => report(sequence, { kind: 'stopped', control: 'STOP.json', reason: 'STOP: journal damaged', since: '2026-11-26T11:59:00.000Z', ...over });

test('opening and reading an empty control database create nothing in it', () => {
    const path = join(tempDir(), 'control.sqlite'), db = new DatabaseSync(path); dbs.push(db);
    db.exec('CREATE TABLE marker (x INTEGER)');
    const before = readFileSync(path), reports = new RunnerReports(db);
    expect(reports.halt()).toBeNull();
    expect(readFileSync(path)).toEqual(before);
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name='runner_halt'").get()).toBeUndefined();
});

test('a higher sequence replaces the report whatever its clock says, the same report again is a repeat, and a lower or conflicting one changes nothing', () => {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const reports = new RunnerReports(db);
    expect(reports.recordHalt(stopped(1), AT)).toEqual({ status: 'recorded', report: stopped(1) });
    // A clear with an earlier clock still overtakes the stop: sequence orders reports.
    const clear = report(2, { reportedAt: '2026-11-26T11:00:00.000Z' });
    expect(reports.recordHalt(clear, AT)).toEqual({ status: 'recorded', report: clear });
    expect(reports.recordHalt(clear, AT)).toEqual({ status: 'replayed', report: clear });
    expect(reports.recordHalt(stopped(1), AT)).toEqual({ status: 'stale', current: clear });
    expect(reports.recordHalt(stopped(2), AT)).toEqual({ status: 'conflict', current: clear });
    expect(reports.halt()).toEqual(clear);
    expect(db.prepare('SELECT COUNT(*) AS n FROM runner_halt').get()).toEqual({ n: 1 });
});

test('a report that breaks the contract is refused before anything is written', () => {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const reports = new RunnerReports(db);
    for (const bad of [report(1, { control: 'STOP.json' }), report(1, { kind: 'paused', control: 'pause.json', since: null }), report(0), { ...report(1), extra: true }])
        expect(() => reports.recordHalt(bad as HaltReport, AT)).toThrow();
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name='runner_halt'").get()).toBeUndefined();
});
