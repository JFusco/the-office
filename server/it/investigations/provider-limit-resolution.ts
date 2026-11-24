import type { ITInvestigation } from '../../../src/contracts/it-investigations';
import type { Store } from '../../store/store';
import type { WorkTime } from '../../../src/shared';
import { providerLimit } from '../../workers/provider-limit';

/** How the receipt of this rule begins: the ledger keeps such a closure as history and records no lesson from it. */
export const PROVIDER_RECOVERED = 'provider:';

/** A read-only run the provider refused at its usage limit: typed so since it was recognised, or recorded as `other` before that with the provider's own sentence. */
function refusedAtLimit(work: WorkTime): boolean {
    const failure = work.failure;
    if (!failure || failure.code) return false;
    return failure.category === 'provider-limit' || failure.category === 'other' && !!work.provider && !!providerLimit(work.provider, failure.detail);
}

/** Whether the investigation's source is a worker run the provider refused at its usage limit: nothing about the Office to learn from it. */
export function investigatesLimitRefusal(store: Store, entry: ITInvestigation): boolean {
    if (entry.source.kind !== 'worker') return false;
    const run = store.state.workLog?.find(item => item.id === entry.source.id);
    return !!run && refusedAtLimit(run);
}

/**
 * A worker the provider refused at its usage limit, once that provider has completed a later run. The refusal
 * was the provider's own and says nothing about the Office, so there is nothing for a diagnosis to find: the
 * investigation is kept as history instead of waiting on a person. Undefined while no later run on that
 * provider has completed, or when the run failed for any other reason.
 */
export function providerLimitResolution(store: Store, entry: ITInvestigation) {
    if (entry.source.kind !== 'worker') return;
    // A proposed Office fix is Morgan's to review whatever the provider did afterwards.
    if (entry.report?.officeFix?.status === 'proposed') return;
    const work = store.state.workLog || [], refused = work.find(item => item.id === entry.source.id);
    if (!refused?.endedAt || !refused.provider || !refusedAtLimit(refused)) return;
    const later = work.find(item => item.provider === refused.provider && item.status === 'completed' && !!item.endedAt && item.endedAt > refused.endedAt!);
    return later ? { kind: 'superseded' as const, sourceId: later.id, receipt: `${PROVIDER_RECOVERED}${refused.provider}:${later.id}` } : undefined;
}
