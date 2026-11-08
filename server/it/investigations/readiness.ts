import { processGroupAlive } from '../../workers/process';
import type { Store } from '../../store/store';
import type { ITInvestigation } from '../../../src/contracts/it-investigations';

/** Unknown process identity and active source claims both keep readers away from an unsettled writer. */
export function investigationReady(store: Store, entry: ITInvestigation, alive = processGroupAlive): boolean {
    if (store.state.paused || store.state.draining) return false;
    const original = store.state.workLog?.filter(work => work.requestId === entry.source.requestId && work.stage !== 'it-investigation') || [];
    if (!original.length || original.some(work => !work.processId || !Number.isSafeInteger(work.processId) || work.processId < 1 || !['completed', 'failed', 'blocked', 'interrupted'].includes(work.status) || alive(work.processId))) return false;
    const originalIds = new Set([entry.source.requestId, ...original.map(work => work.id)]);
    return !store.activeClaims().some(claim => originalIds.has(claim.work.id));
}
