import type { ITInvestigation } from '../../../src/contracts/it-investigations';
import { freezeReads } from '../../incidents/repair/freeze-reads';
import { failureOutranks, repairFreeze } from '../../incidents/repair/repair-freeze';
import type { Store } from '../../store/store';
import { investigatedRecord } from './source-record';

/**
 * Whether an investigation is held because the record its failed run worked is waiting on a
 * harness repair. Two things must both be true. The run under investigation did not itself fail
 * for a cause a repair never holds back (authentication, permission, ownership, a write of
 * unknown outcome): that is judged on the investigated run's own typed failure, because the
 * record it resolves to can be another one, such as the ticket a mirrored request belongs to.
 * And the record is frozen as it stands now. Anything else, including an investigation about no
 * stopped record, is not held.
 */
export function investigationHeld(store: Pick<Store, 'db' | 'project' | 'state' | 'clock'>, entry: Pick<ITInvestigation, 'source'>): boolean {
    const about = investigatedRecord(store.state, entry.source);
    if (!about) return false;
    // The same runs readiness treats as the original ones.
    const { requestId, workerIds } = entry.source, runs = store.state.workLog?.filter(work => work.stage !== 'it-investigation' && (requestId ? work.requestId === requestId : workerIds.includes(work.id))) ?? [];
    if (runs.some(run => !!run.failure && !run.completionAccepted && failureOutranks(run.failure.category))) return false;
    const now = store.clock.now();
    return !!repairFreeze(store.state, about, now, freezeReads(store, now));
}
