import type { BoundedRead } from '../store/owned-artifact';
import type { Store } from '../store/store';
import { completionAccounting, readCompletion } from './run-accounting';

export type CompletionReader = (dataRoot: string, workId: string) => BoundedRead;

/**
 * Imports the CLI's cost estimate for finished Claude runs recorded before live capture existed.
 * Each saved `provider-completion.json` is validated against its run; an unusable artifact leaves
 * the run explicitly unpriced with a reason. Repeats are no-ops.
 */
export function backfillClaudeCost(store: Store, reader: CompletionReader = readCompletion): { imported: number; unpriced: number; skipped: number } {
    const counts = { imported: 0, unpriced: 0, skipped: 0 };
    const at = store.clock.now().toISOString();
    // One transaction: a single save for the whole import.
    return store.transaction(() => {
        for (const work of store.state.workLog || []) {
            // Helper rows (feature reviews) are priced from their own call output, not a worker completion.
            if (work.provider !== 'claude' || work.accounting || ['running', 'stopping'].includes(work.status) || work.stage.startsWith('feature-review:')) { counts.skipped++; continue; }
            const accounting = completionAccounting(work.id, reader(store.dataRoot, work.id), at, 'historical-import');
            const outcome = store.recordRunEvidence(work.id, accounting);
            if (outcome !== 'accepted') counts.skipped++;
            else if (accounting.cost.completeness === 'unpriced') counts.unpriced++;
            else counts.imported++;
        }
        return counts;
    });
}
