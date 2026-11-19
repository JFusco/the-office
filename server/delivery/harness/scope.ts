import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';
import { projectPolicy } from '../../office/project-policy';

/** This project's delivery runs on deterministic harness operations instead of model-performed mechanics. */
export function handsOff(store: Pick<Store, 'project'>): boolean {
    return projectPolicy(store.project).handsOff;
}

/**
 * Jobs carrying legacy recovery records keep their dedicated, reconciled model-stage contracts. Each such
 * record is its own field on the job. A `conflict-readback` step is not one: the ordinary conflict repair
 * writes it for any job whose conflict it verified, and a repaired conflict is no reason to take a job off
 * harness delivery. An initial draft conflict, which also writes that step, has its own record.
 */
export function legacyRecovery(job: TicketJob): boolean {
    return !!(job.initialDraftConflict || job.closeoutRecovery || job.implementationRecovery || job.discoveryRecovery || job.savedPrerequisiteHandoff
        || job.scopeRepairResumes?.length || job.scopeRepairReadback || job.implementationContinuation || job.candidateRecovery);
}

/** The harness performs candidate creation, publication, promotion and closeout for this job. */
export function harnessDelivers(store: Pick<Store, 'project'>, job: TicketJob): boolean {
    return handsOff(store) && !legacyRecovery(job);
}
