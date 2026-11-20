import { readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SNAPSHOT_PREFIX } from './session-context-snapshot';

/** A capture finishes within seconds; a directory older than this was left by a service that died. */
export const STALE_SNAPSHOT_MS = 60 * 1000;

/**
 * Removes capture directories a service that died left behind, which may hold a named clone of a session
 * log. Only real directories with the capture prefix that are older than a minute are removed, so a capture
 * in progress, here or in another process, is not disturbed. Returns how many were removed; never throws.
 */
export function removeStaleSessionSnapshots(directory = tmpdir(), now = Date.now()): number {
    let removed = 0;
    try {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            if (!entry.isDirectory() || !entry.name.startsWith(SNAPSHOT_PREFIX)) continue;
            const path = join(directory, entry.name);
            try {
                if (now - statSync(path).mtimeMs < STALE_SNAPSHOT_MS) continue;
                rmSync(path, { recursive: true, force: true });
                removed++;
            } catch { /* Gone already, or not ours to remove. */ }
        }
    } catch { /* No temporary directory to read. */ }
    return removed;
}
