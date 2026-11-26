import { createHash, randomUUID } from 'node:crypto';
import { lstatSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach } from 'vitest';
import { RUNNER_DEFAULTS, runnerPaths, type RunnerLimits, type RunnerPaths } from '../../../server/overseer/config';
import type { HealthReading, IncidentRow, OfficeReader } from '../../../server/overseer/office-client';
import type { PassMachine } from '../../../server/overseer/pass';

/** Test support for the Overseer runner: temporary roots, a scripted Office and a settable clock. */

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));

/** A fresh physical temporary directory, removed after the test. */
export function tempDir(prefix = 'overseer-'): string {
    const root = realpathSync(mkdtempSync(resolve(tmpdir(), prefix)));
    roots.push(root);
    return root;
}
export const runnerRoot = (): RunnerPaths => runnerPaths(join(tempDir(), 'runner'));

export const HEALTH: HealthReading = { serviceInstanceId: 'service-1', loadedHash: 'a'.repeat(64), pid: 4242, busy: false, fence: 'open', release: { status: 'verified', commit: 'b'.repeat(40) } };
export const incidentId = (n: number) => `inc-${n.toString(16).padStart(16, '0')}`;
export const row = (id: string, extra: Partial<IncidentRow> = {}): IncidentRow =>
    ({ id, state: 'observed', revision: 1, source: 'stopped-work', researchEligible: true, researchAt: '2026-11-20T00:00:00.000Z', openSubjects: 1, ...extra });

export function clock(start = '2026-11-25T12:00:00.000Z') {
    let time = Date.parse(start);
    return { now: () => new Date(time), advance: (ms: number) => { time += ms; } };
}

/** An Office whose answers the test sets; `calls` lists what was read. */
export function scriptedOffice(answers: { health?: () => Promise<HealthReading>; incidents?: () => Promise<IncidentRow[]> } = {}) {
    const calls: string[] = [];
    const reader: OfficeReader = {
        health: () => { calls.push('health'); return answers.health ? answers.health() : Promise.resolve(HEALTH); },
        researchIncidents: () => { calls.push('incidents'); return answers.incidents ? answers.incidents() : Promise.resolve([]); },
    };
    return Object.assign(answers, { calls, reader });
}

export function machine(paths: RunnerPaths, reader: OfficeReader, overrides: Omit<Partial<PassMachine>, 'limits'> & { limits?: Partial<RunnerLimits> } = {}): PassMachine {
    const { limits, ...rest } = overrides;
    return { paths, reader, now: () => new Date('2026-11-25T12:00:00.000Z'), pass: randomUUID(), pid: 777, alive: () => false, limits: { ...RUNNER_DEFAULTS, ...limits }, ...rest };
}

/** Every path under a directory with its type, mode and content hash: equal snapshots mean nothing changed. */
export function snapshot(directory: string): Record<string, string> {
    const entries: Record<string, string> = {};
    const walk = (path: string) => {
        let stat;
        try { stat = lstatSync(path); } catch { return; }
        const key = path.slice(directory.length) || '/';
        if (stat.isSymbolicLink()) entries[key] = `link:${readlinkSync(path)}`;
        else if (stat.isDirectory()) { entries[key] = `dir:${stat.mode}`; for (const name of readdirSync(path).sort()) walk(join(path, name)); }
        else entries[key] = `file:${stat.mode}:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
    };
    walk(directory);
    return entries;
}
