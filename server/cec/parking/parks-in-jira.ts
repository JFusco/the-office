import { needsDecision } from '../../delivery/parking/needs-decision';
import type { StageResult } from '../../../src/shared';

/** A structured decision with no uncertain or unverified write of its own; anything else stays an operational block. */
export function parksInJira(result: StageResult): boolean {
    return needsDecision(result) && !result.receipts.some(receipt => receipt.uncertain || !receipt.verified);
}
