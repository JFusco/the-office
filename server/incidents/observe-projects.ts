import type { WorkEligibility, WorkRef } from '../../src/contracts/work';
import { dependencyEligibility, type DependencyStores } from '../delivery/pipeline/dependencies';
import { holdsFor } from '../office/project-holds';
import { unsettledEffects } from '../operations/unsettled-effects';
import { deliveryRetryDecisions } from '../delivery/attempts/delivery-retry';
import type { Store } from '../store/store';
import { lastFailedMailCheck, lastMailCheckOutcome } from './mailbox-check-window';
import type { ProjectObservation } from './observation';
import { redactEvidence } from './redact-evidence';

/** Every lane the scheduler projects; an incident can stop work in any of them. */
export const LANES = ['delivery', 'operations', 'it', 'knowledge', 'cto'] as const;

type Projected = { work: WorkRef; stage: string; eligibility: WorkEligibility };
export interface OfficeObservation { observations: ProjectObservation[]; unreadable: { projectId: string; error: string }[] }

/**
 * One observation per project: its state, the scheduler's projection of every lane, its unsettled
 * writes, its configured holds, the scheduler's own reading of a prerequisite and each delivery job's current
 * retry decision (the one the outbox reads), all at the same
 * moment. The projection is the one that already drives dispatch, so the ledger sees stopped work
 * exactly as the scheduler does. A project that cannot be read is named and left out; the others
 * are still observed.
 */
export function observeProjects<Entry extends { store: Pick<Store, 'project' | 'state' | 'db' | 'clock' | 'activeClaims'> }>(entries: readonly Entry[], projection: (entry: Entry, lane: string) => readonly Projected[], now: Date): OfficeObservation {
    const observations: ProjectObservation[] = [], unreadable: OfficeObservation['unreadable'] = [];
    const stores = new Map(entries.map(entry => [entry.store.project.id, entry.store])) as unknown as DependencyStores;
    for (const entry of entries) {
        const { project } = entry.store;
        try {
            // The delivery retry decisions the outbox reads, at this observation's own time and over the same ledger read.
            const unsettled = unsettledEffects(entry.store), decisions = deliveryRetryDecisions(entry.store, now, unsettled);
            observations.push({
                projectId: project.id, provider: project.provider, repository: project.repository, state: entry.store.state,
                progression: LANES.flatMap(lane => projection(entry, lane).map(({ work, stage, eligibility }) => ({ work, stage, eligibility }))),
                unsettled, holds: holdsFor(project), dependency: prerequisites => dependencyEligibility(prerequisites, stores, now),
                retry: decisions,
                lastFailedMailCheck: () => lastFailedMailCheck(entry.store.db),
                lastMailCheckOutcome: () => lastMailCheckOutcome(entry.store.db), now,
            });
        } catch (error) { unreadable.push({ projectId: project.id, error: redactEvidence(String(error)).slice(0, 300) }); }
    }
    return { observations, unreadable };
}
