import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { OfficeSnapshot } from '../../src/shared';

/**
 * One project's saved state, as stored, through a read-only connection. The database file is never
 * created, migrated or written; SQLite may leave `-wal`/`-shm` sidecar files beside a WAL database.
 */
export function readSavedState(path: string): OfficeSnapshot | null {
    if (!existsSync(path)) return null;
    const db = new DatabaseSync(path, { readOnly: true });
    try {
        db.exec('PRAGMA busy_timeout=5000');
        const row = db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined;
        return row ? JSON.parse(row.body) as OfficeSnapshot : null;
    } finally {
        db.close();
    }
}
