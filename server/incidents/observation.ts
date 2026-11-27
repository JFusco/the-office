import type { IncidentCandidate } from '../../src/contracts/incidents';
import type { Prerequisite, WorkEligibility, WorkRef } from '../../src/contracts/work';
import type { OfficeSnapshot, TicketJob } from '../../src/shared';
import type { DeliveryRetryDecision } from '../delivery/attempts/delivery-retry';
import type { UnsettledEffects } from '../operations/stale-records';
import type { FailedMailCheck, MailCheckOutcome } from './mailbox-check-window';

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
    /** The owning store's current delivery retry decision for one of its jobs (`server/delivery/attempts/delivery-retry.ts`). */
    retry?: (job: TicketJob) => DeliveryRetryDecision | undefined;
    /** How the scheduler reads these structured prerequisites now, across every project; null when none gates. */
    dependency: (prerequisites: Prerequisite[]) => WorkEligibility | null;
    /** The project's last mailbox check, when it ended blocked, read from its persisted events. */
    lastFailedMailCheck: () => FailedMailCheck | null;
    /** The last completed mailbox check, read from the project's persisted events. */
    lastMailCheckOutcome: () => MailCheckOutcome | null;
    /**
     * Subject keys stopped work reports for this project in this pass, or keeps open while it cannot be
     * read. The sync supplies it to the outbox reader; a direct reading derives it from stopped work.
     */
    covered?: ReadonlySet<string>;
    now: Date;
}

/** One source of incident signals: a pure reading of one project's observation. */
export type IncidentCollector = (observation: ProjectObservation) => IncidentCandidate[];
