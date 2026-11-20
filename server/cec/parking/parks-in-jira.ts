import { needsDecision } from '../../delivery/parking/needs-decision';
import { environmentWait } from '../qa/environment-wait';
import type { StageResult } from '../../../src/shared';

/**
 * A structured decision with no uncertain or unverified write of its own; anything else stays an
 * operational block. A QA environment wait never parks: it is the Office's own test environment,
 * not a decision about the ticket. A setup stop that asks a person to decide still parks.
 */
export function parksInJira(result: StageResult): boolean {
    return needsDecision(result) && !environmentWait(result) && !result.receipts.some(receipt => receipt.uncertain || !receipt.verified);
}
