import type { DatabaseSync } from 'node:sqlite';
import type { Incident, IncidentEvent } from '../../src/contracts/incidents';

/** What one observation changes: events to append and the incidents they leave behind. */
export interface IncidentChange { events: IncidentEvent[]; incidents: Incident[] }

const absent = (error: unknown) => /no such table/i.test(String(error));
/** The same value whatever order its properties were written in; arrays keep their order. */
const canonical = (value: unknown): string => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : item);
const isOpen = (incident: Incident) => incident.subjects.some(subject => subject.status === 'open') ? 1 : 0;

/**
 * The office-wide incident record, on the office control database beside the deployment fence. An
 * append-only event history says what was observed and when; one row per incident holds its
 * current projection. A change is recorded whole or not at all. Nothing here reads or writes a
 * project store.
 *
 * The tables are created by the first recorded change, never by opening the ledger: a release
 * that starts under a deployment's fence must leave the control database exactly as it found it,
 * or that deployment could no longer be rolled back.
 */
export class IncidentLedger {
    constructor(private db: DatabaseSync) {}

    private read<T>(query: () => T, none: T): T {
        try { return query(); } catch (error) { if (absent(error)) return none; throw error; }
    }

    list(): Incident[] {
        return this.read(() => (this.db.prepare('SELECT body FROM incidents ORDER BY id').all() as { body: string }[]).map(row => JSON.parse(row.body) as Incident), []);
    }

    /** The incidents an observation can change: every one with a subject still open, and any with one of these fingerprints. */
    current(fingerprints: Iterable<string> = []): Incident[] {
        return this.read(() => {
            const found = new Map((this.db.prepare('SELECT id, body FROM incidents WHERE open=1').all() as { id: string; body: string }[]).map(row => [row.id, row.body]));
            const byPrint = this.db.prepare('SELECT id, body FROM incidents WHERE fingerprint=?');
            for (const print of fingerprints) { const row = byPrint.get(print) as { id: string; body: string } | undefined; if (row) found.set(row.id, row.body); }
            return [...found.values()].map(body => JSON.parse(body) as Incident);
        }, []);
    }

    get(id: string): Incident | null {
        return this.read(() => { const row = this.db.prepare('SELECT body FROM incidents WHERE id=?').get(id) as { body: string } | undefined; return row ? JSON.parse(row.body) as Incident : null; }, null);
    }

    /** One recorded event by its ID, or null. */
    event(id: string): IncidentEvent | null {
        return this.read(() => { const row = this.db.prepare('SELECT body FROM incident_events WHERE id=?').get(id) as { body: string } | undefined; return row ? JSON.parse(row.body) as IncidentEvent : null; }, null);
    }

    /** How often a subject was observed in an incident, and when first, from the event history; null if never. */
    subjectHistory(incident: string, subject: string): { episodes: number; firstObservedAt: string } | null {
        return this.read(() => {
            const row = this.db.prepare("SELECT COUNT(*) AS episodes, MIN(at) AS first FROM incident_events WHERE incident=? AND kind IN ('subject-observed','episode-observed') AND json_extract(body,'$.body.subject')=?").get(incident, subject) as { episodes: number; first: string | null };
            return row.episodes && row.first ? { episodes: row.episodes, firstObservedAt: row.first } : null;
        }, null);
    }

    events(incident: string): IncidentEvent[] {
        return this.read(() => (this.db.prepare('SELECT body FROM incident_events WHERE incident=? ORDER BY seq').all(incident) as { body: string }[]).map(row => JSON.parse(row.body) as IncidentEvent), []);
    }

    /**
     * Appends the events and saves the projections in one transaction. An event already recorded
     * with the same content is skipped; the same ID with different content refuses the whole
     * change. Each incident must carry the revision after the one stored, so a projection computed
     * from a stale read is refused instead of overwriting a newer one.
     */
    record(change: IncidentChange): void {
        if (!change.events.length && !change.incidents.length) return;
        this.db.exec('BEGIN IMMEDIATE');
        try {
            this.db.exec('CREATE TABLE IF NOT EXISTS incident_events (seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE, incident TEXT NOT NULL, at TEXT NOT NULL, kind TEXT NOT NULL, body TEXT NOT NULL)');
            this.db.exec('CREATE INDEX IF NOT EXISTS incident_events_incident ON incident_events(incident, seq)');
            this.db.exec('CREATE TABLE IF NOT EXISTS incidents (id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL UNIQUE, revision INTEGER NOT NULL CHECK(revision>=1), open INTEGER NOT NULL, body TEXT NOT NULL)');
            this.db.exec('CREATE INDEX IF NOT EXISTS incidents_open ON incidents(open)');
            const known = this.db.prepare('SELECT body FROM incident_events WHERE id=?'), append = this.db.prepare('INSERT INTO incident_events(id,incident,at,kind,body) VALUES(?,?,?,?,?)');
            for (const event of change.events) {
                const body = JSON.stringify(event), saved = known.get(event.id) as { body: string } | undefined;
                if (saved && canonical(JSON.parse(saved.body)) !== canonical(event)) throw new Error(`Incident event ${event.id} was already recorded with different content`);
                if (!saved) append.run(event.id, event.incident, event.at, event.kind, body);
            }
            const revision = this.db.prepare('SELECT revision FROM incidents WHERE id=?'), save = this.db.prepare('INSERT INTO incidents(id,fingerprint,revision,open,body) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision, open=excluded.open, body=excluded.body');
            for (const incident of change.incidents) {
                const stored = (revision.get(incident.id) as { revision: number } | undefined)?.revision ?? 0;
                if (incident.revision !== stored + 1) throw new Error(`Incident ${incident.id} is at revision ${stored}; a change to revision ${incident.revision} is refused`);
                save.run(incident.id, incident.fingerprint, incident.revision, isOpen(incident), JSON.stringify(incident));
            }
            this.db.exec('COMMIT');
        } catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
    }
}
