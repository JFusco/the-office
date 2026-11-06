import type { DatabaseSync } from 'node:sqlite';
/**
 * Connection behavior is chosen here, never inherited from the binding's compile defaults.
 * synchronous=FULL: an effect intent is committed before its remote dispatch and is never resent,
 * so it must survive power loss; WAL with NORMAL may roll back the last commits (sqlite.org/pragma.html#pragma_synchronous).
 */
export function applyConnectionSettings(db: DatabaseSync): void {
    db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
}
/** Long-lived connections: bounded statistics once the schema exists (sqlite.org/pragma.html#pragma_optimize). */
export function optimizeOnOpen(db: DatabaseSync): void {
    db.exec('PRAGMA optimize=0x10002');
}
/** Refresh planner statistics, then close. Statistics are advisory, so they never block shutdown. */
export function closeConnection(db: DatabaseSync): void {
    if (db.isOpen) {
        try { db.exec('PRAGMA optimize'); }
        catch { /* Closing must not fail on advisory statistics. */ }
    }
    db.close();
}
