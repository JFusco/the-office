import { completedExecution } from '../../workers/worker-completion';
import type { ITInvestigation } from '../../../src/contracts/it-investigations';
import type { Store } from '../../store/store';

/**
 * A QA or retest worker cut off before it returned, whose stage was then run again on the same ticket
 * and returned a result: the rerun is the stage's answer, so the interruption has nothing left open.
 */
export function interruptedQARerunResolution(store: Store, entry: ITInvestigation) {
    if (entry.source.kind !== 'worker') return;
    const log = store.state.workLog || [], original = log.find(work => work.id === entry.source.id);
    if (!original?.ticket || !['qa', 'retest'].includes(original.stage) || original.executionStatus === 'completed') return;
    const rerun = log.slice(log.indexOf(original) + 1).find(work => work.ticket === original.ticket && work.stage === original.stage && work.role === original.role && completedExecution(store, work));
    return rerun ? { kind: 'superseded' as const, sourceId: rerun.id, receipt: `sessions/${rerun.id}/execution-completion.json` } : undefined;
}
