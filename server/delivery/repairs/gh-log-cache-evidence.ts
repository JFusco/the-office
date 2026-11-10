import { lstatSync, opendirSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { readBoundedNoFollowSync } from '../../store/owned-artifact';
import type { TicketJob, WorkTime } from '../../../src/shared';

/** Potential facts for a full native audit, never standalone proof of which call wrote a cache. */
export function ghLogCacheEvidence(job: TicketJob, writer: Pick<WorkTime, 'startedAt' | 'endedAt'>, suppliedRoot?: string) {
    const runId = job.mergeScannerRetry?.runId, start = Date.parse(writer.startedAt), end = Date.parse(writer.endedAt);
    const facts: { path: string; sha256: string; size: number; runId: number; createdAt: string; modifiedAt: string }[] = [];
    if (process.env.VITEST && !suppliedRoot) return facts; // Unit callers must supply an owned fixture, never the operator cache.
    const root = suppliedRoot ?? resolve(homedir(), '.cache', 'gh');
    if (!Number.isSafeInteger(runId) || !runId || runId < 1 || !Number.isFinite(start) || !Number.isFinite(end) || end < start) return facts;
    try {
        for (const path of [dirname(root), root]) if (lstatSync(path).isSymbolicLink() || !lstatSync(path).isDirectory()) return facts;
        const names: string[] = [], directory = opendirSync(root), pattern = new RegExp(`^run-log-${runId}-[0-9]{1,20}\\.zip$`);
        try {
            for (let count = 0; ; count++) {
                const entry = directory.readSync();
                if (!entry) break;
                if (count >= 1000) return [];
                if (pattern.test(entry.name)) names.push(entry.name);
            }
        } finally { directory.closeSync(); }
        if (names.length > 8) return [];
        for (const name of names.sort()) {
            const path = resolve(root, name), before = lstatSync(path);
            if (!before.isFile() || before.isSymbolicLink() || before.size > 1048576 ||
                before.birthtimeMs < start || before.birthtimeMs > end || before.mtimeMs < start || before.mtimeMs > end) continue;
            const file = readBoundedNoFollowSync(path, 1048576), after = lstatSync(path);
            if (!('text' in file) || !file.text.startsWith('PK\u0003\u0004') || !after.isFile() || after.isSymbolicLink() ||
                before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) continue;
            facts.push({ path: resolve(realpathSync(root), name), sha256: file.sha256, size: after.size, runId,
                createdAt: new Date(before.birthtimeMs).toISOString(), modifiedAt: new Date(before.mtimeMs).toISOString() });
        }
    } catch { return []; } // Missing, unsafe or changed caches cannot supply affirmative audit evidence.
    return facts;
}
