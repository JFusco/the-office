import { resolve } from 'node:path';
import { QA_GATE_REFUSALS } from '../../qa/report-evidence';
import { qaEvidenceGap } from '../workflow';
import type { Store } from '../../store/store';
import type { Stage, StageResult, Ticket } from '../../../src/shared';

const QA_STAGES: readonly string[] = ['qa', 'retest', 'staging-qa'];
/** How the runner records a pass the QA gate refused; one of the gate's fixed refusals follows it. */
export const GATE_REFUSED = 'QA acceptance not verified: ';

/**
 * The passing QA result the gate refused on this candidate and accepts now, restored to a pass; undefined
 * otherwise. The stage is blocked only by one of the gate's fixed refusals, its paid runs are counted and
 * every receipt is verified, so nothing is unknown and the saved report and evidence are all the gate reads.
 * The gate is run again on it exactly as acceptance runs it; a result it still refuses gets an ordinary run.
 */
export function gateRefusedPass(store: Store, ticket: Ticket, stage: Stage): StageResult | undefined {
    const result = ticket.results[stage];
    if (ticket.stage !== stage || !QA_STAGES.includes(stage) || !result?.qa || result.outcome !== 'blocked' || result.commit !== ticket.commit) return;
    if (!QA_GATE_REFUSALS.some(said => result.blocker === GATE_REFUSED + said)) return;
    if (result.paidRuns === null || result.receipts.some(receipt => receipt.uncertain || !receipt.verified)) return;
    const pass: StageResult = { ...structuredClone(result), outcome: 'passed', blocker: '' };
    return qaEvidenceGap(ticket, stage, pass, resolve(store.dataRoot, 'runs', ticket.runId)) ? undefined : pass;
}
