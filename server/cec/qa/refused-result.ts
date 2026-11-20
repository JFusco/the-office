import type { Stage, StageResult, Ticket, WorkTime } from '../../../src/shared';

const QA_STAGES: readonly string[] = ['qa', 'retest', 'staging-qa'];
type Run = Pick<WorkTime, 'ticket' | 'stage' | 'role' | 'status' | 'failure' | 'executionStatus'>;

/** The receipt wording of a refusal, and the wording an earlier release gave the same event. */
export const REFUSED_RECEIPT = 'Worker returned; the Office refused its result';
const LEGACY_RECEIPT = 'Worker did not return a verified final result';
/** What the report save says when it refuses; an earlier release's record is known by these words alone. */
const SAVE_REFUSALS = ['Prior Office QA report retained', 'Office QA report directory'];

/** The Office would not save the report of a QA result its worker returned. Carries that result. */
export class RefusedQAResult extends Error {
    constructor(readonly returned: StageResult, cause: unknown) { super(String(cause).replace(/^Error:\s*/, '')); }
}

/**
 * The returned result behind a QA stage's failure, when the failure is the Office refusing that result
 * and the result leaves nothing unknown: its paid runs are counted and no receipt is uncertain. A QA
 * worker writes only inside its run and the harness posts the Jira comment after this point, so the
 * stage can be run again. Undefined for a run that died, an unknown count, or any other stage.
 */
export function refusedQA(stage: Stage, error: unknown): StageResult | undefined {
    if (!QA_STAGES.includes(stage) || !(error instanceof RefusedQAResult)) return;
    const { returned } = error;
    return returned.paidRuns !== null && returned.receipts.every(receipt => !receipt.uncertain) ? returned : undefined;
}

/** The blocker for such a refusal, in plain words: nothing outside the run is unknown. */
export const refusedQABlocker = (stage: Stage, error: unknown) => `The Office could not accept the ${stage} result its worker returned. Nothing outside the run was written; the stage can be run again. ${String(error)}`;

/**
 * A blocked QA stage with nothing to reconstruct, so the stage is run again. The result holds only the
 * runner's own receipt for the stage, in the Office's words, and no run on the ticket has since failed
 * with an unknown write. A refusal recorded by this release counted its paid runs. One recorded by an
 * earlier release is known by the report save's own refusal and a latest QA run that returned normally;
 * its paid-run count was not kept.
 */
export function officeRefusedQA(ticket: Ticket, result: StageResult | undefined, attempts: readonly Run[]): boolean {
    if (!QA_STAGES.includes(ticket.stage) || !result || result.outcome !== 'blocked' || result.qaRunDir || result.qa || result.receipts.length !== 1) return false;
    const [receipt] = result.receipts;
    if (receipt.action !== ticket.stage || receipt.target !== ticket.key || receipt.verified) return false;
    const own = attempts.filter(run => run.ticket === ticket.key), at = own.map(run => run.stage === ticket.stage && run.role === 'qa').lastIndexOf(true);
    if (own.slice(at + 1).some(run => run.failure?.category === 'uncertain-effect')) return false;
    if (receipt.detail === REFUSED_RECEIPT) return !receipt.uncertain && result.paidRuns !== null;
    const returned = at >= 0 && own[at].executionStatus === 'completed' && !own[at].failure;
    return receipt.detail === LEGACY_RECEIPT && returned && SAVE_REFUSALS.some(words => result.summary.includes(words));
}
