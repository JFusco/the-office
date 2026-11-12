import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * The live processes Codex itself registered as its app-server daemon and that daemon's updater. They host the shared
 * runtime and never hold a session transcript. A record counts only when the live process with that ID started at the
 * recorded time, so a stale record cannot name a later process that reused the ID.
 */
export function codexDaemonProcesses(started: ReadonlyMap<number, string>, directory = join(homedir(), '.codex/app-server-daemon')): number[] {
    return ['daemon.pid', 'daemon-updater.pid'].flatMap(name => {
        try {
            const { pid, processStartTime } = JSON.parse(readFileSync(join(directory, name), 'utf8'));
            const recorded = typeof processStartTime === 'string' ? processStartTime.trim().split(/\s+/).join(' ') : '';
            return Number.isSafeInteger(pid) && pid > 0 && recorded && started.get(pid) === recorded ? [pid] : [];
        } catch { return []; }
    });
}
