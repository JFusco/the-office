import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** Projects whose delivery runs on deterministic harness operations instead of model-performed mechanics. */
export const HANDS_OFF_PROJECTS: ReadonlySet<string> = new Set(['cms-field-vocabulary']);

export function handsOff(store: Pick<Store, 'project'>): boolean {
    return HANDS_OFF_PROJECTS.has(store.project.id);
}

/** Jobs carrying legacy recovery records keep their dedicated, reconciled model-stage contracts. */
export function legacyRecovery(job: TicketJob): boolean {
    return !!(job.initialDraftConflict || job.closeoutRecovery || job.implementationRecovery || job.discoveryRecovery || job.savedPrerequisiteHandoff
        || job.scopeRepairResumes?.length || job.scopeRepairReadback || job.sourceAmendment || job.implementationContinuation || job.candidateRecovery
        || job.steps.some(step => step.stage === 'conflict-readback'));
}

/** The harness performs candidate creation, publication, promotion and closeout for this job. */
export function harnessDelivers(store: Pick<Store, 'project'>, job: TicketJob): boolean {
    return handsOff(store) && !legacyRecovery(job);
}
