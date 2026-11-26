import type { DatabaseSync } from 'node:sqlite';
import { canonical } from './canonical-json';
import { HaltReport } from './runner-report';

const absent = (error: unknown) => /no such table/i.test(String(error));

export type HaltResult = { status: 'recorded' | 'replayed'; report: HaltReport } | { status: 'stale' | 'conflict'; current: HaltReport };

/**
 * The runner's latest control condition, as it last reported it: one row on the office control
 * database, beside the incident ledger. Like the ledger, its table is created by the first write
 * and never by opening or reading, so a release started under a deployment's fence leaves the
 * control database as it found it. The sequence orders reports, whatever their clocks say.
 */
export class RunnerReports {
    constructor(private db: DatabaseSync) {}

    halt(): HaltReport | null {
        try {
            const row = this.db.prepare('SELECT body FROM runner_halt WHERE slot=1').get() as { body: string } | undefined;
            return row ? HaltReport.parse(JSON.parse(row.body)) : null;
        } catch (error) {
            if (absent(error)) return null;
            throw error;
        }
    }

    /**
     * Saves a report with a higher sequence than the one held. The same sequence with the same
     * content is a repeat and keeps the original; with other content it is a conflict; a lower
     * sequence is stale. Nothing is written for a refusal.
     */
    recordHalt(input: HaltReport, now: Date): HaltResult {
        const report = HaltReport.parse(input);
        this.db.exec('BEGIN IMMEDIATE');
        try {
            this.db.exec('CREATE TABLE IF NOT EXISTS runner_halt (slot INTEGER PRIMARY KEY CHECK(slot=1), sequence INTEGER NOT NULL, body TEXT NOT NULL, received_at TEXT NOT NULL)');
            const row = this.db.prepare('SELECT body FROM runner_halt WHERE slot=1').get() as { body: string } | undefined;
            const saved = row ? HaltReport.parse(JSON.parse(row.body)) : null;
            let result: HaltResult;
            if (saved && report.sequence === saved.sequence) result = canonical(report) === canonical(saved) ? { status: 'replayed', report: saved } : { status: 'conflict', current: saved };
            else if (saved && report.sequence < saved.sequence) result = { status: 'stale', current: saved };
            else {
                this.db.prepare('INSERT INTO runner_halt(slot,sequence,body,received_at) VALUES(1,?,?,?) ON CONFLICT(slot) DO UPDATE SET sequence=excluded.sequence, body=excluded.body, received_at=excluded.received_at')
                    .run(report.sequence, JSON.stringify(report), now.toISOString());
                result = { status: 'recorded', report };
            }
            this.db.exec(result.status === 'recorded' ? 'COMMIT' : 'ROLLBACK');
            return result;
        } catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
    }
}
