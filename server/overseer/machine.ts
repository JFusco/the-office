import { randomUUID } from 'node:crypto';
import { systemClock } from '../office/clock';
import { RUNNER_DEFAULTS, type RunnerPaths } from './config';
import { officeReader } from './office-client';
import { officeWriter } from './office-writer';
import type { PassMachine } from './pass';
import { openRunnerStore } from './runner-store';
import { pidAlive } from './single-flight';

/**
 * The data root this process's Office modules see, read when this module loads. The entry has
 * already set it to the runner's own folder; the entry prints it so a test can tell.
 */
export const officeDataRoot = process.env.OFFICE_DATA_ROOT ?? null;

/**
 * The real machine: the local Office over loopback, the system clock and the process table. The
 * runner Store opens only when the pass asks, once it holds the pass lock, and only in the
 * dedicated runner directory (runner-store.ts); a pass in any other root observes without
 * forwarding. The launcher starts a pass with an IPC channel; a pass run by hand has none.
 */
export function realMachine(paths: RunnerPaths, office: string): PassMachine {
    return {
        paths, reader: officeReader(office), now: () => systemClock.now(), pass: randomUUID(), pid: process.pid, alive: pidAlive, limits: RUNNER_DEFAULTS,
        reporting: {
            origin: office,
            openStore: async () => {
                const opened = await openRunnerStore(paths);
                return { effects: opened.effects, db: opened.store.db, close: opened.close };
            },
            writer: remaining => officeWriter(office, fetch, RUNNER_DEFAULTS, remaining),
            reader: remaining => officeReader(office, fetch, RUNNER_DEFAULTS, remaining),
            monotonic: () => performance.now(),
            launched: typeof process.send === 'function',
            parent: process.ppid,
        },
    };
}
