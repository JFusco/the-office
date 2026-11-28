import { checkedEffect, type HarnessEffect } from '../../delivery/harness/effect';
import { currentAssignment } from '../../workers/assignment-context';
import { holdsFor } from '../../office/project-holds';
import { candidateOwner } from '../candidate-ownership';
import type { Store } from '../../store/store';
import type { MaintenanceRun } from '../../../src/shared';

/**
 * Who a fresh maintenance write belongs to. CMS publication runs under its maintenance claim; a Brain repair
 * follow-up under the selected `repair-followup` continuation. Either way the Effect's work reference is the
 * maintenance run, so the existing maintenance recovery gates see it.
 */
export interface MaintenanceOwner {
    run: MaintenanceRun;
    claim: 'maintenance' | 'repair-followup';
    /** The candidate or follow-up key the write is for; part of every Effect id. */
    subject: string;
    /** The issue whose holds and competing delivery ownership bind the write, once known. */
    issue?: number;
    /** The current phase and any caller-specific binding (head, branch, deferral); a reason when it no longer holds. */
    current: () => string | undefined;
}

/** The Effect id base of one maintenance operation: stable per run, subject and operation, never per attempt. */
export const maintenanceEffectBase = (runId: string, subject: string, operation: string) => `maintenance:${runId}:${subject}:${operation}`;

/**
 * Why the persisted running claim, run, phase, holds or competing ownership no longer authorize this write, or
 * undefined. Synchronous: it also runs inside the transaction that claims the prepared intent.
 */
export function ownershipRefusal(store: Store, owner: MaintenanceOwner): string | undefined {
    const assignment = currentAssignment(), claim = assignment?.claim;
    if (!claim || claim.status !== 'running' || claim.work.projectId !== store.project.id)
        return 'No running scheduler claim of this project owns the maintenance write';
    const expected = owner.claim === 'maintenance' ? { kind: 'maintenance', stage: undefined } : { kind: 'continuation', stage: 'repair-followup' };
    if (claim.work.kind !== expected.kind || claim.work.id !== owner.run.id || expected.stage && claim.stage !== expected.stage)
        return `The running claim is not this run's ${owner.claim} claim`;
    if (!store.activeClaims().some(active => active.id === claim.id && active.status === 'running'))
        return 'The maintenance claim is no longer running';
    const stored = store.state.maintenance?.runs.filter(run => run.id === owner.run.id) || [];
    if (stored.length !== 1 || stored[0] !== owner.run) return 'The maintenance run record changed';
    if (owner.claim === 'maintenance' ? owner.run.status !== 'working' : owner.run.blockerFollowup?.status !== 'working')
        return 'The maintenance run is no longer working';
    if (store.state.paused) return 'Project paused before a maintenance write';
    if (owner.issue) {
        const reason = candidateOwner(store.state, holdsFor(store.project), owner.issue);
        if (reason) return reason;
    }
    return owner.current();
}

const assertOwned = (store: Store, owner: MaintenanceOwner) => { const refusal = ownershipRefusal(store, owner); if (refusal) throw new Error(refusal); };

/**
 * One maintenance write through Effects, under the fixed GitHub adapter the caller supplies: an attempted intent is
 * read back under its saved writer first and never resent; a fresh one is bound to its owner before admission,
 * again after the asynchronous preflight, and inside the dispatch transaction with the writer check. Maintenance has
 * no resend exception, so a `notLanded` declaration is refused.
 */
export async function maintenanceEffect<R>(store: Store, owner: MaintenanceOwner, effect: HarnessEffect<R>): Promise<R> {
    if (effect.notLanded) throw new Error('A maintenance write is never resent; it declares no not-landed read');
    const base = maintenanceEffectBase(owner.run.id, owner.subject, effect.key);
    return checkedEffect(store, {
        base, work: { projectId: store.project.id, kind: 'maintenance', id: owner.run.id }, attemptId: owner.run.id,
        claim: () => ownershipRefusal(store, owner),
    }, { ...effect, guard: async () => { assertOwned(store, owner); await effect.guard(); assertOwned(store, owner); } });
}
