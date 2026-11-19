import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { acceptableRefusedQA } from './refused-qa-result';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';

const REFUSED = 'refused-qa-result';

/**
 * The saved QA result of a job the harness queued again for it (`refused-qa-result.ts`), to be accepted
 * as the stage result in place of another QA run; null when the job was not queued for that or the result
 * no longer qualifies, or the candidate is no longer the clean checkout the result verified, and the
 * ordinary stage then runs. Once per queueing.
 */
export async function savedQAResult(delivery: GitHubDelivery, job: TicketJob): Promise<StageResult | null> {
    const { store } = delivery, mark = job.qaReaccept;
    if (job.stage !== 'validate' || !mark || mark.usedAt || mark.step !== job.steps.length - 1) return null;
    const saved = acceptableRefusedQA(store, job);
    if (!saved) return null;
    // A checkout that is no longer the one QA verified gets an ordinary QA run, which reads it for itself.
    try { await verifyRepairCandidate(store.project, job, delivery.execute); }
    catch { return null; }
    mark.usedAt = store.clock.now().toISOString();
    store.emit('qa-result-reused', `${job.key}: saved QA result accepted for the unchanged candidate; the QA gate was run again on it. No QA rerun.`, 'qa', job.key);
    return structuredClone(saved);
}

/** Once the saved result has been accepted as a new step, the refused copy before it is kept as history under its own name. */
export function retireRefusedQA(job: TicketJob): void {
    const mark = job.qaReaccept, refused = mark?.usedAt ? job.steps[mark.step] : undefined;
    if (refused?.stage === 'validate' && job.steps.slice(mark!.step + 1).some(step => step.stage === 'validate' && step.result.commit === refused.result.commit)) refused.stage = REFUSED;
}
