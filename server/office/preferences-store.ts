import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { OFFICE_PREFERENCE_DEFAULTS, type OfficePreferences, type OfficePreferencesPatch } from '../../src/shared';

const fields = {
    quality: z.enum(['high', 'low']),
    reducedMotion: z.boolean(),
    keyboardShortcuts: z.boolean(),
    deliveryToasts: z.boolean(),
    coffeeBreaks: z.boolean(),
};
const StoredBody = z.object(fields).strict();
/** A client patch: only writable fields, at least one of them. */
export const PreferencesPatch = z.object(fields).partial().strict().refine(patch => Object.keys(patch).length > 0, 'At least one preference is required');

/** Office-wide preferences in a one-row table on the borrowed office control database. */
export class PreferencesStore {
    private listeners = new Set<(preferences: OfficePreferences) => void>();
    constructor(private db: DatabaseSync) {
        db.exec('CREATE TABLE IF NOT EXISTS office_preferences (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL CHECK(revision>=0), body TEXT NOT NULL)');
        const { revision: _revision, ...body } = OFFICE_PREFERENCE_DEFAULTS;
        db.prepare('INSERT OR IGNORE INTO office_preferences VALUES(1,0,?)').run(JSON.stringify(body));
    }
    read(): OfficePreferences {
        const row = this.db.prepare('SELECT revision, body FROM office_preferences WHERE id=1').get() as { revision: number; body: string } | undefined;
        if (!row) throw new Error('Office preferences are missing');
        const body = StoredBody.safeParse(JSON.parse(row.body));
        if (!body.success) throw new Error('Stored office preferences are invalid');
        return { ...body.data, revision: row.revision };
    }
    /** Merge a validated patch into the latest row and advance the revision once. */
    patch(input: unknown): OfficePreferences {
        const patch: OfficePreferencesPatch = PreferencesPatch.parse(input);
        this.db.exec('BEGIN IMMEDIATE');
        let next: OfficePreferences;
        try {
            const current = this.read();
            const { revision, ...body } = { ...current, ...patch };
            next = { ...body, revision: revision + 1 };
            this.db.prepare('UPDATE office_preferences SET revision=?, body=? WHERE id=1').run(next.revision, JSON.stringify(body));
            this.db.exec('COMMIT');
        }
        catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
        for (const listener of this.listeners) {
            try { listener(next); }
            catch { /* A failing subscriber never undoes a committed preference. */ }
        }
        return next;
    }
    subscribe(listener: (preferences: OfficePreferences) => void): () => void {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }
}
