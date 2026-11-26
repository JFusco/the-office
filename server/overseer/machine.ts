import { randomUUID } from 'node:crypto';
import { systemClock } from '../office/clock';
import { RUNNER_DEFAULTS, type RunnerPaths } from './config';
import { officeReader } from './office-client';
import type { PassMachine } from './pass';
import { pidAlive } from './single-flight';

/**
 * The data root this process's Office modules see, read when this module loads. The entry has
 * already set it to the runner's own folder; the entry prints it so a test can tell.
 */
export const officeDataRoot = process.env.OFFICE_DATA_ROOT ?? null;

/** The real machine: the local Office over loopback, the system clock and the process table. */
export function realMachine(paths: RunnerPaths, office: string): PassMachine {
    return { paths, reader: officeReader(office), now: () => systemClock.now(), pass: randomUUID(), pid: process.pid, alive: pidAlive, limits: RUNNER_DEFAULTS };
}
