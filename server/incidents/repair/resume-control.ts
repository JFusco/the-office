import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import type { ResumeSwitch } from '../../../src/contracts/incidents';
import { redactEvidence } from '../redact-evidence';

const REASON_LIMIT = 500;
/** Every change is saved with a reason, so a row without one was not written here. */
const Stored = z.object({ enabled: z.boolean(), reason: z.string().max(REASON_LIMIT).refine(reason => reason.trim().length > 0), at: z.string().datetime() }).strict();
const absent = (error: unknown) => /no such table/i.test(String(error));

/** The switch before anyone has changed it. */
export const NEVER_ENABLED: ResumeSwitch = { enabled: false, revision: 0, reason: 'Automatic repair resumes have never been enabled.', at: null };
const unreadable = (revision: number): ResumeSwitch => ({ enabled: false, revision, reason: 'The saved resume switch cannot be read; automatic repair resumes stay paused until it is paused again.', at: null, invalid: true });

/** One line, bounded, credentials removed: a reason is shown in health and kept as evidence only. */
const stated = (reason: string | undefined, fallback: string) => redactEvidence((reason ?? '').replace(/\s+/g, ' ').trim()).slice(0, REASON_LIMIT) || fallback;

/**
 * The Office-wide switch for automatic repair resumes: one row on the office control database,
 * beside the deployment fence and the incident ledger. Pausing it stops new repair resumes from
 * being admitted without pausing a project or cancelling a resume already admitted.
 *
 * It starts paused, and anything that cannot be read is paused. Its table is created by the first
 * change, never by opening it: a release that starts under a deployment's fence must leave the
 * control database exactly as it found it, or that deployment could no longer be rolled back.
 *
 * Every change advances the revision, a pause included. Enabling must name the revision that was
 * read, so a pause made in between, by a person or by a breaker, is never overridden unseen.
 */
export class ResumeControl {
    constructor(private db: DatabaseSync) {}

    /** The switch as it stands. Never throws: whatever cannot be read is reported as paused. */
    read(): ResumeSwitch {
        let row: { revision: unknown; body: unknown } | undefined;
        try { row = this.db.prepare('SELECT revision, body FROM repair_resume_control WHERE id=1').get() as typeof row; }
        catch (error) { return absent(error) ? NEVER_ENABLED : unreadable(0); }
        if (!row) return NEVER_ENABLED;
        const revision = typeof row.revision === 'number' && Number.isSafeInteger(row.revision) && row.revision >= 1 ? row.revision : 0;
        const body = Stored.safeParse((() => { try { return JSON.parse(String(row.body)); } catch { return undefined; } })());
        return revision && body.success ? { ...body.data, revision } : unreadable(revision);
    }

    /** Stops new repair resumes. Always accepted, whatever the switch held, and recorded as a change. */
    pause(reason: string | undefined, now: Date): ResumeSwitch {
        return this.change(false, stated(reason, 'Paused by request.'), now, () => {});
    }

    /** Allows repair resumes again. Refused unless the switch reads cleanly at the revision named. */
    enable(expectedRevision: number, reason: string | undefined, now: Date): ResumeSwitch {
        return this.change(true, stated(reason, 'Enabled by request.'), now, current => {
            if (current.invalid) throw new Error('The saved resume switch cannot be read; pause it first, then enable it at the revision that pause returns');
            if (current.revision !== expectedRevision) throw new Error(`The resume switch is at revision ${current.revision}, not ${expectedRevision}; read it again`);
        });
    }

    private change(enabled: boolean, reason: string, now: Date, check: (current: ResumeSwitch) => void): ResumeSwitch {
        this.db.exec('BEGIN IMMEDIATE');
        try {
            this.db.exec('CREATE TABLE IF NOT EXISTS repair_resume_control (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL CHECK(revision>=1), body TEXT NOT NULL)');
            const current = this.read();
            check(current);
            const next: ResumeSwitch = { enabled, revision: current.revision + 1, reason, at: now.toISOString() };
            this.db.prepare('INSERT INTO repair_resume_control(id,revision,body) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision, body=excluded.body')
                .run(next.revision, JSON.stringify({ enabled: next.enabled, reason: next.reason, at: next.at }));
            this.db.exec('COMMIT');
            return next;
        } catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
    }
}
