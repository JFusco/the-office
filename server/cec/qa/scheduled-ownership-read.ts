import type { DeliveryRequest } from '../../../src/shared';
import type { ScheduledWork } from '../../scheduling/scheduler';
import type { Store } from '../../store/store';
import type { Engine } from '../../scheduling/engine';
import { digest } from '../../store/readback-evidence';
import { ownershipReadGate } from './ownership-read-gate';
import { continueOwnershipRead } from './continue-ownership-read';
import { expiredOwnershipRead } from './expired-ownership-read';
import type { ReadOwnershipView } from './read-ownership-candidate';

/** Pure cached-inventory projection: no native refresh, provider call or model invocation. */
export function scheduledOwnershipRead(store: Store, engine: Engine, request: DeliveryRequest,
    view: () => ReadOwnershipView | undefined, refresh: (after: string) => Promise<ReadOwnershipView | undefined>, continueRead = continueOwnershipRead): ScheduledWork | undefined {
    const predecessor = request.qaReadContinuation ? expiredOwnershipRead(store, request) : undefined;
    const gate = (!request.qaReadContinuation || predecessor) && !request.qaReadContinuationRepair && ownershipReadGate(store, request, view());
    const readers = store.state.workLog?.filter(w => w.requestId === request.id) || [];
    if (!gate || readers.length !== 1 || readers[0].role !== 'pm' || readers[0].stage !== 'readback' ||
        readers[0].status !== 'completed' || readers[0].executionStatus !== 'completed' ||
        Date.parse(gate.candidate.observedAt) <= Date.parse(readers[0].endedAt || '')) return;
    return { store, work: { projectId: store.project.id, kind: 'delivery', id: request.id }, stage: predecessor ? 'check-qa-ownership-fresh' : 'check-qa-ownership',
        rank: 2, enqueuedAt: request.requestedAt,
        eligibility: { state: 'runnable', reason: 'Checking changed ownership evidence for the existing QA decision', owner: 'Office', nextCheckAt: null },
        identity: () => digest([request, store.ticket(request.key)]),
        claimEligible: () => !engine.busy && !engine.agents.active.size && !request.qaReadContinuationRepair &&
            (!request.qaReadContinuation || !!expiredOwnershipRead(store, request)) && !!ownershipReadGate(store, request, view()),
        execute: async () => {
            if (engine.busy || engine.agents.active.size) throw new Error('Another worker owns the delivery lane');
            engine.busy = true;
            try { await continueRead(store, request, view, refresh, undefined, undefined, !!predecessor); }
            finally { engine.busy = false; }
        } };
}
