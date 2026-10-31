import type { OfficeEntry } from './scheduled-work';
import type { ProgressionItem, ProjectReadiness } from '../src/shared';
export function projectReadiness(entry: OfficeEntry, progression: ProgressionItem[], now = Date.now(), ownership?: {
    observedAt: string;
    fresh: boolean;
    complete: boolean;
}): ProjectReadiness {
    const { store } = entry, provider = store.project.provider === 'github' ? store.state.github : store.state.azure;
    return { projectId: store.project.id, persistence: 'ready', ownershipObservedAt: ownership?.observedAt || '', ownershipFresh: !!ownership?.fresh && ownership.complete, providerAgeMs: provider?.observedAt ? Math.max(0, now - Date.parse(provider.observedAt)) : null,
        runnable: progression.filter(item => item.eligibility.state === 'runnable').length, blocked: progression.filter(item => item.eligibility.state === 'blocked').length,
        waiting: progression.filter(item => item.eligibility.state === 'waiting').length, running: progression.filter(item => item.eligibility.state === 'running').length,
        stall: [store.state.scheduler, ...Object.values(store.state.schedulerLanes || {})].some(lane => (lane?.undispatchedCycles || 0) >= 2), publishingBacklog: store.state.coordination?.time?.entries.filter(entry => ['pending', 'posting', 'uncertain'].includes(entry.status)).length || 0,
        stopping: store.state.workLog?.filter(work => work.status === 'stopping').map(work => work.id) || [], scheduler: store.state.scheduler, schedulerLanes: store.state.schedulerLanes };
}
