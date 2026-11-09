import type { LearningSubject } from '../../src/contracts/knowledge';
import type { Store } from '../store/store';

const identity = (source: LearningSubject) => `${source.kind}:${source.id}`;
const distinct = (sources: LearningSubject[]) => [...new Map(sources.map(source => [identity(source), source])).values()];

/** Follow explicit owner relationships, never infer a second incident from an opaque request ID. */
export function improvementIncident(store: Store, source: LearningSubject): LearningSubject | undefined {
    const jobs = store.state.coordination?.jobs || [], runs = store.state.maintenance?.runs || [];
    const continuations = store.state.coordination?.continuations || [], seen = new Set<string>();
    const origins = (jobId: string): LearningSubject[] => {
        const job = jobs.find(job => job.id === jobId);
        return distinct([
            ...runs.filter(run => run.blockerFollowup?.issue && job?.key === `GH-${run.blockerFollowup.issue}`).map(run => ({ kind: 'maintenance' as const, id: run.id })),
            ...continuations.filter(item => item.repair.kind === 'delivery' && item.repair.id === jobId && item.repair.projectId === store.project.id && item.original.projectId === store.project.id && item.original.kind === 'maintenance').map(item => ({ kind: 'maintenance' as const, id: item.original.id })),
        ]);
    };
    let current = source;
    for (let depth = 0; depth < 16; depth++) {
        if (seen.has(identity(current))) return;
        seen.add(identity(current));
        let parents: LearningSubject[] = [];
        if (current.kind === 'investigation') {
            const entry = store.state.it?.investigations?.find(item => item.id === current.id);
            const requestId = entry && (store.state.workLog?.find(work => work.id === entry.source.id)?.requestId || entry.source.requestId);
            if (!requestId) return;
            parents = [
                ...(store.state.features || []).filter(item => item.id === requestId).map(item => ({ kind: 'feature' as const, id: item.id })),
                ...jobs.filter(item => item.id === requestId).map(item => ({ kind: 'job' as const, id: item.id })),
                ...runs.filter(item => item.id === requestId).map(item => ({ kind: 'maintenance' as const, id: item.id })),
                ...store.state.tickets.filter(item => item.runId && (item.runId === requestId || requestId === `ticket:${item.key}`)).map(item => ({ kind: 'ticket' as const, id: item.runId! })),
            ];
            if (!parents.length) return;
        } else if (current.kind === 'recovery') {
            parents = (store.state.knowledge?.followups || []).filter(item => item.recoveryId === current.id && item.source.kind !== 'recovery').map(item => item.source);
            if (!parents.length) return;
        } else if (current.kind === 'job' || current.kind === 'ticket') {
            const work = current.kind === 'job' ? jobs.find(item => item.id === current.id) : store.state.tickets.find(item => item.runId === current.id);
            if (work?.improvementId || work && store.state.knowledge?.improvements?.some(item => item.providerId === work.key)) return;
            if (current.kind === 'job') parents = origins(current.id);
            if (!parents.length && work?.featureBinding?.featureId) parents = [{ kind: 'feature', id: work.featureBinding.featureId }];
        } else if (current.kind === 'maintenance') {
            parents = continuations.filter(item => item.runId === current.id && item.original.projectId === store.project.id && item.original.kind === 'maintenance').map(item => ({ kind: 'maintenance', id: item.original.id }));
            if (!parents.length) parents = (runs.find(item => item.id === current.id)?.supersedes || []).map(id => ({ kind: 'maintenance', id }));
        } else if (current.kind === 'feature') {
            const children = jobs.filter(job => job.featureBinding?.featureId === current.id);
            if (children.some(job => job.improvementId || store.state.knowledge?.improvements?.some(item => item.providerId === job.key))) return;
            parents = children.flatMap(job => origins(job.id));
        }
        parents = distinct(parents);
        if (!parents.length) return current;
        if (parents.length !== 1) return; // Ambiguous ownership is not evidence of another incident.
        current = parents[0];
    }
}

/** Revalidate persisted incident identities when admission runs, including links added later. */
export function improvementIncidentKey(store: Store, value: string): string | undefined {
    const colon = value.indexOf(':'), kind = value.slice(0, colon), id = value.slice(colon + 1);
    if (!id || !['job', 'ticket', 'maintenance', 'feature', 'investigation', 'recovery', 'message', 'orchestration'].includes(kind)) return;
    const source = improvementIncident(store, { kind: kind as LearningSubject['kind'], id });
    return source && identity(source);
}
