import type { IncidentCandidate } from '../../src/contracts/incidents';
import type { Prerequisite, WorkEligibility, WorkRef } from '../../src/contracts/work';
import type { OfficeSnapshot } from '../../src/shared';
import type { UnsettledEffects } from '../operations/stale-records';

/** What one project shows at one moment. Collectors read it; nothing in it is written. */
export interface ProjectObservation {
    projectId: string;
    /** The project's ticket provider. */
    provider: string;
    /** The project's own repository, as `owner/name`. */
    repository: string;
    state: OfficeSnapshot;
    /** The scheduler's own projection of every lane: the same one that drives dispatch and the queue counts. */
    progression: readonly { work: WorkRef; stage: string; eligibility: WorkEligibility }[];
    /** Writes still dispatching or uncertain in the project's Effects ledger. */
    unsettled: UnsettledEffects;
    /** Tickets the local office config holds for this project, by key. */
    holds: Readonly<Record<string, string>>;
    /** How the scheduler reads these structured prerequisites now, across every project; null when none gates. */
    dependency: (prerequisites: Prerequisite[]) => WorkEligibility | null;
    now: Date;
}

/** One source of incident signals: a pure reading of one project's observation. */
export type IncidentCollector = (observation: ProjectObservation) => IncidentCandidate[];
