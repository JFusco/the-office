import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test, vi } from 'vitest';
import { failureLine, readFailures } from '../../../server/overseer/failure-journal';
import { readStop } from '../../../server/overseer/kill-switch';
import { OfficeReadError } from '../../../server/overseer/office-client';
import { runPass } from '../../../server/overseer/pass';
import { readRunnerState } from '../../../server/overseer/runner-state';
import { clock, HEALTH, machine, runnerRoot, scriptedOffice } from './runner-world';

/** A pass that dies at a chosen point of a journal write: before the append, or after it but before the state that follows. */
const crash = vi.hoisted(() => ({ before: false, after: false }));
vi.mock('../../../server/overseer/failure-journal', async original => {
    const real = await original<typeof import('../../../server/overseer/failure-journal')>();
    return {
        ...real,
        appendFailureLine: (...args: Parameters<typeof real.appendFailureLine>) => {
            if (crash.before) throw new Error('the pass died before appending');
            const written = real.appendFailureLine(...args);
            if (crash.after) throw new Error('the pass died after appending');
            return written;
        },
    };
});

const quick = { serviceDownAfterMs: 0, serviceDownAfterFailures: 1 };
const down = () => Promise.reject(new OfficeReadError('/api/health could not be read: fetch failed (ECONNREFUSED)'));
const saved = (paths: ReturnType<typeof runnerRoot>) => {
    const read = readRunnerState(paths);
    if ('unreadable' in read) throw new Error(read.unreadable);
    return read.state;
};
const kinds = (paths: ReturnType<typeof runnerRoot>) => readFailures(paths, 1000).entries!.map(entry => entry.event.kind);

for (const point of ['before', 'after'] as const) {
    test(`a pass that dies ${point} appending service-down leaves its exact line; the next pass writes it once`, async () => {
        for (const next of ['still down', 'back at once'] as const) {
            const paths = runnerRoot(), time = clock(), office = scriptedOffice({ health: down });
            crash[point] = true;
            await expect(runPass(machine(paths, office.reader, { now: time.now, limits: quick }))).rejects.toThrow(`died ${point}`);
            crash[point] = false;
            const intent = saved(paths).intent!;
            expect(intent.id).toMatch(/^overseer:service-down:/);
            expect(kinds(paths), next).toEqual(point === 'after' ? ['service-down'] : []);
            if (next === 'back at once') office.health = async () => HEALTH;
            time.advance(60_000);
            office.calls.length = 0;
            const result = await runPass(machine(paths, office.reader, { now: time.now, limits: quick }));
            // The saved intent is settled before the Office is read.
            expect(office.calls[0], next).toBe('health');
            expect(readFileSync(paths.failures, 'utf8').split('\n')[0] + '\n', next).toBe(intent.line);
            expect(kinds(paths), next).toEqual(next === 'still down' ? ['service-down'] : ['service-down', 'service-restored']);
            expect(saved(paths), next).toMatchObject({ intent: null, outage: next === 'still down' ? { journaled: true, failures: 2 } : null });
            expect(result, next).toMatchObject({ record: { outcome: next === 'still down' ? 'service-down' : 'idle' } });
        }
    });
}

test('a pass that dies writing service-restored leaves it to the next pass, which writes it once', async () => {
    const paths = runnerRoot(), time = clock(), office = scriptedOffice({ health: down });
    await runPass(machine(paths, office.reader, { now: time.now, limits: quick }));
    office.health = async () => HEALTH;
    crash.after = true;
    time.advance(60_000);
    await expect(runPass(machine(paths, office.reader, { now: time.now, limits: quick }))).rejects.toThrow('died after');
    crash.after = false;
    const intent = saved(paths).intent!;
    expect(intent).toMatchObject({ id: expect.stringMatching(/^overseer:service-restored:/), next: null });
    time.advance(60_000);
    await runPass(machine(paths, office.reader, { now: time.now, limits: quick }));
    expect(kinds(paths)).toEqual(['service-down', 'service-restored']);
    expect(readFileSync(paths.failures, 'utf8').split('\n')[1] + '\n').toBe(intent.line);
    expect(saved(paths)).toMatchObject({ intent: null, outage: null });
});

test('a full journal keeps the intent and stops the runner with its first reason', async () => {
    const paths = runnerRoot(), office = scriptedOffice({ health: down });
    mkdirSync(paths.journal, { recursive: true });
    writeFileSync(paths.failures, Array.from({ length: 999 }, () => {
        const episode = randomUUID();
        return failureLine({ version: 1, id: `overseer:service-restored:${episode}`, kind: 'service-restored', at: '2026-11-25T11:00:00.000Z', episode, detail: 'x', evidence: {} });
    }).join(''));
    const result = await runPass(machine(paths, office.reader, { limits: quick }));
    expect(result).toMatchObject({ record: { outcome: 'stopped', detail: expect.stringContaining('is full (999 of 1000 events)') } });
    expect(saved(paths).intent?.id).toMatch(/^overseer:service-down:/);
    expect(readStop(paths)).toMatchObject({ record: { reason: expect.stringContaining('is full') } });
    expect(readFailures(paths, 1000).entries).toHaveLength(999);
});
