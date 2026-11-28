import { candidateOwner } from '../candidate-ownership';
import { holdsFor } from '../../office/project-holds';
import { diagnoseBlocker, routeRepair, routedRepairMismatch } from './brain-repair-issue';
import { chainQualified } from '../../workers/qualification/chain-qualification';
import type { MaintenanceOwner } from '../publication/maintenance-effect';
import type { Engine } from '../../scheduling/engine';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { MaintenanceRun, PickupPolicy } from '../../../src/shared';

/**
 * Whether an unstarted follow-up may take the #612 contract: not when an earlier diagnosis worker ran without a
 * saved diagnosis. Marks it versioned, or blocks it for the original read-back.
 */
export function admitFollowup(store: Store, run: MaintenanceRun): boolean {
    const followup = run.blockerFollowup!;
    if (!followup.publicationVersion && (store.state.workLog || []).some(work => work.requestId === run.id && work.stage === 'maintenance-blocker' && !!work.processId)) {
        followup.status = 'blocked';
        followup.detail = 'An earlier repair follow-up worker ran under the previous contract; read back its original session before routing.';
        store.save();
        return false;
    }
    followup.publicationVersion = 1;
    return true;
}

/** This follow-up's ownership: its repair-followup claim, the pickup lane it started with, human deferrals, and the shared holds and delivery checks. */
export function followupOwner(store: Store, run: MaintenanceRun, lane: string) {
    return (issue?: number): MaintenanceOwner => ({ run, claim: 'repair-followup', subject: 'followup', issue, current: () => {
        const pickup = store.state.coordination?.pickup || { enabled: true, status: 'Ready' };
        if (!pickup.enabled || pickup.status !== lane) return 'The pickup setting changed during the repair follow-up';
        if (issue && store.state.coordination?.listener.reviews.some(review => review.key === `GH-${issue}` && review.status === 'held')) return `GH-${issue} carries a human deferral`;
        return undefined;
    } });
}

/** The qualification a diagnosis, fresh or saved, must still hold before it routes any fresh write. */
const DIAGNOSIS = [{ policy: 'codex-reader', stage: 'maintenance-blocker' }];

/**
 * The working follow-up's #612 route: a read-only diagnosis persisted before any issue or board work, then the
 * harness's routing through Effects, completed only on the independent issue and pickup read-back. A saved
 * diagnosis routes fresh issue, assignment or board work only while its launch policy is still qualified; a missing
 * or stale record is an `authority` stop before any write (attempted writes keep their read-back).
 */
export async function routeFollowup(store: Store, engine: Engine, execute: typeof command, run: MaintenanceRun, pickup: PickupPolicy): Promise<void> {
    const followup = run.blockerFollowup!, lane = pickup.status;
    if (!followup.diagnosis) {
        followup.diagnosis = await diagnoseBlocker(store, engine.agents, execute, run, pickup);
        run.steps.push({ role: 'pm', stage: 'maintenance-blocker', at: new Date().toISOString(), publicationVersion: 1, result: { outcome: followup.diagnosis.decision === 'blocked' ? 'blocked' : 'passed',
            summary: followup.diagnosis.summary, blocker: followup.diagnosis.decision === 'blocked' ? followup.diagnosis.summary : '', ledger: 'Original nightly refresh remains incomplete.', receipts: [], candidates: [] } });
        store.save();
    }
    const diagnosis = followup.diagnosis;
    if (diagnosis.decision === 'blocked') throw Error(diagnosis.summary || 'Source repair routing is blocked on a decision');
    const refusal = chainQualified(store.dataRoot, DIAGNOSIS, engine.agents.qualification);
    if (refusal) throw refusal;
    const reason = diagnosis.decision === 'adopt' && diagnosis.issue ? candidateOwner(store.state, holdsFor(store.project), diagnosis.issue) : '';
    if (reason) throw Error(reason);
    await routeRepair(store, execute, run, followupOwner(store, run, lane), lane);
    const mismatch = await routedRepairMismatch(store, execute, run, () => engine.github.board(), lane);
    if (mismatch) throw new Error(mismatch);
    const issue = followup.routing!.issue!.number;
    followup.issue = issue; followup.routing!.verifiedAt = store.clock.now().toISOString(); followup.status = 'completed';
    followup.detail = `Source blocker routed to GH-${issue} for normal ownership intake. Nightly refresh is still incomplete; its gate and failures are preserved.`;
    store.emit('maintenance-blocker-routed', followup.detail, 'pm');
}
