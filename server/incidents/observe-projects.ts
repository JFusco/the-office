import type { WorkEligibility, WorkRef } from '../../src/contracts/work';
import { dependencyEligibility, type DependencyStores } from '../delivery/pipeline/dependencies';
import { holdsFor } from '../office/project-holds';
import { unsettledEffects } from '../operations/unsettled-effects';
import type { Store } from '../store/store';
import type { ProjectObservation } from './observation';
import { redactEvidence } from './redact-evidence';

/** Every lane the scheduler projects; an incident can stop work in any of them. */
export const LANES = ['delivery', 'operations', 'it', 'knowledge', 'cto'] as const;

type Projected = { work: WorkRef; stage: string; eligibility: WorkEligibility };
export interface OfficeObservation { observations: ProjectObservation[]; unreadable: { projectId: string; error: string }[] }

/**
 * One observation per project: its state, the scheduler's projection of every lane, its unsettled
 * writes, its configured holds and the scheduler's own reading of a prerequisite, all at the same
 * moment. The projection is the one that already drives dispatch, so the ledger sees stopped work
 * exactly as the scheduler does. A project that cannot be read is named and left out; the others
 * are still observed.
 */
export function observeProjects<Entry extends { store: Pick<Store, 'project' | 'state' | 'db'> }>(entries: readonly Entry[], projection: (entry: Entry, lane: string) => readonly Projected[], now: Date): OfficeObservation {
    const observations: ProjectObservation[] = [], unreadable: OfficeObservation['unreadable'] = [];
    const stores = new Map(entries.map(entry => [entry.store.project.id, entry.store])) as unknown as DependencyStores;
    for (const entry of entries) {
        const { project } = entry.store;
        try {
            observations.push({
                projectId: project.id, provider: project.provider, repository: project.repository, state: entry.store.state,
                progression: LANES.flatMap(lane => projection(entry, lane).map(({ work, stage, eligibility }) => ({ work, stage, eligibility }))),
                unsettled: unsettledEffects(entry.store), holds: holdsFor(project), dependency: prerequisites => dependencyEligibility(prerequisites, stores, now), now,
            });
        } catch (error) { unreadable.push({ projectId: project.id, error: redactEvidence(String(error)).slice(0, 300) }); }
    }
    return { observations, unreadable };
}
