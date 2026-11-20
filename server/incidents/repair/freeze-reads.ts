import type { Prerequisite, WorkRef } from '../../../src/contracts/work';
import { dependencyEligibility, validatePrerequisites, type DependencyStores } from '../../delivery/pipeline/dependencies';
import type { UnsettledEffects } from '../../operations/stale-records';
import { unsettledEffects } from '../../operations/unsettled-effects';
import type { Store } from '../../store/store';

/**
 * What a freeze decision reads beyond the project's saved state, as it stands at the moment of
 * the decision: the writes still unsettled in the project's Effects ledger, and whether the
 * record's structured prerequisites gate it, by the scheduler's own validation and reading.
 */
export interface FreezeReads {
    unsettled: () => UnsettledEffects;
    gated: (work: WorkRef, prerequisites: Prerequisite[]) => boolean;
}

/**
 * The reads for one project. Nothing is kept between decisions: each one asks the Effects ledger
 * again, so a write that became uncertain a moment ago is seen. Prerequisites are read from this
 * project's store alone, by every caller alike; one in another project reads as unavailable,
 * which gates, so such a record is never frozen.
 */
export function freezeReads(store: Pick<Store, 'db' | 'project' | 'state'>, now: Date): FreezeReads {
    const stores = new Map([[store.project.id, store]]) as unknown as DependencyStores;
    return {
        unsettled: () => unsettledEffects(store),
        gated: (work, prerequisites) => !!validatePrerequisites(prerequisites, work, stores) || !!dependencyEligibility(prerequisites, stores, now),
    };
}
