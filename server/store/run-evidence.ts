import type { RunAccounting } from '../../src/contracts/telemetry';
import { sanitizeObject } from '../office/security';
import type { Store } from './store';

export type EvidenceOutcome = 'accepted' | 'unchanged' | 'conflict' | 'missing';

const comparable = (accounting: RunAccounting) => JSON.stringify({ ...accounting, acceptedAt: '' });

/**
 * Attaches final usage and cost evidence to a work record, whatever its execution status.
 * It never touches status, elapsed time, segments or gaps, so a pause or failure cannot lose an
 * already-received completion. Accepted evidence is immutable: a repeat is a no-op and a
 * different claim is surfaced rather than replacing it.
 */
export function recordRunEvidence(store: Store, workId: string, accounting: RunAccounting): EvidenceOutcome {
    return store.transaction(() => {
        const work = store.state.workLog?.find(item => item.id === workId);
        if (!work) return 'missing';
        const next = sanitizeObject(structuredClone(accounting));
        if (work.accounting) {
            if (comparable(work.accounting) === comparable(next)) return 'unchanged';
            store.emit('accounting-conflict', `Kept the accepted usage evidence for ${work.ticket || 'office work'}; a different claim (${next.evidenceId}) was not applied.`, work.role, work.ticket);
            return 'conflict';
        }
        work.accounting = next; // committed (and saved) by the transaction
        return 'accepted';
    });
}
