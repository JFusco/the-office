import { easternDay } from '../office/clock';
import type { WorkEligibility } from '../../src/shared';
import type { ScheduledWork } from '../scheduling/scheduler';
import type { Store } from '../store/store';
import { runRetrospective, type KnowledgeRunner } from './run-retrospective';
import { terminalCandidates, triggerJobId } from './retrospective-triggers';
import { busyMaintenanceIds } from './maintenance-triggers';

const status = (state: WorkEligibility['state'], reason: string, nextCheckAt: string | null = null): WorkEligibility => ({ state, reason, owner: 'Harper', nextCheckAt });

/** Subject ids (job UUIDs, CEC run ids or maintenance run ids) that a delivery or maintenance stage currently owns. */
function busySubjects(store: Store): Set<string> {
    const ids = new Set<string>();
    for (const claim of store.activeClaims().filter(claim => claim.work.kind === 'delivery')) {
        ids.add(claim.work.id);
        const ticket = claim.work.id.startsWith('ticket:') ? store.state.tickets.find(entry => `ticket:${entry.key}` === claim.work.id) : undefined;
        if (ticket?.runId) ids.add(ticket.runId);
    }
    for (const claim of store.activeClaims().filter(claim => claim.work.kind === 'feature')) ids.add(claim.work.id);
    for (const id of busyMaintenanceIds(store.state.maintenance?.runs || [])) ids.add(id);
    return ids;
}

/** Harper's queue: recorded triggers plus unrecorded terminal jobs, CEC runs and maintenance runs. Pure; reading never mutates. */
export function scheduledRetrospectives(store: Store, run: KnowledgeRunner, now = store.clock.now(), context?:import('./context').KnowledgeContext, propose?: Parameters<typeof runRetrospective>[4]): ScheduledWork[] {
    const knowledge = store.state.knowledge;
    if (!knowledge) return [];
    const entries = [
        ...knowledge.pending.map(entry => ({ id: entry.id, at: entry.createdAt, nextAt: entry.nextAt, attempts: entry.attempts })),
        ...terminalCandidates(knowledge, store.state.coordination?.jobs || [], store.state.tickets, store.state.maintenance?.runs || []).map(candidate => ({ id: candidate.id, at: candidate.at, nextAt: '', attempts: 0 })),
    ];
    const busy = busySubjects(store);
    const subjectId = (id: string) => knowledge.pending.find(entry => entry.id === id)?.source?.id || knowledge.pending.find(entry => entry.id === id)?.jobId || triggerJobId(id);
    const atCap = () => (knowledge.learningAttempts?.[easternDay(store.clock.now())] || 0) >= 8;
    const due = (id: string) => {
        const current = store.state.knowledge!;
        const entry = current.pending.find(pending => pending.id === id);
        if (busySubjects(store).has(subjectId(id)) || atCap()) return false;
        return current.enabled && !current.consumed.includes(id) && (!entry?.nextAt || Date.parse(entry.nextAt) <= store.clock.now().getTime());
    };
    return entries.map(({ id, at, nextAt, attempts }) => {
        const eligibility = !knowledge.enabled ? status('waiting', 'Harper retrospectives are turned off')
            : nextAt && Date.parse(nextAt) > now.getTime() ? status('waiting', attempts ? 'Retrying after an earlier attempt' : 'Waiting for 30 quiet minutes or a phase boundary', nextAt)
            : busy.has(subjectId(id)) ? status('waiting', store.state.maintenance?.runs.some(entry => entry.id === triggerJobId(id)) ? 'Waiting for the maintenance run to finish' : 'Waiting for the delivery stage on this ticket to finish')
            : atCap() ? status('waiting', 'Daily learning attempt limit reached') : status('runnable', 'Ready for Harper');
        return { store, work: { projectId: store.project.id, kind: 'retrospective' as const, id }, stage: 'retrospective', rank: 3, enqueuedAt: at, eligibility,
            claimEligible: () => due(id),
            identity: () => { const current = store.state.knowledge!; const entry = current.pending.find(pending => pending.id === id); return JSON.stringify([current.enabled, current.consumed.includes(id), entry?.attempts ?? null, entry?.nextAt ?? null]); },
            execute: () => runRetrospective(store, run, id,context,propose) };
    });
}
