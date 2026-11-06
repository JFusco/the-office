import { shortSummary } from '../../../src/work/work-summary';
import type { TicketJob } from '../../../src/shared';

/**
 * The job history a stage prompt shows. Durable `job.steps` is never changed. A step stays in
 * full when it is the previous step or the latest of its stage, or when it still carries anything
 * a later disposition depends on: a finding never verified by a later step, a pending repair
 * finding, or an unverified or uncertain receipt. Other steps collapse to their verdict, so the
 * prompt grows by a bounded amount per step instead of by every step's full evidence.
 */
export function compactSteps(job: Pick<TicketJob, 'steps' | 'repairCycle'>) {
    const verifiedAt = new Map(job.steps.flatMap((step, index) => step.result.findings.filter(finding => finding.status === 'verified').map(finding => [finding.id, index] as const)));
    const pending = new Set(job.repairCycle?.pendingFindingIds || []);
    const latest = new Set([...new Map(job.steps.map((step, index) => [step.stage, index])).values(), job.steps.length - 1]);
    return job.steps.map((step, index) => {
        const { outcome, summary, commit, blocker, findings, receipts, evidence } = step.result;
        const needed = latest.has(index) || findings.some(finding => finding.status !== 'verified' && (verifiedAt.get(finding.id) ?? -1) <= index || pending.has(finding.id)) || receipts.some(receipt => !receipt.verified || receipt.uncertain);
        return needed
            ? { stage: step.stage, result: { outcome, summary: shortSummary(summary), commit, blocker, findings, receipts, evidence } }
            : { stage: step.stage, result: { outcome, summary: shortSummary(summary), commit, blocker } };
    });
}
