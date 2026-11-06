import type { WorkEligibility } from '../../src/shared';
import type { ScheduledWork } from '../scheduling/scheduler';
import type { Store } from '../store/store';
import { runRetrospective, type RetrospectiveRunner } from './run-retrospective';
import { terminalCandidates, triggerJobId } from './retrospective-triggers';

const status = (state: WorkEligibility['state'], reason: string, nextCheckAt: string | null = null): WorkEligibility => ({ state, reason, owner: 'Harper', nextCheckAt });

/** Harper's queue: recorded triggers plus unrecorded completed/cancelled jobs. Pure; reading never mutates. */
export function scheduledRetrospectives(store: Store, run: RetrospectiveRunner, now = store.clock.now()): ScheduledWork[] {
    const knowledge = store.state.knowledge;
    if (store.project.provider !== 'github' || !knowledge) return [];
    const jobs = store.state.coordination?.jobs || [];
    const entries = [
        ...knowledge.pending.map(entry => ({ id: entry.id, at: entry.createdAt, nextAt: entry.nextAt })),
        ...terminalCandidates(knowledge, jobs).map(candidate => ({ id: candidate.id, at: candidate.job.updatedAt || candidate.job.requestedAt, nextAt: '' })),
    ];
    const busy = new Set(store.activeClaims().filter(claim => claim.work.kind === 'delivery').map(claim => claim.work.id));
    const due = (id: string) => {
        const current = store.state.knowledge!;
        const entry = current.pending.find(pending => pending.id === id);
        if (store.activeClaims().some(claim => claim.work.kind === 'delivery' && claim.work.id === triggerJobId(id))) return false;
        return current.enabled && !current.consumed.includes(id) && (!entry?.nextAt || Date.parse(entry.nextAt) <= store.clock.now().getTime());
    };
    return entries.map(({ id, at, nextAt }) => {
        const eligibility = !knowledge.enabled ? status('waiting', 'Harper retrospectives are turned off')
            : nextAt && Date.parse(nextAt) > now.getTime() ? status('waiting', 'Retrying after an earlier attempt', nextAt)
            : busy.has(triggerJobId(id)) ? status('waiting', 'Waiting for the delivery stage on this ticket to finish')
            : status('runnable', 'Ready for Harper');
        return { store, work: { projectId: store.project.id, kind: 'retrospective' as const, id }, stage: 'retrospective', rank: 3, enqueuedAt: at, eligibility,
            claimEligible: () => due(id),
            identity: () => { const current = store.state.knowledge!; const entry = current.pending.find(pending => pending.id === id); return JSON.stringify([current.enabled, current.consumed.includes(id), entry?.attempts ?? null, entry?.nextAt ?? null]); },
            execute: () => runRetrospective(store, run, id) };
    });
}
