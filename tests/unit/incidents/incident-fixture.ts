import type { IncidentCandidate, IncidentSubject } from '../../../src/contracts/incidents';
import type { BlockedCause, WorkKind } from '../../../src/contracts/work';
import { lastFailedMailCheck, lastMailCheckOutcome } from '../../../server/incidents/mailbox-check-window';
import type { ProjectObservation } from '../../../server/incidents/observation';
import type { OfficeObservation } from '../../../server/incidents/observe-projects';
import { projectById } from '../../../server/office/projects';
import { unsettledEffects } from '../../../server/operations/unsettled-effects';
import { coordination } from '../../../server/scheduling/coordination';
import { Store } from '../../../server/store/store';

export const AT = new Date('2026-11-20T12:00:00.000Z');
export const later = (minutes: number) => new Date(AT.getTime() + minutes * 60_000);

/** An isolated in-memory project store with empty coordination state. */
export function projectStore(id = 'cms-field-vocabulary'): Store {
    const store = new Store(':memory:', projectById(id));
    store.state.coordination ??= coordination();
    return store;
}

type Item = ProjectObservation['progression'][number];
export const item = (kind: WorkKind, id: string, stage: string, state: Item['eligibility']['state'], reason: string, cause?: BlockedCause, projectId = 'cms-field-vocabulary'): Item =>
    ({ work: { projectId, kind, id }, stage, eligibility: { state, reason, owner: 'Morgan', nextCheckAt: null, ...(cause ? { cause } : {}) } });

export function observe(store: Store, progression: Item[] = [], now = AT, holds: Record<string, string> = {}): ProjectObservation {
    return { projectId: store.project.id, provider: store.project.provider, repository: store.project.repository, state: store.state, progression, unsettled: unsettledEffects(store), holds, dependency: () => null, lastFailedMailCheck: () => lastFailedMailCheck(store.db), lastMailCheckOutcome: () => lastMailCheckOutcome(store.db), now };
}

/** Observations of readable projects, as the sync receives them. */
export const office = (...observations: ProjectObservation[]): OfficeObservation => ({ observations, unreadable: [] });

export const subject = (over: Partial<IncidentSubject> = {}): IncidentSubject =>
    ({ projectId: 'brain', kind: 'delivery', id: 'job-1', episode: 'e1', stage: 'review', stop: null, lastWorker: '', head: '', unsettledEffect: false, ...over });

export const candidate = (over: Partial<IncidentSubject> = {}, more: Partial<IncidentCandidate> = {}): IncidentCandidate => ({
    subject: subject(over),
    cause: { source: 'stopped-work', provider: 'github', stage: over.stage ?? 'review', kind: 'unclassified', text: 'worktree is missing', author: 'harness' },
    expected: null, evidence: 'Worktree is missing', ...more,
});
