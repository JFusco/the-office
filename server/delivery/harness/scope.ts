import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';
import { projectPolicy } from '../../office/project-policy';

/** This project's delivery runs on deterministic harness operations instead of model-performed mechanics. */
export function handsOff(store: Pick<Store, 'project'>): boolean {
    return projectPolicy(store.project).handsOff;
}

/** Jobs carrying legacy recovery records keep their dedicated, reconciled model-stage contracts. */
export function legacyRecovery(job: TicketJob): boolean {
    return !!(job.initialDraftConflict || job.closeoutRecovery || job.implementationRecovery || job.discoveryRecovery || job.savedPrerequisiteHandoff
        || job.scopeRepairResumes?.length || job.scopeRepairReadback || job.implementationContinuation || job.candidateRecovery
        || job.steps.some(step => step.stage === 'conflict-readback'));
}

/** The harness performs candidate creation, publication, promotion and closeout for this job. */
export function harnessDelivers(store: Pick<Store, 'project'>, job: TicketJob): boolean {
    return handsOff(store) && !legacyRecovery(job);
}
