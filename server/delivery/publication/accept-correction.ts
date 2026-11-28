import type { Role, StageResult, TicketJob } from '../../../src/shared';
import { deliveryInputSha256 } from '../../github/github-context';
import { digest } from '../../store/readback-evidence';
import type { Store } from '../../store/store';
import { currentAssignment } from '../../workers/assignment-context';
import { handsOff } from '../harness/scope';
import { recordJobApproach } from '../pipeline/approach';
import { unresolvedWorkerFailure } from '../pipeline/unresolved-worker';
import type { CorrectionAcceptance } from './marker-correction-task';
import { indeterminate } from './release-marker-stop';

/**
 * The last step of a correction, after acceptStageResult's own contained-evidence, branch, worktree and HEAD checks
 * passed on the derived result: in one synchronous transaction, revalidate the pending attempt and inputs, resolve the
 * return, apply the retained approach, record the successful implement step, assign the adopted head and select the
 * next stage. Review, QA and ordinary publication then run on that head with their own fresh evidence.
 */
export function acceptCorrection(store: Store, job: TicketJob, result: StageResult, role: Role, acceptance: CorrectionAcceptance,
    next: (job: TicketJob) => TicketJob['stage'], learn: () => void): void {
    store.transaction(() => {
        const pending = job.releaseMarkerReturns?.[acceptance.refusedWorkId];
        if (!pending || pending.status !== 'pending' || digest(pending) !== acceptance.pendingSha256 || currentAssignment()?.claim.id !== acceptance.claimId ||
            deliveryInputSha256(store, job.key) !== acceptance.inputSha256 || pending.correction?.workId !== acceptance.correctionWorkId)
            throw indeterminate('the pending correction, claim or human inputs changed before acceptance', result.commit);
        pending.status = 'resolved';
        if (result.approach) recordJobApproach(job, result.approach, role, unresolvedWorkerFailure(store.state.workLog, job), handsOff(store), result);
        job.steps.push({ stage: job.stage, workerId: acceptance.correctionWorkId, result });
        job.head = result.commit; job.worktree = result.worktree; job.branch = result.branch;
        learn();
        job.stage = next(job);
        job.status = 'queued';
        job.detail = `The harness reworded the refused [skip release] commits and adopted ${result.commit.slice(0, 12)}; review, QA and publication run on it with fresh evidence.`;
        store.emit('release-marker-corrected', `${job.key}: ${job.detail}`, role, job.key);
    });
}
