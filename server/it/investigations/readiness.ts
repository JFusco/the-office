import { processGroupAlive } from '../../workers/process';
import type { Store } from '../../store/store';
import type { ITInvestigation } from '../../../src/contracts/it-investigations';

/** Unknown process identity and active source claims both keep readers away from an unsettled writer. */
export function investigationReady(store: Store, entry: ITInvestigation, alive = processGroupAlive): boolean {
    if (store.state.paused || store.state.draining) return false;
    // A worker recorded without a request (a Jira/Azure stage run) is its own subject; an empty request id binds nothing else to it.
    const original = store.state.workLog?.filter(work => work.stage !== 'it-investigation' && (entry.source.requestId ? work.requestId === entry.source.requestId : entry.source.workerIds.includes(work.id))) || [];
    if (!original.length || original.some(work => !work.processId || !Number.isSafeInteger(work.processId) || work.processId < 1 || !['completed', 'failed', 'blocked', 'interrupted'].includes(work.status) || alive(work.processId))) return false;
    const originalIds = new Set([entry.source.requestId, ...original.map(work => work.id)]);
    return !store.activeClaims().some(claim => originalIds.has(claim.work.id));
}
