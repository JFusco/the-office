import { constants } from 'node:fs';
import { open, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { readBoundedNoFollow, type BoundedRead } from '../store/owned-artifact';

/** The largest rollout observed is ~17 MB; refuse anything far beyond that rather than read it partially. */
export const ROLLOUT_MAX_BYTES = 64 * 1024 * 1024;
const HEADER_MAX_BYTES = 4 * 1024 * 1024;
const CLOCK_SKEW_MS = 10 * 60_000;
const THREAD = /^[0-9a-f-]{20,64}$/i;

export function codexHome(env: NodeJS.ProcessEnv = process.env): string {
    return resolve(env.CODEX_HOME || resolve(homedir(), '.codex'));
}

/** Codex files rollouts under their local creation date; search that day and its calendar neighbours (DST-safe). */
function dayDirs(home: string, startedAt: string): string[] {
    const start = new Date(Date.parse(startedAt));
    if (!Number.isFinite(start.getTime())) return [];
    return [0, -1, 1].map(offset => {
        const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
        return resolve(home, 'sessions', String(day.getFullYear()), String(day.getMonth() + 1).padStart(2, '0'), String(day.getDate()).padStart(2, '0'));
    });
}

/** Rollout filenames carry their local creation time: `rollout-YYYY-MM-DDTHH-MM-SS-<thread>.jsonl`. */
function createdAt(name: string): number | null {
    const m = name.match(/^rollout-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() : null;
}

/** First line only (session_meta), bounded, without following symlinks. */
async function header(path: string): Promise<any> {
    const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
        if (!(await handle.stat()).isFile()) return null;
        const parts: Buffer[] = [], chunk = Buffer.alloc(64 * 1024);
        for (let total = 0; total < HEADER_MAX_BYTES;) {
            const { bytesRead } = await handle.read(chunk, 0, chunk.length, total);
            if (!bytesRead) break;
            const newline = chunk.subarray(0, bytesRead).indexOf(10);
            parts.push(Buffer.from(chunk.subarray(0, newline < 0 ? bytesRead : newline)));
            total += bytesRead;
            if (newline >= 0) break;
        }
        return JSON.parse(Buffer.concat(parts).toString('utf8'));
    }
    finally { await handle.close(); }
}

export interface RolloutScan { root: string | null; descendants: { path: string; threadId: string }[] }

/**
 * One pass over the candidate day directories finds the run's own rollout and every thread Codex
 * started on its behalf: the approval guardian, sub-agents, and their own children, each naming
 * its parent thread. Only rollouts created after the run started are opened, header only.
 */
export async function scanCodexRollouts(home: string, threadId: string, startedAt: string): Promise<RolloutScan> {
    if (!THREAD.test(threadId)) return { root: null, descendants: [] };
    const start = Date.parse(startedAt), byParent = new Map<string, { path: string; threadId: string }[]>();
    let root: string | null = null;
    for (const dir of dayDirs(home, startedAt)) {
        let names: string[];
        try { names = await readdir(dir); } catch { continue; }
        for (const name of names) {
            if (!name.startsWith('rollout-') || !name.endsWith('.jsonl')) continue;
            const path = resolve(dir, name);
            if (name.endsWith(`-${threadId}.jsonl`)) { root ??= path; continue; }
            const created = createdAt(name);
            if (created === null || created < start - CLOCK_SKEW_MS) continue;
            try {
                const meta = await header(path), parent = meta?.payload?.parent_thread_id, id = meta?.payload?.id;
                if (meta?.type === 'session_meta' && typeof parent === 'string' && typeof id === 'string' && THREAD.test(id))
                    byParent.set(parent, [...(byParent.get(parent) || []), { path, threadId: id }]);
            }
            catch { /* unreadable header: not attributable */ }
        }
    }
    const descendants: RolloutScan['descendants'] = [], visited = new Set([threadId]), queue = [threadId];
    while (queue.length)
        for (const child of byParent.get(queue.shift()!) || [])
            if (!visited.has(child.threadId)) { visited.add(child.threadId); descendants.push(child); queue.push(child.threadId); }
    return { root, descendants };
}

export function readCodexRollout(path: string): Promise<BoundedRead> {
    return readBoundedNoFollow(path, ROLLOUT_MAX_BYTES);
}
