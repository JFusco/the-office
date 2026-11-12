import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * The process IDs Codex itself registered for its app-server daemon and that daemon's updater.
 * They host the shared runtime and never hold a session transcript. A missing or unreadable record names none.
 */
export function codexDaemonProcesses(directory = join(homedir(), '.codex/app-server-daemon')): number[] {
    return ['daemon.pid', 'daemon-updater.pid'].flatMap(name => {
        try {
            const pid = JSON.parse(readFileSync(join(directory, name), 'utf8'))?.pid;
            return Number.isSafeInteger(pid) && pid > 0 ? [pid] : [];
        } catch { return []; }
    });
}
