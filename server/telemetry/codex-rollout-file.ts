import { closeSync, lstatSync, openSync, readdirSync, readFileSync, readSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

/** Rollouts of long sessions grow large; refuse anything beyond this rather than read it partially. */
export const ROLLOUT_MAX_BYTES = 64 * 1024 * 1024;
const THREAD = /^[0-9a-f-]{20,64}$/i;

export function codexHome(env: NodeJS.ProcessEnv = process.env): string {
    return resolve(env.CODEX_HOME || resolve(homedir(), '.codex'));
}

function dayDirs(home: string, startedAt: string): string[] {
    const start = Date.parse(startedAt);
    if (!Number.isFinite(start)) return [];
    return [0, -1, 1].map(offset => {
        const day = new Date(start + offset * 86_400_000);
        return resolve(home, 'sessions', String(day.getFullYear()), String(day.getMonth() + 1).padStart(2, '0'), String(day.getDate()).padStart(2, '0'));
    });
}
const regularFile = (path: string) => { try { return lstatSync(path).isFile(); } catch { return false; } };

/**
 * Finds the rollout for a thread. Codex files rollouts under the local start date, so the
 * day before and after the run's start are searched too. Only regular files are accepted.
 */
export function findCodexRollout(home: string, threadId: string, startedAt: string): string | null {
    if (!THREAD.test(threadId)) return null;
    for (const dir of dayDirs(home, startedAt)) {
        let names: string[];
        try { names = readdirSync(dir); } catch { continue; }
        const name = names.find(entry => entry.startsWith('rollout-') && entry.endsWith(`-${threadId}.jsonl`));
        if (name && regularFile(resolve(dir, name))) return resolve(dir, name);
    }
    return null;
}

/** First line only (session_meta), bounded, so scanning siblings never reads whole rollouts. */
function firstLine(path: string, limit = 4 * 1024 * 1024): string {
    const fd = openSync(path, 'r');
    try {
        const chunk = Buffer.alloc(64 * 1024), parts: Buffer[] = [];
        let total = 0;
        while (total < limit) {
            const read = readSync(fd, chunk, 0, chunk.length, total);
            if (!read) break;
            const newline = chunk.subarray(0, read).indexOf(10);
            parts.push(Buffer.from(chunk.subarray(0, newline < 0 ? read : newline)));
            total += read;
            if (newline >= 0) break;
        }
        return Buffer.concat(parts).toString('utf8');
    }
    finally { closeSync(fd); }
}

/** Rollout filenames carry their local creation time: `rollout-YYYY-MM-DDTHH-MM-SS-<thread>.jsonl`. */
function createdAt(name: string): number | null {
    const m = name.match(/^rollout-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() : null;
}
const CLOCK_SKEW_MS = 10 * 60_000;

/**
 * Codex starts separate threads on behalf of a run, such as the guardian that reviews approval
 * requests, and sub-agents that may start guardians of their own. They are model work for the
 * same run; each names its parent thread. Headers are read once (only for rollouts created after
 * the run started) and the tree is walked breadth-first.
 */
export function findCodexChildRollouts(home: string, rootThreadId: string, startedAt: string): { path: string; threadId: string }[] {
    if (!THREAD.test(rootThreadId)) return [];
    const start = Date.parse(startedAt), byParent = new Map<string, { path: string; threadId: string }[]>();
    for (const dir of dayDirs(home, startedAt)) {
        let names: string[];
        try { names = readdirSync(dir); } catch { continue; }
        for (const name of names) {
            const created = createdAt(name), path = resolve(dir, name);
            if (!name.endsWith('.jsonl') || created === null || created < start - CLOCK_SKEW_MS || name.endsWith(`-${rootThreadId}.jsonl`) || !regularFile(path)) continue;
            try {
                const meta = JSON.parse(firstLine(path)), parent = meta?.payload?.parent_thread_id, id = meta?.payload?.id;
                if (meta?.type === 'session_meta' && typeof parent === 'string' && typeof id === 'string' && THREAD.test(id))
                    byParent.set(parent, [...(byParent.get(parent) || []), { path, threadId: id }]);
            }
            catch { /* not a readable rollout header; not attributable */ }
        }
    }
    const found: { path: string; threadId: string }[] = [], visited = new Set([rootThreadId]), queue = [rootThreadId];
    while (queue.length)
        for (const child of byParent.get(queue.shift()!) || [])
            if (!visited.has(child.threadId)) { visited.add(child.threadId); found.push(child); queue.push(child.threadId); }
    return found;
}

/** Bounded read; a symlink, oversized or unreadable file yields a reason instead of content. */
export function readCodexRollout(path: string): { text: string; sha256: string } | { reason: string } {
    try {
        const stat = lstatSync(path);
        if (!stat.isFile()) return { reason: 'rollout-not-a-regular-file' };
        if (stat.size > ROLLOUT_MAX_BYTES) return { reason: 'rollout-too-large' };
        const bytes = readFileSync(path);
        return { text: bytes.toString('utf8'), sha256: createHash('sha256').update(bytes).digest('hex') };
    }
    catch { return { reason: 'rollout-unreadable' }; }
}
