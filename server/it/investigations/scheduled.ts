import { processGroupAlive } from '../../workers/process';
import { investigationReady } from './readiness';
import { runInvestigation, INVESTIGATION_ATTEMPTS, type InvestigationRunner } from './run';
import type { Store } from '../../store/store';
import type { ScheduledWork } from '../../scheduling/scheduler';
import type { WorkEligibility } from '../../../src/shared';

/** Pure queue projection plus a synchronous source/process fence immediately before claim. */
export function scheduledInvestigations(store: Store, run: InvestigationRunner, now = store.clock.now(), alive = processGroupAlive): ScheduledWork[] {
    return (store.state.it?.investigations || []).filter(entry => !entry.retirement).map(entry => {
        const ready = () => investigationReady(store, entry, alive) && !(store.state.workLog || []).some(work => work.requestId === entry.id && (!work.processId || ['running', 'stopping'].includes(work.status) || alive(work.processId)));
        const due = () => ['queued', 'working'].includes(entry.status) && entry.attempts < INVESTIGATION_ATTEMPTS && (!entry.nextAt || Date.parse(entry.nextAt) <= store.clock.now().getTime()) && ready();
        const exhausted = entry.attempts >= INVESTIGATION_ATTEMPTS && (entry.status !== 'working' || !!entry.nextAt && Date.parse(entry.nextAt) <= now.getTime());
        const state: WorkEligibility['state'] = entry.status === 'resolved' ? 'terminal' : !['queued', 'working'].includes(entry.status) || exhausted ? 'blocked' : store.state.paused || store.state.draining || !ready() || !!entry.nextAt && Date.parse(entry.nextAt) > now.getTime() ? 'waiting' : 'runnable';
        return { store, work: { projectId: store.project.id, kind: 'conversation' as const, id: entry.id }, stage: 'it-investigation', rank: 3, enqueuedAt: entry.createdAt,
            eligibility: { state, owner: ['blocked', 'diagnosed'].includes(entry.status) || exhausted ? 'Morgan' : 'IT', reason: state === 'runnable' ? 'Ready for bounded read-only diagnosis' : state === 'waiting' ? 'Waiting for process termination, project controls or read-only retry backoff' : entry.report?.blocker || entry.lastError || `Investigation ${entry.status}`, nextCheckAt: entry.nextAt || null },
            claimEligible: due, identity: () => JSON.stringify([entry.status, entry.attempts, entry.nextAt]), execute: () => runInvestigation(store, entry.id, run, alive) };
    });
}
