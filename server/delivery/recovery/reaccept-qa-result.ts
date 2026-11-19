import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { refusedQADecline } from './refused-qa-result';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';

const REFUSED = 'refused-qa-result';

/**
 * The saved QA result of a job the harness queued again for it (`refused-qa-result.ts`), to be accepted
 * as the stage result in place of another QA run; null when the job was not queued for that or the result
 * no longer qualifies, or the candidate is no longer the clean checkout the result verified, and the
 * ordinary stage then runs. Once per queueing. A queued job that is not given its saved result has the
 * first reason recorded on it and in the event log, once; that record changes nothing a later run does.
 */
export async function savedQAResult(delivery: GitHubDelivery, job: TicketJob): Promise<StageResult | null> {
    const { store } = delivery, mark = job.qaReaccept;
    if (job.stage !== 'validate' || !mark || mark.usedAt) return null;
    // The first reason is the one kept and reported; a later run still checks again and may reuse the result.
    const decline = (reason: string) => {
        if (!mark.declined) {
            mark.declined = reason.slice(0, 500);
            store.emit('qa-result-not-reused', `${job.key}: saved QA result not reused: ${mark.declined}. The ordinary QA stage runs.`, 'qa', job.key);
        }
        return null;
    };
    if (mark.step !== job.steps.length - 1) return decline('a step was recorded after the job was queued for it');
    const declined = refusedQADecline(store, job);
    if (declined) return decline(declined);
    const saved = job.steps.at(-1)!.result;
    // A checkout that is no longer the one QA verified gets an ordinary QA run, which reads it for itself.
    try { await verifyRepairCandidate(store.project, job, delivery.execute); }
    catch (error) { return decline(`the candidate is not the clean checkout QA verified (${String(error).replace(/^Error: /, '')})`); }
    mark.usedAt = store.clock.now().toISOString();
    store.emit('qa-result-reused', `${job.key}: saved QA result accepted for the unchanged candidate; the QA gate was run again on it. No QA rerun.`, 'qa', job.key);
    return structuredClone(saved);
}

/** Once the saved result has been accepted as a new step, the refused copy before it is kept as history under its own name. */
export function retireRefusedQA(job: TicketJob): void {
    const mark = job.qaReaccept, refused = mark?.usedAt ? job.steps[mark.step] : undefined;
    if (refused?.stage === 'validate' && job.steps.slice(mark!.step + 1).some(step => step.stage === 'validate' && step.result.commit === refused.result.commit)) refused.stage = REFUSED;
}
