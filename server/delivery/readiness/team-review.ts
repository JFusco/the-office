import { harnessDelivers } from '../harness/scope';
import type { Store } from '../../store/store';
import type { StageResult, TicketJob } from '../../../src/shared';

/**
 * The team's own verdict on the exact PR head: Sam's passed independent review, plus Riley's
 * passed validation when the approach required independent checks. When it exists, a second
 * Lead readiness review adds nothing the deterministic merge gate does not already check.
 * Hands-off jobs only; a job without its own independent review still gets the Lead review.
 */
export function teamReviewedHead(store: Pick<Store, 'project'>, job: TicketJob): StageResult | null {
    if (!harnessDelivers(store, job) || !job.head) return null;
    const latest = (stage: string) => job.steps.filter(step => step.stage === stage).at(-1)?.result;
    const review = latest('review');
    if (review?.outcome !== 'passed' || review.commit !== job.head) return null;
    if (job.approach?.validation !== 'developer-checks') {
        const validation = latest('validate');
        if (validation?.outcome !== 'passed' || validation.commit !== job.head) return null;
    }
    return review;
}

export function mergeAuthorized(store: Pick<Store, 'state'>, job: TicketJob): boolean {
    return !!store.state.coordination?.merges?.enabled || job.mergeAuthorization?.head === job.head;
}
