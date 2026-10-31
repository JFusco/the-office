import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DATA } from '../office/config';
import { type Clock, systemClock } from '../office/clock';
import type { DailyCTOReport, DailyCTOSummary } from '../../src/shared';
import { sanitizeObject } from '../office/security';
export interface CTOConfiguration {
    enabled: boolean;
    activatedAt: string;
}
/** Office-wide leadership state is deliberately separate from CEC's database. */
export class ControlStore {
    readonly db: DatabaseSync;
    constructor(path = `${DATA}/office-control.sqlite`, public clock: Clock = systemClock) {
        if (path !== ':memory:')
            mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
        this.db = new DatabaseSync(path);
        this.db.exec(`
      PRAGMA journal_mode=WAL;
      PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS configuration (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS daily_cto (id TEXT PRIMARY KEY, date TEXT NOT NULL UNIQUE, revision INTEGER NOT NULL, body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS leases (name TEXT PRIMARY KEY, owner TEXT NOT NULL, heartbeat_at TEXT NOT NULL);
    `);
        this.db.prepare('INSERT OR IGNORE INTO configuration VALUES(1,?)').run(JSON.stringify({ enabled: true, activatedAt: clock.now().toISOString() }));
    }
    configuration(): CTOConfiguration {
        const row = this.db.prepare('SELECT body FROM configuration WHERE id=1').get() as {
            body: string;
        };
        return JSON.parse(row.body);
    }
    configure(value: CTOConfiguration): void {
        if (typeof value.enabled !== 'boolean' || !Number.isFinite(Date.parse(value.activatedAt)))
            throw new Error('Invalid daily CTO configuration');
        this.db.prepare('UPDATE configuration SET body=? WHERE id=1').run(JSON.stringify(value));
    }
    get(id: string): DailyCTOReport | undefined {
        const row = this.db.prepare('SELECT body FROM daily_cto WHERE id=?').get(id) as {
            body: string;
        } | undefined;
        return row && JSON.parse(row.body);
    }
    forDate(date: string): DailyCTOReport | undefined {
        const row = this.db.prepare('SELECT body FROM daily_cto WHERE date=?').get(date) as {
            body: string;
        } | undefined;
        return row && JSON.parse(row.body);
    }
    enqueue(date: string, dueAt: string, facts: unknown): DailyCTOReport {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(dueAt)))
            throw new Error('Invalid daily review date');
        const report: DailyCTOReport = {
            id: randomUUID(), revision: 0, date, dueAt, collectedAt: this.clock.now().toISOString(), status: 'queued',
            facts: structuredClone(facts), result: null, attemptId: '', detail: 'All-project update collected; waiting for Avery.', applied: [], conflicts: [],
        };
        this.db.prepare('INSERT OR IGNORE INTO daily_cto VALUES(?,?,?,?)').run(report.id, date, 0, JSON.stringify(sanitizeObject(report)));
        return this.forDate(date)!;
    }
    update(id: string, revision: number, mutate: (report: DailyCTOReport) => void): DailyCTOReport {
        this.db.exec('BEGIN IMMEDIATE');
        try {
            const report = this.get(id);
            if (!report || report.revision !== revision)
                throw new Error('Daily CTO review changed; read it back before continuing');
            mutate(report);
            report.revision++;
            const result = this.db.prepare('UPDATE daily_cto SET revision=?,body=? WHERE id=? AND revision=?').run(report.revision, JSON.stringify(sanitizeObject(report)), id, revision);
            if (result.changes !== 1)
                throw new Error('Daily CTO review version conflict');
            this.db.exec('COMMIT');
            return report;
        }
        catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
    }
    list(limit = 50, before = ''): DailyCTOReport[] {
        if (!Number.isInteger(limit) || limit < 1 || limit > 100)
            throw new Error('Review page limit must be between 1 and 100');
        return (this.db.prepare("SELECT body FROM daily_cto WHERE (?='' OR date<?) ORDER BY date DESC LIMIT ?").all(before, before, limit) as {
            body: string;
        }[]).map(row => JSON.parse(row.body));
    }
    summaries(): DailyCTOSummary[] {
        return this.list(8).map(({ id, date, dueAt, collectedAt, status, detail }) => ({ id, date, dueAt, collectedAt, status, detail }));
    }
    coalesceBefore(date: string): void {
        const rows = this.db.prepare("SELECT body FROM daily_cto WHERE date<? AND json_extract(body,'$.status')='queued'").all(date) as {
            body: string;
        }[];
        for (const row of rows) {
            const report: DailyCTOReport = JSON.parse(row.body);
            this.update(report.id, report.revision, next => { next.status = 'coalesced'; next.detail = `Unstarted catch-up coalesced into ${date}; original collected facts retained.`; });
        }
    }
    recover(): void {
        // Startup runs only after the service PID ownership lock is acquired.
        this.db.exec('DELETE FROM leases');
        const rows = this.db.prepare("SELECT body FROM daily_cto WHERE json_extract(body,'$.status')='working'").all() as {
            body: string;
        }[];
        for (const row of rows) {
            const report: DailyCTOReport = JSON.parse(row.body);
            this.update(report.id, report.revision, next => { next.status = 'interrupted'; next.detail = 'Assessment interrupted; reconcile the saved read-only result and worker ownership before another assessment.'; });
        }
    }
    claimLease(name: string, owner: string): boolean {
        this.db.exec('BEGIN IMMEDIATE');
        try {
            const current = this.db.prepare('SELECT owner FROM leases WHERE name=?').get(name) as {
                owner: string;
            } | undefined;
            if (current && current.owner !== owner) {
                this.db.exec('COMMIT');
                return false;
            }
            this.db.prepare('INSERT INTO leases VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET heartbeat_at=excluded.heartbeat_at').run(name, owner, this.clock.now().toISOString());
            this.db.exec('COMMIT');
            return true;
        }
        catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
    }
    releaseLease(name: string, owner: string): void { this.db.prepare('DELETE FROM leases WHERE name=? AND owner=?').run(name, owner); }
    close(): void { this.db.close(); }
}
