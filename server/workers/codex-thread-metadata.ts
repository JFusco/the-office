import type { DatabaseSync } from 'node:sqlite';

/** Well under SQLite's limit on bound values in one statement. */
export const METADATA_CHUNK = 500;

/**
 * Codex's own metadata rows for the given transcript paths, by path, read with one query per chunk of paths.
 * The `threads` table has no index on `rollout_path`, so every query scans it: one scan per transcript held the
 * service's main thread for seconds once many sessions were open. A path with more than one row keeps the first
 * in table order, as a single-row lookup did. A path with no row is simply absent; the caller refuses it.
 */
export function codexThreadMetadata(db: Pick<DatabaseSync, 'prepare'>, paths: Iterable<string>): Map<string, unknown> {
    const wanted = [...new Set(paths)], rows = new Map<string, unknown>();
    for (let from = 0; from < wanted.length; from += METADATA_CHUNK) {
        const chunk = wanted.slice(from, from + METADATA_CHUNK);
        const found = db.prepare(`SELECT id,cwd,name,title,git_branch,thread_source,source,rollout_path FROM threads WHERE rollout_path IN (${chunk.map(() => '?').join(',')}) ORDER BY rowid`)
            .all(...chunk) as { rollout_path: string }[];
        for (const row of found) if (!rows.has(row.rollout_path)) rows.set(row.rollout_path, row);
    }
    return rows;
}
