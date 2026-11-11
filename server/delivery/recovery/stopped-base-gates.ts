import type { TicketJob, WorkApproach } from '../../../src/shared';

export function assertStoppedBaseApproach(job: TicketJob, next: WorkApproach) {
    if (!job.stoppedBaseUpdate) return;
    const preserved = job.stoppedBaseUpdate.preservedCandidate?.approach;
    if (next.review === 'none' || next.validation === 'developer-checks' ||
        preserved?.review === 'full' && next.review !== 'full' || preserved?.validation === 'browser' && next.validation !== 'browser')
        throw new Error('Stopped-base recovery requires actual independent source review and QA without reducing prior gates');
}

export function stoppedBaseNextStage(job: TicketJob): TicketJob['stage'] | undefined {
    if (!job.stoppedBaseUpdate || !['review','validate','implement','scope-repair','update-base'].includes(job.stage)) return;
    assertStoppedBaseApproach(job, job.approach!);
    const review = job.steps.filter(s => s.stage === 'review').at(-1), qa = job.steps.filter(s => s.stage === 'validate').at(-1);
    if (!review?.workerId || review.result.outcome !== 'passed' || review.result.commit !== job.head) return 'review';
    if (!qa?.workerId || qa.result.outcome !== 'passed' || qa.result.commit !== job.head) return 'validate';
    return job.head === job.stoppedBaseUpdate.handoff?.head || job.head === job.repairCycle?.publishedHead ? 'prepare-pr' : 'draft';
}

