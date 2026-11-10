import type { DatabaseSync } from 'node:sqlite';
export function sourceSchema(db: DatabaseSync): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS knowledge_sources (id TEXT PRIMARY KEY, identity TEXT UNIQUE, revision INTEGER NOT NULL, body TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS knowledge_subscriptions (source_id TEXT NOT NULL, project_id TEXT NOT NULL, active INTEGER NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(source_id,project_id));
        CREATE TABLE IF NOT EXISTS knowledge_source_meta (id TEXT PRIMARY KEY, body TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS knowledge_launches (attempt TEXT PRIMARY KEY, day TEXT NOT NULL, source_id TEXT NOT NULL, state TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS knowledge_launch_day ON knowledge_launches(day);
        CREATE TABLE IF NOT EXISTS knowledge_backoff (id TEXT PRIMARY KEY, until_at TEXT NOT NULL);
    `);
}
