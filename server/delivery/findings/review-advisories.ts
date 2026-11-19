import { handsOff } from '../harness/scope';
import type { Store } from '../../store/store';
import type { StageResult, TicketJob } from '../../../src/shared';

type Reviewed = Pick<TicketJob, 'head' | 'steps' | 'repairCycle'>;
/** The stages whose findings are QA's own, including a QA result the gate refused and the harness later accepted. */
const QA_STAGES = ['validate', 'refused-qa-result'];

/**
 * The findings the independent review of the job's current head raised and left open while passing. On a
 * hands-off project those are advisory (`findingsBlock`): the reviewer's outcome decided, and what it left
 * open is a note for a later stage. Read from the saved review, never from what a later stage says about
 * it. A finding QA raised in an earlier run, or one a repair is still answering, is somebody's work to
 * settle, whatever the review left it as, and is never advisory; a note the reviewer has carried through
 * several reviews still is. Empty when the project is not hands-off, or the latest review is not a pass
 * on this head.
 */
export function reviewAdvisoryIds(store: Pick<Store, 'project'>, job: Reviewed): Set<string> {
    const at = job.steps.map(step => step.stage).lastIndexOf('review'), review = job.steps[at]?.result;
    if (!handsOff(store) || !review || review.outcome !== 'passed' || !job.head || review.commit !== job.head) return new Set();
    const owned = new Set([...job.steps.slice(0, at).filter(step => QA_STAGES.includes(step.stage)).flatMap(step => step.result.findings.map(finding => finding.id)), ...(job.repairCycle?.pendingFindingIds || [])]);
    return new Set(review.findings.filter(finding => finding.status === 'open' && !owned.has(finding.id)).map(finding => finding.id));
}

/**
 * A QA result as its gate judges it: without the findings the review of the same head left as advisory
 * and QA returned still open. QA cannot settle a reviewer's note for a later stage, so carrying it forward
 * is not unresolved QA work. A finding QA raised itself, and one it returned in any other state, is
 * untouched.
 */
export function withoutReviewAdvisories(store: Pick<Store, 'project'>, job: Reviewed, result: StageResult): StageResult {
    const advisory = reviewAdvisoryIds(store, job);
    if (!advisory.size || result.commit !== job.head) return result;
    return { ...result, findings: result.findings.filter(finding => !(finding.status === 'open' && advisory.has(finding.id))) };
}
