import type { DatabaseSync } from 'node:sqlite';
export function initializeStoreSchema(db: DatabaseSync): void {
    db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts (id TEXT PRIMARY KEY, ticket TEXT NOT NULL, stage TEXT NOT NULL, status TEXT NOT NULL, session TEXT, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS lock (name TEXT PRIMARY KEY, owner TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS effects (id TEXT PRIMARY KEY, work_key TEXT NOT NULL, status TEXT NOT NULL, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS work_claims (id TEXT PRIMARY KEY, work_key TEXT NOT NULL, status TEXT NOT NULL, body TEXT NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS active_work_claim ON work_claims(work_key) WHERE status IN ('running','stopping');
    CREATE TABLE IF NOT EXISTS goal_review_applications (review_id TEXT NOT NULL, project_id TEXT NOT NULL, goal_id TEXT NOT NULL, at TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(review_id,project_id,goal_id));
    CREATE INDEX IF NOT EXISTS goal_application_history ON goal_review_applications(project_id,goal_id,at);
    CREATE TABLE IF NOT EXISTS queue_observations (work_key TEXT NOT NULL,stage TEXT NOT NULL,enqueued_at TEXT NOT NULL,ready_at TEXT NOT NULL,PRIMARY KEY(work_key,stage));
    CREATE TABLE IF NOT EXISTS queue_timings (claim_id TEXT PRIMARY KEY,work_key TEXT NOT NULL,body TEXT NOT NULL);
  `);
}
