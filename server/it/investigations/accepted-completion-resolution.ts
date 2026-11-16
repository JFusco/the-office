import type { ITInvestigation } from '../../../src/contracts/it-investigations';
import type { Store } from '../../store/store';

/**
 * A worker stopped by its time limit after saving a finished result, whose stage then accepted
 * that result: the failure has its answer on record, so there is nothing left to diagnose.
 */
export function acceptedCompletionResolution(store: Store, entry: ITInvestigation) {
    if (entry.source.kind !== 'worker') return;
    const work = store.state.workLog?.find(item => item.id === entry.source.id && item.completionAccepted);
    return work ? { kind: 'confirmed' as const, sourceId: work.id, receipt: `sessions/${work.id}/completed-output.json` } : undefined;
}
