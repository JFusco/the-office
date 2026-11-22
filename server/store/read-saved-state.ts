import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { OfficeSnapshot } from '../../src/shared';
import { readSaved, savedText } from './saved-state';

/**
 * One project's saved state, as stored, through a read-only connection. The database file is never
 * created, migrated or written; SQLite may leave `-wal`/`-shm` sidecar files beside a WAL database.
 */
export function readSavedState(path: string): OfficeSnapshot | null {
    if (!existsSync(path)) return null;
    const db = new DatabaseSync(path, { readOnly: true });
    try {
        db.exec('PRAGMA busy_timeout=5000');
        const text = savedText(readSaved(db));
        return text === null ? null : JSON.parse(text) as OfficeSnapshot;
    } finally {
        db.close();
    }
}
